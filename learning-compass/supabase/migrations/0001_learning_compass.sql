-- AI 학습 나침반 v2.0 schema, RLS, RPCs.
-- Apply to a new development database. Do not run a destructive reset on existing data.

create schema if not exists private;

create table if not exists public.learning_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  last_mutation_id text,
  last_payload_hash text
);

alter table public.learning_states enable row level security;

drop policy if exists learning_states_select_own on public.learning_states;
create policy learning_states_select_own
  on public.learning_states
  for select
  using ((select auth.uid()) = user_id);

revoke all on table public.learning_states from public;
revoke all on table public.learning_states from anon;
revoke insert, update, delete on table public.learning_states from authenticated;
grant select on table public.learning_states to authenticated;

create table if not exists private.ai_requests (
  user_id uuid not null references auth.users (id) on delete cascade,
  request_id uuid not null,
  input_hash text not null,
  status text not null check (status in ('reserved', 'succeeded', 'failed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  result jsonb,
  primary key (user_id, request_id)
);

create table if not exists private.ai_quota (
  scope text not null check (scope in ('user', 'global')),
  scope_id text not null,
  window_key text not null,
  used integer not null default 0,
  primary key (scope, scope_id, window_key)
);

create table if not exists private.app_limits (
  name text primary key,
  value integer not null
);

insert into private.app_limits (name, value)
values
  ('ai_user_per_minute', 5),
  ('ai_user_daily', 30),
  ('ai_global_daily', 300)
on conflict (name) do nothing;

revoke all on table private.ai_requests from public, anon, authenticated;
revoke all on table private.ai_quota from public, anon, authenticated;
revoke all on table private.app_limits from public, anon, authenticated;

create or replace function public.save_learning_state(expected_revision bigint, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  current_revision bigint;
  current_updated timestamptz;
begin
  uid := (select auth.uid());
  if uid is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  if jsonb_typeof(payload) is distinct from 'object' then
    return jsonb_build_object('status', 'invalid', 'message', 'payload must be object');
  end if;

  if coalesce(payload->>'schemaVersion', '') = '' then
    return jsonb_build_object('status', 'invalid', 'message', 'schemaVersion required');
  end if;

  if coalesce(payload->>'contentVersion', '') = '' then
    return jsonb_build_object('status', 'invalid', 'message', 'contentVersion required');
  end if;

  if octet_length(payload::text) > 2097152 then
    return jsonb_build_object('status', 'invalid', 'message', 'payload too large');
  end if;

  select ls.revision, ls.updated_at
    into current_revision, current_updated
  from public.learning_states as ls
  where ls.user_id = uid
  for update;

  if expected_revision = -1 then
    if current_revision is not null then
      return jsonb_build_object('status', 'conflict', 'revision', current_revision, 'updatedAt', current_updated);
    end if;
    begin
      insert into public.learning_states (user_id, payload, revision, updated_at)
      values (uid, payload, 0, now());
    exception
      when unique_violation then
        select ls.revision, ls.updated_at into current_revision, current_updated
        from public.learning_states as ls
        where ls.user_id = uid;
        return jsonb_build_object('status', 'conflict', 'revision', coalesce(current_revision, 0), 'updatedAt', current_updated);
    end;
    return jsonb_build_object('status', 'ok', 'revision', 0, 'updatedAt', now());
  end if;

  if current_revision is null or current_revision is distinct from expected_revision then
    return jsonb_build_object('status', 'conflict', 'revision', coalesce(current_revision, -1), 'updatedAt', current_updated);
  end if;

  update public.learning_states as ls
     set payload = save_learning_state.payload,
         revision = ls.revision + 1,
         updated_at = now()
   where ls.user_id = uid
     and ls.revision = expected_revision;

  if not found then
    select ls.revision, ls.updated_at into current_revision, current_updated
    from public.learning_states as ls
    where ls.user_id = uid;
    return jsonb_build_object('status', 'conflict', 'revision', coalesce(current_revision, -1), 'updatedAt', current_updated);
  end if;

  return jsonb_build_object('status', 'ok', 'revision', expected_revision + 1, 'updatedAt', now());
end;
$$;

create or replace function public.reserve_ai_request(request_id uuid, input_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  existing private.ai_requests%rowtype;
  minute_key text;
  day_key text;
  user_minute integer;
  user_daily integer;
  global_daily integer;
  lim_minute integer;
  lim_user_daily integer;
  lim_global_daily integer;
begin
  uid := (select auth.uid());
  if uid is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  select *
    into existing
  from private.ai_requests as r
  where r.user_id = uid and r.request_id = reserve_ai_request.request_id
  for update;

  if found then
    if existing.input_hash is distinct from reserve_ai_request.input_hash then
      return jsonb_build_object('status', 'conflict', 'code', 'hash_mismatch');
    end if;
    if existing.status = 'succeeded' then
      return jsonb_build_object('status', 'replay', 'result', existing.result);
    end if;
    if existing.status = 'failed' then
      return jsonb_build_object('status', 'failed_replay');
    end if;
    if existing.status = 'reserved' and existing.created_at > now() - interval '60 seconds' then
      return jsonb_build_object('status', 'pending');
    end if;
    if existing.status = 'reserved' then
      update private.ai_requests as r
         set status = 'failed'
       where r.user_id = uid and r.request_id = existing.request_id;
      return jsonb_build_object('status', 'expired');
    end if;
  end if;

  minute_key := to_char((now() at time zone 'utc'), 'YYYYMMDDHH24MI');
  day_key := to_char((now() at time zone 'utc'), 'YYYYMMDD');

  select value into lim_minute from private.app_limits where name = 'ai_user_per_minute';
  select value into lim_user_daily from private.app_limits where name = 'ai_user_daily';
  select value into lim_global_daily from private.app_limits where name = 'ai_global_daily';

  insert into private.ai_quota (scope, scope_id, window_key, used)
  values ('global', 'all', day_key, 0)
  on conflict do nothing;

  perform 1
  from private.ai_quota as q
  where q.scope = 'global' and q.scope_id = 'all' and q.window_key = day_key
  for update;

  insert into private.ai_quota (scope, scope_id, window_key, used)
  values ('user', uid::text, day_key, 0)
  on conflict do nothing;

  insert into private.ai_quota (scope, scope_id, window_key, used)
  values ('user', uid::text, minute_key, 0)
  on conflict do nothing;

  perform 1
  from private.ai_quota as q
  where q.scope = 'user' and q.scope_id = uid::text and q.window_key = day_key
  for update;

  perform 1
  from private.ai_quota as q
  where q.scope = 'user' and q.scope_id = uid::text and q.window_key = minute_key
  for update;

  select q.used into global_daily
  from private.ai_quota as q
  where q.scope = 'global' and q.scope_id = 'all' and q.window_key = day_key;

  select q.used into user_daily
  from private.ai_quota as q
  where q.scope = 'user' and q.scope_id = uid::text and q.window_key = day_key;

  select q.used into user_minute
  from private.ai_quota as q
  where q.scope = 'user' and q.scope_id = uid::text and q.window_key = minute_key;

  if global_daily >= lim_global_daily or user_daily >= lim_user_daily or user_minute >= lim_minute then
    return jsonb_build_object('status', 'limited');
  end if;

  update private.ai_quota as q
     set used = q.used + 1
   where q.scope = 'global' and q.scope_id = 'all' and q.window_key = day_key;

  update private.ai_quota as q
     set used = q.used + 1
   where q.scope = 'user' and q.scope_id = uid::text and q.window_key = day_key;

  update private.ai_quota as q
     set used = q.used + 1
   where q.scope = 'user' and q.scope_id = uid::text and q.window_key = minute_key;

  insert into private.ai_requests (user_id, request_id, input_hash, status, created_at, expires_at)
  values (uid, reserve_ai_request.request_id, reserve_ai_request.input_hash, 'reserved', now(), now() + interval '7 days');

  return jsonb_build_object('status', 'reserved');
end;
$$;

create or replace function public.complete_ai_request(request_id uuid, request_status text, result jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  uid := (select auth.uid());
  if uid is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;
  if request_status not in ('succeeded', 'failed') then
    return jsonb_build_object('status', 'invalid');
  end if;

  update private.ai_requests as r
     set status = complete_ai_request.request_status,
         result = case when complete_ai_request.request_status = 'succeeded' then complete_ai_request.result else r.result end
   where r.user_id = uid
     and r.request_id = complete_ai_request.request_id
     and r.status = 'reserved';

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  return jsonb_build_object('status', 'ok');
end;
$$;

create or replace function public.ai_remaining_today()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  day_key text;
  used integer;
  lim integer;
begin
  uid := (select auth.uid());
  if uid is null then
    return 0;
  end if;
  day_key := to_char((now() at time zone 'utc'), 'YYYYMMDD');
  select value into lim from private.app_limits where name = 'ai_user_daily';
  select coalesce(q.used, 0) into used
  from private.ai_quota as q
  where q.scope = 'user' and q.scope_id = uid::text and q.window_key = day_key;
  return greatest(lim - coalesce(used, 0), 0);
end;
$$;

-- Example cleanup for requests older than 7 days. Schedule in the operator console if needed.
create or replace function private.cleanup_ai_requests()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.ai_requests
  where created_at < now() - interval '7 days';
end;
$$;

revoke all on function public.save_learning_state(bigint, jsonb) from public, anon;
revoke all on function public.reserve_ai_request(uuid, text) from public, anon;
revoke all on function public.complete_ai_request(uuid, text, jsonb) from public, anon;
revoke all on function public.ai_remaining_today() from public, anon;
grant execute on function public.save_learning_state(bigint, jsonb) to authenticated;
grant execute on function public.reserve_ai_request(uuid, text) to authenticated;
grant execute on function public.complete_ai_request(uuid, text, jsonb) to authenticated;
grant execute on function public.ai_remaining_today() to authenticated;
