import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { userApi } from "../../api/userApi";
import { translateRole } from "../../i18n/helpers";

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
  const { t, i18n } = useTranslation(["admin", "common"]);
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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState(null);
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
      addToast(t("admin:users.loadFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    if (!window.confirm(t("admin:users.approveConfirm"))) {
      return;
    }

    setProcessingUserId(userId);
    try {
      await userApi.approveUser(userId);
      addToast(t("admin:users.approveSuccess"), "success");
      fetchUsers(); // Reload list
    } catch (error) {
      console.error("Failed to approve user:", error);
      addToast(error.message || t("admin:users.approveFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRejectUser = async (userId) => {
    const reason = window.prompt(t("admin:users.rejectPrompt"));
    if (reason === null) return; // User cancelled

    setProcessingUserId(userId);
    try {
      await userApi.rejectUser(userId, reason);
      addToast(t("admin:users.rejectSuccess"), "info");
      fetchUsers(); // Reload list
    } catch (error) {
      console.error("Failed to reject user:", error);
      addToast(error.message || t("admin:users.rejectFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm(t("admin:users.banConfirm"))) {
      return;
    }

    setProcessingUserId(userId);
    try {
      // Use suspendUser instead of banUser if backend doesn't have /ban endpoint
      await userApi.suspendUser(userId);
      addToast(t("admin:users.banSuccess"), "success");
      fetchUsers();
    } catch (error) {
      console.error("Failed to ban user:", error);
      addToast(error.message || t("admin:users.banFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleUnbanUser = async (userId) => {
    if (!window.confirm(t("admin:users.unbanConfirm"))) {
      return;
    }

    setProcessingUserId(userId);
    try {
      // Use activateUser instead of unbanUser if backend doesn't have /unban endpoint
      await userApi.activateUser(userId);
      addToast(t("admin:users.unbanSuccess"), "success");
      fetchUsers();
    } catch (error) {
      console.error("Failed to unban user:", error);
      addToast(error.message || t("admin:users.unbanFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    // Map role name to roleId
    const roleMap = {
      'ADMIN': 1,
      'MANAGER': 2,
      'ANNOTATOR': 3,
      'REVIEWER': 4
    };
    setNewRole(roleMap[user.roleName?.toUpperCase()] || user.roleId || 3);
    setShowRoleModal(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    setProcessingUserId(selectedUser.userId);
    try {
      // Use updateUser API with roleId
      await userApi.updateUser(selectedUser.userId, { roleId: newRole });
      addToast(t("admin:users.changeRoleSuccess"), "success");
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to change role:", error);
      addToast(error.message || t("admin:users.changeRoleFailed"), "error");
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
      addToast(t("admin:users.createRequired"), "error");
      return;
    }

    setIsCreating(true);
    try {
      await userApi.createUser(newUser);
      addToast(t("admin:users.createSuccess"), "success");
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
      // Map backend error codes to localized messages
      const backendMessage = error.data?.message || error.message || "";
      const errorMessages = {
        EMAIL_ALREADY_EXISTS: t("admin:users.errors.emailExists"),
        USERNAME_ALREADY_EXISTS: t("admin:users.errors.usernameExists"),
        ROLE_NOT_FOUND: t("admin:users.errors.roleNotFound"),
      };
      const displayMessage =
        errorMessages[backendMessage] ||
        backendMessage ||
        t("admin:users.createFailed");
      addToast(displayMessage, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleLabel = (roleId) => {
    switch (roleId) {
      case 1: return { name: translateRole("ADMIN"), color: "#ef4444" };
      case 2: return { name: translateRole("MANAGER"), color: "#10b981" };
      case 3: return { name: translateRole("ANNOTATOR"), color: "#3b82f6" };
      case 4: return { name: translateRole("REVIEWER"), color: "#f59e0b" };
      default: return { name: translateRole("UNKNOWN"), color: "#6b7280" };
    }
  };

  const getRoleLabelFromName = (roleName) => {
    switch (roleName?.toUpperCase()) {
      case "ANNOTATOR": return { name: translateRole("ANNOTATOR"), color: "#3b82f6" };
      case "MANAGER": return { name: translateRole("MANAGER"), color: "#10b981" };
      case "REVIEWER": return { name: translateRole("REVIEWER"), color: "#f59e0b" };
      case "ADMIN": return { name: translateRole("ADMIN"), color: "#ef4444" };
      default: return { name: roleName || translateRole("UNKNOWN"), color: "#6b7280" };
    }
  };

  // Pagination logic
  const filteredUsers = users.filter((u) => {
    const isBanned = u.status?.toLowerCase() === "banned" || 
                     u.status?.toLowerCase() === "suspended" || 
                     u.status?.toLowerCase() === "inactive";
    
    if (statusFilter === "all") {
      // "Tất cả" không bao gồm người bị cấm
      return !isBanned;
    }
    if (statusFilter === "banned") {
      // Tab "Bị cấm" chỉ hiển thị người bị cấm
      return isBanned;
    }
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

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return t("admin:users.statuses.active");
      case "pending":
        return t("admin:users.statuses.pending");
      case "banned":
        return t("admin:users.statuses.banned");
      case "suspended":
        return t("admin:users.statuses.suspended");
      case "inactive":
        return t("admin:users.statuses.inactive");
      default:
        return status || t("admin:users.statuses.unknown");
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
                {t("admin:users.systemManagement")}
              </p>
              <h1 style={{
                fontSize: "28px",
                fontWeight: 800,
                color: T.textPrimary,
                letterSpacing: "-0.02em",
                marginBottom: "8px"
              }}>
                {t("admin:users.title")}
              </h1>
              <p style={{ fontSize: "14px", color: T.textMuted }}>
                {t("admin:users.subtitle")}
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
              {t("admin:users.create")}
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ marginBottom: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { 
                value: "all", 
                label: t("admin:users.filters.all"), 
                count: users.filter((u) => {
                  const isBanned = u.status?.toLowerCase() === "banned" || 
                                   u.status?.toLowerCase() === "suspended" || 
                                   u.status?.toLowerCase() === "inactive";
                  return !isBanned;
                }).length 
              },
              {
                value: "pending",
                label: t("admin:users.filters.pending"),
                count: users.filter(
                  (u) => u.status?.toLowerCase() === "pending",
                ).length,
              },
              {
                value: "active",
                label: t("admin:users.filters.active"),
                count: users.filter((u) => u.status?.toLowerCase() === "active")
                  .length,
              },
              {
                value: "banned",
                label: t("admin:users.filters.banned"),
                count: users.filter(
                  (u) => u.status?.toLowerCase() === "banned" || u.status?.toLowerCase() === "suspended" || u.status?.toLowerCase() === "inactive",
                ).length,
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
                <p style={{ fontSize: "13px" }}>{t("admin:users.loading")}</p>
              </div>
            ) : users.length === 0 ? (
              <div style={{
                textAlign: "center",
                color: T.textMuted,
                padding: "64px 0"
              }}>
                <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: T.textPrimary }}>
                  {t("admin:users.emptyTitle")}
                </p>
                <p style={{ fontSize: "13px" }}>
                  {t("admin:users.emptyHint")}
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
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("admin:users.table.user")}</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("admin:users.table.email")}</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("admin:users.table.role")}</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("admin:users.table.status")}</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("admin:users.table.createdAt")}</p>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("admin:users.table.actions")}</p>
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
                          {getStatusLabel(u.status)}
                        </span>
                        <span style={{ fontSize: "12px", color: T.textMuted }}>
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString(
                                i18n.language === "en" ? "en-US" : "vi-VN",
                              )
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
                                {`✔ ${t("admin:users.actions.approve")}`}
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
                                {`✖ ${t("admin:users.actions.reject")}`}
                              </button>
                            </div>
                          ) : (u.status?.toLowerCase() === "banned" || 
                                u.status?.toLowerCase() === "suspended" || 
                                u.status?.toLowerCase() === "inactive") ? (
                            <button
                              onClick={() => handleUnbanUser(u.userId)}
                              disabled={processingUserId === u.userId}
                              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = T.brandHover)}
                              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = T.brand)}
                              style={{
                                padding: "6px 12px",
                                background: T.brand,
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
                              {t("admin:users.actions.unban")}
                            </button>
                          ) : u.roleName && u.roleName.toUpperCase() !== "ADMIN" ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => handleOpenRoleModal(u)}
                                disabled={processingUserId === u.userId}
                                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = T.brandHover)}
                                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = T.brand)}
                                style={{
                                  padding: "6px 12px",
                                  background: T.brand,
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
                                title={t("admin:users.actions.changeRole")}
                              >
                                {t("admin:users.actions.changeRole")}
                              </button>
                              <button
                                onClick={() => handleBanUser(u.userId)}
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
                                title={t("admin:users.actions.ban")}
                              >
                                {t("admin:users.actions.ban")}
                              </button>
                            </div>
                          ) : null
                          }
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
                  {t("admin:users.showing", {
                    start: indexOfFirstUser + 1,
                    end: Math.min(indexOfLastUser, filteredUsers.length),
                    total: filteredUsers.length,
                  })}
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
                    {`← ${t("admin:users.pagination.prev")}`}
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
                    {t("admin:users.pagination.page", {
                      current: currentPage,
                      total: totalPages,
                    })}
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
                    {`${t("admin:users.pagination.next")} →`}
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
                  {t("admin:users.createTitle")}
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.textMuted, marginBottom: "6px" }}>
                      {t("admin:users.fields.username")} <span style={{ color: T.red }}>*</span>
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
                      placeholder={t("admin:users.placeholders.username")}
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
                      {t("admin:users.fields.email")} <span style={{ color: T.red }}>*</span>
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
                      placeholder={t("admin:users.placeholders.email")}
                      onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.textMuted, marginBottom: "6px" }}>
                      {t("admin:users.fields.fullName")} <span style={{ color: T.red }}>*</span>
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
                      placeholder={t("admin:users.placeholders.fullName")}
                      onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.textMuted, marginBottom: "6px" }}>
                      {t("admin:users.fields.role")} <span style={{ color: T.red }}>*</span>
                    </label>
                    <select
                      value={newUser.roleId}
                      onChange={(e) => setNewUser({ ...newUser, roleId: parseInt(e.target.value) })}
                      style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", color: T.textPrimary, fontSize: "13px", fontFamily: "inherit", outline: "none" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    >
                      <option value={2}>{translateRole("MANAGER")}</option>
                      <option value={3}>{translateRole("ANNOTATOR")}</option>
                      <option value={4}>{translateRole("REVIEWER")}</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.textMuted, marginBottom: "6px" }}>
                      {t("admin:users.fields.password")} <span style={{ color: T.red }}>*</span>
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
                      placeholder={t("admin:users.placeholders.password")}
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
                    {t("common:actions.cancel")}
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
                    {isCreating
                      ? t("admin:users.createButtonLoading")
                      : t("common:actions.create")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Change Role Modal */}
          {showRoleModal && selectedUser && (
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
                maxWidth: "450px",
                boxShadow: "0 8px 24px rgba(9,30,66,.25)"
              }}>
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: T.textPrimary,
                  marginBottom: "8px"
                }}>
                  {t("admin:users.changeRoleTitle")}
                </h2>
                <p style={{
                  fontSize: "13px",
                  color: T.textMuted,
                  marginBottom: "24px"
                }}>
                  {t("admin:users.changeRoleDescription", {
                    name: selectedUser.fullName || selectedUser.username,
                  })}
                </p>

                <div>
                  <label style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.textMuted,
                    marginBottom: "8px"
                  }}>
                    {t("admin:users.selectNewRole")} <span style={{ color: T.red }}>*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(parseInt(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: "4px",
                      color: T.textPrimary,
                      fontSize: "14px",
                      fontFamily: "inherit",
                      outline: "none",
                      cursor: "pointer"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                    onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                  >
                    <option value={2}>{translateRole("MANAGER")}</option>
                    <option value={3}>{translateRole("ANNOTATOR")}</option>
                    <option value={4}>{translateRole("REVIEWER")}</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedUser(null);
                    }}
                    disabled={processingUserId === selectedUser.userId}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      border: `1px solid ${T.border}`,
                      borderRadius: "4px",
                      color: T.textPrimary,
                      background: T.surface,
                      cursor: processingUserId === selectedUser.userId ? "not-allowed" : "pointer",
                      transition: "all .15s",
                      fontSize: "14px",
                      fontWeight: 600,
                      fontFamily: "inherit"
                    }}
                    onMouseEnter={(e) => processingUserId !== selectedUser.userId && (e.currentTarget.style.background = T.surfaceHover)}
                    onMouseLeave={(e) => processingUserId !== selectedUser.userId && (e.currentTarget.style.background = T.surface)}
                  >
                    {t("common:actions.cancel")}
                  </button>
                  <button
                    onClick={handleChangeRole}
                    disabled={processingUserId === selectedUser.userId}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      background: T.brand,
                      color: "#FFFFFF",
                      borderRadius: "4px",
                      border: "none",
                      cursor: processingUserId === selectedUser.userId ? "not-allowed" : "pointer",
                      opacity: processingUserId === selectedUser.userId ? 0.5 : 1,
                      transition: "all .15s",
                      fontSize: "14px",
                      fontWeight: 700,
                      fontFamily: "inherit"
                    }}
                    onMouseEnter={(e) => processingUserId !== selectedUser.userId && (e.currentTarget.style.background = T.brandHover)}
                    onMouseLeave={(e) => processingUserId !== selectedUser.userId && (e.currentTarget.style.background = T.brand)}
                  >
                    {processingUserId === selectedUser.userId
                      ? t("admin:users.processing")
                      : t("admin:users.actions.saveChanges")}
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
