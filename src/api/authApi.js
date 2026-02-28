/**
 * Auth API Module
 * Endpoints: POST /api/auth/login, POST /api/auth/register
 */

import apiClient from "./apiClient";

export const authApi = {
  /**
   * Login user
   * @param {Object} payload - { username, password }
   * @returns {Promise<Object>} AuthResponse - { accessToken, tokenType, username, role }
   */
  login: async (payload) => {
    return await apiClient.post("/api/auth/login", payload);
  },

  /**
   * Register new user (self-registration)
   * Backend expects: { username, email, password, fullName }
   * Backend auto-assigns: role = ANNOTATOR, status = PENDING
   * @param {Object} payload - { username, email, password, fullName }
   * @returns {Promise<Object>} UserResponse
   */
  register: async (payload) => {
    const { username, email, password, fullName } = payload;
    return await apiClient.post("/api/auth/register", {
      username,
      email,
      password,
      fullName,
    });
  },
};
