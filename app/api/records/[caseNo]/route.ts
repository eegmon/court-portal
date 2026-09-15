/**
 * app/api/records/[caseNo]/route.ts
 * 사건번호로 상세 조회 (법원 사건번호 1~3심, 형제번호, 수제번호 모두 매칭)
 * GET /api/records/[caseNo]
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCamel, toPublicCase } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseNo: string }> }
) {
  const { caseNo } = await params;
  const decoded = decodeURIComponent(caseNo).trim();

  try {
    const result = await db.execute({
      sql: `SELECT id, hyeongje_no, latest_hyeongje_no, suje_no, suspect_name, charge_name,
                   court1_no, court1_result, court1_doc,
                   court2_no, court2_result, court2_doc,
                   court3_no, court3_result, court3_doc,
                   disposition, execution_status, execution_date, execution_notes,
                   is_expunged, expunged_at, expunged_reason,
                   booking_date, created_at
            FROM cases
            WHERE (
              court3_no = ? OR court2_no = ? OR court1_no = ?
              OR latest_hyeongje_no = ? OR hyeongje_no = ? OR suje_no = ?
            )
            AND deleted_at = ''
            LIMIT 1`,
      args: [decoded, decoded, decoded, decoded, decoded, decoded],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "해당 사건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const raw = toCamel(result.rows[0] as Record<string, unknown>);
    const publicCase = toPublicCase(raw);

    return NextResponse.json({ case: publicCase });
  } catch (e) {
    console.error("[GET /api/records]", e);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
