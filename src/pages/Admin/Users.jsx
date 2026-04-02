import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../../context/ToastContext";
import { userApi } from "../../api/userApi";
import { translateRole } from "../../i18n/helpers";

export default function AdminUsers() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingUserId, setProcessingUserId] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState(null);
  const usersPerPage = 10;
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    roleId: 3,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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
      const data = await userApi.getAllUsers({ page: 0, size: 50 });
      setUsers(data.content || data || []);
    } catch (error) {
      addToast(t("admin:users.loadFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    if (!window.confirm(t("admin:users.approveConfirm"))) return;
    setProcessingUserId(userId);
    try {
      await userApi.approveUser(userId);
      addToast(t("admin:users.approveSuccess"), "success");
      fetchUsers();
    } catch (error) {
      addToast(error.message || t("admin:users.approveFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRejectUser = async (userId) => {
    const reason = window.prompt(t("admin:users.rejectPrompt"));
    if (reason === null) return;
    setProcessingUserId(userId);
    try {
      await userApi.rejectUser(userId, reason);
      addToast(t("admin:users.rejectSuccess"), "info");
      fetchUsers();
    } catch (error) {
      addToast(error.message || t("admin:users.rejectFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm(t("admin:users.banConfirm"))) return;
    setProcessingUserId(userId);
    try {
      await userApi.suspendUser(userId);
      addToast(t("admin:users.banSuccess"), "success");
      fetchUsers();
    } catch (error) {
      addToast(error.message || t("admin:users.banFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleUnbanUser = async (userId) => {
    if (!window.confirm(t("admin:users.unbanConfirm"))) return;
    setProcessingUserId(userId);
    try {
      await userApi.activateUser(userId);
      addToast(t("admin:users.unbanSuccess"), "success");
      fetchUsers();
    } catch (error) {
      addToast(error.message || t("admin:users.unbanFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    const roleMap = { ADMIN: 1, MANAGER: 2, ANNOTATOR: 3, REVIEWER: 4 };
    setNewRole(roleMap[user.roleName?.toUpperCase()] || user.roleId || 3);
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
    } catch (error) {
      addToast(error.message || t("admin:users.changeRoleFailed"), "error");
    } finally {
      setProcessingUserId(null);
    }
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
      setNewUser({
        username: "",
        email: "",
        password: "",
        fullName: "",
        roleId: 3,
      });
      fetchUsers();
    } catch (error) {
      const backendMessage = error.data?.message || error.message || "";
      const errorMessages = {
        EMAIL_ALREADY_EXISTS: t("admin:users.errors.emailExists"),
        USERNAME_ALREADY_EXISTS: t("admin:users.errors.usernameExists"),
        ROLE_NOT_FOUND: t("admin:users.errors.roleNotFound"),
      };
      addToast(
        errorMessages[backendMessage] || backendMessage || t("admin:users.createFailed"),
        "error",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleLabel = (roleId) => {
    switch (roleId) {
      case 1:
        return { name: translateRole("ADMIN"), color: "bg-red-100 text-red-700" };
      case 2:
        return { name: translateRole("MANAGER"), color: "bg-emerald-100 text-emerald-700" };
      case 3:
        return { name: translateRole("ANNOTATOR"), color: "bg-blue-100 text-blue-700" };
      case 4:
        return { name: translateRole("REVIEWER"), color: "bg-amber-100 text-amber-700" };
      default:
        return { name: translateRole("UNKNOWN"), color: "bg-slate-100 text-slate-500" };
    }
  };

  const getRoleLabelFromName = (roleName) => {
    switch (roleName?.toUpperCase()) {
      case "ANNOTATOR":
        return { name: translateRole("ANNOTATOR"), color: "bg-blue-100 text-blue-700" };
      case "MANAGER":
        return { name: translateRole("MANAGER"), color: "bg-emerald-100 text-emerald-700" };
      case "REVIEWER":
        return { name: translateRole("REVIEWER"), color: "bg-amber-100 text-amber-700" };
      case "ADMIN":
        return { name: translateRole("ADMIN"), color: "bg-red-100 text-red-700" };
      default:
        return { name: roleName || translateRole("UNKNOWN"), color: "bg-slate-100 text-slate-500" };
    }
  };

  const filteredUsers = users.filter((u) => {
    const isBanned =
      u.status?.toLowerCase() === "banned" ||
      u.status?.toLowerCase() === "suspended" ||
      u.status?.toLowerCase() === "inactive";
    if (statusFilter === "all") return !isBanned;
    if (statusFilter === "banned") return isBanned;
    return u.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "banned":
        return "bg-red-100 text-red-700";
      case "inactive":
      case "suspended":
        return "bg-slate-100 text-slate-600";
      case "pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-500";
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

  const filterTabs = [
    {
      value: "all",
      label: t("admin:users.filters.all"),
      count: users.filter((u) => {
        const isBanned =
          u.status?.toLowerCase() === "banned" ||
          u.status?.toLowerCase() === "suspended" ||
          u.status?.toLowerCase() === "inactive";
        return !isBanned;
      }).length,
    },
    {
      value: "pending",
      label: t("admin:users.filters.pending"),
      count: users.filter((u) => u.status?.toLowerCase() === "pending").length,
    },
    {
      value: "active",
      label: t("admin:users.filters.active"),
      count: users.filter((u) => u.status?.toLowerCase() === "active").length,
    },
    {
      value: "banned",
      label: t("admin:users.filters.banned"),
      count: users.filter(
        (u) =>
          u.status?.toLowerCase() === "banned" ||
          u.status?.toLowerCase() === "suspended" ||
          u.status?.toLowerCase() === "inactive",
      ).length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-['IBM_Plex_Sans','Segoe_UI',system-ui,sans-serif]">
      <main className="w-full px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-200 pb-6">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                {t("admin:users.systemManagement")}
              </p>
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {t("admin:users.title")}
              </h1>
              <p className="text-sm text-slate-500">{t("admin:users.subtitle")}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              {t("admin:users.create")}
            </button>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {filterTabs.map((tab, idx) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1);
                }}
                onMouseEnter={() => setHoveredTab(idx)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`rounded-md border px-4 py-2 text-sm font-bold transition ${
                  statusFilter === tab.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : hoveredTab === idx
                      ? "border-slate-300 bg-slate-100 text-slate-900"
                      : "border-slate-300 bg-white text-slate-900"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="py-16 text-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-3xl">
                  progress_activity
                </span>
                <p className="mt-4 text-sm">{t("admin:users.loading")}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <p className="mb-2 text-lg font-semibold text-slate-900">
                  {t("admin:users.emptyTitle")}
                </p>
                <p className="text-sm">{t("admin:users.emptyHint")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1.5fr] gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{t("admin:users.table.user")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{t("admin:users.table.email")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{t("admin:users.table.role")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{t("admin:users.table.status")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{t("admin:users.table.createdAt")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{t("admin:users.table.actions")}</p>
                </div>

                <div>
                  {currentUsers.map((u, idx) => {
                    const roleInfo = u.roleName
                      ? getRoleLabelFromName(u.roleName)
                      : getRoleLabel(u.roleId);
                    const isPending = u.status?.toLowerCase() === "pending";
                    const isBanned =
                      u.status?.toLowerCase() === "banned" ||
                      u.status?.toLowerCase() === "suspended" ||
                      u.status?.toLowerCase() === "inactive";

                    return (
                      <div
                        key={u.userId || u.id}
                        onMouseEnter={() => setHoveredRow(idx)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1.5fr] items-center gap-3 border-b border-slate-200 px-6 py-4 transition ${
                          hoveredRow === idx
                            ? "bg-blue-50"
                            : idx % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-base font-bold text-white">
                            {u.fullName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {u.fullName || u.username}
                            </div>
                            <div className="text-xs text-slate-500">@{u.username}</div>
                          </div>
                        </div>

                        <div className="truncate text-sm text-slate-600">{u.email}</div>

                        <div>
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${roleInfo.color}`}>
                            {roleInfo.name}
                          </span>
                        </div>

                        <div>
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${getStatusColor(u.status)}`}>
                            {getStatusLabel(u.status)}
                          </span>
                        </div>

                        <div className="text-sm text-slate-500">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString(i18n.language === "en" ? "en-US" : "vi-VN")
                            : "—"}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleApproveUser(u.userId)}
                                disabled={processingUserId === u.userId}
                                className="rounded-md border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {t("admin:users.actions.approve")}
                              </button>
                              <button
                                onClick={() => handleRejectUser(u.userId)}
                                disabled={processingUserId === u.userId}
                                className="rounded-md border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {t("admin:users.actions.reject")}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenRoleModal(u)}
                                disabled={processingUserId === u.userId}
                                className="rounded-md border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {t("admin:users.actions.changeRole")}
                              </button>
                              {isBanned ? (
                                <button
                                  onClick={() => handleUnbanUser(u.userId)}
                                  disabled={processingUserId === u.userId}
                                  className="rounded-md border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {t("admin:users.actions.unban")}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBanUser(u.userId)}
                                  disabled={processingUserId === u.userId}
                                  className="rounded-md border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {t("admin:users.actions.ban")}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {!isLoading && filteredUsers.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                <div className="text-sm text-slate-500">
                  {t("admin:users.showing", {
                    start: indexOfFirstUser + 1,
                    end: Math.min(indexOfLastUser, filteredUsers.length),
                    total: filteredUsers.length,
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {`← ${t("admin:users.pagination.prev")}`}
                  </button>
                  <div className="rounded-md border border-slate-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                    {t("admin:users.pagination.page", {
                      current: currentPage,
                      total: totalPages,
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {`${t("admin:users.pagination.next")} →`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {showCreateModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 shadow-2xl">
                <h2 className="mb-6 text-2xl font-bold text-slate-900">
                  {t("admin:users.createTitle")}
                </h2>

                <div className="flex flex-col gap-4">
                  {[
                    ["username", "text", t("admin:users.fields.username"), t("admin:users.placeholders.username")],
                    ["email", "email", t("admin:users.fields.email"), t("admin:users.placeholders.email")],
                    ["fullName", "text", t("admin:users.fields.fullName"), t("admin:users.placeholders.fullName")],
                    ["password", "password", t("admin:users.fields.password"), t("admin:users.placeholders.password")],
                  ].map(([key, type, label, placeholder]) => (
                    <div key={key}>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                        {label} <span className="text-red-600">*</span>
                      </label>
                      <input
                        type={type}
                        value={newUser[key]}
                        onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                        className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      {t("admin:users.fields.role")} <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={newUser.roleId}
                      onChange={(e) => setNewUser({ ...newUser, roleId: parseInt(e.target.value) })}
                      className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value={2}>{translateRole("MANAGER")}</option>
                      <option value={3}>{translateRole("ANNOTATOR")}</option>
                      <option value={4}>{translateRole("REVIEWER")}</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                    className="flex-1 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("common:actions.cancel")}
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isCreating}
                    className="flex-1 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreating ? t("admin:users.createButtonLoading") : t("common:actions.create")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRoleModal && selectedUser && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-2xl">
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                  {t("admin:users.changeRoleTitle")}
                </h2>
                <p className="mb-6 text-sm text-slate-500">
                  {t("admin:users.changeRoleDescription", {
                    name: selectedUser.fullName || selectedUser.username,
                  })}
                </p>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-500">
                    {t("admin:users.selectNewRole")} <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(parseInt(e.target.value))}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value={2}>{translateRole("MANAGER")}</option>
                    <option value={3}>{translateRole("ANNOTATOR")}</option>
                    <option value={4}>{translateRole("REVIEWER")}</option>
                  </select>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedUser(null);
                    }}
                    disabled={processingUserId === selectedUser.userId}
                    className="flex-1 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("common:actions.cancel")}
                  </button>
                  <button
                    onClick={handleChangeRole}
                    disabled={processingUserId === selectedUser.userId}
                    className="flex-1 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
