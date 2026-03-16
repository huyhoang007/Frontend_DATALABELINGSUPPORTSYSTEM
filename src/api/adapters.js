/**
 * DTO Adapters for BE1 Integration
 * Maps between FE models and BE1 DTOs
 */

/**
 * Normalize role string from BE1
 * BE1 returns: ADMIN, MANAGER, ANNOTATOR, REVIEWER
 * @param {string} role - Role from BE1
 * @returns {string} Normalized role
 */
export const normalizeRole = (role) => {
    if (!role) return null;

    // Remove ROLE_ prefix if present (some backends use ROLE_ADMIN format)
    const normalized = role.replace(/^ROLE_/i, '').toUpperCase();

    // Validate against known roles
    const validRoles = ['ADMIN', 'MANAGER', 'ANNOTATOR', 'REVIEWER'];
    return validRoles.includes(normalized) ? normalized : role;
};

/**
 * Role ID mapping for user creation
 * BE1 expects: 1=ADMIN, 2=MANAGER, 3=ANNOTATOR, 4=REVIEWER
 */
export const ROLE_ID_MAP = {
    ADMIN: 1,
    MANAGER: 2,
    ANNOTATOR: 3,
    REVIEWER: 4,
};

/**
 * Get roleId from role name
 * @param {string} roleName 
 * @returns {number} roleId
 */
export const getRoleId = (roleName) => {
    return ROLE_ID_MAP[normalizeRole(roleName)] || 3; // Default to ANNOTATOR
};

// ============================================
// POLICY ADAPTERS
// ============================================

/**
 * Adapt Spring Page response to FE format
 * BE1 returns: { content, totalElements, totalPages, size, number, ... }
 * FE expects: { data, meta: { page, limit, total, totalPages } }
 * @param {Object} springPage - Spring Page object
 * @returns {Object} FE formatted response
 */
export const adaptPolicyListResponse = (springPage) => {
    if (!springPage) return { data: [], meta: { page: 0, limit: 20, total: 0, totalPages: 0 } };

    const rawList = springPage.content || [];
    return {
        data: rawList.map((item) => fromPolicyDto(item)),
        meta: {
            page: springPage.number || 0,
            limit: springPage.size || 20,
            total: springPage.totalElements || 0,
            totalPages: springPage.totalPages || 0,
        }
    };
};

/**
 * Map FE policy form to BE1 CreatePolicyRequest
 * BE1 expects: { errorName, description, errorLevel }
 * @param {Object} formData - FE form data
 * @returns {Object} BE1 DTO
 */
export const toCreatePolicyRequest = (formData) => {
    return {
        errorName: formData.errorName || formData.name,
        description: formData.description || '',
        errorLevel: formData.errorLevel || 'MEDIUM',
    };
};

/**
 * Map BE1 PolicyResponse to FE model
 * @param {Object} dto - BE1 PolicyResponse
 * @returns {Object} FE Policy model
 */
export const fromPolicyDto = (dto) => {
    return {
        id: dto.policyId,
        policyId: dto.policyId,
        name: dto.errorName,
        errorName: dto.errorName,
        description: dto.description,
        errorLevel: dto.errorLevel,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        // Giữ lại projects nếu backend trả về
        projects: dto.projects || [],
    };
};

// ============================================
// USER ADAPTERS
// ============================================

/**
 * Map FE create user form to BE1 CreateUserRequest
 * BE1 expects: { username, email, password, fullName, roleId }
 * @param {Object} formData - FE form data
 * @returns {Object} BE1 DTO
 */
export const toCreateUserRequest = (formData) => {
    return {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName || formData.name || formData.username,
        roleId: formData.roleId || getRoleId(formData.role),
    };
};

/**
 * Map BE1 UserResponse to FE model
 * @param {Object} dto - BE1 UserResponse
 * @returns {Object} FE User model
 */
export const fromUserDto = (dto) => {
    return {
        id: dto.userId,
        username: dto.username,
        email: dto.email,
        fullName: dto.fullName,
        status: dto.status,
        role: normalizeRole(dto.roleName),
        createdAt: dto.createdAt,
    };
};

// ============================================
// PROJECT ADAPTERS
// ============================================

/**
 * Map FE create project form to BE1 CreateProjectRequest
 * BE1 expects: { name, dataType, description? }
 * @param {Object} formData - FE form data
 * @returns {Object} BE1 DTO
 */
export const toCreateProjectRequest = (formData) => {
    return {
        name: formData.name,
        dataType: formData.dataType || 'IMAGE',
        description: formData.description || '',
    };
};

/**
 * Map BE1 ProjectResponse to FE model
 * @param {Object} dto - BE1 ProjectResponse
 * @returns {Object} FE Project model
 */
export const fromProjectDto = (dto) => {
    return {
        id: dto.projectId,
        name: dto.name,
        dataType: dto.dataType,
        status: dto.status,
        description: dto.description,
        managerName: dto.managerName,
        managerId: dto.managerId,
        createdAt: dto.createdAt,
    };
};

// ============================================
// LABEL ADAPTERS
// ============================================

/**
 * Map FE create label form to BE1 CreateLabelRequest
 * BE1 expects: { labelName, colorCode, labelType, description?, shortcutKey? }
 * @param {Object} formData - FE form data
 * @returns {Object} BE1 DTO
 */
export const toCreateLabelRequest = (formData) => {
    return {
        labelName: formData.labelName || formData.name,
        colorCode: formData.colorCode || formData.color || '#3B82F6',
        labelType: formData.labelType || formData.type || 'CLASSIFICATION',
        description: formData.description || '',
        shortcutKey: formData.shortcutKey || formData.hotkey || null,
    };
};

/**
 * Map BE1 LabelResponse to FE model
 * @param {Object} dto - BE1 LabelResponse
 * @returns {Object} FE Label model
 */
export const fromLabelDto = (dto) => {
    return {
        id: dto.labelId,
        name: dto.labelName,
        color: dto.colorCode,
        type: dto.labelType,
        description: dto.description,
        shortcutKey: dto.shortcutKey,
        isActive: dto.isActive,
    };
};
