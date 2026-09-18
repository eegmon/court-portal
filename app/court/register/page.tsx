"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COURT_ROLES } from "@/lib/utils";

export default function CourtRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState("JUDGE");
  const [dept, setDept] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/court/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          loginId,
          password,
          role,
          dept,
          joinCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsPending(!!data.isPending);
      setSuccess(data.message || "가입 신청이 완료되었습니다.");

      setTimeout(() => {
        router.push("/court/login");
      }, data.isPending ? 3000 : 1500);
    } catch (e) {
      setError((e as Error).message || "가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-6 sm:py-8 px-2">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-lg p-6 sm:p-8">
        <div className="text-center mb-5 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl sm:text-2xl mx-auto mb-2.5 shadow-inner">
            🏛️
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">법원 공무원 가입 신청</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            판사 및 법원 공무원 업무망 계정을 신청합니다.
          </p>
        </div>

        {/* 승인 절차 안내 배너 */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 rounded-xl p-3 text-[11px] sm:text-xs text-blue-800 dark:text-blue-300 mb-4 flex items-start gap-2">
          <span className="text-sm shrink-0">ℹ️</span>
          <span>
            신규 공무원 계정은 가입 신청 후 <strong>법원 관리자의 승인</strong>을 거쳐 활성화됩니다.
            (최초 관리자 부트스트랩 코드가 있는 경우 즉시 활성화)
          </span>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl p-3 text-xs mb-4 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl p-3.5 text-xs mb-4 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <span>✅</span>
              <span>{success}</span>
            </div>
            {isPending && (
              <p className="text-[11px] text-emerald-800 dark:text-emerald-200 pl-5">
                관리자가 승인하면 즉시 로그인할 수 있습니다. 잠시 후 로그인 화면으로 이동합니다.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              성명 <span className="text-rose-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              placeholder="예: 홍길동"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              공무원 아이디 (로그인용) <span className="text-rose-500">*</span>
            </label>
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              type="text"
              required
              autoComplete="username"
              placeholder="아이디를 입력하세요"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                비밀번호 <span className="text-rose-500">*</span>
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="new-password"
                placeholder="4자 이상"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                비밀번호 확인 <span className="text-rose-500">*</span>
              </label>
              <input
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                type="password"
                required
                autoComplete="new-password"
                placeholder="비밀번호 재입력"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                직무 직책 <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
              >
                {COURT_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                소속 재판부 / 부서
              </label>
              <input
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                type="text"
                placeholder="예: 형사1단독 / 사법행정처"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              관리자 가입 코드 <span className="text-slate-400 font-normal">(관리자 즉시 등록 시에만 입력)</span>
            </label>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              type="password"
              placeholder="일반 신청 시 비워두세요"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 mt-4"
          >
            {loading ? "가입 신청 처리 중..." : "법원 공무원 가입 신청"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            이미 계정이 있으신가요?{" "}
            <a href="/court/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              로그인하기 →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

