import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "../../api/userApi";
import { useToast } from "../../context/ToastContext";

interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  status: string;
  roleName: string;
  createdAt: string;
}

const PendingUsersPage: React.FC = () => {
  const { t } = useTranslation(["admin", "common"]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { addToast } = useToast() as { addToast: (message: string, type?: "success" | "error" | "info") => void };

  const loadPendingUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getPendingUsers({ page, size: 10 }) as any;
      setPendingUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error: any) {
      addToast(error.message || t("admin:pendingUsers.loadError"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPendingUsers(); }, [page]);

  const handleApprove = async (userId: number, username: string) => {
    if (!confirm(t("admin:pendingUsers.confirmApprove", { username }))) return;
    try {
      await userApi.approveUser(userId);
      addToast(t("admin:pendingUsers.approveSuccess", { username }), "success");
      loadPendingUsers();
    } catch (error: any) {
      addToast(error.message || t("admin:pendingUsers.approveError"), "error");
    }
  };

  const handleReject = async (userId: number, username: string) => {
    const reason = prompt(t("admin:pendingUsers.rejectReason", { username }));
    if (reason === null) return;
    try {
      await userApi.rejectUser(userId, reason);
      addToast(t("admin:pendingUsers.rejectSuccess", { username }), "info");
      loadPendingUsers();
    } catch (error: any) {
      addToast(error.message || t("admin:pendingUsers.rejectError"), "error");
    }
  };

  if (isLoading && pendingUsers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined text-4xl text-muted-foreground animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {t("admin:pendingUsers.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-bold text-amber-600">{pendingUsers.length}</span>{" "}
            {t("admin:pendingUsers.subtitle")}
          </p>
        </div>
        <button
          onClick={loadPendingUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isLoading ? "progress_activity" : "refresh"}
          </span>
          {t("common:actions.refresh")}
        </button>
      </div>

      {/* Empty State */}
      {pendingUsers.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
          <span className="material-symbols-outlined text-6xl text-emerald-400/40 mb-4">check_circle</span>
          <h3 className="text-lg font-bold text-foreground mb-2">{t("admin:pendingUsers.emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("admin:pendingUsers.emptyDescription")}</p>
        </div>
      )}

      {/* User Cards */}
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.userId}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-center gap-6">
                {/* Info */}
                <div className="flex-1 min-w-[280px] space-y-3">
                  <h3 className="text-base font-bold text-foreground">{user.fullName}</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{t("admin:users.table.username")}:</span>
                      <span className="font-mono text-foreground">{user.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Email:</span>
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{t("admin:users.table.role")}:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {user.roleName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{t("admin:users.table.createdAt")}:</span>
                      <span>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {t("common:status.pending")}
                </span>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(user.userId, user.username)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">check</span>
                    {t("admin:pendingUsers.approve")}
                  </button>
                  <button
                    onClick={() => handleReject(user.userId, user.username)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                    {t("admin:pendingUsers.reject")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-foreground bg-card border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {t("common:actions.back")}
          </button>
          <span className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 rounded">
            {t("common:pagination.pageOf", { page: page + 1, total: totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-foreground bg-card border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("common:actions.next")}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingUsersPage;
