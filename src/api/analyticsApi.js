/**
 * Analytics API Module
 * Endpoints for project analytics and monitoring
 */

import apiClient from "./apiClient";

export const analyticsApi = {
    /**
     * Get comprehensive analytics summary for a project
     * GET /api/analytics/projects/{projectId}/summary
     * @param {number} projectId
     * @returns {Promise<Object>} ProjectAnalyticsSummaryResponse
     */
    getProjectSummary: (projectId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/summary`),

    /**
     * Get project progress
     * GET /api/analytics/projects/{projectId}/progress
     * @param {number} projectId
     * @returns {Promise<Object>} ProjectProgressResponse
     */
    getProjectProgress: (projectId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/progress`),

    /**
     * Get quality metrics
     * GET /api/analytics/projects/{projectId}/quality
     * @param {number} projectId
     * @returns {Promise<Object>} QualityMetricsResponse
     */
    getQualityMetrics: (projectId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/quality`),

    /**
     * Get team contributions
     * GET /api/analytics/projects/{projectId}/contributions
     * @param {number} projectId
     * @returns {Promise<Object>} ContributionResponse[]
     */
    getTeamContributions: (projectId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/contributions`),

    /**
     * Get component quality
     * GET /api/analytics/projects/{projectId}/components
     * @param {number} projectId
     * @returns {Promise<Object>} ComponentQualityResponse[]
     */
    getComponentQuality: (projectId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/components`),

    /**
     * Get member scores in a project
     * GET /api/analytics/projects/{projectId}/member-scores
     * @param {number} projectId
     * @returns {Promise<Object[]>} MemberScoreResponse[]
     */
    getMemberScores: (projectId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/member-scores`),

    /**
     * Get violations for a project
     * GET /api/analytics/projects/{projectId}/violations
     * @param {number} projectId
     * @returns {Promise<Object[]>} ViolationResponse[]
     */
    getProjectViolations: (projectId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/violations`),

    /**
     * Get violation details
     * GET /api/analytics/projects/{projectId}/violations/{violationId}
     * @param {number} projectId
     * @param {number} violationId
     * @returns {Promise<Object>} ViolationResponse
     */
    getViolationDetails: (projectId, violationId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/violations/${violationId}`),

    /**
     * Get violation summary for a project
     * GET /api/analytics/projects/{projectId}/violations/summary
     * @param {number} projectId
     * @returns {Promise<Object>} ViolationSummaryResponse
     */
    getViolationSummary: (projectId) =>
        apiClient.get(`/api/analytics/projects/${projectId}/violations/summary`),
};

export default analyticsApi;
