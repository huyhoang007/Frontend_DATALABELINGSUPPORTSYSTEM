/**
 * Label API Module
 * Endpoints match backend LabelController
 */

import apiClient from "./apiClient";

export const labelApi = {
    /**
     * Get all labels
     * @returns {Promise<Array>} Label[]
     */
    getAllLabels: async () => {
        return await apiClient.get("/api/labels");
    },

    /**
     * Get active labels only
     * @returns {Promise<Array>} Label[]
     */
    getActiveLabels: async () => {
        return await apiClient.get("/api/labels/active");
    },

    /**
     * Get label by ID
     * @param {number} labelId
     * @returns {Promise<Object>} Label
     */
    getLabelById: async (labelId) => {
        return await apiClient.get(`/api/labels/${labelId}`);
    },

    /**
     * Create new label
     * @param {Object} payload - { labelName, colorCode, labelType, description?, shortcutKey? }
     * @returns {Promise<Object>} Label object
     */
    createLabel: async (payload) => {
        return await apiClient.post("/api/labels", payload);
    },

    /**
     * Update label
     * @param {number} labelId
     * @param {Object} payload - { labelName, colorCode, labelType, description?, shortcutKey? }
     * @returns {Promise<Object>} Updated label
     */
    updateLabel: async (labelId, payload) => {
        return await apiClient.put(`/api/labels/${labelId}`, payload);
    },

    /**
     * Delete label (soft delete)
     * @param {number} labelId
     * @returns {Promise<void>}
     */
    deleteLabel: async (labelId) => {
        return await apiClient.delete(`/api/labels/${labelId}`);
    },

    /**
     * Get labels by project (legacy - may need backend update)
     * @param {number} projectId
     * @returns {Promise<Array>} Label[]
     */
    getLabelsByProject: async (projectId) => {
        return await apiClient.get(`/api/labels?projectId=${projectId}`);
    },
};
