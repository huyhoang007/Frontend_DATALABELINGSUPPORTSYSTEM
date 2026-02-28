/**
 * Assignment API Module
 * Endpoints: POST/GET /api/projects/{projectId}/assignments, DELETE /api/assignments/{id}
 */

import apiClient from "./apiClient";

export const assignmentApi = {
    /**
     * Create assignment (Manager only)
     * POST /api/projects/{projectId}/assignments
     * @param {number} projectId
     * @param {{ datasetId: number, annotatorId: number, reviewerId: number }} payload
     * @returns {Promise<AssignmentResponse>}
     */
    createAssignment: (projectId, payload) =>
        apiClient.post(`/api/projects/${projectId}/assignments`, payload),

    /**
     * List assignments for a project (Manager only)
     * GET /api/projects/{projectId}/assignments
     * @param {number} projectId
     * @returns {Promise<AssignmentResponse[]>}
     */
    getAssignmentsByProject: (projectId) =>
        apiClient.get(`/api/projects/${projectId}/assignments`),

    /**
     * Delete assignment (only PENDING, Manager only)
     * DELETE /api/assignments/{assignmentId}
     * @param {number} assignmentId
     * @returns {Promise<void>}
     */
    deleteAssignment: (assignmentId) =>
        apiClient.delete(`/api/assignments/${assignmentId}`),
};

export default assignmentApi;
