/**
 * Label Rule API Module
 * Endpoints match backend LabelRuleController
 */

import apiClient from "./apiClient";

export const labelRuleApi = {
    /**
     * Get all label rules
     * @returns {Promise<Array>} LabelRuleResponse[]
     */
    getAllRules: async () => {
        return await apiClient.get("/api/label-rules");
    },

    /**
     * Get label rule by ID
     * @param {number} ruleId
     * @returns {Promise<Object>} LabelRuleResponse
     */
    getRuleById: async (ruleId) => {
        return await apiClient.get(`/api/label-rules/${ruleId}`);
    },

    /**
     * Create new label rule (with labels included)
     * @param {Object} payload - { name, ruleContent?, labelIds: number[] }
     * @returns {Promise<Object>} LabelRuleResponse
     */
    createRule: async (payload) => {
        return await apiClient.post("/api/label-rules", payload);
    },

    /**
     * Update label rule
     * @param {number} ruleId
     * @param {Object} payload - { name, ruleContent?, labelIds? }
     * @returns {Promise<Object>} LabelRuleResponse
     */
    updateRule: async (ruleId, payload) => {
        return await apiClient.put(`/api/label-rules/${ruleId}`, payload);
    },

    /**
     * Delete label rule
     * @param {number} ruleId
     * @returns {Promise<void>}
     */
    deleteRule: async (ruleId) => {
        return await apiClient.delete(`/api/label-rules/${ruleId}`);
    },

    /**
     * Attach labels to a rule (additive, does not remove existing)
     * @param {number} ruleId
     * @param {number[]} labelIds
     * @returns {Promise<void>}
     */
    attachLabels: async (ruleId, labelIds) => {
        return await apiClient.post(`/api/label-rules/${ruleId}/labels`, { labelIds });
    },

    /**
     * Replace all labels for a rule atomically
     * @param {number} ruleId
     * @param {number[]} labelIds
     * @returns {Promise<void>}
     */
    replaceLabels: async (ruleId, labelIds) => {
        return await apiClient.post(`/api/label-rules/${ruleId}/labels/bulk`, { labelIds });
    },
};
