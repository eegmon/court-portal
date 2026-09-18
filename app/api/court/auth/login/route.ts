/**
 * app/api/court/auth/login/route.ts
 * 법원 공무원 로그인
 * POST /api/court/auth/login
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { InValue } from "@libsql/client";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { toCamel } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { loginId, password } = await req.json();

  if (!loginId || !password) {
    return NextResponse.json(
      { error: "아이디와 비밀번호를 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const result = await db.execute({
      sql: `SELECT * FROM court_users WHERE login_id = ? LIMIT 1`,
      args: [loginId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const user = toCamel(result.rows[0] as Record<string, unknown>);
    const match = await bcrypt.compare(password, user.password as string);

    if (!match) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 계정 승인 상태 확인
    const userStatus = String(user.status || "ACTIVE");
    if (userStatus === "PENDING") {
      return NextResponse.json(
        {
          error:
            "공무원 가입 승인 대기 중입니다. 관리자의 승인 완료 후 로그인하실 수 있습니다.",
          status: "PENDING",
        },
        { status: 403 }
      );
    }
    if (userStatus === "REJECTED") {
      return NextResponse.json(
        {
          error:
            "가입 신청이 반려된 계정입니다. 법원 행정처 또는 시스템 관리자에게 문의하세요.",
          status: "REJECTED",
        },
        { status: 403 }
      );
    }
    if (userStatus === "INACTIVE") {
      return NextResponse.json(
        {
          error:
            "현재 정지(비활성화)된 계정입니다. 관리자에게 문의하세요.",
          status: "INACTIVE",
        },
        { status: 403 }
      );
    }

    // 마지막 로그인 시각 갱신
    await db.execute({
      sql: `UPDATE court_users SET last_login = datetime('now') WHERE id = ?`,
      args: [user.id as string],
    });

    const token = signToken({
      id: user.id as string,
      name: user.name as string,
      loginId: user.loginId as string,
      role: user.role as string,
      isAdmin: !!user.isAdmin,
    });

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role, isAdmin: user.isAdmin },
    });

    // HttpOnly 쿠키로 토큰 저장 (12시간)
    response.cookies.set("court_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("[POST /api/court/auth/login]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
