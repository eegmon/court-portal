"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface ExpungementInfo {
  isExpunged: boolean;
  expungedAt?: string;
  reason?: string;
  requiredDays?: number;
  elapsedDays?: number;
  daysRemaining?: number;
}

interface CaseRecord {
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

function StatusBadge({ label, text }: { label?: string; text: string }) {
  if (!text) return <span className="text-slate-300 text-xs">-</span>;

  const isNegative = ["무죄", "불기소", "기각", "혐의없음", "공소기각", "죄가안됨"].some((k) =>
    text.includes(k)
  );
  const isExecutionDone = ["완료", "면제"].some((k) => text.includes(k));
  const isExecutionPending = ["집행 중", "집행 전"].some((k) => text.includes(k));

  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
  if (isNegative) {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (isExecutionDone) {
    colorClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (isExecutionPending) {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (text.includes("징역") || text.includes("금고") || text.includes("벌금") || text.includes("구형")) {
    colorClass = "bg-rose-50 text-rose-700 border-rose-200";
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      {label && <span className="text-slate-400 font-medium">{label}</span>}
      <span className={`px-2.5 py-1 rounded-md font-semibold border ${colorClass}`}>
        {text}
      </span>
    </div>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialNickname = searchParams.get("nickname") || "";

  const [nickname, setNickname] = useState(initialNickname);
  const [input, setInput] = useState(initialNickname);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [expungedCount, setExpungedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialNickname) fetchCases(initialNickname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCases(q: string) {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const res = await fetch(`/api/search?nickname=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCases(data.cases);
      setExpungedCount(data.expungedCount || 0);
    } catch (e) {
      setError((e as Error).message || "검색 중 오류가 발생했습니다.");
      setCases([]);
      setExpungedCount(0);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setNickname(input.trim());
    router.push(`/search?nickname=${encodeURIComponent(input.trim())}`);
    fetchCases(input.trim());
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 상단 검색 바 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
        <h1 className="text-xl font-bold text-slate-900 mb-2">사법 기록 통합 검색</h1>
        <p className="text-slate-500 text-xs mb-4">
          조회하고자 하는 닉네임을 입력하여 사건 처분 및 판결 사실을 확인하세요.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder="닉네임 입력 (예: 홍길동)"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </form>
      </div>

      {/* 에러 알림 */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm mb-6 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* 결과 헤더 */}
      {searched && !loading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900">&quot;{nickname}&quot;</span> 검색 결과:{" "}
            <span className="font-bold text-blue-600">{cases.length}</span>건
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {expungedCount > 0 && (
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                ⚖️ 제72조 실효 전과 {expungedCount}건 비공개 보호됨
              </span>
            )}
            <span>최신 법원 사건번호 기준</span>
          </div>
        </div>
      )}

      {/* 로딩 표시 */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-slate-600">전산망에서 기록을 조회하고 있습니다...</p>
        </div>
      )}

      {/* 결과 목록 */}
      {!loading && cases.length > 0 && (
        <div className="space-y-4">
          {cases.map((c, i) => {
            const latestDoc = c.court3Doc || c.court2Doc || c.court1Doc;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="bg-blue-50 text-blue-800 font-mono text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200">
                      {c.displayCaseNo}
                    </span>
                    <span className="text-slate-900 font-bold text-base">{c.suspectName}</span>
                    {c.court3No && c.displayCaseNo !== c.hyeongjeNo && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        (검찰 {c.hyeongjeNo})
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    접수일: {c.bookingDate ? c.bookingDate.slice(0, 10) : "-"}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-slate-400 font-medium mb-1">죄명</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {c.chargeName || "죄명 미기재"}
                  </div>
                </div>

                {/* 진행 상태 태그들 */}
                <div className="bg-slate-50 rounded-xl p-3 flex flex-wrap items-center gap-3 border border-slate-100">
                  <StatusBadge label="검찰처분:" text={c.disposition} />
                  {c.court1Result && <StatusBadge label="1심선고:" text={c.court1Result} />}
                  {c.court2Result && <StatusBadge label="2심선고:" text={c.court2Result} />}
                  {c.court3Result && <StatusBadge label="3심선고:" text={c.court3Result} />}
                  {c.executionStatus && <StatusBadge label="형집행:" text={c.executionStatus} />}
                </div>

                {/* 판결문 링크 및 상세 버튼 */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {c.court1Doc && (
                      <a
                        href={c.court1Doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                      >
                        📄 1심 판결문 ↗
                      </a>
                    )}
                    {c.court2Doc && (
                      <a
                        href={c.court2Doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                      >
                        📄 2심 판결문 ↗
                      </a>
                    )}
                    {c.court3Doc && (
                      <a
                        href={c.court3Doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                      >
                        📄 대법원 판결문 ↗
                      </a>
                    )}
                  </div>

                  <a
                    href={`/records/${encodeURIComponent(c.displayCaseNo)}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs hover:underline ml-auto"
                  >
                    사건 전체 상세 보기 →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 결과 없음 */}
      {searched && !loading && cases.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
          <div className="text-4xl mb-3">🕊️</div>
          <h3 className="font-bold text-slate-800 text-base mb-1">
            {expungedCount > 0 ? "유효한 전과 기록이 없습니다" : "기록이 존재하지 않습니다"}
          </h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {expungedCount > 0
              ? `제72조(형의 실효)에 따라 기간이 경과하여 실효된 전과(${expungedCount}건)는 대국민 공개에서 자동 제외되었습니다.`
              : "해당 닉네임으로 등록된 전과 또는 형집행 대상 사건이 없습니다."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm">페이지 로딩 중...</p>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
