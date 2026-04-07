import i18n from "./index";

export function translate(key, options = {}) {
  return i18n.t(key, options);
}

export function translateError(key, fallback) {
  if (i18n.exists(key)) return i18n.t(key);
  return fallback ?? key;
}

const PROJECT_STATUS_KEYS = {
  DRAFT: "status:project.draft",
  IN_PROGRESS: "status:project.in_progress",
  PAUSED: "status:project.paused",
  COMPLETED: "status:project.completed",
  INACTIVE: "status:project.inactive",
};

const ASSIGNMENT_STATUS_KEYS = {
  PENDING: "status:assignment.pending",
  DRAFT: "status:assignment.draft",
  IN_PROGRESS: "status:assignment.in_progress",
  SUBMITTED: "status:assignment.submitted",
  RE_SUBMITTED: "status:assignment.re_submitted",
  APPROVED: "status:assignment.approved",
  REJECTED: "status:assignment.rejected",
  COMPLETED: "status:assignment.completed",
};

const REVIEW_STATUS_KEYS = {
  PENDING: "status:review.pending",
  APPROVED: "status:review.approved",
  REJECTED: "status:review.rejected",
};

const ROLE_KEYS = {
  ADMIN: "role:admin",
  MANAGER: "role:manager",
  ANNOTATOR: "role:annotator",
  REVIEWER: "role:reviewer",
};

const DATA_TYPE_KEYS = {
  IMAGE: "common:dataType.image",
  TEXT: "common:dataType.text",
  VIDEO: "common:dataType.video",
  AUDIO: "common:dataType.audio",
};

const ADMIN_LOG_ACTION_KEYS = {
  LOGIN: "admin:logs.actions.login",
  CREATE: "admin:logs.actions.create",
  UPDATE: "admin:logs.actions.update",
  DELETE: "admin:logs.actions.delete",
  VIEW: "admin:logs.actions.view",
  APPROVE: "admin:logs.actions.approve",
  REJECT: "admin:logs.actions.reject",
  BAN: "admin:logs.actions.ban",
  UNBAN: "admin:logs.actions.unban",
};

const ADMIN_LOG_TARGET_KEYS = {
  ASSIGNMENT: "admin:logs.targets.assignment",
  DATASET: "admin:logs.targets.dataset",
  PROJECT: "admin:logs.targets.project",
  POLICY: "admin:logs.targets.policy",
  USER: "admin:logs.targets.user",
  LABEL: "admin:logs.targets.label",
  LABEL_RULE: "admin:logs.targets.labelRule",
  LABELRULE: "admin:logs.targets.labelRule",
  REVIEW: "admin:logs.targets.review",
  ROLE: "admin:logs.targets.role",
  AUTH: "admin:logs.targets.auth",
};

const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

const lowerFirstCharacter = (value) => {
  if (!value) return value;
  return value.toLocaleLowerCase();
};

export function getProjectStatusKey(value) {
  return PROJECT_STATUS_KEYS[normalizeValue(value)] || "status:project.unknown";
}

export function getAssignmentStatusKey(value) {
  return ASSIGNMENT_STATUS_KEYS[normalizeValue(value)] || "status:assignment.unknown";
}

export function getReviewStatusKey(value) {
  return REVIEW_STATUS_KEYS[normalizeValue(value)] || "status:review.unknown";
}

export function getRoleKey(value) {
  return ROLE_KEYS[normalizeValue(value)] || "role:unknown";
}

export function getDataTypeKey(value) {
  return DATA_TYPE_KEYS[normalizeValue(value)] || "common:dataType.unknown";
}

export function getAdminLogActionKey(value) {
  return ADMIN_LOG_ACTION_KEYS[normalizeValue(value)] || null;
}

export function getAdminLogTargetKey(value) {
  return ADMIN_LOG_TARGET_KEYS[normalizeValue(value)] || null;
}

export function translateProjectStatus(value, options) {
  return translate(getProjectStatusKey(value), options);
}

export function translateAssignmentStatus(value, options) {
  return translate(getAssignmentStatusKey(value), options);
}

export function translateReviewStatus(value, options) {
  return translate(getReviewStatusKey(value), options);
}

export function translateRole(value, options) {
  return translate(getRoleKey(value), options);
}

export function translateDataType(value, options) {
  return translate(getDataTypeKey(value), options);
}

export function translateAdminLogAction(value, options) {
  const key = getAdminLogActionKey(value);
  return key
    ? translate(key, options)
    : translate("admin:logs.unknownAction", {
        defaultValue: value || "-",
        ...options,
      });
}

