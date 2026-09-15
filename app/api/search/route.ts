/**
 * app/api/search/route.ts
 * 닉네임으로 전과·형집행 기록 검색 (공개, 인증 불필요)
 * GET /api/search?nickname=xxx
 *
 * * 제72조(형의 실효)에 따라 실효된 전과는 대국민 공개 검색에서 제외(숨김) 처리됩니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCamel, toPublicCase, uuidv4 } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const nickname = req.nextUrl.searchParams.get("nickname")?.trim();

  if (!nickname || nickname.length < 1) {
    return NextResponse.json(
      { error: "닉네임을 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    // 닉네임(suspect_name) 부분 일치 검색
    const result = await db.execute({
      sql: `SELECT id, hyeongje_no, latest_hyeongje_no, suje_no, suspect_name, charge_name,
                   court1_no, court1_result, court1_doc,
                   court2_no, court2_result, court2_doc,
                   court3_no, court3_result, court3_doc,
                   disposition, execution_status, execution_date, execution_notes,
                   is_expunged, expunged_at, expunged_reason,
                   booking_date, created_at
            FROM cases
            WHERE suspect_name LIKE ?
              AND deleted_at = ''
            ORDER BY booking_date DESC
            LIMIT 50`,
      args: [`%${nickname}%`],
    });

    // 공개 사건 목록 변환 및 형의 실효(제72조) 적용 건은 대국민 조회에서 제외
    const allCases = result.rows.map((row) =>
      toPublicCase(toCamel(row as Record<string, unknown>))
    );

    // 실효되지 않은 유효 전과/사건만 대국민 공개
    const activeCases = allCases.filter((c) => !c.expungement.isExpunged);

    // 검색 감사 로그 기록
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    await db.execute({
      sql: `INSERT INTO public_search_logs (id, nickname, ip, result_count, searched_at)
            VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [uuidv4(), nickname, ip, activeCases.length],
    });

    return NextResponse.json({
      cases: activeCases,
      total: activeCases.length,
      expungedCount: allCases.length - activeCases.length,
    });
  } catch (e) {
    console.error("[GET /api/search]", e);
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
