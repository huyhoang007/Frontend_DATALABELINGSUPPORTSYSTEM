/**
 * Project Data Types
 * Based on Backend DTOs: CreateProjectRequest, ProjectResponse
 */

/**
 * @typedef {Object} CreateProjectRequest
 * @property {string} name
 * @property {string} dataType - "IMAGE" | "VIDEO" | "TEXT" | "AUDIO"
 * @property {string} [description] - Optional
 */

/**
 * @typedef {Object} ProjectResponse
 * @property {number} projectId
 * @property {string} name
 * @property {string} dataType
 * @property {string} status
 * @property {string} description
 * @property {string} managerName
 * @property {number} managerId
 * @property {string} createdAt - ISO 8601 format
 */

export { };
