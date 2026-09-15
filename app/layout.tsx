import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "도스온라인 사법정보 포털 | 대국민 형사사법정보 서비스",
  description: "전과 기록 및 형집행 사실 대국민 공개 조회 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="light">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        {/* 상단 공식 배너 바 */}
        <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              도스온라인 사법전산망 공식 대외 서비스
            </span>
            <span className="text-slate-400">실시간 연동 가동 중</span>
          </div>
        </div>

        {/* 네비게이션 헤더 */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                ⚖️
              </div>
              <div>
                <div className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  도스온라인 사법정보 포털
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                    대외용
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium -mt-0.5">
                  Court & Justice Open Service
                </div>
              </div>
            </a>

            <nav className="flex items-center gap-3 text-sm">
              <a
                href="/search"
                className="px-3.5 py-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-medium transition-colors"
              >
                🔍 기록 조회
              </a>
              <div className="w-px h-4 bg-slate-200"></div>
              <a
                href="/court/login"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-sm hover:shadow transition-all"
              >
                <span>법원 공무원 전용</span>
                <span className="opacity-70">→</span>
              </a>
            </nav>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="border-t border-slate-200 bg-white py-8 text-slate-500 text-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-700">도스온라인 사법전산 통합망</p>
              <p className="mt-1 text-slate-400">
                본 사이트에서 제공되는 모든 조회 기록은 사법 데이터 연계 정책에 따라 실시간 감사 로그에 기록·보관됩니다.
              </p>
            </div>
            <div className="flex items-center gap-4 text-slate-400 shrink-0">
              <span>개인정보 처리방침</span>
              <span>·</span>
              <span>이용약관</span>
              <span>·</span>
              <span>시스템 문의</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
