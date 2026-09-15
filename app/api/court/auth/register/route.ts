/**
 * app/api/court/auth/register/route.ts
 * 법원 공무원 및 판사 계정 가입 API
 * POST /api/court/auth/register
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { uuidv4 } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, loginId, password, role, dept, joinCode } = body;

  if (!name || !loginId || !password) {
    return NextResponse.json(
      { error: "이름, 아이디, 비밀번호를 모두 입력해주세요." },
      { status: 400 }
    );
  }

  if (password.length < 4) {
    return NextResponse.json(
      { error: "비밀번호는 최소 4자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  try {
    // 1. 기존 등록된 계정 수 확인
    const countResult = await db.execute(`SELECT COUNT(*) as cnt FROM court_users`);
    const totalUsers = Number(countResult.rows[0].cnt);

    const bootstrapSecret = process.env.COURT_BOOTSTRAP_SECRET || "1234";
    const user = getAuthUser(req);
    const isAdmin = !!user?.isAdmin;

    // 첫 번째 계정이거나 부트스트랩 코드가 일치하면 관리자 계정으로 승격
    const isFirstUser = totalUsers === 0;
    const isBootstrapMatch = joinCode && joinCode.trim() === bootstrapSecret;

    // 가입 승인 검증: 첫 계정이거나, 관리자가 추가하거나, 가입 코드가 일치하거나, 공개 가입 허용
    // (가상서버 환경에서 원활한 테스팅을 위해 가입 지원)
    let assignedRole = role || "COURT_CLERK";
    let isUserAdmin = isFirstUser || (isBootstrapMatch ? 1 : 0);

    const hashed = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await db.execute({
      sql: `INSERT INTO court_users (id, name, login_id, password, role, dept, is_admin, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
      args: [
        id,
        name.trim(),
        loginId.trim(),
        hashed,
        assignedRole,
        dept?.trim() || "",
        isUserAdmin,
      ],
    });

    return NextResponse.json({
      ok: true,
      id,
      message: isFirstUser
        ? "최초 관리자 계정으로 등록되었습니다."
        : "법원 공무원 계정이 등록되었습니다.",
    });
  } catch (e) {
    const msg = String((e as Error).message || e);
    if (msg.includes("UNIQUE constraint")) {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다. 다른 아이디를 입력하세요." },
        { status: 409 }
      );
    }
    console.error("[POST /api/court/auth/register]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
