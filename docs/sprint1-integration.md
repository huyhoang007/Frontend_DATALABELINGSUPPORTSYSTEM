# Sprint 1 Frontend-Backend Integration Summary

**Date:** 2026-01-27  
**Status:** ✅ Completed (with Backend dependencies noted)

---

## Overview

Integrated Frontend (React + Vite + TailwindCSS) with Backend (Spring Boot) for Sprint 1 features. All API modules created, authentication flow refactored, and existing screens (Policies, Activity Logs) now call real backend endpoints.

---

## Completed Features

### 1. ✅ Đăng nhập (Login)
- **Frontend Screen:** `src/pages/Login/Login.jsx`
- **API Module:** `src/api/authApi.js`
- **Backend Endpoint:** `POST /api/auth/login`
- **Request DTO:** `{ username, password }`
- **Response DTO:** `{ accessToken, tokenType, username, role }`
- **Status:** **READY** - Backend endpoint confirmed in `AuthController.java`

### 2. ✅ Thiết lập Policy
- **Frontend Screen:** `src/pages/Manager/Policies.jsx`
- **API Module:** `src/api/policyApi.js` (refactored from mock)
- **Backend Endpoints:**
  - `GET /api/policies?q=&status=`
  - `POST /api/policies`
  - `PUT /api/policies/:policyId`
  - `PATCH /api/policies/:policyId/status`
- **Status:** **NEEDS BACKEND** - PolicyController not found

### 3. ✅ Theo dõi nhật ký (Activity Logs)
- **Frontend Screen:** `src/pages/Manager/ActivityLogs.jsx`
- **API Module:** `src/api/activityLogApi.js` (refactored from mock)
- **Backend Endpoint:** `GET /api/activity-logs?page=&limit=&q=&action=`
- **Status:** **NEEDS BACKEND** - ActivityLogController not found

---

## API Modules Created

| Module | File | Status | Backend Status |
|--------|------|--------|----------------|
| Auth | `src/api/authApi.js` | ✅ Complete | ✅ Backend Ready |
| User | `src/api/userApi.js` | ✅ Complete | ⚠️ Backend Missing |
| Project | `src/api/projectApi.js` | ✅ Complete | ✅ Backend Ready |
| Label | `src/api/labelApi.js` | ✅ Complete | ⚠️ Backend Missing |
| Policy | `src/api/policyApi.js` | ✅ Complete | ⚠️ Backend Missing |
| Activity Log | `src/api/activityLogApi.js` | ✅ Complete | ⚠️ Backend Missing |

---

## Screen-to-API Mapping

| Screen | Route | API Calls | Auth Required | Backend Status |
|--------|-------|-----------|---------------|----------------|
| Login | `/login` | `POST /api/auth/login` | No | ✅ Ready |
| Policies | `/manager/policies` | `GET /api/policies`<br>`POST /api/policies`<br>`PUT /api/policies/:id`<br>`PATCH /api/policies/:id/status` | Yes (MANAGER) | ⚠️ Missing |
| Activity Logs | `/manager/activity-logs` | `GET /api/activity-logs` | Yes (MANAGER) | ⚠️ Missing |

---

## TODO_BACKEND Items

### Critical (Blocking Sprint 1 Testing)

1. **PolicyController** - Missing entirely
   - `GET /api/policies?q=&status=`
   - `POST /api/policies` - DTO: `{ errorName, description, errorLevel, status }`
   - `PUT /api/policies/:policyId`
   - `PATCH /api/policies/:policyId/status?status=`

2. **ActivityLogController** - Missing entirely
   - `GET /api/activity-logs?page=&limit=&q=&action=`
   - Response: `{ data: Log[], meta: { page, limit, total, totalPages } }`

### Non-Critical (No UI in Sprint 1)

3. **UserController** - Missing entirely
   - `GET /api/users?page=&limit=&search=`
   - `POST /api/users` - DTO: `{ username, email, password, role }`

4. **LabelController** - Missing entirely
   - `POST /api/labels` - DTO: `{ name, color, projectId }`
   - `GET /api/labels?projectId=`

5. **RegisterRequest** - Backend has endpoint but returns string instead of AuthResponse
   - Current: `POST /api/auth/register` → `"Register successfully"`
   - Suggested: Return `AuthResponse` to auto-login after registration

---

## Features Not Implemented (Missing UI)

These features are in Sprint 1 scope but have no UI screens:

1. **Đăng ký (Register)** - No register screen exists
2. **Tạo dự án (Create Project)** - No project creation form
3. **Tạo nhãn (Create Label)** - No label creation form
4. **Xem người dùng (View Users)** - No user list screen
5. **Tạo người dùng (Create User)** - No user creation form

