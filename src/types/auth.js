/**
 * Auth Data Types
 * Based on Backend DTOs: LoginRequest, RegisterRequest, AuthResponse
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} username
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} accessToken - JWT token
 * @property {string} tokenType - "Bearer"
 * @property {string} username
 * @property {string} role - "MANAGER" | "ANNOTATOR" | "REVIEWER" | "ADMIN"
 */

export { };
