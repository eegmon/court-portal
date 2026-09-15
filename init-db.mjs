import { initCourtDb } from "./lib/db.js";

async function main() {
  console.log("DB 초기화 시작...");
  await initCourtDb();
  console.log("DB 초기화 완료!");
  process.exit(0);
}

main().catch((err) => {
  console.error("DB 초기화 실패:", err);
  process.exit(1);
});
