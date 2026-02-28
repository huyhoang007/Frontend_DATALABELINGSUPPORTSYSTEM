import React, { useState, useEffect } from "react";
import { userApi } from "../../api/userApi";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";

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
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { showToast } = useToast();

  const loadPendingUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getPendingUsers({ page, size: 10 });
      setPendingUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error: any) {
      showToast(error.message || "Failed to load pending users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, [page]);

  const handleApprove = async (userId: number, username: string) => {
    if (!confirm(`Bạn có chắc muốn duyệt tài khoản của ${username}?`)) {
      return;
    }

    try {
      await userApi.approveUser(userId);
      showToast(`Đã duyệt tài khoản ${username}`, "success");
      loadPendingUsers(); // Reload list
    } catch (error: any) {
      showToast(error.message || "Failed to approve user", "error");
    }
  };

  const handleReject = async (userId: number, username: string) => {
    const reason = prompt(`Lý do từ chối tài khoản ${username}:`);
    if (reason === null) return; // User cancelled

    try {
      await userApi.rejectUser(userId, reason);
      showToast(`Đã từ chối tài khoản ${username}`, "info");
      loadPendingUsers(); // Reload list
    } catch (error: any) {
      showToast(error.message || "Failed to reject user", "error");
    }
  };

  if (isLoading && pendingUsers.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-muted-foreground">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin">⏳</div>
          <div>Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full bg-transparent space-y-8">
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <span>⏳</span> Tài khoản chờ duyệt
            </h1>
            <p className="text-lg text-muted-foreground">
              {pendingUsers.length} tài khoản đang chờ phê duyệt từ Admin
            </p>
          </div>
          <Button
            onClick={loadPendingUsers}
            disabled={isLoading}
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            leftIcon={isLoading ? "loading" : "refresh"}
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* Empty State */}
      {pendingUsers.length === 0 && !isLoading && (
        <Card className="p-16 text-center bg-card/80 backdrop-blur border-border/50">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Không có tài khoản chờ duyệt
          </h3>
          <p className="text-sm text-muted-foreground">
            Tất cả tài khoản đăng ký đã được xử lý
          </p>
        </Card>
      )}

      {/* Pending Users List */}
      {pendingUsers.length > 0 && (
        <div className="grid gap-6">
          {pendingUsers.map((user) => (
            <Card
              key={user.userId}
              className="p-6 transition-all duration-300 hover:shadow-lg bg-card/80 backdrop-blur border-border/60"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* User Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 shrink-0">
                  👤
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {user.fullName}
                  </h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">👤</span>
                      {user.username}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">📧</span>
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">🏷️</span>
                      {user.roleName}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">📅</span>
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-bold tracking-wide">
                  ⏳ PENDING
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(user.userId, user.username)}
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                    leftIcon="check"
                  >
                    Duyệt
                  </Button>

                  <Button
                    onClick={() => handleReject(user.userId, user.username)}
                    variant="primary"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                    leftIcon="close"
                  >
                    Từ chối
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <Button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            variant="ghost"
            leftIcon="arrow-left"
          >
            Trước
          </Button>
          <div className="px-4 py-2 bg-card/50 rounded-lg text-sm font-bold text-foreground border border-border/50 flex items-center">
            Trang {page + 1} / {totalPages}
          </div>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            variant="ghost"
            rightIcon="arrow-right"
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
};

export default PendingUsersPage;
