import apiClient from "./apiClient";

/**
 * Annotation / Workspace API for Annotator role
 * Based on AnnotationController.java endpoints
 */
export const annotationApi = {
    /**
     * GET /api/my-assignments
     * Annotator xem danh sách task được giao
     * @returns {Promise<AnnotatorAssignmentResponse[]>}
     *   { assignmentId, projectName, datasetName, dataType, status, progress, completedAt, annotatorName, reviewerName }
     */
    getMyAssignments: () => apiClient.get("/api/my-assignments"),

    /**
     * GET /api/assignments/{assignmentId}/workspace
     * Mở workspace gán nhãn
     * @returns {Promise<AnnotationWorkspaceResponse>}
     *   { assignmentId, projectName, dataType, items[], labelGroups[], labelGuideUrls[], progress, assignmentStatus }
     *   items[]: { itemId, fileUrl, fileName, fileType, width, height, isActive, annotations[] }
     *   annotations[]: { reviewingId, itemId, labelId, labelName, colorCode, labelType, geometry, status, isImproved }
     */
    openWorkspace: (assignmentId) =>
        apiClient.get(`/api/assignments/${assignmentId}/workspace`),

    /**
     * GET /api/assignments/{assignmentId}/items/{itemId}/annotations
     * Lấy annotations theo item
     * @returns {Promise<AnnotationResponse[]>}
     */
    getAnnotationsByItem: (assignmentId, itemId) =>
        apiClient.get(`/api/assignments/${assignmentId}/items/${itemId}/annotations`),

    /**
     * POST /api/assignments/{assignmentId}/annotations
     * Lưu annotations cho 1 ảnh
     * @param {Object} request - BatchSaveAnnotationRequest
     * @returns {Promise<AnnotationResponse[]>}
     */
    saveAnnotations: (assignmentId, request) =>
        apiClient.post(`/api/assignments/${assignmentId}/annotations`, request),

    /**
     * PUT /api/assignments/{assignmentId}/annotations/fix
     * Sửa annotations sau khi reviewer reject
     * @param {Object} request - BatchSaveAnnotationRequest
     * @returns {Promise<AnnotationResponse[]>}
     */
    fixRejectedAnnotations: (assignmentId, request) =>
        apiClient.put(`/api/assignments/${assignmentId}/annotations/fix`, request),

    /**
     * POST /api/assignments/{assignmentId}/submit
     * Nộp assignment để reviewer đánh giá
     */
    submitAssignment: (assignmentId) =>
        apiClient.post(`/api/assignments/${assignmentId}/submit`),
};

export default annotationApi;
