/**
 * lib/auth.ts
 * 법원 공무원 JWT 인증 헬퍼
 */
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const SECRET = process.env.COURT_JWT_SECRET!;

export interface CourtUserPayload {
  id: string;
  name: string;
  loginId: string;
  role: string;
  isAdmin: boolean;
}

export function signToken(payload: CourtUserPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "12h" });
}

export function verifyToken(token: string): CourtUserPayload | null {
  try {
    return jwt.verify(token, SECRET) as CourtUserPayload;
  } catch {
    return null;
  }
}

/** Request 헤더 또는 쿠키에서 토큰을 꺼내 검증 */
export function getAuthUser(req: NextRequest): CourtUserPayload | null {
  // Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyToken(authHeader.slice(7));
  }
  // 쿠키
  const cookieToken = req.cookies.get("court_token")?.value;
  if (cookieToken) return verifyToken(cookieToken);
  return null;
}

/** 관리자 권한 확인 */
export function requireAdmin(user: CourtUserPayload | null): boolean {
  return !!user?.isAdmin;
}
