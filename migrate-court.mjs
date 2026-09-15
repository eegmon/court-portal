import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL missing");
}

const db = createClient({ url, authToken });

async function init() {
  console.log("Turso DB 연결 확인 및 테이블 생성 중...");

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
  console.log("✓ court_users 테이블 준비 완료");

  const executionColumns = [
    "execution_status TEXT DEFAULT ''",
    "execution_date TEXT DEFAULT ''",
    "execution_notes TEXT DEFAULT ''",
    "execution_updated_by TEXT DEFAULT ''",
    "execution_updated_at TEXT DEFAULT ''",
  ];
  for (const col of executionColumns) {
    try {
      await db.execute(`ALTER TABLE cases ADD COLUMN ${col}`);
      console.log(`✓ cases 컬럼 추가: ${col}`);
    } catch (e) {
      if (!String(e.message || e).includes("duplicate column")) {
        console.warn(`! 컬럼 확인: ${col}`, e.message);
      }
    }
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS public_search_logs (
      id          TEXT PRIMARY KEY,
      nickname    TEXT NOT NULL,
      ip          TEXT DEFAULT '',
      result_count INTEGER DEFAULT 0,
      searched_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log("✓ public_search_logs 테이블 준비 완료");

  const res = await db.execute("SELECT COUNT(*) as count FROM cases");
  console.log(`현재 DB 내 사건 수: ${res.rows[0].count}건`);
  console.log("🚀 Turso DB 초기화 및 연동 성공!");
}

init().catch(console.error);
