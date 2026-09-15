/**
 * app/api/court/cases/route.ts
 * 법원 공무원: 담당 사건 목록 조회 (대시보드용, 실효 전과 포함 열람 가능)
 * GET /api/court/cases?page=1&q=검색어
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { toCamel, toPublicCase } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const prefixFilter = `AND (
      hyeongje_no LIKE '%형제%' OR hyeongje_no LIKE '%특형%' OR hyeongje_no LIKE '%특공%'
      OR latest_hyeongje_no LIKE '%형제%' OR latest_hyeongje_no LIKE '%특형%' OR latest_hyeongje_no LIKE '%특공%'
      OR court1_no != '' OR court2_no != '' OR court3_no != ''
    )`;

    const whereClause = q
      ? `AND (
          suspect_name LIKE ? OR hyeongje_no LIKE ? OR suje_no LIKE ?
          OR court1_no LIKE ? OR court2_no LIKE ? OR court3_no LIKE ?
        )`
      : "";
    const args = q
      ? [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit, offset]
      : [limit, offset];

    const result = await db.execute({
      sql: `SELECT id, hyeongje_no, latest_hyeongje_no, suje_no, suspect_name, charge_name,
                   court1_no, court1_result, court1_doc,
                   court2_no, court2_result, court2_doc,
                   court3_no, court3_result, court3_doc,
                   disposition, execution_status, execution_date, execution_notes,
                   is_expunged, expunged_at, expunged_reason,
                   booking_date, created_at
            FROM cases
            WHERE deleted_at = ''
              ${prefixFilter}
              ${whereClause}
            ORDER BY booking_date DESC
            LIMIT ? OFFSET ?`,
      args,
    });

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM cases WHERE deleted_at = '' ${prefixFilter} ${whereClause}`,
      args: q ? [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`] : [],
    });

    const cases = result.rows.map((r) => {
      const camel = toCamel(r as Record<string, unknown>);
      return {
        id: camel.id,
        ...toPublicCase(camel),
      };
    });
    const total = Number(countResult.rows[0].cnt);

    return NextResponse.json({
      cases,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("[GET /api/court/cases]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
