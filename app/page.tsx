export default function Home() {
  return (
    <div className="flex flex-col items-center text-center py-6 sm:py-16">
      {/* 배지 */}
      <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 sm:mb-6 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
        대국민 형사사법 전산 통합 조회 서비스
      </div>

      {/* Hero 제목 */}
      <h1 className="text-2xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-2xl leading-tight">
        신속하고 투명한 <br />
        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">
          사법 기록 조회
        </span>
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-base max-w-xl mt-3 sm:mt-4 leading-relaxed px-2">
        닉네임 검색을 통해 사건번호, 죄명, 1~3심 재판 선고 결과 및 형집행 현황을
        실시간으로 투명하게 확인하실 수 있습니다.
      </p>

      {/* 검색 바 */}
      <div className="w-full max-w-xl mt-6 sm:mt-8 px-1">
        <form
          action="/search"
          method="get"
          className="relative bg-white dark:bg-slate-900 rounded-2xl p-1.5 sm:p-2 shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        >
          <div className="pl-2.5 sm:pl-3 text-slate-400 text-base sm:text-lg shrink-0">🔍</div>
          <input
            name="nickname"
            type="text"
            placeholder="조회할 대상의 닉네임을 입력하세요"
            required
            autoComplete="off"
            className="flex-1 bg-transparent py-2.5 sm:py-3 px-1 sm:px-2 text-slate-900 dark:text-white text-xs sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-w-0"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-95 shrink-0"
          >
            조회하기
          </button>
        </form>
        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-2">
          💡 별도의 본인인증 없이 닉네임만으로 즉시 조회가 가능합니다.
        </p>
      </div>

      {/* 3대 핵심 서비스 안내 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 w-full max-w-4xl mt-10 sm:mt-16 text-left">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4 font-bold">
            01
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base mb-1">
            정식 기소 및 전과 조회
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
            수사 중인 사건이나 무혐의 사건은 보호되며, 법원에 기소 및 판결 확정된 사건만 투명하게 제공됩니다.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4 font-bold">
            02
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base mb-1">
            1~3심 판결문 및 집행 현황
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
            지방법원, 고등법원, 대법원 선고 결과와 판결문 원문 링크 및 형집행 완료 상태까지 상세히 확인합니다.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4 font-bold">
            03
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base mb-1">
            제72조 형의 실효 보호
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
            법정 형 실효 기간(벌금 14일, 금고 28~42일 등)이 경과한 전과는 대국민 공개에서 자동 비공개 보호됩니다.
          </p>
        </div>
      </div>

      {/* 공무원 배너 */}
      <div className="w-full max-w-4xl mt-8 sm:mt-12 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-5 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-lg border border-slate-700/50">
        <div>
          <h4 className="font-bold text-base sm:text-lg text-white">
            법원 공무원 및 판사 업무 전용 포털
          </h4>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            사건 판결 선고 등록, 판결문 첨부 및 형집행 사실 입력을 진행하세요.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <a
            href="/court/register"
            className="flex-1 sm:flex-initial text-center bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
          >
            공무원 가입
          </a>
          <a
            href="/court/login"
            className="flex-1 sm:flex-initial text-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow transition-colors"
          >
            로그인 →
          </a>
        </div>
      </div>
    </div>
  );
}
