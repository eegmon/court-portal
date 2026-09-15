import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { toCamel, toPublicCase, isPubliclyDisclosableCase } from "@/lib/utils";

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
  bookingDate: string;
  createdAt: string;
  expungement?: ExpungementInfo;
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
        <span className="text-lg">{icon}</span>
        <h2 className="font-bold text-slate-900 text-base">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DataRow({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-50 last:border-0 gap-1 text-sm">
      <span className="text-slate-500 font-medium text-xs sm:text-sm">{label}</span>
      <span className={`font-semibold ${highlight ? "text-blue-600 font-mono text-base" : "text-slate-800"}`}>
        {value || <span className="text-slate-300 font-normal">-</span>}
      </span>
    </div>
  );
}

async function getCaseDetail(caseNo: string): Promise<CaseDetail | null> {
  const decoded = decodeURIComponent(caseNo).trim();

  try {
    const result = await db.execute({
      sql: `SELECT id, hyeongje_no, latest_hyeongje_no, suje_no, suspect_name, charge_name,
                   court1_no, court1_result, court1_doc,
                   court2_no, court2_result, court2_doc,
                   court3_no, court3_result, court3_doc,
                   disposition, execution_status, execution_date, execution_notes,
                   is_expunged, expunged_at, expunged_reason,
                   booking_date, created_at
            FROM cases
            WHERE (
              id = ?
              OR court3_no = ? OR court2_no = ? OR court1_no = ?
              OR latest_hyeongje_no = ? OR hyeongje_no = ? OR suje_no = ?
            )
            AND deleted_at = ''
            LIMIT 1`,
      args: [decoded, decoded, decoded, decoded, decoded, decoded, decoded],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const raw = toCamel(result.rows[0] as Record<string, unknown>);
    if (!isPubliclyDisclosableCase(raw)) {
      return null;
    }
    const pub = toPublicCase(raw) as CaseDetail;
    if (pub.expungement?.isExpunged) {
      return null;
    }
    return pub;
  } catch (e) {
    console.error("[getCaseDetail error]", e);
    return null;
  }
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ caseNo: string }>;
}) {
  const { caseNo } = await params;
  const decodedCaseNo = decodeURIComponent(caseNo);
  const c = await getCaseDetail(decodedCaseNo);

  if (!c) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <a
          href="/search"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
        >
          ← 검색 목록으로 돌아가기
        </a>
      </div>

      {/* 사건 타이틀 카드 */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-md mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-mono text-xs font-bold px-3 py-1 rounded-md border border-blue-400/30">
              최신 대표 사건번호: {c.displayCaseNo}
            </span>
          </div>
          <span className="text-slate-300 text-xs">
            접수일: {c.bookingDate ? c.bookingDate.slice(0, 10) : "-"}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
          {c.suspectName}{" "}
          <span className="text-slate-400 text-lg font-normal">관련 사건 기록</span>
        </h1>
        <p className="text-slate-300 text-sm mt-1">죄명: {c.chargeName || "미기재"}</p>
      </div>

      {/* 기본 정보 */}
      <SectionCard title="기본 사건 정보" icon="📋">
        <DataRow label="대표 사건번호 (법원 최신)" value={c.displayCaseNo} highlight />
        <DataRow label="피의자/피고인 닉네임" value={c.suspectName} />
        <DataRow label="적용 죄명" value={c.chargeName} />
        <DataRow label="검찰 형제번호" value={c.hyeongjeNo} />
        <DataRow label="수사 수제번호" value={c.sujeNo} />
        <DataRow label="검찰 종국처분" value={c.disposition} />
      </SectionCard>

      {/* 재판 결과 및 판결문 */}
      <SectionCard title="법원 재판 및 판결문" icon="⚖️">
        <div className="space-y-4">
          {/* 1심 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">1심 (지방법원)</span>
              <span className="font-mono text-xs text-slate-500">{c.court1No || "사건번호 미기재"}</span>
            </div>
            <DataRow label="1심 선고 결과" value={c.court1Result} />
            {c.court1Doc ? (
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                <a
                  href={c.court1Doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                >
                  📄 1심 판결문 원문 보기 ↗
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-right mt-1">등록된 판결문 링크 없음</p>
            )}
          </div>

          {/* 2심 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">2심 (고등법원 항소심)</span>
              <span className="font-mono text-xs text-slate-500">{c.court2No || "사건번호 미기재"}</span>
            </div>
            <DataRow label="2심 선고 결과" value={c.court2Result} />
            {c.court2Doc ? (
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                <a
                  href={c.court2Doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                >
                  📄 2심 판결문 원문 보기 ↗
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-right mt-1">등록된 판결문 링크 없음</p>
            )}
          </div>

          {/* 3심 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">3심 (대법원 상고심)</span>
              <span className="font-mono text-xs text-slate-500">{c.court3No || "사건번호 미기재"}</span>
            </div>
            <DataRow label="3심 선고 결과" value={c.court3Result} />
            {c.court3Doc ? (
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                <a
                  href={c.court3Doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                >
                  📄 3심 판결문 원문 보기 ↗
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-right mt-1">등록된 판결문 링크 없음</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* 형집행 정보 */}
      <SectionCard title="형집행 현황" icon="🔒">
        <DataRow label="형집행 상태" value={c.executionStatus} highlight={!!c.executionStatus} />
        <DataRow label="집행 일자" value={c.executionDate ? c.executionDate.slice(0, 10) : "-"} />
        <DataRow label="집행 관련 비고사항" value={c.executionNotes} />
      </SectionCard>
    </div>
  );
}
