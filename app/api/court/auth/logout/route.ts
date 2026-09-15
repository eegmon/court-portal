/**
 * app/api/court/auth/logout/route.ts
 */
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("court_token", "", { maxAge: 0, path: "/" });
  return res;
}
