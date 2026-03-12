import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { userApi } from "../../api/userApi";

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

export default function AdminUsers() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'active', 'banned'
  const usersPerPage = 10;
  const [processingUserId, setProcessingUserId] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    roleId: 3, // Default to Annotator (Database: 1=ADMIN, 2=MANAGER, 3=ANNOTATOR, 4=REVIEWER)
  });

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-open create modal when action=create query param is present
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      setShowCreateModal(true);
      // Clear only 'action' param, preserve others
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userApi.getAllUsers({ page: 0, size: 50 });
      // Backend returns Page object with content array
      setUsers(data.content || data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      addToast("Không thể tải danh sách người dùng", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn chấp nhận tài khoản này?")) {
      return;
    }

    setProcessingUserId(userId);
    try {
      await userApi.approveUser(userId);
      addToast("Đã chấp nhận tài khoản thành công!", "success");
      fetchUsers(); // Reload list
    } catch (error) {
      console.error("Failed to approve user:", error);
      addToast(error.message || "Chấp nhận tài khoản thất bại", "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRejectUser = async (userId) => {
    const reason = window.prompt("Lý do từ chối (tùy chọn):");
    if (reason === null) return; // User cancelled

    setProcessingUserId(userId);
    try {
      await userApi.rejectUser(userId, reason);
      addToast("Đã từ chối tài khoản", "info");
      fetchUsers(); // Reload list
    } catch (error) {
      console.error("Failed to reject user:", error);
      addToast(error.message || "Từ chối tài khoản thất bại", "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleCreateUser = async () => {
    if (
      !newUser.username ||
      !newUser.email ||
      !newUser.password ||
      !newUser.fullName
    ) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    setIsCreating(true);
    try {
      await userApi.createUser(newUser);
      addToast("User created successfully!", "success");
      setShowCreateModal(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        fullName: "",
        roleId: 3,
      });
      fetchUsers(); // Refresh list
    } catch (error) {
      // Map backend error codes to Vietnamese messages
      const backendMessage = error.data?.message || error.message || "";
      const errorMessages = {
        EMAIL_ALREADY_EXISTS: "Email đã tồn tại trong hệ thống",
        USERNAME_ALREADY_EXISTS: "Tên đăng nhập đã tồn tại",
        ROLE_NOT_FOUND: "Role không hợp lệ",
      };
      const displayMessage =
        errorMessages[backendMessage] ||
        backendMessage ||
        "Tạo user thất bại. Vui lòng thử lại.";
      addToast(displayMessage, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleLabel = (roleId) => {
    switch (roleId) {
      case 1:
        return { name: "Admin", color: "#ef4444" };
      case 2:
        return { name: "Manager", color: "#10b981" };
      case 3:
        return { name: "Annotator", color: "#3b82f6" };
      case 4:
        return { name: "Reviewer", color: "#f59e0b" };
      default:
        return { name: "Unknown", color: "#6b7280" };
    }
  };

  const getRoleLabelFromName = (roleName) => {
    switch (roleName?.toUpperCase()) {
      case "ANNOTATOR":
        return { name: "Annotator", color: "#3b82f6" };
      case "MANAGER":
        return { name: "Manager", color: "#10b981" };
      case "REVIEWER":
        return { name: "Reviewer", color: "#f59e0b" };
      case "ADMIN":
        return { name: "Admin", color: "#ef4444" };
      default:
        return { name: roleName || "Unknown", color: "#6b7280" };
    }
  };

  // Pagination logic
  const filteredUsers = users.filter((u) => {
    if (statusFilter === "all") return true;
    return u.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#10b981";
      case "banned":
        return "#ef4444";
      case "inactive":
        return "#6b7280";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <main style={{ padding: "32px 40px", width: "100%" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{
            marginBottom: "32px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: "24px",
            borderBottom: `2px solid ${T.border}`,
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <p style={{
                fontSize: "11px",
                fontWeight: 700,
                color: T.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "4px"
              }}>
                Quản lý hệ thống
              </p>
              <h1 style={{
                fontSize: "28px",
                fontWeight: 800,
                color: T.textPrimary,
                letterSpacing: "-0.02em",
                marginBottom: "8px"
              }}>
                User Management
              </h1>
              <p style={{ fontSize: "14px", color: T.textMuted }}>
                Quản lý người dùng và phân quyền trong hệ thống
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              onMouseEnter={(e) => e.currentTarget.style.background = T.brandHover}
              onMouseLeave={(e) => e.currentTarget.style.background = T.brand}
              style={{
                padding: "10px 20px",
                background: T.brand,
                color: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all .15s"
              }}
            >
              Tạo người dùng
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ marginBottom: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { value: "all", label: "Tất cả", count: users.length },
              {
                value: "pending",
                label: "Chờ duyệt",
                count: users.filter(
                  (u) => u.status?.toLowerCase() === "pending",
                ).length,
              },
              {
                value: "active",
                label: "Hoạt động",
                count: users.filter((u) => u.status?.toLowerCase() === "active")
                  .length,
              },
              {
                value: "banned",
                label: "Bị cấm",
                count: users.filter((u) => u.status?.toLowerCase() === "banned")
                  .length,
              },
            ].map((tab, idx) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1);
                }}
                onMouseEnter={() => setHoveredTab(idx)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 700,
                  transition: "all .15s",
                  background: statusFilter === tab.value ? T.brand : (hoveredTab === idx ? T.surfaceHover : T.surface),
                  color: statusFilter === tab.value ? "#FFFFFF" : T.textPrimary,
                  border: `1px solid ${statusFilter === tab.value ? T.brand : T.border}`,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* User List */}
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(9,30,66,.08)"
          }}>
            {isLoading ? (
              <div style={{
                textAlign: "center",
                color: T.textMuted,
                padding: "64px 0"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px", color: T.textMuted, animation: "spin 1s linear infinite" }}>progress_activity</span>
                </div>
                <p style={{ fontSize: "13px" }}>Đang tải người dùng...</p>
              </div>
            ) : users.length === 0 ? (
              <div style={{
                textAlign: "center",
                color: T.textMuted,
                padding: "64px 0"
              }}>
                <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: T.textPrimary }}>
                  Không tìm thấy người dùng
                </p>
                <p style={{ fontSize: "13px" }}>
                  Nhấn "Tạo người dùng" để thêm người dùng đầu tiên
                </p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1.5fr",
                  padding: "12px 24px",
                  background: "#FAFBFC",
                  borderBottom: `1px solid ${T.border}`,
                  gap: "12px"
                }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>NGƯỜI DÙNG</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>EMAIL</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>VAI TRÒ</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>TRẠNG THÁI</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>NGÀY TẠO</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>THAO TÁC</p>
                </div>

                {/* Table Body */}
                <div>
                  {currentUsers.map((u, idx) => {
                    const roleInfo = u.roleName
                      ? getRoleLabelFromName(u.roleName)
                      : getRoleLabel(u.roleId);
                    return (
                      <div
                        key={u.userId || u.id}
                        onMouseEnter={() => setHoveredRow(idx)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1.5fr",
                          padding: "16px 24px",
                          background: hoveredRow === idx ? T.brandLight : (idx % 2 === 0 ? T.surface : "#FAFBFC"),
                          borderBottom: `1px solid ${T.border}`,
                          transition: "all .15s",
                          gap: "12px",
                          alignItems: "center"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${T.brand}, ${T.purple})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            fontSize: "16px",
                            fontWeight: 700
                          }}>
                            {u.fullName?.[0]?.toUpperCase() ||
                              u.username?.[0]?.toUpperCase() ||
                              "?"}
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: T.textPrimary }}>
                              {u.fullName || u.username}
                            </div>
                            <div style={{ fontSize: "12px", color: T.textMuted }}>
                              @{u.username}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: "13px", color: T.textPrimary }}>
                          {u.email}
                        </span>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          background: `${roleInfo.color}20`,
                          color: roleInfo.color
                        }}>
                          {roleInfo.name}
                        </span>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          background: `${getStatusColor(u.status)}20`,
                          color: getStatusColor(u.status)
                        }}>
                          {u.status === 'active' ? 'Hoạt động' : u.status === 'pending' ? 'Chờ duyệt' : u.status === 'banned' ? 'Bị cấm' : u.status === 'inactive' ? 'Không hoạt động' : u.status || "Hoạt động"}
                        </span>
                        <span style={{ fontSize: "12px", color: T.textMuted }}>
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "-"}
                        </span>
                        <div>
                          {u.status?.toLowerCase() === "pending" ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => handleApproveUser(u.userId)}
                                disabled={processingUserId === u.userId}
                                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#16A34A")}
                                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = T.green)}
                                style={{
                                  padding: "6px 12px",
                                  background: T.green,
                                  color: "#FFFFFF",
                                  fontSize: "11px",
                                  borderRadius: "4px",
                                  fontWeight: 700,
                                  border: "none",
                                  cursor: processingUserId === u.userId ? "not-allowed" : "pointer",
                                  opacity: processingUserId === u.userId ? 0.5 : 1,
                                  transition: "all .15s",
                                  fontFamily: "inherit"
                                }}
                              >
                                ✔ Chấp nhận
                              </button>
                              <button
                                onClick={() => handleRejectUser(u.userId)}
                                disabled={processingUserId === u.userId}
                                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#DC2626")}
                                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = T.red)}
                                style={{
                                  padding: "6px 12px",
                                  background: T.red,
                                  color: "#FFFFFF",
                                  fontSize: "11px",
                                  borderRadius: "4px",
                                  fontWeight: 700,
                                  border: "none",
                                  cursor: processingUserId === u.userId ? "not-allowed" : "pointer",
                                  opacity: processingUserId === u.userId ? 0.5 : 1,
                                  transition: "all .15s",
                                  fontFamily: "inherit"
                                }}
                              >
                                ✖ Từ chối
                              </button>
                            </div>
                          ) : u.status?.toLowerCase() === "banned" ? (
                            <button
                              onClick={() =>
                                userApi
                                  .unbanUser(u.userId)
                                  .then(() => fetchUsers())
                              }
                              onMouseEnter={(e) => e.currentTarget.style.background = T.brandHover}
                              onMouseLeave={(e) => e.currentTarget.style.background = T.brand}
                              style={{
                                padding: "6px 12px",
                                background: T.brand,
                                color: "#FFFFFF",
                                fontSize: "11px",
                                borderRadius: "4px",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                                transition: "all .15s",
                                fontFamily: "inherit"
                              }}
                            >
                              Unban
                            </button>
                          ) : (
                            <span style={{ fontSize: "12px", color: T.textMuted }}>
                              -
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination */}
            {!isLoading && filteredUsers.length > 0 && totalPages > 1 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderTop: `1px solid ${T.border}`
              }}>
                <div style={{ fontSize: "13px", color: T.textMuted }}>
                  Hiển thị {indexOfFirstUser + 1}-
                  {Math.min(indexOfLastUser, filteredUsers.length)} /{" "}
                  {filteredUsers.length} người dùng
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      border: `1px solid ${T.border}`,
                      borderRadius: "4px",
                      color: T.textPrimary,
                      background: T.surface,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.5 : 1,
                      transition: "all .15s",
                      fontFamily: "inherit",
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => currentPage !== 1 && (e.currentTarget.style.background = T.surfaceHover)}
                    onMouseLeave={(e) => currentPage !== 1 && (e.currentTarget.style.background = T.surface)}
                  >
                    ← Trước
                  </button>
                  <div style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    border: `1px solid ${T.border}`,
                    borderRadius: "4px",
                    background: T.brandLight,
                    color: T.brand,
                    fontWeight: 700
                  }}>
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      border: `1px solid ${T.border}`,
                      borderRadius: "4px",
                      color: T.textPrimary,
                      background: T.surface,
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      transition: "all .15s",
                      fontFamily: "inherit",
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => currentPage !== totalPages && (e.currentTarget.style.background = T.surfaceHover)}
                    onMouseLeave={(e) => currentPage !== totalPages && (e.currentTarget.style.background = T.surface)}
                  >
                    Tiếp →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create User Modal */}
          {showCreateModal && (
            <div style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999
            }}>
              <div style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                padding: "32px",
                width: "90%",
                maxWidth: "500px",
                boxShadow: "0 8px 24px rgba(9,30,66,.25)"
              }}>
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: T.textPrimary,
                  marginBottom: "24px"
                }}>
                  Tạo người dùng mới
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: T.textMuted,
                      marginBottom: "6px"
                    }}>
                      Username <span style={{ color: T.red }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: "4px",
                        color: T.textPrimary,
                        fontSize: "13px",
                        fontFamily: "inherit",
                        outline: "none"
                      }}
                      placeholder="johndoe"
                      onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: T.textMuted,
                      marginBottom: "6px"
                    }}>
                      Email <span style={{ color: T.red }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: "4px",
                        color: T.textPrimary,
                        fontSize: "13px",
                        fontFamily: "inherit",
                        outline: "none"
                      }}
                      placeholder="john@example.com"
                      onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: T.textMuted,
                      marginBottom: "6px"
                    }}>
                      Full Name <span style={{ color: T.red }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newUser.fullName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, fullName: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: "4px",
                        color: T.textPrimary,
                        fontSize: "13px",
                        fontFamily: "inherit",
                        outline: "none"
                      }}
                      placeholder="John Doe"
                      onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: T.textMuted,
                      marginBottom: "6px"
                    }}>
                      Role <span style={{ color: T.red }}>*</span>
                    </label>
                    <select
                      value={newUser.roleId}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          roleId: parseInt(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: "4px",
                        color: T.textPrimary,
                        fontSize: "13px",
                        fontFamily: "inherit",
                        outline: "none"
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    >
                      <option value={2}>Manager</option>
                      <option value={3}>Annotator</option>
                      <option value={4}>Reviewer</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: T.textMuted,
                      marginBottom: "6px"
                    }}>
                      Password <span style={{ color: T.red }}>*</span>
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: "4px",
                        color: T.textPrimary,
                        fontSize: "13px",
                        fontFamily: "inherit",
                        outline: "none"
                      }}
                      placeholder="••••••••"
                      onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      border: `1px solid ${T.border}`,
                      borderRadius: "4px",
                      color: T.textPrimary,
                      background: T.surface,
                      cursor: isCreating ? "not-allowed" : "pointer",
                      transition: "all .15s",
                      fontSize: "14px",
                      fontWeight: 600,
                      fontFamily: "inherit"
                    }}
                    onMouseEnter={(e) => !isCreating && (e.currentTarget.style.background = T.surfaceHover)}
                    onMouseLeave={(e) => !isCreating && (e.currentTarget.style.background = T.surface)}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isCreating}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      background: T.brand,
                      color: "#FFFFFF",
                      borderRadius: "4px",
                      border: "none",
                      cursor: isCreating ? "not-allowed" : "pointer",
                      opacity: isCreating ? 0.5 : 1,
                      transition: "all .15s",
                      fontSize: "14px",
                      fontWeight: 700,
                      fontFamily: "inherit"
                    }}
                    onMouseEnter={(e) => !isCreating && (e.currentTarget.style.background = T.brandHover)}
                    onMouseLeave={(e) => !isCreating && (e.currentTarget.style.background = T.brand)}
                  >
                    {isCreating ? "Đang tạo..." : "Tạo"}
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
