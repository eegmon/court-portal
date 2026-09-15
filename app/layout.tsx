import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && supportDarkMode)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
        {/* 상단 공식 배너 바 */}
        <div className="bg-slate-900 dark:bg-black text-slate-300 text-xs py-1.5 px-3 sm:px-4 border-b border-slate-800">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="truncate">도스온라인 사법전산망 대외 서비스</span>
            </span>
            <span className="text-slate-400 shrink-0 ml-2">실시간 연동</span>
          </div>
        </div>

        {/* 네비게이션 헤더 */}
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-2xs">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
            <a href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform text-base sm:text-lg">
                ⚖️
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  <span>사법정보 포털</span>
                  <span className="hidden sm:inline-block bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    대외용
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium -mt-0.5 hidden xs:block">
                  Court Open Portal
                </div>
              </div>
            </a>

            <nav className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm">
              <a
                href="/search"
                className="px-2.5 sm:px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                🔍 <span className="hidden sm:inline">기록</span> 조회
              </a>
              
              <a
                href="/court/register"
                className="hidden md:inline-block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
              >
                🏛️ 공무원 가입
              </a>

              <a
                href="/court/login"
                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-3.5 py-2 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all shrink-0"
              >
                <span>로그인</span>
                <span className="opacity-70">→</span>
              </a>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

              {/* ☀️ / 🌙 다크모드 스위치 */}
              <ThemeToggle />
            </nav>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-8">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 sm:py-8 text-slate-500 dark:text-slate-400 text-xs">
          <div className="max-w-6xl mx-auto px-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">도스온라인 사법전산 통합망</p>
              <p className="mt-1 text-slate-400 dark:text-slate-500 text-[11px] leading-relaxed">
                본 포털에서 제공되는 모든 사건 데이터는 사법 정책에 따라 실시간 감사 로그에 안전하게 기록·보관됩니다.
              </p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px] shrink-0">
              <a href="/court/register" className="hover:text-blue-600 dark:hover:text-blue-400">공무원 가입</a>
              <span>·</span>
              <a href="/court/login" className="hover:text-blue-600 dark:hover:text-blue-400">공무원 로그인</a>
              <span>·</span>
              <a href="/search" className="hover:text-blue-600 dark:hover:text-blue-400">전과 조회</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
