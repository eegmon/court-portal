/**
 * app/api/court/auth/me/route.ts
 * 현재 로그인된 공무원 정보 및 권한 확인 API
 * GET /api/court/auth/me
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCamel } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const result = await db.execute({
      sql: `SELECT id, name, login_id, role, dept, is_admin, status, created_at, last_login 
            FROM court_users WHERE id = ? LIMIT 1`,
      args: [user.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userData = toCamel(result.rows[0] as Record<string, unknown>);

    // 관리자인 경우 승인 대기 중인 가입 건수도 함께 반환
    let pendingCount = 0;
    if (userData.isAdmin) {
      const pendingRes = await db.execute(
        `SELECT COUNT(*) as cnt FROM court_users WHERE status = 'PENDING'`
      );
      pendingCount = Number(pendingRes.rows[0]?.cnt || 0);
    }

    return NextResponse.json({
      authenticated: true,
      user: userData,
      pendingCount,
    });
  } catch (e) {
    console.error("[GET /api/court/auth/me]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
