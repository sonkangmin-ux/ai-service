import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(file) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.example"));

function status(name, value, predicate) {
  if (!value) return `${name}=missing`;
  return `${name}=${predicate(value) ? "configured" : "invalid"}`;
}

const rows = [
  status("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL, (v) => v.startsWith("http")),
  status("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, (v) => v.length > 20),
  status("APP_URL", process.env.APP_URL, (v) => v.startsWith("http")),
  status("AUTH_FLOW_SECRET", process.env.AUTH_FLOW_SECRET, (v) => v.length >= 32),
  status("AI_MODE", process.env.AI_MODE, (v) => v === "demo" || v === "live"),
  status("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY, () => true),
  status("ANTHROPIC_MODEL", process.env.ANTHROPIC_MODEL, () => true),
  status("AI_USER_DAILY_LIMIT", process.env.AI_USER_DAILY_LIMIT, () => true),
  status("AI_GLOBAL_DAILY_LIMIT", process.env.AI_GLOBAL_DAILY_LIMIT, () => true),
];

for (const row of rows) console.log(row);
