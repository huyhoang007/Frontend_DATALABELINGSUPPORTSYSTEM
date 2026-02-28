import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { userApi } from "../../api/userApi";

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
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    roleId: 2, // Default to Annotator (Database: 1=ADMIN, 2=ANNOTATOR, 3=REVIEWER, 4=MANAGER)
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
      addToast("Failed to load users", "error");
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
        roleId: 2,
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
        return { name: "Annotator", color: "#3b82f6" };
      case 3:
        return { name: "Reviewer", color: "#f59e0b" };
      case 4:
        return { name: "Manager", color: "#10b981" };
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
    <div className="flex h-screen bg-background">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                 User Management
              </h1>
              <p className="text-muted-foreground">
                Manage system users and roles
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              ➕ Create User
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="mb-6 flex gap-2 flex-wrap">
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
                label: "Active",
                count: users.filter((u) => u.status?.toLowerCase() === "active")
                  .length,
              },
              {
                value: "banned",
                label: "Banned",
                count: users.filter((u) => u.status?.toLowerCase() === "banned")
                  .length,
              },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-card border border-border text-foreground hover:bg-accent"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* User List */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-lg font-medium mb-2">No users found</p>
                <p className="text-sm">
                  Click "Create User" to add the first user
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-background/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentUsers.map((u) => {
                    const roleInfo = u.roleName
                      ? getRoleLabelFromName(u.roleName)
                      : getRoleLabel(u.roleId);
                    return (
                      <tr
                        key={u.userId || u.id}
                        className="hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {u.fullName?.[0]?.toUpperCase() ||
                                u.username?.[0]?.toUpperCase() ||
                                "?"}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {u.fullName || u.username}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{u.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {u.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${roleInfo.color}20`,
                              color: roleInfo.color,
                            }}
                          >
                            {roleInfo.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${getStatusColor(u.status)}20`,
                              color: getStatusColor(u.status),
                            }}
                          >
                            {u.status || "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {u.status?.toLowerCase() === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveUser(u.userId)}
                                disabled={processingUserId === u.userId}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                              >
                                ✔ Chấp nhận
                              </button>
                              <button
                                onClick={() => handleRejectUser(u.userId)}
                                disabled={processingUserId === u.userId}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
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
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-colors"
                            >
                              Unban
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!isLoading && filteredUsers.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {indexOfFirstUser + 1}-
                  {Math.min(indexOfLastUser, filteredUsers.length)} /{" "}
                  {filteredUsers.length} người dùng
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Trước
                  </button>
                  <div className="px-3 py-1.5 text-sm border border-border rounded-lg bg-blue-600/10 text-blue-600 font-medium">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create User Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Create New User
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      placeholder="johndoe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newUser.fullName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, fullName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newUser.roleId}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          roleId: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    >
                      <option value={2}>Annotator</option>
                      <option value={3}>Reviewer</option>
                      <option value={4}>Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors"
                  >
                    {isCreating ? "Creating..." : "Create"}
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