**Recommendation:** Clarify Sprint 1 scope with team. If these are required, UI screens need to be created.

---

## Infrastructure Changes

### ✅ Created Files

- `src/api/apiClient.js` - Shared axios client with JWT auto-attach and 401 interceptor
- `src/api/authApi.js` - Auth endpoints
- `src/api/userApi.js` - User management endpoints (TODO_BACKEND)
- `src/api/projectApi.js` - Project management endpoints
- `src/api/labelApi.js` - Label management endpoints (TODO_BACKEND)
- `src/types/auth.js` - Auth DTOs
- `src/types/project.js` - Project DTOs
- `src/types/user.js` - User DTOs (TODO_BACKEND)
- `src/types/label.js` - Label DTOs (TODO_BACKEND)
- `src/types/policy.js` - Policy DTOs (TODO_BACKEND)
- `src/types/activityLog.js` - Activity Log DTOs (TODO_BACKEND)
- `.env` - Environment config with `VITE_API_BASE_URL=http://localhost:8080`

### ✅ Modified Files

- `src/context/AuthContext.jsx` - Refactored from mock to real API
- `src/pages/Login/Login.jsx` - Added real username/password inputs
- `src/api/policyApi.js` - Removed localStorage mock, now calls backend
- `src/api/activityLogApi.js` - Removed localStorage mock, now calls backend

---

## Authentication Flow

### Before (Mock)
1. User selects role from dropdown
2. Mock delay 800ms
3. Store mock user object in localStorage
4. Redirect based on selected role

### After (Real API)
1. User enters username + password
2. Call `POST /api/auth/login`
3. Store `accessToken` in localStorage key `"accessToken"`
4. Store user info `{ username, role }` in localStorage key `"user"`
5. Redirect based on role from API response
6. All subsequent API calls auto-attach `Authorization: Bearer <token>`
7. On 401 error: clear localStorage + redirect to `/login`

---

## Assumptions & Design Decisions

1. **Token Storage:** JWT stored in localStorage (not httpOnly cookie)
   - Reason: Simpler for SPA, matches common practice
   - Security note: Vulnerable to XSS, but acceptable for internal tool

2. **Role Format:** Backend returns uppercase roles (`MANAGER`, `ANNOTATOR`)
   - Frontend routes expect uppercase
   - Mapping handled in Login.jsx

3. **Error Handling:** All API errors standardized to `{ status, message, data }`
   - Interceptor in apiClient.js handles this

4. **CORS:** Assumed backend has CORS configured for `http://localhost:5173`

5. **Response Envelope:** Assumed backend uses consistent format:
   ```json
   {
     "data": [...],
     "meta": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
   }
   ```

---

## Testing Checklist

### ✅ Can Test Now (Backend Ready)

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (401 error)
- [ ] Token auto-attach on authenticated requests
- [ ] 401 redirect to login
- [ ] Logout clears token and redirects

### ⚠️ Cannot Test Yet (Backend Missing)

- [ ] Policy list/create/update/status
- [ ] Activity log list with pagination/filters
- [ ] User management
- [ ] Label management
- [ ] Project creation

---

## Next Steps

### For Backend Team

1. **Implement PolicyController**
   - Endpoints: GET, POST, PUT, PATCH (see TODO_BACKEND section)
   - DTO structure can match current mock data structure

2. **Implement ActivityLogController**
   - Endpoint: GET with pagination
   - Response envelope: `{ data, meta }`

3. **Implement UserController** (if needed in Sprint 1)

4. **Implement LabelController** (if needed in Sprint 1)

5. **Configure CORS** for `http://localhost:5173`

### For Frontend Team

1. **Test Login Flow** once backend is running

2. **Create Missing UI Screens** if required in Sprint 1:
   - Register page
   - Create Project form
   - Create Label form
   - User Management page

3. **Update TODO_BACKEND comments** once backend confirms DTO structures

---

## Environment Setup

### Frontend
```bash
# Install dependencies
npm install

# Create .env file (already created)
# VITE_API_BASE_URL=http://localhost:8080

# Run dev server
npm run dev
```

### Backend
```bash
# Start Spring Boot application
# Ensure it runs on http://localhost:8080
# Swagger UI should be accessible at http://localhost:8080/swagger-ui.html
```

---

## Contact Points

- **Frontend Lead:** Integration complete, waiting for backend endpoints
- **Backend Lead:** See TODO_BACKEND section for required endpoints
- **PM:** Clarify Sprint 1 scope - which features need UI screens?

---

**Integration Status:** ✅ Frontend Ready | ⚠️ Waiting for Backend Controllers
