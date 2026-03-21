/**
 * Project API Module
 * Endpoints: POST /api/projects, GET /api/projects/my-projects
 */

import apiClient from "./apiClient";

export const projectApi = {
    /**
     * Create new project
        * @param {Object} payload - { name, dataType, description, guidelineContent?, guidelineVersion? }
     * @returns {Promise<Object>} ProjectResponse
     */
    createProject: async (payload) => {
        return await apiClient.post("/api/projects", payload);
    },

    /**
     * Get my projects (for current manager)
     * @returns {Promise<Array>} ProjectResponse[]
     */
    getMyProjects: async () => {
        return await apiClient.get("/api/projects/my-projects");
    },

    /**
     * Get project by ID
     * @param {number} projectId
     * @returns {Promise<Object>} ProjectResponse
     */
    getProjectById: async (projectId) => {
        return await apiClient.get(`/api/projects/${projectId}`);
    },

    /**
     * Delete project
     * @param {number} projectId
     * @returns {Promise<void>}
     */
    deleteProject: async (projectId) => {
        return await apiClient.delete(`/api/projects/${projectId}`);
    },

    /**
     * Update project status
     * @param {number} projectId
     * @param {string} status - "DRAFT" | "IN_PROGRESS" | "PAUSED" | "COMPLETED"
     * @returns {Promise<Object>} ProjectResponse
     */
    updateProjectStatus: async (projectId, status) => {
        return await apiClient.patch(`/api/projects/${projectId}/status`, null, {
            params: { status },
        });
    },

    /**
     * Update project
     * @param {number} projectId
        * @param {Object} payload - { name, dataType, description, status, guidelineContent?, guidelineVersion? }
     * @returns {Promise<Object>} ProjectResponse
     */
    updateProject: async (projectId, payload) => {
        return await apiClient.put(`/api/projects/${projectId}`, payload);
    },
};
