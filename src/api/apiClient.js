/**
 * Shared API Client for Backend Integration
 * - Auto-attaches JWT token from localStorage
 * - Handles 401 errors (clear auth + redirect to login)
 * - Standardizes error responses
 */

import axios from "axios";

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/",
  headers: {
    "Content-Type": "application/json",
  },
});

const buildRequestUrl = (config) => {
  const baseURL = config?.baseURL || "";
  const url = config?.url || "";

  if (!baseURL) return url;

  if (baseURL.startsWith("http")) {
    return `${baseURL.replace(/\/$/, "")}${url}`;
  }

  return `${baseURL.replace(/\/$/, "")}${url}`;
};

// Request Interceptor: Auto-attach token
apiClient.interceptors.request.use(
  (config) => {
    // Guard: auto-strip duplicate /api prefix if baseURL already ends with /api
    if (
      config.baseURL &&
      config.baseURL.replace(/\/$/, "").endsWith("/api") &&
      config.url?.startsWith("/api/")
    ) {
      config.url = config.url.slice(4); // "/api/labels" → "/labels"
      if (import.meta.env.DEV) {
        console.warn(
          '[API] Double /api prefix detected — auto-stripped. Fix VITE_API_BASE_URL (should be "/" not "/api").',
        );
      }
    }

    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      const method = (config.method || "GET").toUpperCase();
      const requestUrl = buildRequestUrl(config);
      console.info("[API] Request", { method, url: requestUrl });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Session renewal constants (must match AuthContext.jsx)
const SESSION_KEY = "sessionExpiry";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 giờ

// Response Interceptor: Handle 401, 403 and standardize errors
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const requestUrl = buildRequestUrl(response.config);
      console.info("[API] Response", {
        url: requestUrl,
        status: response.status,
        data: response.data,
      });
    }

    // Renew session expiry on every successful API call
    if (localStorage.getItem(SESSION_KEY)) {
      localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_DURATION));
    }

    // Success response - return data directly
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Clear auth state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Redirect to login (only if not already on login page)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Handle 403 Forbidden
    if (error.response && error.response.status === 403) {
      // Show unauthorized message (could be replaced with toast library)
      console.warn(
        "[API] 403 Forbidden - Bạn không có quyền thực hiện hành động này",
      );
      // If you have a toast library, uncomment:
      // toast.error("Bạn không có quyền thực hiện hành động này");
    }

    // Extract error message - prioritize BE1 response message
    const extractErrorMessage = (err) => {
      // BE1 may return message directly or in data.message
      if (err.response?.data?.message) {
        return err.response.data.message;
      }
      // Check for validation errors
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        return Array.isArray(firstError) ? firstError[0] : firstError;
      }
      // Check for direct string response
      if (typeof err.response?.data === "string") {
        return err.response.data;
      }
      // Translate common HTTP error messages to Vietnamese
      const status = err.response?.status;
      if (status === 401) {
        return "Sai tên đăng nhập hoặc mật khẩu. Vui lòng đăng nhập lại.";
      }
      if (status === 403) {
        return "Bạn không có quyền thực hiện hành động này.";
      }
      if (status === 404) {
        return "Không tìm thấy tài nguyên yêu cầu.";
      }
      if (status === 500) {
        return "Lỗi máy chủ. Vui lòng thử lại sau.";
      }
      if (status === 503) {
        return "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.";
      }
      // Default fallback
      return err.message || "Đã xảy ra lỗi";
    };

    // Standardize error response
    const standardError = {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data || null,
    };

    if (import.meta.env.DEV) {
      const requestUrl = buildRequestUrl(error.config);
      console.error("[API] Error", {
        url: requestUrl,
        status: standardError.status,
        message: standardError.message,
        data: standardError.data,
      });
    }

    return Promise.reject(standardError);
  },
);

export default apiClient;
