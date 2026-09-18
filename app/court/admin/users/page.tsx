"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COURT_ROLES, getCourtRoleLabel } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  loginId: string;
  role: string;
  dept: string;
  isAdmin: boolean | number;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "INACTIVE";
  createdAt: string;
  lastLogin: string;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  rejected: number;
  inactive: number;
}

export default function CourtAdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    rejected: 0,
    inactive: 0,
  });
  const [activeTab, setActiveTab] = useState<"PENDING" | "ALL">("PENDING");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");

  // 편집 모달 상태
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("ACTIVE");
  const [savingEdit, setSavingEdit] = useState(false);

  // 알림 메시지 상태
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);

  function showToast(text: string, isError = false) {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3000);
  }

  // 관리자 인증 및 사용자 목록 불러오기
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 현재 사용자 권한 확인
      const meRes = await fetch("/api/court/auth/me");
      if (meRes.status === 401) {
        router.push("/court/login");
        return;
      }
      const meData = await meRes.json();
      if (!meData.user?.isAdmin) {
        alert("관리자 권한이 필요한 페이지입니다.");
        router.push("/court/dashboard");
        return;
      }
      setCurrentAdminId(meData.user.id);

      // 2. 전체 목록 조회
      const res = await fetch("/api/court/admin/users?status=ALL");
      if (res.status === 401 || res.status === 403) {
        router.push("/court/login");
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users || []);
        if (data.stats) {
          setStats(data.stats);
          // 대기 건수가 0이고 전체 탭에 있다면 유지, 아니면 기본 탭 결정
          if (data.stats.pending === 0 && activeTab === "PENDING" && data.stats.total > 0) {
            // 원하면 기본 탭 유지하거나 전환 가능
          }
        }
      }
    } catch (e) {
      console.error(e);
      showToast("데이터를 불러오는 중 오류가 발생했습니다.", true);
    } finally {
      setLoading(false);
    }
  }, [router, activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 빠른 상태 변경 (승인, 반려, 정지 등)
  async function handleStatusChange(userId: string, newStatus: string, actionName: string) {
    if (!confirm(`해당 사용자를 [${actionName}] 처리하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/court/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`성공적으로 [${actionName}] 처리되었습니다.`);
      fetchUsers();
    } catch (e) {
      showToast((e as Error).message || "처리 중 오류 발생", true);
    }
  }

  // 관리자 권한 토글
  async function handleToggleAdmin(user: UserItem) {
    const willBeAdmin = !user.isAdmin;
    const confirmMsg = willBeAdmin
      ? `[${user.name}] 사용자에게 관리자 권한을 부여하시겠습니까?`
      : `[${user.name}] 사용자의 관리자 권한을 해제하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/court/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: willBeAdmin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`관리자 권한이 ${willBeAdmin ? "부여" : "해제"}되었습니다.`);
      fetchUsers();
    } catch (e) {
      showToast((e as Error).message || "권한 변경 실패", true);
    }
  }

  // 삭제 처리
  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`정말로 [${userName}] 계정(또는 신청)을 삭제하시겠습니까? 복구할 수 없습니다.`)) return;

    try {
      const res = await fetch(`/api/court/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("계정이 삭제되었습니다.");
      fetchUsers();
    } catch (e) {
      showToast((e as Error).message || "삭제 실패", true);
    }
  }

  // 편집 모달 열기
  function openEditModal(u: UserItem) {
    setEditingUser(u);
    setEditRole(u.role);
    setEditDept(u.dept || "");
    setEditIsAdmin(Boolean(u.isAdmin));
    setEditStatus(u.status);
  }

  // 편집 저장
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/court/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          dept: editDept,
          isAdmin: editIsAdmin,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("공무원 정보가 성공적으로 수정되었습니다.");
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      showToast((e as Error).message || "수정 실패", true);
    } finally {
      setSavingEdit(false);
    }
  }

  // 필터링된 사용자 목록
  const displayedUsers = users.filter((u) => {
    // 탭 필터
    if (activeTab === "PENDING" && u.status !== "PENDING") return false;

    // 상세 상태 필터 (전체 탭일 때)
    if (activeTab === "ALL" && statusFilter !== "ALL" && u.status !== statusFilter) return false;

    // 직책 필터
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;

    // 검색어 필터
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchId = u.loginId.toLowerCase().includes(q);
      const matchDept = (u.dept || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDept) return false;
    }

    return true;
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 ${
              toast.isError
                ? "bg-rose-600 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            <span>{toast.isError ? "⚠️" : "✅"}</span>
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* 헤더 바 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xs mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              관리자 전용
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              공무원 계정 및 가입신청 관리
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            신규 공무원 가입 신청을 승인/반려하고 직무 직책(대법원장, 판사, 법원사무관 등) 및 관리 권한을 설정합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => router.push("/court/dashboard")}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-colors"
          >
            ← 사건 대시보드로 돌아가기
          </button>
        </div>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div
          onClick={() => {
            setActiveTab("PENDING");
            setStatusFilter("ALL");
          }}
          className={`cursor-pointer bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all ${
            activeTab === "PENDING"
              ? "border-amber-400 dark:border-amber-500 bg-amber-50/20 ring-2 ring-amber-400/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">승인 대기</span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.pending}
            <span className="text-xs font-normal text-slate-400 ml-1">건</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">신규 가입 검토 필요</p>
        </div>

        <div
          onClick={() => {
            setActiveTab("ALL");
            setStatusFilter("ACTIVE");
          }}
          className={`cursor-pointer bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all ${
            activeTab === "ALL" && statusFilter === "ACTIVE"
              ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-400/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">승인 완료 (활성)</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.active}
            <span className="text-xs font-normal text-slate-400 ml-1">명</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">정상 업무 중인 공무원</p>
        </div>

        <div
          onClick={() => {
            setActiveTab("ALL");
            setStatusFilter("REJECTED");
          }}
          className={`cursor-pointer bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all ${
            activeTab === "ALL" && statusFilter === "REJECTED"
              ? "border-rose-400 dark:border-rose-500 bg-rose-50/20 ring-2 ring-rose-400/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">반려 / 거절</span>
            <span className="text-lg">🚫</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.rejected}
            <span className="text-xs font-normal text-slate-400 ml-1">건</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">가입 신청 반려됨</p>
        </div>

        <div
          onClick={() => {
            setActiveTab("ALL");
            setStatusFilter("ALL");
          }}
          className={`cursor-pointer bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all ${
            activeTab === "ALL" && statusFilter === "ALL"
              ? "border-blue-400 dark:border-blue-500 bg-blue-50/20 ring-2 ring-blue-400/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">전체 공무원 계정</span>
            <span className="text-lg">🏛️</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
            <span className="text-xs font-normal text-slate-400 ml-1">건</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">정지 {stats.inactive}명 포함</p>
        </div>
      </div>

      {/* 탭 네비게이션 & 필터 바 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("PENDING");
                setStatusFilter("ALL");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "PENDING"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>⏳ 가입 승인 대기</span>
              {stats.pending > 0 && (
                <span className="bg-amber-800 text-amber-100 text-[10px] px-1.5 py-0.2 rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "ALL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              👥 전체 공무원 계정 관리 ({stats.total})
            </button>
          </div>

          <div className="text-xs text-slate-400">
            {activeTab === "PENDING" ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                * 가입 신청 내역을 검토한 후 승인 또는 반려하세요.
              </span>
            ) : (
              <span>* 직책 변경, 관리자 권한 부여 및 계정 정지를 관리할 수 있습니다.</span>
            )}
          </div>
        </div>

        {/* 검색 및 드롭다운 필터 */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 아이디, 소속 부서로 검색..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === "ALL" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">상태: 전체</option>
              <option value="ACTIVE">활성 (승인 완료)</option>
              <option value="PENDING">대기 (승인 대기)</option>
              <option value="REJECTED">반려됨</option>
              <option value="INACTIVE">정지 (비활성화)</option>
            </select>
          )}

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">직책: 전체</option>
            {COURT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {(searchQuery || roleFilter !== "ALL" || (activeTab === "ALL" && statusFilter !== "ALL")) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1.5"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 공무원 목록 테이블 / 카드 */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs sm:text-sm">공무원 계정 목록을 불러오는 중입니다...</p>
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-400">
          <div className="text-4xl mb-3">{activeTab === "PENDING" ? "✨" : "📂"}</div>
          <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">
            {activeTab === "PENDING"
              ? "현재 대기 중인 가입 신청이 없습니다."
              : "해당 조건의 공무원 계정이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedUsers.map((u) => {
            const isSelf = u.id === currentAdminId;
            const roleLabel = getCourtRoleLabel(u.role);

            return (
              <div
                key={u.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  u.status === "PENDING"
                    ? "border-amber-300 dark:border-amber-800 bg-amber-50/10 dark:bg-amber-950/10"
                    : u.status === "REJECTED"
                    ? "border-rose-200 dark:border-rose-900/60 opacity-80"
                    : u.status === "INACTIVE"
                    ? "border-slate-200 dark:border-slate-800 opacity-70 bg-slate-50 dark:bg-slate-900/50"
                    : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                {/* 좌측 정보 영역 */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {u.name}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      (@{u.loginId})
                    </span>

                    {/* 직책 뱃지 */}
                    <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {roleLabel}
                    </span>

                    {/* 관리자 뱃지 */}
                    {Boolean(u.isAdmin) && (
                      <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <span>🛡️</span>
                        <span>시스템 관리자</span>
                      </span>
                    )}

                    {/* 상태 뱃지 */}
                    {u.status === "PENDING" && (
                      <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                        ⏳ 승인 대기
                      </span>
                    )}
                    {u.status === "ACTIVE" && (
                      <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium px-1.5 py-0.5 rounded">
                        ● 활성
                      </span>
                    )}
                    {u.status === "REJECTED" && (
                      <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        ✕ 반려됨
                      </span>
                    )}
                    {u.status === "INACTIVE" && (
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        정지됨
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      소속 부서:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {u.dept || "미지정"}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      신청/가입일:{" "}
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {u.createdAt ? u.createdAt.slice(0, 16) : "-"}
                      </span>
                    </span>
                    {u.lastLogin && (
                      <>
                        <span>·</span>
                        <span>
                          최근 로그인:{" "}
                          <span className="font-mono text-slate-600 dark:text-slate-300">
                            {u.lastLogin.slice(0, 16)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 우측 조작 버튼 영역 */}
                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* 승인 대기 상태일 때의 원클릭 승인 / 반려 버튼 */}
                  {u.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(u.id, "ACTIVE", "가입 승인")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                      >
                        <span>✓</span>
                        <span>승인하기</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(u.id, "REJECTED", "가입 반려")}
                        className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      >
                        반려
                      </button>
                    </>
                  )}

                  {/* 반려 상태일 때 다시 승인 버튼 */}
                  {u.status === "REJECTED" && (
                    <button
                      onClick={() => handleStatusChange(u.id, "ACTIVE", "재승인")}
                      className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      재승인
                    </button>
                  )}

                  {/* 활성 상태일 때 정지 버튼 */}
                  {u.status === "ACTIVE" && !isSelf && (
                    <button
                      onClick={() => handleStatusChange(u.id, "INACTIVE", "계정 정지")}
                      title="계정 일시 정지"
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2.5 py-1.5 rounded-xl font-medium transition-all"
                    >
                      정지
                    </button>
                  )}

                  {/* 정지 상태일 때 활성화 버튼 */}
                  {u.status === "INACTIVE" && (
                    <button
                      onClick={() => handleStatusChange(u.id, "ACTIVE", "계정 재활성화")}
                      className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl font-bold transition-all"
                    >
                      활성화
                    </button>
                  )}

                  {/* 관리자 권한 토글 버튼 (본인 제외) */}
                  {!isSelf && u.status === "ACTIVE" && (
                    <button
                      onClick={() => handleToggleAdmin(u)}
                      title={u.isAdmin ? "관리자 권한 해제" : "관리자 권한 부여"}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all border ${
                        u.isAdmin
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {u.isAdmin ? "관리자 해제" : "관리자 지정"}
                    </button>
                  )}

                  {/* 상세 정보 및 직책 수정 버튼 */}
                  <button
                    onClick={() => openEditModal(u)}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    직책/정보 수정
                  </button>

                  {/* 삭제 버튼 (본인 제외) */}
                  {!isSelf && (
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg text-xs transition-colors"
                      title="계정 영구 삭제"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🛠️ 공무원 직책 및 계정 정보 수정 모달 다이얼로그 */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  공무원 직책 및 권한 수정
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {editingUser.name} (@{editingUser.loginId})
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  직무 직책
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COURT_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  소속 재판부 / 부서
                </label>
                <input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  placeholder="예: 형사1단독 / 사법행정처"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  계정 상태
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">활성 (정상 승인)</option>
                  <option value="PENDING">승인 대기</option>
                  <option value="REJECTED">반려됨</option>
                  <option value="INACTIVE">정지 (비활성화)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={editIsAdmin}
                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      시스템 관리자 권한 부여
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      공무원 가입 승인 및 전체 권한 관리 기능에 접근할 수 있습니다.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
