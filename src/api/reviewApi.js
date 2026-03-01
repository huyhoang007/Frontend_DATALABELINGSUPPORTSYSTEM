/**
 * Review API Module
 * Wrappers for Reviewer-specific endpoints (AnnotationController.java)
 */

import apiClient from "./apiClient";

const reviewApi = {
    /**
     * Get list of assignments assigned to the current reviewer.
     * BE: GET /api/my-review-assignments
     * @returns {Promise<AnnotatorAssignmentResponse[]>}
     */
    getMyReviewAssignments: async () => {
        const res = await apiClient.get("/api/my-review-assignments");
        return res.data ?? res;
    },

    /**
     * Open review workspace for a specific assignment.
     * BE: GET /api/assignments/{assignmentId}/review-workspace
     * Pre-condition: assignment status SUBMITTED or REJECTED
     * @param {number} assignmentId
     * @returns {Promise<AnnotationWorkspaceResponse>}
     */
    openReviewWorkspace: async (assignmentId) => {
        const res = await apiClient.get(`/api/assignments/${assignmentId}/review-workspace`);
        return res.data ?? res;
    },

    /**
     * Get annotations for a specific item in an assignment (lazy-load / refresh).
     * BE: GET /api/assignments/{assignmentId}/items/{itemId}/review-annotations
     * @param {number} assignmentId
     * @param {number} itemId
     * @returns {Promise<AnnotationResponse[]>}
     */
    getReviewAnnotationsByItem: async (assignmentId, itemId) => {
        const res = await apiClient.get(
            `/api/assignments/${assignmentId}/items/${itemId}/review-annotations`
        );
        return res.data ?? res;
    },

    /**
     * Review a single annotation (approve or reject).
     * BE: POST /api/annotations/{reviewingId}/review
     * @param {number} reviewingId
     * @param {{ hasError: boolean, policyId?: number }} payload
     * @returns {Promise<AnnotationResponse>}
     */
    reviewAnnotation: async (reviewingId, { hasError, policyId }) => {
        const body = { hasError };
        if (hasError && policyId != null) {
            body.policyId = policyId;
        }
        const res = await apiClient.post(`/api/annotations/${reviewingId}/review`, body);
        return res.data ?? res;
    },
};

export default reviewApi;
