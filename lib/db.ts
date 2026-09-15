/**
 * lib/db.ts
 * fervent-borg와 동일한 Turso DB에 연결 (읽기 + 법원 공무원 쓰기)
 */
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL 환경변수가 설정되지 않았습니다.");
}

export const db = createClient({ url, authToken });

/**
 * 법원 포털에서 필요한 테이블/컬럼을 추가로 초기화
 * - court_users: 법원 공무원 계정
 * - cases에 형집행 컬럼 추가 (없을 경우)
 * - public_search_logs: 닉네임 검색 감사 로그
 */
export async function initCourtDb() {
  // ── court_users (법원 공무원 / 판사 계정) ──────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS court_users (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      login_id     TEXT NOT NULL UNIQUE,
      password     TEXT NOT NULL,
      role         TEXT NOT NULL DEFAULT 'COURT_CLERK',
      dept         TEXT DEFAULT '',
      is_admin     INTEGER DEFAULT 0,
      status       TEXT DEFAULT 'ACTIVE',
      created_at   TEXT DEFAULT (datetime('now')),
      last_login   TEXT DEFAULT ''
    )
  `);

  // ── cases 테이블에 형집행 컬럼 추가 ───────────────────────────────
  const executionColumns = [
    "execution_status TEXT DEFAULT ''",
    "execution_date TEXT DEFAULT ''",
    "execution_notes TEXT DEFAULT ''",
    "execution_updated_by TEXT DEFAULT ''",
    "execution_updated_at TEXT DEFAULT ''",
    "is_expunged INTEGER DEFAULT 0",
    "expunged_at TEXT DEFAULT ''",
    "expunged_reason TEXT DEFAULT ''",
  ];
  for (const col of executionColumns) {
    try {
      await db.execute(`ALTER TABLE cases ADD COLUMN ${col}`);
    } catch (e) {
      const msg = String((e as Error).message || e);
      if (!msg.includes("duplicate column")) throw e;
    }
  }

  // ── public_search_logs (닉네임 검색 감사 로그) ────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS public_search_logs (
      id          TEXT PRIMARY KEY,
      nickname    TEXT NOT NULL,
      ip          TEXT DEFAULT '',
      result_count INTEGER DEFAULT 0,
      searched_at TEXT DEFAULT (datetime('now'))
    )
  `);

  console.log("[Court DB] 초기화 완료");
}
