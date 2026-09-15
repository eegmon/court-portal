"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CourtLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/court/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/court/dashboard");
    } catch (e) {
      setError((e as Error).message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
            ⚖️
          </div>
          <h1 className="text-2xl font-bold text-slate-900">법원 공무원 업무망</h1>
          <p className="text-xs text-slate-400 mt-1">
            재판 판결 선고 및 형집행 정보 전산 입력 시스템
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              공무원 계정 아이디
            </label>
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              type="text"
              required
              autoComplete="username"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="아이디를 입력하세요"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              비밀번호
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 mt-2"
          >
            {loading ? "인증 확인 중..." : "업무망 로그인"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            계정 발급 및 비밀번호 분실은 사법전산 담당자에게 문의 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