export function translateAdminLogTarget(value, options) {
  const key = getAdminLogTargetKey(value);
  return key
    ? translate(key, options)
    : translate("admin:logs.unknownTarget", {
        defaultValue: value || "-",
        ...options,
      });
}

export function translateAdminLogTargetNoun(value, options) {
  return lowerFirstCharacter(translateAdminLogTarget(value, options));
}

export function translateLabelType(value, options) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return translate("common:labels.unknown", options);
  }
  return translate(`manager:labels.types.${normalized}`, {
    defaultValue: value,
    ...options,
  });
}

export function translateAdminLogDetails(log, options) {
  const details = String(log?.details || log?.description || "").trim();
  if (!details) return "-";

  const rawTarget = log?.target || log?.targetType || "";
  let match =
    details.match(
      /^Tạo dự án '(.+?)' \(ID:\s*(\d+)\) có loại dữ liệu:\s*([A-Z_]+), trạng thái:\s*([A-Z_]+), mô tả:\s*'([\s\S]+)'$/i,
    ) ||
    details.match(
      /^Create project '(.+?)' \(ID:\s*(\d+)\) with data type:\s*([A-Z_]+), status:\s*([A-Z_]+), description:\s*'([\s\S]+)'$/i,
    );

  if (match) {
    const [, name, id, dataType, status, description] = match;
    return translate("admin:logs.detailTemplates.createProjectWithMeta", {
      name,
      id,
      dataType: translateDataType(dataType, options),
      status: translateProjectStatus(status, options),
      description,
      ...options,
    });
  }

  match =
    details.match(
      /^Cập nhật dự án '(.+?)' \(ID:\s*(\d+)\) - Trạng thái hiện tại:\s*([A-Z_]+), loại dữ liệu:\s*([A-Z_]+)$/i,
    ) ||
    details.match(
      /^Updated project '(.+?)' \(ID:\s*(\d+)\) - Current status:\s*([A-Z_]+), data type:\s*([A-Z_]+)$/i,
    );

  if (match) {
    const [, name, id, status, dataType] = match;
    return translate("admin:logs.detailTemplates.updateProjectWithMeta", {
      name,
      id,
      status: translateProjectStatus(status, options),
      dataType: translateDataType(dataType, options),
      ...options,
    });
  }

  match =
    details.match(
      /^Tạo nhãn '(.+?)' \(ID:\s*(\d+)\) có loại:\s*([A-Z_]+), màu:\s*(#[0-9A-Fa-f]{6})$/i,
    ) ||
    details.match(
      /^Created label '(.+?)' \(ID:\s*(\d+)\) with type:\s*([A-Z_]+), color:\s*(#[0-9A-Fa-f]{6})$/i,
    );

  if (match) {
    const [, name, id, type, color] = match;
    return translate("admin:logs.detailTemplates.createLabelWithMeta", {
      name,
      id,
      type: translateLabelType(type, options),
      color,
      ...options,
    });
  }

  match =
    details.match(/^Đã xo[áa]\s+([A-Za-z_]+)\s+có ID:\s*(\d+)$/i) ||
    details.match(/^Deleted\s+([A-Za-z_]+)\s+with ID:\s*(\d+)$/i);

  if (match) {
    const [, targetValue, id] = match;
    return translate("admin:logs.detailTemplates.deleteTargetWithId", {
      target: translateAdminLogTargetNoun(rawTarget || targetValue, options),
      id,
      ...options,
    });
  }

  match =
    details.match(/^Cập nhật\s+([A-Za-z_]+)\s+với ID:\s*(\d+)$/i) ||
    details.match(/^Update(?:d)?\s+([A-Za-z_]+)\s+with ID:\s*(\d+)$/i);

  if (match) {
    const [, targetValue, id] = match;
    return translate("admin:logs.detailTemplates.updateTargetWithId", {
      target: translateAdminLogTargetNoun(rawTarget || targetValue, options),
      id,
      ...options,
    });
  }

  match =
    details.match(/^Tạo\s+([A-Za-z_]+)$/i) ||
    details.match(/^Create(?:d)?\s+([A-Za-z_]+)$/i);

  if (match) {
    const [, targetValue] = match;
    return translate("admin:logs.detailTemplates.createTarget", {
      target: translateAdminLogTargetNoun(rawTarget || targetValue, options),
      ...options,
    });
  }

  return details;
}
