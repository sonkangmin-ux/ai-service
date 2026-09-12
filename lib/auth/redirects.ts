import { safeNextPath } from "@/lib/auth/safe-next";

export function authEmailRedirect(origin: string, next = "/learn"): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`;
}
