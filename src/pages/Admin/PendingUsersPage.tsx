import React, { useState, useEffect } from "react";
import { userApi } from "../../api/userApi";
import { useToast } from "../../context/ToastContext";

// Bảng màu Modern Enterprise UI
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  textPrimary: "#172B4D",
  textSecondary: "#44546F",
  textMuted: "#626F86",
  brand: "#0C66E4",
  brandHover: "#0055CC",
  brandLight: "#E9F2FF",
  green: "#1F845A",
  greenBg: "#DCFFF1",
  amber: "#A54800",
  amberBg: "#FFF7D6",
  purple: "#5E4DB2",
  purpleBg: "#F3F0FF",
  red: "#DE350B",
  redBg: "#FFEBE6",
};

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
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const { addToast } = useToast() as { addToast: (message: string, type?: 'success' | 'error' | 'info') => void };

  const loadPendingUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getPendingUsers({ page, size: 10 }) as any;
      setPendingUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error: any) {
      addToast(error.message || "Không thể tải danh sách người dùng chờ duyệt", "error");
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
      addToast(`Đã duyệt tài khoản ${username}`, "success");
      loadPendingUsers();
    } catch (error: any) {
      addToast(error.message || "Duyệt tài khoản thất bại", "error");
    }
  };

  const handleReject = async (userId: number, username: string) => {
    const reason = prompt(`Lý do từ chối tài khoản ${username}:`);
    if (reason === null) return;

    try {
      await userApi.rejectUser(userId, reason);
      addToast(`Đã từ chối tài khoản ${username}`, "info");
      loadPendingUsers();
    } catch (error: any) {
      addToast(error.message || "Từ chối tài khoản thất bại", "error");
    }
  };

  if (isLoading && pendingUsers.length === 0) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px",
        color: T.textMuted
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "48px", animation: "spin 1s linear infinite" }}>progress_activity</span>
          </div>
          <div style={{ fontSize: "14px" }}>Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "32px 40px",
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: "32px",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "6px",
        marginBottom: "32px",
        boxShadow: "0 1px 3px rgba(9,30,66,.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: T.textPrimary,
              marginBottom: "8px",
              letterSpacing: "-0.02em"
            }}>
              Tài khoản chờ duyệt
            </h1>
            <p style={{ fontSize: "14px", color: T.textMuted }}>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: T.amber }}>{pendingUsers.length}</span> tài khoản đang chờ phê duyệt từ Admin
            </p>
          </div>
          <button
            onClick={loadPendingUsers}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#FFFFFF",
              background: T.green,
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              transition: "all .15s",
              fontFamily: "inherit"
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = "#16A34A")}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = T.green)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              {isLoading ? "progress_activity" : "refresh"}
            </span>
            Làm mới
          </button>
        </div>
      </div>

      {/* Empty State */}
      {pendingUsers.length === 0 && !isLoading && (
        <div style={{
          padding: "64px",
          textAlign: "center",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: "6px",
          boxShadow: "0 1px 3px rgba(9,30,66,.08)"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: T.green + "40", marginBottom: "16px", display: "block" }}>
            check_circle
          </span>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: T.textPrimary, marginBottom: "8px" }}>
            Không có tài khoản chờ duyệt
          </h3>
          <p style={{ fontSize: "14px", color: T.textMuted }}>
            Tất cả tài khoản đăng ký đã được xử lý
          </p>
        </div>
      )}

      {/* Pending Users List */}
      {pendingUsers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {pendingUsers.map((user, idx) => (
            <div
              key={user.userId}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: "24px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                transition: "all .15s",
                boxShadow: hoveredCard === idx ? "0 4px 12px rgba(9,30,66,.12)" : "0 1px 3px rgba(9,30,66,.08)"
              }}
            >
              <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap"
              }}>
                {/* User Info */}
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: T.textPrimary,
                    marginBottom: "12px"
                  }}>
                    {user.fullName}
                  </h3>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "24px 32px",
                    fontSize: "13px",
                    color: T.textMuted
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: T.textMuted, fontWeight: 600 }}>Username:</span>
                      <span style={{ fontFamily: "monospace", color: T.textPrimary }}>{user.username}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: T.textMuted, fontWeight: 600 }}>Email:</span>
                      <span style={{ color: T.textPrimary }}>{user.email}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: T.textMuted, fontWeight: 600 }}>Role:</span>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: T.purpleBg,
                        color: T.purple
                      }}>
                        {user.roleName}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: T.textMuted, fontWeight: 600 }}>Ngày tạo:</span>
                      <span style={{ color: T.textPrimary }}>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  background: T.amberBg,
                  border: `1px solid ${T.amber}40`,
                  color: T.amber,
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}>
                  PENDING
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => handleApprove(user.userId, user.username)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 20px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      background: T.green,
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all .15s",
                      fontFamily: "inherit",
                      boxShadow: `0 2px 8px ${T.green}40`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#16A34A"}
                    onMouseLeave={(e) => e.currentTarget.style.background = T.green}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check</span>
                    Duyệt
                  </button>

                  <button
                    onClick={() => handleReject(user.userId, user.username)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 20px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      background: T.red,
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all .15s",
                      fontFamily: "inherit",
                      boxShadow: `0 2px 8px ${T.red}40`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#DC2626"}
                    onMouseLeave={(e) => e.currentTarget.style.background = T.red}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginTop: "32px"
        }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              color: T.textPrimary,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "4px",
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.5 : 1,
              transition: "all .15s",
              fontFamily: "inherit"
            }}
            onMouseEnter={(e) => page !== 0 && (e.currentTarget.style.background = T.surfaceHover)}
            onMouseLeave={(e) => page !== 0 && (e.currentTarget.style.background = T.surface)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
            Trước
          </button>
          <div style={{
            padding: "8px 16px",
            background: T.brandLight,
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: 700,
            color: T.brand,
            border: `1px solid ${T.brand}20`,
            display: "flex",
            alignItems: "center"
          }}>
            Trang {page + 1} / {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              color: T.textPrimary,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "4px",
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.5 : 1,
              transition: "all .15s",
              fontFamily: "inherit"
            }}
            onMouseEnter={(e) => page < totalPages - 1 && (e.currentTarget.style.background = T.surfaceHover)}
            onMouseLeave={(e) => page < totalPages - 1 && (e.currentTarget.style.background = T.surface)}
          >
            Sau
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingUsersPage;
