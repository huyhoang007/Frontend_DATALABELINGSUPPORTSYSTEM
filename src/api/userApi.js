/**
 * User API Module
 * BE1 Endpoint: /api/users (UserController)
 * Most endpoints are ADMIN only except /me
 */

import apiClient from "./apiClient";
import { toCreateUserRequest } from "./adapters";

export const userApi = {
  /**
   * Get all users with pagination (ADMIN only)
   * @param {Object} params - { page, size }
   * @returns {Promise<Object>} Page<UserResponse>
   */
  getAllUsers: async ({ page = 0, size = 20 } = {}) => {
    return await apiClient.get(`/api/users?page=${page}&size=${size}`);
  },

  /**
   * Get current user profile (ALL roles)
   * @returns {Promise<Object>} UserResponse
   */
  getCurrentUser: async () => {
    return await apiClient.get("/api/users/me");
  },

  /**
   * Get user by ID (ADMIN only)
   * @param {number} userId
   * @returns {Promise<Object>} UserResponse
   */
  getUserById: async (userId) => {
    return await apiClient.get(`/api/users/${userId}`);
  },

  /**
   * Create new user (ADMIN only)
   * BE1 expects: { username, email, password, fullName, roleId }
   * Role IDs: 1=ADMIN, 2=MANAGER, 3=ANNOTATOR, 4=REVIEWER
   * @param {Object} payload - { username, email, password, fullName, roleId|role }
   * @returns {Promise<Object>} UserResponse
   */
  createUser: async (payload) => {
    const dto = toCreateUserRequest(payload);
    return await apiClient.post("/api/users", dto);
  },

  /**
   * Update current user profile (ALL roles)
   * @param {Object} payload - { fullName, email, ... }
   * @returns {Promise<Object>} UserResponse
   */
  updateCurrentUser: async (payload) => {
    return await apiClient.put("/api/users/me", payload);
  },

  /**
   * Update user by ID (ADMIN or self)
   * @param {number} userId
   * @param {Object} payload
   * @returns {Promise<Object>} UserResponse
   */
  updateUser: async (userId, payload) => {
    return await apiClient.put(`/api/users/${userId}`, payload);
  },

  /**
   * Ban user (ADMIN only)
   * @param {number} userId
   * @returns {Promise<Object>} UserResponse
   */
  banUser: async (userId) => {
    return await apiClient.patch(`/api/users/${userId}/ban`);
  },

  /**
   * Unban user (ADMIN only)
   * @param {number} userId
   * @returns {Promise<Object>} UserResponse
   */
  unbanUser: async (userId) => {
    return await apiClient.patch(`/api/users/${userId}/unban`);
  },

  /**
   * Get pending users waiting for approval (ADMIN only)
   * @param {Object} params - { page, size }
   * @returns {Promise<Object>} Page<UserResponse>
   */
  getPendingUsers: async ({ page = 0, size = 20 } = {}) => {
    return await apiClient.get(`/api/users/pending?page=${page}&size=${size}`);
  },

  /**
   * Approve pending user (ADMIN only)
   * @param {number} userId
   * @returns {Promise<Object>} UserResponse
   */
  approveUser: async (userId) => {
    return await apiClient.patch(`/api/users/${userId}/approve`);
  },

  /**
   * Reject pending user (ADMIN only)
   * @param {number} userId
   * @param {string} reason - Optional rejection reason
   * @returns {Promise<Object>} UserResponse
   */
  rejectUser: async (userId, reason = "") => {
    return await apiClient.patch(
      `/api/users/${userId}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
    );
  },

  /**
   * Suspend user (ADMIN only)
   * @param {number} userId
   * @returns {Promise<Object>} UserResponse
   */
  suspendUser: async (userId) => {
    return await apiClient.patch(`/api/users/${userId}/suspend`);
  },

  /**
   * Activate user (ADMIN only)
   * @param {number} userId
   * @returns {Promise<Object>} UserResponse
   */
  activateUser: async (userId) => {
    return await apiClient.patch(`/api/users/${userId}/activate`);
  },

  /**
   * Delete user (ADMIN only)
   * @param {number} userId
   * @returns {Promise<string>} Success message
   */
  deleteUser: async (userId) => {
    return await apiClient.delete(`/api/users/${userId}`);
  },
};
