/**
 * app/api/court/cases/[caseNo]/verdict/route.ts
 * 법원 공무원: 법원 사건번호, 재판 결과 및 판결문 링크 입력/수정
 * POST /api/court/cases/[caseNo]/verdict
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
    court1No, court1Result, court1Doc,
    court2No, court2Result, court2Doc,
    court3No, court3Result, court3Doc,
  } = body;

  try {
    // 사건 존재 확인 (어떤 사건번호로도 매칭)
    const existing = await db.execute({
      sql: `SELECT id, hyeongje_no, court1_no, court2_no, court3_no
            FROM cases
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
            SET court1_no     = ?,
                court1_result = ?,
                court1_doc    = ?,
                court2_no     = ?,
                court2_result = ?,
                court2_doc    = ?,
                court3_no     = ?,
                court3_result = ?,
                court3_doc    = ?
            WHERE id = ?`,
      args: [
        court1No || "", court1Result || "", court1Doc || "",
        court2No || "", court2Result || "", court2Doc || "",
        court3No || "", court3Result || "", court3Doc || "",
        caseId,
      ],
    });

    // 감사 로그 기록
    await db.execute({
      sql: `INSERT INTO audit_logs (id, action, entity_type, entity_id, entity_label, actor_id, actor_name, detail, created_at)
            VALUES (?, 'UPDATE', 'case', ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        uuidv4(), caseId, hyeongjeNo, user.id, user.name,
        `법원 판결 및 사건번호 갱신 (1심:${court1No||'-'}/${court1Result||'-'} 2심:${court2No||'-'}/${court2Result||'-'} 3심:${court3No||'-'}/${court3Result||'-'})`,
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/court/cases/verdict]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
