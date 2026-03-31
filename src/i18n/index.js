import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import commonVi from "./locales/vi/common";
import authVi from "./locales/vi/auth";
import managerVi from "./locales/vi/manager";
import annotatorVi from "./locales/vi/annotator";
import reviewerVi from "./locales/vi/reviewer";
import adminVi from "./locales/vi/admin";
import statusVi from "./locales/vi/status";
import roleVi from "./locales/vi/role";
import commonEn from "./locales/en/common";
import authEn from "./locales/en/auth";
import managerEn from "./locales/en/manager";
import annotatorEn from "./locales/en/annotator";
import reviewerEn from "./locales/en/reviewer";
import adminEn from "./locales/en/admin";
import statusEn from "./locales/en/status";
import roleEn from "./locales/en/role";

export const LANGUAGE_STORAGE_KEY = "app_language";

const resources = {
  vi: {
    common: commonVi,
    auth: authVi,
    manager: managerVi,
    annotator: annotatorVi,
    reviewer: reviewerVi,
    admin: adminVi,
    status: statusVi,
    role: roleVi,
  },
  en: {
    common: commonEn,
    auth: authEn,
    manager: managerEn,
    annotator: annotatorEn,
    reviewer: reviewerEn,
    admin: adminEn,
    status: statusEn,
    role: roleEn,
  },
};

const detectLanguage = () => {
  if (typeof window === "undefined") return "vi";
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" ? "en" : "vi";
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: "vi",
    defaultNS: "common",
    ns: [
      "common",
      "auth",
      "manager",
      "annotator",
      "reviewer",
      "admin",
      "status",
      "role",
    ],
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
