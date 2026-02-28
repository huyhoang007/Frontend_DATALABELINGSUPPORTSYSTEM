/**
 * Policy API Module
 * BE1 Endpoint: /api/policies (PolicyController)
 * Allowed roles: MANAGER, REVIEWER (for read)
 */

import apiClient from "./apiClient";
import { adaptPolicyListResponse, toCreatePolicyRequest } from "./adapters";

export const policyApi = {
    /**
     * List policies with pagination
     * BE1 returns Spring Page<PolicyResponse>
     * @param {Object} params - { page, size }
     * @returns {Promise<Object>} { data: Policy[], meta: { page, limit, total, totalPages } }
     */
    list: async ({ page = 0, size = 20 } = {}) => {
        const response = await apiClient.get(`/api/policies?page=${page}&size=${size}`);
        return adaptPolicyListResponse(response);
    },

    /**
     * Get policy by ID
     * @param {number} policyId
     * @returns {Promise<Object>} PolicyResponse
     */
    getById: async (policyId) => {
        return await apiClient.get(`/api/policies/${policyId}`);
    },

    /**
     * Create new policy
     * BE1 expects: { errorName, description, errorLevel }
     * @param {Object} payload - { errorName, description, errorLevel }
     * @returns {Promise<Object>} PolicyResponse
     */
    create: async (payload) => {
        const dto = toCreatePolicyRequest(payload);
        return await apiClient.post("/api/policies", dto);
    },

    /**
     * Update existing policy
     * @param {number} policyId
     * @param {Object} payload - { errorName, description, errorLevel }
     * @returns {Promise<Object>} PolicyResponse
     */
    update: async (policyId, payload) => {
        const dto = toCreatePolicyRequest(payload);
        return await apiClient.put(`/api/policies/${policyId}`, dto);
    },

    /**
     * Delete policy
     * @param {number} policyId
     * @returns {Promise<string>} Success message
     */
    delete: async (policyId) => {
        return await apiClient.delete(`/api/policies/${policyId}`);
    },

    /**
     * Assign policy to project
     * @param {number} projectId
     * @param {number} policyId
     * @returns {Promise<string>} Success message
     */
    assignToProject: async (projectId, policyId) => {
        return await apiClient.post(`/api/policies/assign?projectId=${projectId}&policyId=${policyId}`);
    },

    /**
     * Get policies by project
     * @param {number} projectId
     * @returns {Promise<Array>} PolicyResponse[]
     */
    getByProject: async (projectId) => {
        return await apiClient.get(`/api/policies/project/${projectId}`);
    },

    /**
     * Get policies by error level
     * @param {string} errorLevel - LOW, MEDIUM, HIGH, CRITICAL
     * @param {Object} params - { page, size }
     * @returns {Promise<Object>} { data, meta }
     */
    getByErrorLevel: async (errorLevel, { page = 0, size = 20 } = {}) => {
        const response = await apiClient.get(`/api/policies/error-level/${errorLevel}?page=${page}&size=${size}`);
        return adaptPolicyListResponse(response);
    },
};
