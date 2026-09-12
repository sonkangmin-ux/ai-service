import { NextResponse } from "next/server";
import { recoveryCookieName } from "@/lib/auth/recovery";

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(recoveryCookieName, "", { path: "/", maxAge: 0 });
  return response;
}
