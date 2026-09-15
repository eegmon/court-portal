/**
 * middleware.ts
 * /court/* 경로는 court_token 쿠키가 없으면 로그인 페이지로 리다이렉트
 * (로그인·등록 페이지 자체는 제외)
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_COURT_PATHS = ["/court/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /court/** 경로 보호 (API 제외 — API는 라우트에서 직접 검증)
  if (pathname.startsWith("/court/") && !pathname.startsWith("/api/")) {
    if (PUBLIC_COURT_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    const token = req.cookies.get("court_token");
    if (!token) {
      const loginUrl = new URL("/court/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/court/:path*"],
};
