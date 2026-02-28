/**
 * Activity Log API Module
 * Matches backend ActivityLogController
 */

import apiClient from "./apiClient";

export const activityLogApi = {
    /**
     * Get all activity logs with pagination (ADMIN only)
     * @param {Object} params - { page, size }
     * @returns {Promise<Object>} Page<ActivityLogResponse>
     */
    getAllLogs: async ({ page = 0, size = 20 } = {}) => {
        return await apiClient.get(`/api/activity-logs?page=${page}&size=${size}`);
    },

    /**
     * Get logs by user ID (ADMIN only)
     * @param {number} userId
     * @param {Object} params - { page, size }
     * @returns {Promise<Object>} Page<ActivityLogResponse>
     */
    getLogsByUser: async (userId, { page = 0, size = 20 } = {}) => {
        return await apiClient.get(`/api/activity-logs/user/${userId}?page=${page}&size=${size}`);
    },

    /**
     * Get logs by action type (ADMIN only)
     * @param {string} action - Action type
     * @param {Object} params - { page, size }
     * @returns {Promise<Object>} Page<ActivityLogResponse>
     */
    getLogsByAction: async (action, { page = 0, size = 20 } = {}) => {
        return await apiClient.get(`/api/activity-logs/action/${action}?page=${page}&size=${size}`);
    },

    /**
     * Get logs by target (ADMIN only)
     * @param {string} target - Target type
     * @param {Object} params - { page, size }
     * @returns {Promise<Object>} Page<ActivityLogResponse>
     */
    getLogsByTarget: async (target, { page = 0, size = 20 } = {}) => {
        return await apiClient.get(`/api/activity-logs/target/${target}?page=${page}&size=${size}`);
    },

    /**
     * Get logs by date range (ADMIN only)
     * @param {string} startDate - ISO datetime
     * @param {string} endDate - ISO datetime
     * @returns {Promise<Array>} ActivityLogResponse[]
     */
    getLogsByDateRange: async (startDate, endDate) => {
        return await apiClient.get(`/api/activity-logs/date-range?startDate=${startDate}&endDate=${endDate}`);
    },
};
