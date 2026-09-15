/**
 * app/api/init/route.ts
 * 서버 최초 실행 시 DB 초기화 (빌드 타임 방지 위해 런타임 라우트로 분리)
 */
import { NextResponse } from "next/server";
import { initCourtDb } from "@/lib/db";

let initialized = false;

export async function GET() {
  if (!initialized) {
    await initCourtDb();
    initialized = true;
  }
  return NextResponse.json({ ok: true });
}
