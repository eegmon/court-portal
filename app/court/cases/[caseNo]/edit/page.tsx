"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface ExpungementInfo {
  isExpunged: boolean;
  expungedAt?: string;
  reason?: string;
  requiredDays?: number;
  elapsedDays?: number;
  daysRemaining?: number;
}

interface CaseDetail {
  displayCaseNo: string;
  hyeongjeNo: string;
  sujeNo: string;
  court1No?: string;
  court1Result: string;
  court1Doc: string;
  court2No?: string;
  court2Result: string;
  court2Doc: string;
  court3No?: string;
  court3Result: string;
  court3Doc: string;
  suspectName: string;
  chargeName: string;
  disposition: string;
  executionStatus: string;
  executionDate: string;
  executionNotes: string;
  expungement?: ExpungementInfo;
}

export default function CourtCaseEditPage() {
  const params = useParams();
  const router = useRouter();
  const caseNo = decodeURIComponent(params.caseNo as string);

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingVerdict, setSavingVerdict] = useState(false);
  const [savingExecution, setSavingExecution] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 법원 사건번호, 판결결과 및 판결문 폼
  const [court1No, setCourt1No] = useState("");
  const [court1Result, setCourt1Result] = useState("");
  const [court1Doc, setCourt1Doc] = useState("");

  const [court2No, setCourt2No] = useState("");
  const [court2Result, setCourt2Result] = useState("");
  const [court2Doc, setCourt2Doc] = useState("");

  const [court3No, setCourt3No] = useState("");
  const [court3Result, setCourt3Result] = useState("");
  const [court3Doc, setCourt3Doc] = useState("");

  // 형집행 폼
  const [executionStatus, setExecutionStatus] = useState("");
  const [executionDate, setExecutionDate] = useState("");
  const [executionNotes, setExecutionNotes] = useState("");

  // 형의 실효 폼
  const [isExpunged, setIsExpunged] = useState(false);
  const [expungedReason, setExpungedReason] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/records/${encodeURIComponent(caseNo)}`);
        if (res.status === 401) {
          router.push("/court/login");
          return;
        }
        if (!res.ok) {
          setError("사건을 찾을 수 없습니다.");
          return;
        }
        const data = await res.json();
        const c: CaseDetail = data.case;
        setCaseData(c);

        setCourt1No(c.court1No || "");
        setCourt1Result(c.court1Result || "");
        setCourt1Doc(c.court1Doc || "");

        setCourt2No(c.court2No || "");
        setCourt2Result(c.court2Result || "");
        setCourt2Doc(c.court2Doc || "");

        setCourt3No(c.court3No || "");
        setCourt3Result(c.court3Result || "");
        setCourt3Doc(c.court3Doc || "");

        setExecutionStatus(c.executionStatus || "");
        setExecutionDate(c.executionDate?.slice(0, 10) || "");
        setExecutionNotes(c.executionNotes || "");

        setIsExpunged(!!c.expungement?.isExpunged);
        setExpungedReason(c.expungement?.reason || "");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseNo, router]);

  async function handleVerdictSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingVerdict(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `/api/court/cases/${encodeURIComponent(caseNo)}/verdict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            court1No,
            court1Result,
            court1Doc,
            court2No,
            court2Result,
            court2Doc,
            court3No,
            court3Result,
            court3Doc,
          }),
        }
      );
      if (res.status === 401) {
        router.push("/court/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("법원 사건번호, 판결 선고 및 판결문 링크가 성공적으로 저장되었습니다.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingVerdict(false);
    }
  }

  async function handleExecutionSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingExecution(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `/api/court/cases/${encodeURIComponent(caseNo)}/execution`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            executionStatus,
            executionDate,
            executionNotes,
            isExpunged,
            expungedReason,
          }),
        }
      );
      if (res.status === 401) {
        router.push("/court/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("형집행 사실 및 형 실효 설정이 전산망에 성공적으로 저장되었습니다.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingExecution(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">사건 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-8">
          <p className="font-bold">{error}</p>
          <a
            href="/court/dashboard"
            className="mt-4 inline-block text-xs font-semibold text-rose-800 underline"
          >
            ← 대시보드로 복귀
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6">
        <a
          href="/court/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
        >
          ← 공무원 대시보드로 돌아가기
        </a>
      </div>

      {/* 사건 요약 카드 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              대표: {caseData?.displayCaseNo}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (검찰 {caseData?.hyeongjeNo})
            </span>
          </div>
          <span className="text-xs text-slate-400">
            피의자: <strong className="text-slate-800 font-bold">{caseData?.suspectName}</strong>
          </span>
        </div>
        <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100">
          <div>죄명: <strong className="text-slate-800">{caseData?.chargeName || "미기재"}</strong></div>
          <div>검찰 처분: <strong className="text-slate-800">{caseData?.disposition || "미기재"}</strong></div>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-xs font-semibold mb-6 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-xs font-semibold mb-6 flex items-center gap-2">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* 1. 재판 사건번호, 판결 선고 및 판결문 링크 입력 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-6">
        <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
          <span className="text-xl">⚖️</span>
          <div>
            <h2 className="font-bold text-slate-900 text-base">법원 사건번호 및 판결문 등록</h2>
            <p className="text-xs text-slate-400">심급별 법원 사건번호와 선고 결과, 판결문 URL을 등록합니다.</p>
          </div>
        </div>

        <form onSubmit={handleVerdictSave} className="space-y-4">
          {[
            {
              level: "1심 (지방법원)",
              no: court1No,
              setNo: setCourt1No,
              noPlaceholder: "예: 2024고단101",
              val: court1Result,
              setVal: setCourt1Result,
              doc: court1Doc,
              setDoc: setCourt1Doc,
              valPlaceholder: "예: 징역 1년 집행유예 2년 / 벌금 500만원",
            },
            {
              level: "2심 (고등법원 항소심)",
              no: court2No,
              setNo: setCourt2No,
              noPlaceholder: "예: 2024노202",
              val: court2Result,
              setVal: setCourt2Result,
              doc: court2Doc,
              setDoc: setCourt2Doc,
              valPlaceholder: "예: 항소기각 / 징역 8개월 감형",
            },
            {
              level: "3심 (대법원 상고심)",
              no: court3No,
              setNo: setCourt3No,
              noPlaceholder: "예: 2024도303",
              val: court3Result,
              setVal: setCourt3Result,
              doc: court3Doc,
              setDoc: setCourt3Doc,
              valPlaceholder: "예: 상고기각 (확정) / 파기환송",
            },
          ].map(({ level, no, setNo, noPlaceholder, val, setVal, doc, setDoc, valPlaceholder }) => (
            <div key={level} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>{level}</span>
                <span className="text-[11px] text-slate-400 font-normal">법원 사건번호 우선순위 자동 채번</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">법원 사건번호</label>
                  <input
                    value={no}
                    onChange={(e) => setNo(e.target.value)}
                    type="text"
                    placeholder={noPlaceholder}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">선고 결과</label>
                  <input
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    type="text"
                    placeholder={valPlaceholder}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">판결문 링크 (URL)</label>
                  <input
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingVerdict}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {savingVerdict ? "판결 정보 저장 중..." : "⚖️ 판결 정보 및 판결문 저장"}
            </button>
          </div>
        </form>
      </div>

      {/* 2. 형집행 및 제72조 형의 실효 관리 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
          <span className="text-xl">🔒</span>
          <div>
            <h2 className="font-bold text-slate-900 text-base">형집행 및 제72조(형의 실효) 관리</h2>
            <p className="text-xs text-slate-400">형집행 현황과 법령에 따른 실효 판정 및 수동 실효를 설정합니다.</p>
          </div>
        </div>

        {/* 제72조 법령 안내 박스 */}
        <div className="bg-purple-50 border border-purple-200/80 rounded-xl p-4 text-xs text-purple-900 mb-5">
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <span>📜</span>
            <span>제72조(형의 실효) 기준 안내</span>
          </div>
          <p className="text-purple-700 leading-relaxed text-[11px]">
            형의 집행 종료/면제일로부터 <strong>5시간 초과 금고·징역: 42일</strong> / <strong>5시간 이하 금고: 28일</strong> / <strong>벌금: 14일</strong> / <strong>구류·과료: 즉시</strong> 경과 시 대국민 검색에서 자동 실효(비공개) 처리됩니다.
          </p>
          {caseData?.expungement && (
            <div className="mt-2 pt-2 border-t border-purple-200/60 font-semibold text-purple-950">
              {caseData.expungement.isExpunged ? (
                <span>✅ 현재 상태: 형 실효 적용 중 ({caseData.expungement.reason})</span>
              ) : caseData.expungement.daysRemaining !== undefined ? (
                <span>⏳ 실효 예정: 집행일로부터 {caseData.expungement.daysRemaining}일 후 자동 실효 예정</span>
              ) : (
                <span>집행완료 일자 입력 시 자동 계산됩니다.</span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleExecutionSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                형집행 상태 <span className="text-rose-500">*</span>
              </label>
              <select
                value={executionStatus}
                onChange={(e) => setExecutionStatus(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">집행 상태를 선택하세요</option>
                <option value="집행 전">집행 전 (영장 대기/미집행)</option>
                <option value="집행 중">집행 중 (수형/노역/보호관찰 중)</option>
                <option value="집행 완료">집행 완료 (만기출소/벌금납부완료)</option>
                <option value="집행 유예">집행 유예 (유예기간 진행 중)</option>
                <option value="집행 면제">집행 면제 (사면/공소시효만료)</option>
                <option value="가석방">가석방 (가석방 출소)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                집행(완료/개시) 일자
              </label>
              <input
                value={executionDate}
                onChange={(e) => setExecutionDate(e.target.value)}
                type="date"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              형집행 세부 비고사항
            </label>
            <textarea
              value={executionNotes}
              onChange={(e) => setExecutionNotes(e.target.value)}
              rows={2}
              placeholder="예: 서울남부교도소 이감 완료 / 벌금 500만원 전액 납부 확인"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 수동 실효 토글 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isExpunged"
                checked={isExpunged}
                onChange={(e) => setIsExpunged(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="isExpunged" className="text-xs font-bold text-slate-800 cursor-pointer">
                ⚖️ 법원 직권 수동 실효 처리 (체크 시 대국민 검색에서 즉시 비공개)
              </label>
            </div>

            {isExpunged && (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">실효 사유 (선택)</label>
                <input
                  value={expungedReason}
                  onChange={(e) => setExpungedReason(e.target.value)}
                  type="text"
                  placeholder="예: 특별사면 / 법 제72조에 따른 실효 / 법원 직권 말소"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingExecution}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {savingExecution ? "저장 중..." : "🔒 형집행 사실 및 실효 설정 저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
