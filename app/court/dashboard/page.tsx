"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ExpungementInfo {
  isExpunged: boolean;
  expungedAt?: string;
  reason?: string;
  requiredDays?: number;
  elapsedDays?: number;
  daysRemaining?: number;
}

interface CaseRow {
  id: string;
  displayCaseNo: string;
  hyeongjeNo: string;
  sujeNo: string;
  court1No?: string;
  court2No?: string;
  court3No?: string;
  suspectName: string;
  chargeName: string;
  disposition: string;
  court1Result: string;
  court1Doc?: string;
  court2Result: string;
  court2Doc?: string;
  court3Result: string;
  court3Doc?: string;
  executionStatus: string;
  executionDate: string;
  bookingDate: string;
  expungement?: ExpungementInfo;
}

export default function CourtDashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 사용자 정보 및 관리자 여부
  const [currentUser, setCurrentUser] = useState<{
    name?: string;
    role?: string;
    dept?: string;
    isAdmin?: boolean;
  } | null>(null);
  const [pendingUserCount, setPendingUserCount] = useState(0);

  // 판결문 빠른 첨부 모달 상태
  const [attachModalCase, setAttachModalCase] = useState<CaseRow | null>(null);
  const [court1DocInput, setCourt1DocInput] = useState("");
  const [court2DocInput, setCourt2DocInput] = useState("");
  const [court3DocInput, setCourt3DocInput] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchCases = useCallback(async (pageNum: number, query: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/court/cases?page=${pageNum}&q=${encodeURIComponent(query)}`
      );
      if (res.status === 401) {
        router.push("/court/login");
        return;
      }
      const data = await res.json();
      setCases(data.cases || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCases(1, "");

    // 사용자 정보 및 권한 불러오기
    fetch("/api/court/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          setPendingUserCount(data.pendingCount || 0);
        }
      })
      .catch(() => {});
  }, [fetchCases]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(q);
    fetchCases(1, q);
  }

  async function handleLogout() {
    await fetch("/api/court/auth/logout", { method: "POST" });
    router.push("/court/login");
  }

  function openAttachModal(c: CaseRow) {
    setAttachModalCase(c);
    setCourt1DocInput(c.court1Doc || "");
    setCourt2DocInput(c.court2Doc || "");
    setCourt3DocInput(c.court3Doc || "");
    setModalMsg(null);
  }

  async function handleQuickSaveDocs(e: React.FormEvent) {
    e.preventDefault();
    if (!attachModalCase) return;
    setSavingDoc(true);
    setModalMsg(null);

    try {
      const res = await fetch(
        `/api/court/cases/${encodeURIComponent(attachModalCase.displayCaseNo)}/verdict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            court1No: attachModalCase.court1No || "",
            court1Result: attachModalCase.court1Result || "",
            court1Doc: court1DocInput.trim(),
            court2No: attachModalCase.court2No || "",
            court2Result: attachModalCase.court2Result || "",
            court2Doc: court2DocInput.trim(),
            court3No: attachModalCase.court3No || "",
            court3Result: attachModalCase.court3Result || "",
            court3Doc: court3DocInput.trim(),
          }),
        }
      );

      if (res.status === 401) {
        router.push("/court/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalMsg({ text: "판결문 링크가 성공적으로 첨부되었습니다!" });
      setTimeout(() => {
        setAttachModalCase(null);
        fetchCases(page, search);
      }, 900);
    } catch (e) {
      setModalMsg({ text: (e as Error).message || "저장 실패", isError: true });
    } finally {
      setSavingDoc(false);
    }
  }

  function needsVerdict(c: CaseRow) {
    return (
      c.disposition &&
      !c.disposition.includes("불기소") &&
      !c.disposition.includes("무혐의") &&
      !c.disposition.includes("기소유예") &&
      !c.court1Result
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 바 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xs mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              법원 공무원 전산망
            </span>
            {currentUser?.name && (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {currentUser.name} 님 ({currentUser.dept || "법원"})
              </span>
            )}
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">사건 판결 및 형 실효 관리</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            법원 사건번호 채번, 1~3심 판결문 링크 첨부 및 제72조(형의 실효) 사실을 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {currentUser?.isAdmin && (
            <a
              href="/court/admin/users"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
            >
              <span>👥</span>
              <span>공무원 가입/계정 관리</span>
              {pendingUserCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-bounce">
                  {pendingUserCount}
                </span>
              )}
            </a>
          )}
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl transition-colors"
          >
            안전 로그아웃
          </button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-2xs mb-5 sm:mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="피의자 닉네임 또는 법원/검찰 사건번호로 검색"
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-0"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all shrink-0"
          >
            검색
          </button>
        </form>
      </div>

      {/* 상태 요약 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 px-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          총 <strong className="text-slate-800 dark:text-slate-200 font-bold">{total}</strong>건의 관리 사건 (형제/특형/특공)
          {search && ` (검색어: "${search}")`}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">최신 법원 사건번호 우선 정렬</span>
      </div>

      {/* 사건 목록 */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs sm:text-sm">목록을 불러오는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const isExpunged = c.expungement?.isExpunged;
            const hasDoc = c.court1Doc || c.court2Doc || c.court3Doc;

            return (
              <div
                key={c.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs hover:shadow-md transition-all ${
                  isExpunged
                    ? "border-purple-200/80 dark:border-purple-800/80 bg-purple-50/20 dark:bg-purple-950/20"
                    : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                    <span className="font-mono text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {c.displayCaseNo}
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold text-sm">{c.suspectName}</span>

                    {/* 형 실효 뱃지 */}
                    {isExpunged && (
                      <span
                        title={c.expungement?.reason}
                        className="text-[11px] bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1"
                      >
                        ⚖️ 형 실효됨 (대국민 비공개)
                      </span>
                    )}

                    {/* 판결문 등록 상태 */}
                    {hasDoc ? (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                        <span>📄</span>
                        <span>판결문 연동됨</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">
                        판결문 미등록
                      </span>
                    )}

                    {needsVerdict(c) && (
                      <span className="text-[11px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md font-semibold">
                        ⚡ 판결결과 미입력
                      </span>
                    )}
                    {c.court1Result && !c.executionStatus && (
                      <span className="text-[11px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md font-semibold">
                        🔒 형집행 미입력
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2.5 gap-y-1">
                    <span>죄명: <strong className="text-slate-700 dark:text-slate-200">{c.chargeName || "-"}</strong></span>
                    <span>·</span>
                    <span>검찰: <span className="text-slate-600 dark:text-slate-300 font-mono">{c.hyeongjeNo || "-"}</span></span>
                    {c.court1Result && (
                      <>
                        <span>·</span>
                        <span>1심: <strong className="text-indigo-600 dark:text-indigo-400">{c.court1Result}</strong></span>
                      </>
                    )}
                    {c.executionStatus && (
                      <>
                        <span>·</span>
                        <span>집행: <strong className="text-emerald-600 dark:text-emerald-400">{c.executionStatus}</strong></span>
                      </>
                    )}
                  </div>

                  {/* 실효 안내 힌트 */}
                  {c.expungement?.daysRemaining !== undefined && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      ⏳ 제72조 실효까지 {c.expungement.daysRemaining}일 남음 (집행 후 {c.expungement.elapsedDays}일 경과 / 기준: {c.expungement.requiredDays}일)
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 mt-2 sm:mt-0">
                  <button
                    onClick={() => openAttachModal(c)}
                    className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <span>📎</span>
                    <span>판결문 첨부</span>
                  </button>
                  <a
                    href={`/court/cases/${encodeURIComponent(c.displayCaseNo)}/edit`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    상세 관리 →
                  </a>
                </div>
              </div>
            );
          })}

          {cases.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-400">
              <div className="text-4xl mb-3">📂</div>
              <p className="font-medium text-slate-600 dark:text-slate-400">등록된 사건이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 sm:mt-8">
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage(page - 1);
              fetchCases(page - 1, search);
            }}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              setPage(page + 1);
              fetchCases(page + 1, search);
            }}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
          >
            다음
          </button>
        </div>
      )}

      {/* 📎 판결문 빠른 첨부 모달 다이얼로그 */}
      {attachModalCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📎</span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">판결문 링크 빠른 첨부</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                    사건: {attachModalCase.displayCaseNo} ({attachModalCase.suspectName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAttachModalCase(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${
                  modalMsg.isError
                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                <span>{modalMsg.isError ? "⚠️" : "✅"}</span>
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleQuickSaveDocs} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1심 (지방법원) 판결문 URL
                </label>
                <div className="flex gap-2">
                  <input
                    value={court1DocInput}
                    onChange={(e) => setCourt1DocInput(e.target.value)}
                    type="url"
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {court1DocInput && (
                    <a
                      href={court1DocInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-2 rounded-xl font-semibold shrink-0"
                    >
                      열람 ↗
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2심 (고등법원) 판결문 URL
                </label>
                <div className="flex gap-2">
                  <input
                    value={court2DocInput}
                    onChange={(e) => setCourt2DocInput(e.target.value)}
                    type="url"
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {court2DocInput && (
                    <a
                      href={court2DocInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-2 rounded-xl font-semibold shrink-0"
                    >
                      열람 ↗
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3심 (대법원) 판결문 URL
                </label>
                <div className="flex gap-2">
                  <input
                    value={court3DocInput}
                    onChange={(e) => setCourt3DocInput(e.target.value)}
                    type="url"
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {court3DocInput && (
                    <a
                      href={court3DocInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-2 rounded-xl font-semibold shrink-0"
                    >
                      열람 ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAttachModalCase(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {savingDoc ? "첨부 저장 중..." : "판결문 링크 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
