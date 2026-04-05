import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../../context/ToastContext";
import { userApi } from "../../api/userApi";
import { translateRole } from "../../i18n/helpers";

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  userId: number;
  id?: number;
  username: string;
  email: string;
  fullName?: string;
  roleName?: string;
  roleId?: number;
  status?: string;
  createdAt?: string;
}

interface NewUserForm {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roleId: number;
}

type NewUserFormKey = keyof NewUserForm;

interface ApiError {
  message?: string;
  data?: { message?: string };
  response?: { data?: { message?: string } };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  ADMIN:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  MANAGER:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ANNOTATOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REVIEWER:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  banned:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  inactive:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const inputCls = "w-full px-3 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors";
const btnPrimary = "flex-1 py-2.5 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "flex-1 py-2.5 px-5 bg-background hover:bg-accent border border-border text-foreground text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({ username: "", email: "", password: "", fullName: "", roleId: 3 });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<number>(3);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      setShowCreateModal(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userApi.getAllUsers({ page: 0, size: 50 }) as { content?: User[] } | User[];
      setUsers((data as { content?: User[] }).content || (data as User[]) || []);
    } catch (err: unknown) {
      const error = err as ApiError;
      addToast(error.message || t("admin:users.loadFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId: number) => {
    if (!window.confirm(t("admin:users.approveConfirm"))) return;
    setProcessingUserId(userId);
    try {
      await userApi.approveUser(userId);
      addToast(t("admin:users.approveSuccess"), "success");
      fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      addToast(error.message || t("admin:users.approveFailed"), "error");
    } finally { setProcessingUserId(null); }
  };

  const handleRejectUser = async (userId: number) => {
    const reason = window.prompt(t("admin:users.rejectPrompt"));
    if (reason === null) return;
    setProcessingUserId(userId);
    try {
      await userApi.rejectUser(userId, reason);
      addToast(t("admin:users.rejectSuccess"), "info");
      fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      addToast(error.message || t("admin:users.rejectFailed"), "error");
    } finally { setProcessingUserId(null); }
  };

  const handleBanUser = async (userId: number) => {
    if (!window.confirm(t("admin:users.banConfirm"))) return;
    setProcessingUserId(userId);
    try {
      await userApi.suspendUser(userId);
      addToast(t("admin:users.banSuccess"), "success");
      fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      addToast(error.message || t("admin:users.banFailed"), "error");
    } finally { setProcessingUserId(null); }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!window.confirm(t("admin:users.unbanConfirm"))) return;
    setProcessingUserId(userId);
    try {
      await userApi.activateUser(userId);
      addToast(t("admin:users.unbanSuccess"), "success");
      fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      addToast(error.message || t("admin:users.unbanFailed"), "error");
    } finally { setProcessingUserId(null); }
  };

  const handleOpenRoleModal = (u: User) => {
    setSelectedUser(u);
    const roleMap: Record<string, number> = { ADMIN: 1, MANAGER: 2, ANNOTATOR: 3, REVIEWER: 4 };
    setNewRole(roleMap[u.roleName?.toUpperCase() ?? ""] || u.roleId || 3);
    setShowRoleModal(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    setProcessingUserId(selectedUser.userId);
    try {
      await userApi.updateUser(selectedUser.userId, { roleId: newRole });
      addToast(t("admin:users.changeRoleSuccess"), "success");
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      addToast(error.message || t("admin:users.changeRoleFailed"), "error");
    } finally { setProcessingUserId(null); }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.fullName) {
      addToast(t("admin:users.createRequired"), "error");
      return;
    }
    setIsCreating(true);
    try {
      await userApi.createUser(newUser);
      addToast(t("admin:users.createSuccess"), "success");
      setShowCreateModal(false);
      setNewUser({ username: "", email: "", password: "", fullName: "", roleId: 3 });
      fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      const backendMessage = error.data?.message || error.message || "";
      const errorMessages: Record<string, string> = {
        EMAIL_ALREADY_EXISTS: t("admin:users.errors.emailExists"),
        USERNAME_ALREADY_EXISTS: t("admin:users.errors.usernameExists"),
        ROLE_NOT_FOUND: t("admin:users.errors.roleNotFound"),
      };
      addToast(errorMessages[backendMessage] || backendMessage || t("admin:users.createFailed"), "error");
    } finally { setIsCreating(false); }
  };

  const getRoleBadgeClass = (roleName: string): string => ROLE_BADGE[roleName?.toUpperCase()] || "bg-muted text-muted-foreground";
  const getStatusBadgeClass = (status: string): string => STATUS_BADGE[status?.toLowerCase()] || "bg-muted text-muted-foreground";

  const getStatusLabel = (status: string): string => {
    const key = status?.toLowerCase();
    if (key === "active") return t("admin:users.statuses.active");
    if (key === "pending") return t("admin:users.statuses.pending");
    if (key === "banned") return t("admin:users.statuses.banned");
    if (key === "suspended") return t("admin:users.statuses.suspended");
    if (key === "inactive") return t("admin:users.statuses.inactive");
    return status || t("admin:users.statuses.unknown");
  };

  const filteredUsers = users.filter((u: User) => {
    const isBanned = ["banned", "suspended", "inactive"].includes(u.status?.toLowerCase() ?? "");
    if (statusFilter === "all") return !isBanned;
    if (statusFilter === "banned") return isBanned;
    return u.status?.toLowerCase() === statusFilter;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const TABS = [
    { value: "all",     label: t("admin:users.filters.all"),     count: users.filter((u: User) => !["banned","suspended","inactive"].includes(u.status?.toLowerCase() ?? "")).length },
    { value: "pending", label: t("admin:users.filters.pending"), count: users.filter((u: User) => u.status?.toLowerCase() === "pending").length },
    { value: "active",  label: t("admin:users.filters.active"),  count: users.filter((u: User) => u.status?.toLowerCase() === "active").length },
    { value: "banned",  label: t("admin:users.filters.banned"),  count: users.filter((u: User) => ["banned","suspended","inactive"].includes(u.status?.toLowerCase() ?? "")).length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="p-8 w-full">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-end justify-between flex-wrap gap-4 pb-6 border-b-2 border-border">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                {t("admin:users.systemManagement")}
              </p>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                {t("admin:users.title")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("admin:users.subtitle")}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded transition-colors"
            >
              {t("admin:users.create")}
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatusFilter(tab.value); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded text-sm font-bold border transition-colors ${
                  statusFilter === tab.value
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-foreground border-border hover:bg-accent"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="material-symbols-outlined text-3xl animate-spin block mb-2">progress_activity</span>
                <p className="text-sm">{t("admin:users.loading")}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-base font-semibold text-foreground mb-1">{t("admin:users.emptyTitle")}</p>
                <p className="text-sm">{t("admin:users.emptyHint")}</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1.5fr] px-6 py-3 bg-muted/50 border-b border-border gap-3">
                  {[t("admin:users.table.user"), t("admin:users.table.email"), t("admin:users.table.role"), t("admin:users.table.status"), t("admin:users.table.createdAt"), t("admin:users.table.actions")].map((h) => (
                    <p key={h} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
                  ))}
                </div>

                {/* Table Body */}
                {currentUsers.map((u: User, idx: number) => {
                  const roleName = u.roleName?.toUpperCase() || "";
                  const isBanned = ["banned", "suspended", "inactive"].includes(u.status?.toLowerCase() ?? "");
                  const isProcessing = processingUserId === u.userId;
                  return (
                    <div
                      key={u.userId || u.id}
                      className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1.5fr] px-6 py-4 border-b border-border gap-3 items-center transition-colors hover:bg-primary/5 ${idx % 2 !== 0 ? "bg-muted/20" : ""}`}
                    >
                      {/* User */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-base font-bold shrink-0">
                          {u.fullName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{u.fullName || u.username}</div>
                          <div className="text-xs text-muted-foreground">@{u.username}</div>
                        </div>
                      </div>

                      {/* Email */}
                      <span className="text-sm text-foreground truncate">{u.email}</span>

                      {/* Role */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getRoleBadgeClass(roleName)}`}>
                        {translateRole(roleName) || roleName}
                      </span>

                      {/* Status */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeClass(u.status ?? "")}`}>
                        {getStatusLabel(u.status ?? "")}
                      </span>

                      {/* Created At */}
                      <span className="text-xs text-muted-foreground">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString(i18n.language === "en" ? "en-US" : "vi-VN") : "-"}
                      </span>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {u.status?.toLowerCase() === "pending" ? (
                          <>
                            <button onClick={() => handleApproveUser(u.userId)} disabled={isProcessing}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              ✔ {t("admin:users.actions.approve")}
                            </button>
                            <button onClick={() => handleRejectUser(u.userId)} disabled={isProcessing}
                              className="px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              ✖ {t("admin:users.actions.reject")}
                            </button>
                          </>
                        ) : isBanned ? (
                          <button onClick={() => handleUnbanUser(u.userId)} disabled={isProcessing}
                            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {t("admin:users.actions.unban")}
                          </button>
                        ) : roleName !== "ADMIN" ? (
                          <>
                            <button onClick={() => handleOpenRoleModal(u)} disabled={isProcessing}
                              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {t("admin:users.actions.changeRole")}
                            </button>
                            <button onClick={() => handleBanUser(u.userId)} disabled={isProcessing}
                              className="px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {t("admin:users.actions.ban")}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {filteredUsers.length > usersPerPage && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      {t("admin:users.showing", { start: indexOfFirstUser + 1, end: Math.min(indexOfLastUser, filteredUsers.length), total: filteredUsers.length })}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-semibold border border-border rounded text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        ← {t("admin:users.pagination.prev")}
                      </button>
                      <div className="px-4 py-2 text-sm font-bold bg-primary/10 text-primary border border-primary/20 rounded">
                        {t("admin:users.pagination.page", { current: currentPage, total: totalPages })}
                      </div>
                      <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-semibold border border-border rounded text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {t("admin:users.pagination.next")} →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Create User Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
              <div className="bg-card border border-border rounded-lg p-8 w-[90%] max-w-lg shadow-2xl">
                <h2 className="text-xl font-bold text-foreground mb-6">{t("admin:users.createTitle")}</h2>
                <div className="space-y-4">
                  {([
                    { key: "username" as NewUserFormKey, label: t("admin:users.fields.username"), type: "text", ph: t("admin:users.placeholders.username") },
                    { key: "email"    as NewUserFormKey, label: t("admin:users.fields.email"),    type: "email", ph: t("admin:users.placeholders.email") },
                    { key: "fullName" as NewUserFormKey, label: t("admin:users.fields.fullName"), type: "text", ph: t("admin:users.placeholders.fullName") },
                    { key: "password" as NewUserFormKey, label: t("admin:users.fields.password"), type: "password", ph: t("admin:users.placeholders.password") },
                  ] as { key: NewUserFormKey; label: string; type: string; ph: string }[]).map(({ key, label, type, ph }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        {label} <span className="text-destructive">*</span>
                      </label>
                      <input type={type} value={newUser[key] as string} placeholder={ph}
                        onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                        className={inputCls} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      {t("admin:users.fields.role")} <span className="text-destructive">*</span>
                    </label>
                    <select value={newUser.roleId} onChange={(e) => setNewUser({ ...newUser, roleId: parseInt(e.target.value) })} className={inputCls}>
                      <option value={2}>{translateRole("MANAGER")}</option>
                      <option value={3}>{translateRole("ANNOTATOR")}</option>
                      <option value={4}>{translateRole("REVIEWER")}</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowCreateModal(false)} disabled={isCreating} className={btnSecondary}>{t("common:actions.cancel")}</button>
                  <button onClick={handleCreateUser} disabled={isCreating} className={btnPrimary}>
                    {isCreating ? t("admin:users.createButtonLoading") : t("common:actions.create")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Change Role Modal */}
          {showRoleModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
              <div className="bg-card border border-border rounded-lg p-8 w-[90%] max-w-md shadow-2xl">
                <h2 className="text-xl font-bold text-foreground mb-2">{t("admin:users.changeRoleTitle")}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("admin:users.changeRoleDescription", { name: selectedUser.fullName || selectedUser.username })}
                </p>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    {t("admin:users.selectNewRole")} <span className="text-destructive">*</span>
                  </label>
                  <select value={newRole} onChange={(e) => setNewRole(parseInt(e.target.value))} className={inputCls}>
                    <option value={2}>{translateRole("MANAGER")}</option>
                    <option value={3}>{translateRole("ANNOTATOR")}</option>
                    <option value={4}>{translateRole("REVIEWER")}</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
                    disabled={processingUserId === selectedUser.userId} className={btnSecondary}>
                    {t("common:actions.cancel")}
                  </button>
                  <button onClick={handleChangeRole} disabled={processingUserId === selectedUser.userId} className={btnPrimary}>
                    {processingUserId === selectedUser.userId ? t("admin:users.processing") : t("admin:users.actions.saveChanges")}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
