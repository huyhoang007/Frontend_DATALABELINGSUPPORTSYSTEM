/**
 * Dataset API Module
 * Endpoints match backend DatasetController
 * Uses multipart/form-data for upload endpoints
 */

import apiClient from "./apiClient";

export const datasetApi = {
    /**
     * Create a new dataset (batch) under a project
     * @param {number} projectId
     * @param {string} batchName
     * @param {File[]} files
     * @returns {Promise<Object>} DatasetResponse
     */
    /**
     * Create a new dataset (batch) under a project
     * BE contract: POST /api/projects/{projectId}/datasets (multipart/form-data)
     *   - @RequestParam("batch_name") String batchName
     *   - @RequestPart("files") List<MultipartFile> files
     * Response: DatasetResponse { datasetId, name, status, createdAt, projectId, totalItems }
     * Limits: max-file-size=10MB, max-request-size=100MB
     *
     * @param {number} projectId
     * @param {string} batchName
     * @param {File[]} files
     * @param {function} [onProgress] - optional (event) => void for upload progress
     * @returns {Promise<Object>} DatasetResponse
     */
    createDataset: async (projectId, batchName, files, onProgress) => {
        const formData = new FormData();
        formData.append("batch_name", batchName);
        files.forEach((file) => {
            formData.append("files", file);
        });
        return await apiClient.post(
            `/api/projects/${projectId}/datasets`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
                ...(onProgress ? { onUploadProgress: onProgress } : {}),
            }
        );
    },

    /**
     * Get all datasets for a project
     * @param {number} projectId
     * @returns {Promise<Array>} DatasetResponse[]
     */
    getDatasetsByProject: async (projectId) => {
        return await apiClient.get(`/api/projects/${projectId}/datasets`);
    },

    /**
     * Get all active items in a dataset
     * @param {number} datasetId
     * @returns {Promise<Array>} DataItemResponse[]
     */
    getDatasetItems: async (datasetId) => {
        return await apiClient.get(`/api/datasets/${datasetId}/items`);
    },

    /**
     * Add more files to an existing dataset
     * @param {number} datasetId
     * @param {File[]} files
     * @returns {Promise<Object>} DatasetResponse
     */
    addItemsToDataset: async (datasetId, files) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });
        return await apiClient.post(
            `/api/datasets/${datasetId}/items`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    },

    /**
     * Soft delete a data item
     * @param {number} itemId
     * @returns {Promise<void>}
     */
    deleteItem: async (itemId) => {
        return await apiClient.delete(`/api/items/${itemId}`);
    },

    /**
     * Delete an entire dataset
     * @param {number} datasetId
     * @returns {Promise<void>}
     */
    deleteDataset: async (datasetId) => {
        return await apiClient.delete(`/api/datasets/${datasetId}`);
    },

    // ─── Export ───────────────────────────────────────────────────────────────

    /**
     * Export dataset as custom JSON (all annotation details).
     * Returns the parsed JSON object.
     */
    exportJson: async (datasetId, status = null) => {
        const params = status ? { status } : {};
        return await apiClient.get(`/api/datasets/${datasetId}/export/json`, { params });
    },

    /**
     * Export dataset as CSV. Returns blob for download.
     */
    exportCsv: async (datasetId, status = null) => {
        const params = status ? { status } : {};
        return await apiClient.get(`/api/datasets/${datasetId}/export/csv`, {
            params,
            responseType: "blob",
            transformResponse: [(d) => d],
        });
    },

    /**
     * Export dataset as COCO JSON. Returns blob for download.
     */
    exportCoco: async (datasetId, status = null) => {
        const params = status ? { status } : {};
        return await apiClient.get(`/api/datasets/${datasetId}/export/coco`, {
            params,
            responseType: "blob",
            transformResponse: [(d) => d],
        });
    },

    /**
     * Export dataset as YOLO ZIP (includes label txts + images). Returns blob.
     */
    exportYolo: async (datasetId, status = null) => {
        const params = status ? { status } : {};
        return await apiClient.get(`/api/datasets/${datasetId}/export/yolo`, {
            params,
            responseType: "blob",
            transformResponse: [(d) => d],
        });
    },

    /**
     * Export dataset as Pascal VOC ZIP (includes XML annotations + images). Returns blob.
     */
    exportPascalVoc: async (datasetId, status = null) => {
        const params = status ? { status } : {};
        return await apiClient.get(`/api/datasets/${datasetId}/export/pascal-voc`, {
            params,
            responseType: "blob",
            transformResponse: [(d) => d],
        });
    },
};


