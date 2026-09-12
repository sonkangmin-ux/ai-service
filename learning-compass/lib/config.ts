export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return url.startsWith("http") && key.length > 20;
}

export function isAuthFlowSecretConfigured(): boolean {
  const secret = process.env.AUTH_FLOW_SECRET ?? "";
  return secret.length >= 32;
}

export function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

export function isLiveAiConfigured(): boolean {
  return (
    process.env.AI_MODE === "live" &&
    Boolean(process.env.ANTHROPIC_API_KEY) &&
    Boolean(process.env.ANTHROPIC_MODEL)
  );
}

export function userDailyLimit(): number {
  const fromEnv = Number(process.env.AI_USER_DAILY_LIMIT ?? 30);
  return Number.isFinite(fromEnv) ? fromEnv : 30;
}

export function globalDailyLimit(): number {
  const fromEnv = Number(process.env.AI_GLOBAL_DAILY_LIMIT ?? 300);
  return Number.isFinite(fromEnv) ? fromEnv : 300;
}

export type ConfigCheck = { name: string; status: "configured" | "missing" | "invalid" };

export function checkConfig(): ConfigCheck[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const secret = process.env.AUTH_FLOW_SECRET ?? "";
  const aiMode = process.env.AI_MODE ?? "";
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";
  const anthropicModel = process.env.ANTHROPIC_MODEL ?? "";
  const app = process.env.APP_URL ?? "";

  const urlStatus: ConfigCheck["status"] = !url ? "missing" : url.startsWith("http") ? "configured" : "invalid";
  const keyStatus: ConfigCheck["status"] = !key ? "missing" : key.length > 20 ? "configured" : "invalid";
  const secretStatus: ConfigCheck["status"] = !secret ? "missing" : secret.length >= 32 ? "configured" : "invalid";
  const modeStatus: ConfigCheck["status"] = !aiMode ? "missing" : aiMode === "demo" || aiMode === "live" ? "configured" : "invalid";
  const anthropicKeyStatus: ConfigCheck["status"] = !anthropicKey ? "missing" : "configured";
  const anthropicModelStatus: ConfigCheck["status"] = !anthropicModel ? "missing" : "configured";
  const appStatus: ConfigCheck["status"] = !app ? "missing" : app.startsWith("http") ? "configured" : "invalid";

  return [
    { name: "NEXT_PUBLIC_SUPABASE_URL", status: urlStatus },
    { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", status: keyStatus },
    { name: "APP_URL", status: appStatus },
    { name: "AUTH_FLOW_SECRET", status: secretStatus },
    { name: "AI_MODE", status: modeStatus },
    { name: "ANTHROPIC_API_KEY", status: anthropicKeyStatus },
    { name: "ANTHROPIC_MODEL", status: anthropicModelStatus },
    { name: "AI_USER_DAILY_LIMIT", status: process.env.AI_USER_DAILY_LIMIT ? "configured" : "missing" },
    { name: "AI_GLOBAL_DAILY_LIMIT", status: process.env.AI_GLOBAL_DAILY_LIMIT ? "configured" : "missing" },
  ];
}
