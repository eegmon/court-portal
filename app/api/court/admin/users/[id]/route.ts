/**
 * app/api/court/admin/users/[id]/route.ts
 * 관리자 전용: 공무원 계정 상태/역할/권한 변경 및 삭제 API
 * PATCH /api/court/admin/users/[id]
 * DELETE /api/court/admin/users/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCamel } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authUser = getAuthUser(req);
  if (!authUser || !requireAdmin(authUser)) {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "대상 사용자 ID가 누락되었습니다." }, { status: 400 });
  }

  const body = await req.json();
  const { status, role, dept, isAdmin } = body;

  try {
    // 대상 계정 존재 여부 확인
    const targetCheck = await db.execute({
      sql: `SELECT * FROM court_users WHERE id = ? LIMIT 1`,
      args: [id],
    });

    if (targetCheck.rows.length === 0) {
      return NextResponse.json({ error: "해당 사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const updates: string[] = [];
    const args: (string | number)[] = [];

    if (status !== undefined) {
      const validStatuses = ["PENDING", "ACTIVE", "REJECTED", "INACTIVE"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "유효하지 않은 계정 상태입니다." }, { status: 400 });
      }
      updates.push("status = ?");
      args.push(status);
    }

    if (role !== undefined) {
      updates.push("role = ?");
      args.push(role);
    }

    if (dept !== undefined) {
      updates.push("dept = ?");
      args.push(dept.trim());
    }

    if (isAdmin !== undefined) {
      // 본인의 관리자 권한을 스스로 해제하는 것 방지 (혼자일 경우)
      if (authUser.id === id && !isAdmin) {
        const adminCountRes = await db.execute(
          `SELECT COUNT(*) as cnt FROM court_users WHERE is_admin = 1 AND status = 'ACTIVE'`
        );
        const adminCount = Number(adminCountRes.rows[0]?.cnt || 0);
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "최소 1명 이상의 활성 관리자가 유지되어야 합니다." },
            { status: 400 }
          );
        }
      }
      updates.push("is_admin = ?");
      args.push(isAdmin ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
    }

    args.push(id);
    await db.execute({
      sql: `UPDATE court_users SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    // 업데이트된 사용자 정보 반환
    const updatedRes = await db.execute({
      sql: `SELECT id, name, login_id, role, dept, is_admin, status, created_at, last_login 
            FROM court_users WHERE id = ? LIMIT 1`,
      args: [id],
    });

    const updatedUser = toCamel(updatedRes.rows[0] as Record<string, unknown>);

    return NextResponse.json({
      ok: true,
      message: "공무원 계정 정보가 성공적으로 변경되었습니다.",
      user: updatedUser,
    });
  } catch (e) {
    console.error("[PATCH /api/court/admin/users/[id]]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authUser = getAuthUser(req);
  if (!authUser || !requireAdmin(authUser)) {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "대상 사용자 ID가 누락되었습니다." }, { status: 400 });
  }

  if (authUser.id === id) {
    return NextResponse.json(
      { error: "본인 계정은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  try {
    const checkRes = await db.execute({
      sql: `SELECT id, name, is_admin FROM court_users WHERE id = ? LIMIT 1`,
      args: [id],
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "해당 사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    await db.execute({
      sql: `DELETE FROM court_users WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({
      ok: true,
      message: "계정(또는 가입 신청)이 삭제되었습니다.",
    });
  } catch (e) {
    console.error("[DELETE /api/court/admin/users/[id]]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
