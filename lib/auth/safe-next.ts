const ALLOWED_NEXT = new Set(["/learn", "/onboarding", "/reset-password"]);

export function safeNextPath(input: string | null | undefined, fallback = "/learn"): string {
  if (!input) return fallback;
  let value = input.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return fallback;
  }
  const path = value.split("?")[0];
  if (ALLOWED_NEXT.has(path)) return path;
  return fallback;
}

export function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const expected = process.env.APP_URL || "http://localhost:3000";
  try {
    return canonicalizeOrigin(origin) === canonicalizeOrigin(expected);
  } catch {
    return false;
  }
}

function canonicalizeOrigin(value: string): string {
  const url = new URL(value);
  const host = url.hostname === "127.0.0.1" ? "localhost" : url.hostname;
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  return `${url.protocol}//${host}:${port}`;
}
