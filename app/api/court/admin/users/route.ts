/**
 * app/api/court/admin/users/route.ts
 * 관리자 전용: 공무원 계정 목록 및 가입 신청 목록 조회 API
 * GET /api/court/admin/users
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCamel } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !requireAdmin(authUser)) {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "ALL"; // ALL, PENDING, ACTIVE, REJECTED, INACTIVE
  const query = searchParams.get("q")?.trim() || "";

  try {
    let sql = `SELECT id, name, login_id, role, dept, is_admin, status, created_at, last_login FROM court_users WHERE 1=1`;
    const args: (string | number)[] = [];

    if (statusFilter !== "ALL") {
      sql += ` AND status = ?`;
      args.push(statusFilter);
    }

    if (query) {
      sql += ` AND (name LIKE ? OR login_id LIKE ? OR dept LIKE ?)`;
      args.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    // 승인 대기(PENDING) 우선, 이후 최근 가입순
    sql += ` ORDER BY CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END ASC, created_at DESC`;

    const result = await db.execute({ sql, args });
    const users = result.rows.map((r) => toCamel(r as Record<string, unknown>));

    // 상태별 통계 계산
    const statsRes = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_cnt,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_cnt,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_cnt,
        SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_cnt
      FROM court_users
    `);

    const statsRow = statsRes.rows[0] as Record<string, unknown>;
    const stats = {
      total: Number(statsRow?.total || 0),
      pending: Number(statsRow?.pending_cnt || 0),
      active: Number(statsRow?.active_cnt || 0),
      rejected: Number(statsRow?.rejected_cnt || 0),
      inactive: Number(statsRow?.inactive_cnt || 0),
    };

    return NextResponse.json({
      ok: true,
      users,
      stats,
    });
  } catch (e) {
    console.error("[GET /api/court/admin/users]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
