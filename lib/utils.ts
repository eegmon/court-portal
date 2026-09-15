/**
 * lib/utils.ts
 * 공통 유틸리티 (사건번호 우선순위 채번, 제72조 형의 실효 판정)
 */

/** snake_case → camelCase 변환 */
export function toCamel(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      v,
    ])
  );
}

/**
 * 가장 최신의 법원 사건번호를 대표 사건번호로 결정
 * 우선순위: 3심 사건번호 > 2심 사건번호 > 1심 사건번호 > 최신형제번호 > 형제번호 > 수제번호
 */
export function getDisplayCaseNo(c: Record<string, unknown>): string {
  return String(
    c.court3No ||
    c.court2No ||
    c.court1No ||
    c.latestHyeongjeNo ||
    c.hyeongjeNo ||
    c.sujeNo ||
    "사건번호 미부여"
  );
}

export interface ExpungementInfo {
  isExpunged: boolean;
  expungedAt?: string;
  reason?: string;
  requiredDays?: number;
  elapsedDays?: number;
  daysRemaining?: number;
}

/**
 * 제72조(형의 실효) 및 수동 실효 여부 계산
 *
 * 제72조(형의 실효)
 * - 구류 / 과료 : 집행종료 / 면제 시 즉시 실효 (0일)
 * - 벌금 : 14일
 * - 5시간 이하의 금고 : 28일
 * - 5시간 초과 금고 / 징역 : 42일
 */
export function calculateExpungement(c: Record<string, unknown>): ExpungementInfo {
  // 1. 수동 실효 처리된 경우
  if (c.isExpunged === 1 || c.isExpunged === "1" || c.isExpunged === true) {
    return {
      isExpunged: true,
      expungedAt: String(c.expungedAt || ""),
      reason: String(c.expungedReason || "법원 직권 형 실효 처리"),
    };
  }

  const executionStatus = String(c.executionStatus || "");
  const isExecutionDone = executionStatus.includes("완료") || executionStatus.includes("면제");
  const executionDateStr = String(c.executionDate || "");

  if (!isExecutionDone || !executionDateStr) {
    return { isExpunged: false };
  }

  const execDate = new Date(executionDateStr);
  if (isNaN(execDate.getTime())) {
    return { isExpunged: false };
  }

  // 선고 형량 텍스트 파악 (3심 > 2심 > 1심 > 처분)
  const verdictText = String(
    c.court3Result || c.court2Result || c.court1Result || c.disposition || ""
  );

  let requiredDays = 42; // 기본 징역/금고 42일
  let penaltyType = "5시간 초과 금고/징역 (42일)";

  if (verdictText.includes("구류") || verdictText.includes("과료")) {
    requiredDays = 0;
    penaltyType = "구류/과료 (즉시 실효)";
  } else if (verdictText.includes("벌금")) {
    requiredDays = 14;
    penaltyType = "벌금 (14일)";
  } else if (verdictText.includes("금고") || verdictText.includes("시간")) {
    const match = verdictText.match(/(\d+)\s*시간/);
    if (match) {
      const hours = parseInt(match[1], 10);
      if (hours <= 5) {
        requiredDays = 28;
        penaltyType = `5시간 이하 금고(${hours}시간, 28일)`;
      } else {
        requiredDays = 42;
        penaltyType = `5시간 초과 금고(${hours}시간, 42일)`;
      }
    } else {
      requiredDays = 42;
    }
  }

  const now = new Date();
  const diffMs = now.getTime() - execDate.getTime();
  const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (elapsedDays >= requiredDays) {
    const expungedDate = new Date(execDate.getTime() + requiredDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return {
      isExpunged: true,
      expungedAt: expungedDate,
      reason: `제72조(형의 실효) 규정에 따른 기간 경과 자동 실효 [${penaltyType}]`,
      requiredDays,
      elapsedDays,
    };
  }

  return {
    isExpunged: false,
    requiredDays,
    elapsedDays,
    daysRemaining: requiredDays - elapsedDays,
  };
}

/** 공개용 사건 정보 추출 (대표 사건번호 + 판결문 링크 + 실효 정보 포함) */
export function toPublicCase(c: Record<string, unknown>) {
  const displayCaseNo = getDisplayCaseNo(c);
  const expungement = calculateExpungement(c);

  return {
    displayCaseNo,
    hyeongjeNo: c.hyeongjeNo,
    sujeNo: c.sujeNo,
    court1No: c.court1No,
    court2No: c.court2No,
    court3No: c.court3No,
    suspectName: c.suspectName,
    chargeName: c.chargeName,
    disposition: c.disposition,
    court1Result: c.court1Result,
    court1Doc: c.court1Doc,
    court2Result: c.court2Result,
    court2Doc: c.court2Doc,
    court3Result: c.court3Result,
    court3Doc: c.court3Doc,
    executionStatus: c.executionStatus,
    executionDate: c.executionDate,
    executionNotes: c.executionNotes,
    bookingDate: c.bookingDate,
    createdAt: c.createdAt,
    expungement,
  };
}

/** UUID v4 생성 */
export function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
