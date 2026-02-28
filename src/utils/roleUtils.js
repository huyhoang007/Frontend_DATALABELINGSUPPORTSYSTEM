/**
 * Normalize role string to consistent format
 * Strips "ROLE_" prefix and converts to uppercase
 * 
 * @param {string} role - Raw role string from backend or storage
 * @returns {string} Normalized role (e.g., "ADMIN", "MANAGER")
 * 
 * Examples:
 * - "ROLE_ADMIN" -> "ADMIN"
 * - "admin" -> "ADMIN"
 * - "Manager" -> "MANAGER"
 */
export function normalizeRole(role) {
    if (!role || typeof role !== 'string') {
        return '';
    }

    // Remove "ROLE_" prefix if present
    let normalized = role.replace(/^ROLE_/i, '');

    // Convert to uppercase
    normalized = normalized.toUpperCase();

    return normalized;
}

/**
 * Get role-based redirect path
 * @param {string} role - User role (will be normalized)
 * @returns {string} Redirect path
 */
export function getRoleBasedRedirect(role) {
    const normalizedRole = normalizeRole(role);

    const roleRoutes = {
        ANNOTATOR: "/annotator/tasks",
        REVIEWER: "/reviewer/queue",
        MANAGER: "/manager/dashboard",
        ADMIN: "/admin/dashboard",
    };

    return roleRoutes[normalizedRole] || "/login";
}
