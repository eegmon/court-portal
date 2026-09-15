export default function Home() {
  return (
    <div className="flex flex-col items-center text-center py-10 sm:py-16">
      {/* 배지 */}
      <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
        대국민 형사사법 전산 통합 조회 서비스
      </div>

      {/* Hero 제목 */}
      <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-2xl leading-tight">
        신속하고 투명한 <br />
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          사법 기록 조회
        </span>
      </h1>
      
      <p className="text-slate-500 text-base sm:text-lg max-w-xl mt-4 leading-relaxed">
        닉네임 검색을 통해 사건번호, 죄명, 1~3심 재판 판결 및 형집행 현황을
        실시간으로 투명하게 확인하실 수 있습니다.
      </p>

      {/* 검색 바 */}
      <div className="w-full max-w-xl mt-8">
        <form
          action="/search"
          method="get"
          className="relative bg-white rounded-2xl p-2 shadow-xl shadow-slate-200/60 border border-slate-200 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        >
          <div className="pl-3 text-slate-400 text-lg">🔍</div>
          <input
            name="nickname"
            type="text"
            placeholder="조회할 대상의 닉네임을 입력하세요"
            required
            autoComplete="off"
            className="flex-1 bg-transparent py-3 px-2 text-slate-900 text-base placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-95 shrink-0"
          >
            조회하기
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2.5">
          💡 별도의 본인인증 없이 닉네임만으로 즉시 조회가 가능합니다.
        </p>
      </div>

      {/* 3대 핵심 서비스 안내 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl mt-16 text-left">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-4 font-bold">
            01
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1.5">
            실시간 닉네임 검색
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            검찰청 및 법원 전산망과 직접 연동되어 최근 사건부터 과거 이력까지 실시간으로 집계됩니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-4 font-bold">
            02
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1.5">
            단계별 재판 및 집행 현황
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            검찰 기소/불기소 처분부터 1·2·3심 법원 판결 결과 및 형집행 완료 여부까지 상세히 제공됩니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4 font-bold">
            03
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1.5">
            안전한 감사 로그 체계
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            모든 대외 조회 및 법원 공무원의 판결 입력은 데이터 위변조 방지를 위해 감사 로그에 영구 기록됩니다.
          </p>
        </div>
      </div>

      {/* 공무원 배너 */}
      <div className="w-full max-w-4xl mt-12 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-lg">
        <div>
          <h4 className="font-bold text-lg text-white">
            법원 공무원 및 판사 업무 전용 포털
          </h4>
          <p className="text-slate-300 text-sm mt-1">
            담당 재판의 선고 결과 등록 및 형집행 사실 입력을 진행하시려면 로그인하세요.
          </p>
        </div>
        <a
          href="/court/login"
          className="bg-white hover:bg-slate-100 text-slate-900 px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 shadow transition-colors"
        >
          공무원 전용 로그인 →
        </a>
      </div>
    </div>
  );
}
