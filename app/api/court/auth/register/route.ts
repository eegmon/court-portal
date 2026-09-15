/**
 * app/api/court/auth/register/route.ts
 * 법원 공무원 계정 생성 (관리자 전용 또는 최초 부트스트랩)
 * POST /api/court/auth/register
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { uuidv4 } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, loginId, password, role, dept, bootstrapSecret } = body;

  if (!name || !loginId || !password) {
    return NextResponse.json(
      { error: "이름, 아이디, 비밀번호는 필수입니다." },
      { status: 400 }
    );
  }

  // 최초 부트스트랩 또는 관리자만 허용
  const isBootstrap = bootstrapSecret === process.env.COURT_BOOTSTRAP_SECRET;
  const user = getAuthUser(req);
  const isAdmin = user?.isAdmin;

  if (!isBootstrap && !isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 부트스트랩: 계정이 하나라도 있으면 차단
  if (isBootstrap) {
    const count = await db.execute(`SELECT COUNT(*) as cnt FROM court_users`);
    if (Number(count.rows[0].cnt) > 0) {
      return NextResponse.json(
        { error: "이미 계정이 존재합니다. 관리자에게 문의하세요." },
        { status: 403 }
      );
    }
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await db.execute({
      sql: `INSERT INTO court_users (id, name, login_id, password, role, dept, is_admin)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        name,
        loginId,
        hashed,
        role || "COURT_CLERK",
        dept || "",
        isBootstrap ? 1 : 0,
      ],
    });

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const msg = String((e as Error).message || e);
    if (msg.includes("UNIQUE constraint")) {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다." },
        { status: 409 }
      );
    }
    console.error("[POST /api/court/auth/register]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
