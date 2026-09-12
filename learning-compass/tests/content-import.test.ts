import { readFileSync } from "node:fs";
import { pythonFoundations } from "../content/python-foundations";
import { validateContent } from "../lib/domain/content-graph";
import { createEmptyState } from "../lib/domain/empty";
import { validateImportJson } from "../lib/domain/import";
import { describe, expect, it } from "vitest";

describe("content pack", () => {
  it("has valid ids, DAG, and exactly one correct choice per item", () => {
    expect(validateContent(pythonFoundations)).toEqual([]);
  });
});

describe("import", () => {
  it("does not overwrite current data when JSON is invalid", () => {
    const current = createEmptyState();
    const result = validateImportJson("{not json", current);
    expect(result.ok).toBe(false);
    expect(current.attempts).toEqual([]);
  });

  it("rejects contentVersion mismatch", () => {
    const current = createEmptyState();
    const result = validateImportJson(JSON.stringify({ ...current, contentVersion: "9.0" }), current);
    expect(result.ok).toBe(false);
  });
});

describe("sql contract", () => {
  it("enables RLS, revokes public writes, and locks search_path", () => {
    const sql = readFileSync("supabase/migrations/0001_learning_compass.sql", "utf8");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("revoke insert, update, delete on table public.learning_states");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("grant execute on function public.save_learning_state");
    expect(sql).toContain("revoke all on function public.save_learning_state");
  });
});
