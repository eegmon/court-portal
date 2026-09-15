import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turso (@libsql/client)는 서버 사이드 전용 — 클라이언트 번들에서 제외
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
