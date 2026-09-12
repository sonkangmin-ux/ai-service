import { createHmac, timingSafeEqual } from "node:crypto";
import { isAuthFlowSecretConfigured } from "@/lib/config";

const COOKIE = "lc_recovery_flow";

type Payload = { userId: string; flow: "recovery"; expiresAt: number };

function secret(): string | null {
  if (!isAuthFlowSecretConfigured()) return null;
  return process.env.AUTH_FLOW_SECRET ?? null;
}

function sign(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("base64url");
}

export function createRecoveryCookieValue(userId: string, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const payload: Payload = { userId, flow: "recovery", expiresAt: now + 10 * 60 * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded, key)}`;
}

export function readRecoveryCookieValue(
  value: string | undefined,
  userId: string,
  now = Date.now(),
): boolean {
  const key = secret();
  if (!key || !value) return false;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return false;
  const expected = sign(encoded, key);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Payload;
    if (payload.flow !== "recovery") return false;
    if (payload.userId !== userId) return false;
    if (payload.expiresAt < now) return false;
    return true;
  } catch {
    return false;
  }
}

export const recoveryCookieName = COOKIE;
export const recoveryCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 10 * 60,
  secure: process.env.NODE_ENV === "production",
};
