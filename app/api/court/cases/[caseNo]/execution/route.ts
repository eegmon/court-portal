/**
 * app/api/court/cases/[caseNo]/execution/route.ts
 * 법원 공무원: 형집행 사실 및 형의 실효(수동/자동) 입력/수정
 * POST /api/court/cases/[caseNo]/execution
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { uuidv4 } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseNo: string }> }
) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { caseNo } = await params;
  const decoded = decodeURIComponent(caseNo).trim();
  const body = await req.json();
  const {
    executionStatus,
    executionDate,
    executionNotes,
    isExpunged,
    expungedAt,
    expungedReason,
  } = body;

  try {
    const existing = await db.execute({
      sql: `SELECT id, hyeongje_no FROM cases
            WHERE (
              court3_no = ? OR court2_no = ? OR court1_no = ?
              OR latest_hyeongje_no = ? OR hyeongje_no = ? OR suje_no = ?
            ) AND deleted_at = '' LIMIT 1`,
      args: [decoded, decoded, decoded, decoded, decoded, decoded],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "해당 사건을 찾을 수 없습니다." }, { status: 404 });
    }

    const caseId = existing.rows[0].id as string;
    const hyeongjeNo = (existing.rows[0].hyeongje_no as string) || decoded;

    await db.execute({
      sql: `UPDATE cases
            SET execution_status     = ?,
                execution_date       = ?,
                execution_notes      = ?,
                execution_updated_by = ?,
                execution_updated_at = datetime('now'),
                is_expunged          = ?,
                expunged_at          = ?,
                expunged_reason      = ?
            WHERE id = ?`,
      args: [
        executionStatus || "",
        executionDate || "",
        executionNotes || "",
        user.name,
        isExpunged ? 1 : 0,
        expungedAt || (isExpunged ? new Date().toISOString().slice(0, 10) : ""),
        expungedReason || "",
        caseId,
      ],
    });

    // 감사 로그 기록
    await db.execute({
      sql: `INSERT INTO audit_logs (id, action, entity_type, entity_id, entity_label, actor_id, actor_name, detail, created_at)
            VALUES (?, 'UPDATE', 'case', ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        uuidv4(), caseId, hyeongjeNo, user.id, user.name,
        `형집행/실효 사실 갱신: 상태=${executionStatus||'-'}, 실효여부=${isExpunged ? '실효됨' : '미실효'}${expungedReason ? ` (${expungedReason})` : ''}`,
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/court/cases/execution]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
