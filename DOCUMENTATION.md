# DATA LABELING SUPPORT SYSTEM — TÀI LIỆU KỸ THUẬT

> Tài liệu này mô tả chính xác trạng thái hiện tại của codebase sau khi đã dọn dẹp.
> Cập nhật lần cuối: sau khi merge Modern/ vào Manager/, xóa ErrorTypes, xóa Admin Labels/Policies.

---

## 1. TỔNG QUAN HỆ THỐNG

Đây là ứng dụng **Data Labeling Support System** — hệ thống hỗ trợ gán nhãn dữ liệu cho AI/ML.

**Tech stack:**
- React 19 + TypeScript + Vite
- React Router v7 (nested routes)
- TanStack React Query v5 (server state)
- Axios (HTTP client)
- i18next (đa ngôn ngữ: VI/EN)
- Tailwind CSS

**Backend:** Spring Boot chạy tại `localhost:8080`, proxy qua Vite.

**4 vai trò người dùng:**

| Role | Route gốc | Chức năng chính |
|------|-----------|-----------------|
| ADMIN | `/admin` | Quản lý người dùng, xem activity logs |
| MANAGER | `/manager` | Quản lý project, dataset, label, policy, assignment |
| ANNOTATOR | `/annotator` | Gán nhãn dữ liệu |
| REVIEWER | `/reviewer` | Đánh giá kết quả gán nhãn |

---

## 2. CẤU TRÚC THƯ MỤC

```
src/
├── api/              ← Tất cả API calls (1 file = 1 domain)
├── components/       ← Reusable components
├── config/           ← Feature flags
├── context/          ← React Context (Auth, Theme, Toast)
├── i18n/             ← Đa ngôn ngữ (vi/en, 8 namespaces)
├── layouts/          ← Layout wrappers (Sidebar + Outlet)
├── pages/            ← Pages theo role
│   ├── Admin/
│   ├── Annotator/
│   ├── Annotator__backup_before_swap/  ← BACKUP, không dùng
│   ├── Login/
│   ├── Manager/
│   ├── Register/
│   └── Reviewer/
├── query/            ← React Query layer
├── services/         ← api.ts (LEGACY, không dùng)
├── types/            ← TypeScript types
└── utils/            ← Utility functions
```

---

## 3. src/api/ — LỚP GỌI API

Tất cả đều đi qua `apiClient.js`. Không file nào gọi axios trực tiếp (ngoại trừ DevHealthCheck).

### apiClient.js
Axios instance trung tâm. Tự động:
- Đính kèm `Authorization: Bearer <token>` từ localStorage
- 401 → xóa token + redirect `/login`
- Gia hạn session mỗi response thành công
- Chuẩn hóa lỗi thành `{ status, message, data }`
- **Trả về `response.data` trực tiếp** — không cần `.data` ở nơi gọi

### adapters.js
Chuyển đổi FE model ↔ BE DTO. Không gọi API.
- `normalizeRole()` — xóa `ROLE_` prefix
- `toCreateUserRequest()`, `toCreatePolicyRequest()`, `toCreateLabelRequest()`
- `fromPolicyDto()`, `fromUserDto()`, `fromLabelDto()`

### Các API files

| File | Endpoints chính |
|------|----------------|
| `authApi.js` | POST /api/auth/login, POST /api/auth/register |
| `userApi.js` | CRUD users, approve/reject/ban/suspend/activate |
| `projectApi.js` | CRUD projects, updateStatus, activateProject |
| `datasetApi.js` | Upload (multipart), CRUD items, export 5 formats |
| `assignmentApi.js` | Tạo/xóa/list assignments theo project |
| `annotationApi.js` | Workspace annotator: load, save, fix, submit |
| `reviewApi.js` | Workspace reviewer: load, review annotation, submit |
| `labelApi.js` | CRUD labels, soft delete/activate |
| `labelRuleApi.js` | CRUD rules, attachLabels, replaceLabels |
| `policyApi.js` | CRUD policies, assign to project |
| `activityLogApi.js` | Xem logs theo user/action/date |
| `analyticsApi.js` | Analytics project: summary, progress, quality, contributions |

---

## 4. src/context/ — GLOBAL STATE

### AuthContext.tsx
Quản lý auth state toàn app.

**Session management:**
- Login → lưu `accessToken`, `user`, `sessionExpiry` vào localStorage
- Idle timeout: 30 phút không hoạt động → tự logout
- Mỗi API response thành công → gia hạn thêm 24h
- Mỗi 30 giây check expiry

**Hook:** `useAuth()` → `{ user, login, logout, register, isLoading, isAuthenticated }`

### ToastContext.tsx
Hệ thống thông báo toast toàn app.

**Hook:** `useToast()` → `{ addToast(message, type) }`

**Types:** `success` (3s), `error` (5s), `warning` (5s), `info` (3s)

Render qua `createPortal` vào `document.body`, góc trên phải.

### ThemeContext.tsx
Hardcode light mode. `toggleTheme` là no-op.

---

## 5. src/query/ — REACT QUERY LAYER

### queryClient.js
Config global: retry 1 lần, không refetch khi focus/reconnect/mount.

### projectQueries.js
Query keys, normalize functions, fetch functions cho project data.

**Query keys:**
```js
projectQueryKeys.summaryList()   // danh sách projects
projectQueryKeys.detail(id)      // chi tiết project
projectQueryKeys.overview(id)    // analytics overview
projectQueryKeys.datasets(id)    // datasets của project
projectQueryKeys.assignments(id) // assignments của project
```

**fetchProjectOverview(id)** — gọi 7 API song song:
1. analytics/summary
2. analytics/progress
3. analytics/quality
4. analytics/contributions
5. analytics/member-scores
6. assignments
7. datasets

**Invalidate helpers:** Sau khi mutate, gọi để force refetch:
- `invalidateProjectSummaryData()` — summary + detail + overview
- `invalidateProjectDatasetData()` — + datasets
- `invalidateProjectAssignmentData()` — + assignments + datasets

---

## 6. src/layouts/ — LAYOUT WRAPPERS

4 layout giống nhau: `Sidebar` (fixed trái, 256px) + `<Outlet>` (nội dung phải).

| File | Dùng cho |
|------|---------|
| `AdminLayout.tsx` | `/admin/*` |
| `ManagerLayout.tsx` | `/manager/*` |
| `AnnotatorLayout.tsx` | `/annotator/*` (trừ workspace) |
| `ReviewerLayout.tsx` | `/reviewer/*` (trừ review workspace) |

**Workspace không dùng layout này** — `Workspace.tsx` và `ReviewWorkspace.tsx` có layout 3 cột riêng.

---

## 7. src/components/ — REUSABLE COMPONENTS

### layout/Sidebar.tsx
Sidebar cố định, hiển thị navigation theo role:
- ADMIN: Dashboard, Users, Activity Logs
- MANAGER: Dashboard, Projects, Labels, Policies
- ANNOTATOR: Dashboard, My Tasks
- REVIEWER: Review Queue

Click logo → về home route. Click user info → logout.

### layout/WorkspaceLayout.tsx
Layout 3 cột cho workspace (Annotator + Reviewer):
- Trái: danh sách ảnh/tasks
- Giữa: canvas
- Phải: annotations/review panel

### Common/RoleGuard.tsx
Bảo vệ route. Logic:
1. `isLoading` → hiển thị loading
2. Không có user → redirect `/login`
3. Role không match → redirect `/unauthorized`
4. OK → render children

**Đây là component được dùng trong App.tsx** (không phải `ProtectedRoute.tsx`).

### Common/ProtectedRoute.tsx
Legacy, không được dùng trong App.tsx. Có thể xóa.

### Manager/ImagePreviewModal.tsx
Modal xem ảnh dataset: gallery, prev/next, xóa ảnh, thêm ảnh (drag & drop).

API: `getDatasetItems`, `deleteItem`, `addItemsToDataset`

### Modals/ConfirmDialog.tsx
Dialog xác nhận với 3 type: `danger` (đỏ), `warning` (cam), `info` (xanh). Có loading state.

### LabelSummaryPanel.tsx
Panel thống kê labels trong workspace annotator:
- Coverage % (số ảnh đã annotate / tổng)
- Shape count theo label
- Ưu tiên `liveAnnotations` (real-time) hơn backend annotations

### i18n/LanguageSwitcher.tsx
Widget chuyển ngôn ngữ VI/EN, draggable (giữ Ctrl + drag), fixed position.

### ui/ — Design System

| Component | Chức năng |
|-----------|-----------|
| `Button.tsx` | variants: primary/secondary/ghost/destructive, leftIcon, isLoading |
| `Card.tsx` | Container với border + shadow |
| `Input.tsx` | Input field với label, error state |
| `Modal.tsx` | `ModalDialog` (portal, Escape close) + `ConfirmDialog` |
| `Table.tsx` | Table/Header/Body/Row/Head/Cell |
| `BadgeStatus.tsx` | Badge màu theo status |
| `ThemeToggle.tsx` | Disabled (theme hardcode light) |

### DevHealthCheck.tsx
Route `/dev-check`. Ping `GET /api/health`, hiển thị status backend.

---

## 8. src/pages/Admin/ — TRANG ADMIN

Admin chỉ quản lý **người dùng** và **xem logs**. Không quản lý labels hay policies.

### AdminDashboard.tsx — `/admin/dashboard`
**Hiển thị:** KPI tổng users, biểu đồ phân bổ role, 5 activity logs gần nhất.

**API:**
- `GET /api/users?page=0&size=1000` → đếm theo role
- `GET /api/activity-logs?page=0&size=5` → logs gần nhất

### Users.tsx — `/admin/users`
**Hiển thị:** Bảng users với filter tabs (All/Pending/Active/Banned), pagination 10/trang.

**Chức năng & API:**
| Hành động | API |
|-----------|-----|
| Load | `GET /api/users?page=0&size=50` |
| Tạo user | `POST /api/users` |
| Approve (PENDING) | `PATCH /api/users/:id/approve` |
| Reject (PENDING) | `PATCH /api/users/:id/reject?reason=` |
| Ban | `PATCH /api/users/:id/suspend` |
| Unban | `PATCH /api/users/:id/activate` |
| Đổi role | `PUT /api/users/:id` `{ roleId }` |

**Lưu ý:** Admin không thể đổi role hoặc ban chính ADMIN.

### PendingUsersPage.tsx
Trang duyệt users PENDING dạng cards, server-side pagination.

**API:** `GET /api/users/pending?page=&size=10`, approve/reject tương tự Users.tsx.

### ActivityLogs.tsx — `/admin/logs`
**Hiển thị:** Bảng logs với filter action + date range.

**API:**
- Load: `GET /api/activity-logs?page=0&size=50`
- Filter date: `GET /api/activity-logs/date-range?startDate=&endDate=`
- Filter action: `GET /api/activity-logs/action/:action`

---

## 9. src/pages/Manager/ — TRANG MANAGER

### ManagerDashboard.tsx — `/manager/dashboard`
**Hiển thị:** Landing page. Projects list (phân trang 5/trang), annotator progress cards, quick actions.

**API:**
- `GET /api/projects/my-projects`
- `GET /api/users?page=0&size=200` → filter annotators
- Với mỗi project: `GET /api/projects/:id/assignments` → tính progress

---

### ProjectsPage.tsx — `/manager/projects`
**Hiển thị:** Danh sách projects, Grid/List view, tab Active/Deleted, filter status, stats cards.

**Chức năng & API:**
| Hành động | API |
|-----------|-----|
| Load | `GET /api/projects/my-projects` (React Query) |
| Tạo | `POST /api/projects` |
| Sửa | `PUT /api/projects/:id` |
| Xóa (soft) | `DELETE /api/projects/:id` → status INACTIVE |
| Restore | `PATCH /api/projects/:id/activate` |

**State persistence:** Lưu viewMode, filter, scroll position vào `sessionStorage` để restore khi navigate back.

---

### ProjectDetail.tsx — `/manager/projects/:id`
**Vai trò:** Shell container. Load project data, render tab bar, truyền `project` xuống tabs con qua `<Outlet context={{ project }}>`.

**API:** `GET /api/projects/:id` (React Query, stale 60s)

**6 tabs:**

| Tab | Route | File |
|-----|-------|------|
| Overview | index | ProjectOverview.tsx |
| Data | /data | ProjectData.tsx |
| Labels | /labels | ProjectLabels.tsx |
| Assignments | /assignments | ProjectAssignments.tsx |
| Export | /export | ProjectExport.tsx |
| Errors | /errors | ProjectErrors.tsx |

---

### ProjectOverview.tsx — tab Overview
**Hiển thị:** KPI cards, progress bars (labeling/reviewing/approval), quality metrics, top contributors table, alerts, annotation guideline editor.

**API (7 calls song song):**
- `GET /api/analytics/projects/:id/summary`
- `GET /api/analytics/projects/:id/progress`
- `GET /api/analytics/projects/:id/quality`
- `GET /api/analytics/projects/:id/contributions`
- `GET /api/analytics/projects/:id/member-scores`
- `GET /api/projects/:id/assignments`
- `GET /api/projects/:id/datasets`

**Save guideline:** `PUT /api/projects/:id` `{ guidelineContent, guidelineFileUrl, guidelineVersion }`

---

### ProjectData.tsx — tab Data
**Hiển thị:** Form upload dataset (files hoặc folder), dataset table, ImagePreviewModal.

**Đặc biệt:**
- Upload folder: dùng `webkitGetAsEntry()` đọc đệ quy
- Progress bar khi upload
- Auto-refresh dataset list mỗi 10 giây (polling)
- Lock toàn bộ khi project COMPLETED

**API:**
| Hành động | API |
|-----------|-----|
| Load datasets | `GET /api/projects/:id/datasets` |
| Upload | `POST /api/projects/:id/datasets` (multipart) |
| Preview ảnh | `GET /api/datasets/:id/items` |
| Xóa ảnh | `DELETE /api/items/:itemId` |
| Thêm ảnh | `POST /api/datasets/:id/items` (multipart) |
| Xóa dataset | `DELETE /api/datasets/:id` |

---

### ProjectLabels.tsx — tab Labels
**Hiển thị:** Danh sách label rules gán cho project, modal thêm rule từ global.

**Đặc biệt:** Lưu rule IDs vào localStorage (`dlss_project_label_rules::{pid}`) và sync lên backend.

**API:**
- Load rules: `GET /api/label-rules`
- Sync: `PUT /api/projects/:id/label-rules` `{ ruleIds }`

---

### ProjectAssignments.tsx — tab Assignments
**Hiển thị:** Form tạo assignment (chọn Dataset + Annotator + Reviewer), bảng assignments, stats.

**Đặc biệt:** Nếu `GET /api/users` trả về 403 → fallback dùng cache từ `localStorage["dlss_users_cache"]`.

**API:**
| Hành động | API |
|-----------|-----|
| Load datasets | `GET /api/projects/:id/datasets` |
| Load assignments | `GET /api/projects/:id/assignments` |
| Load users | `GET /api/users?page=0&size=200` |
| Tạo | `POST /api/projects/:id/assignments` `{ datasetId, annotatorId, reviewerId }` |
| Xóa (PENDING only) | `DELETE /api/assignments/:id` |

---

### ProjectExport.tsx — tab Export
**Hiển thị:** Chọn dataset + format, batch status, nút Export, lịch sử export (sessionStorage).

**Chỉ export được khi batch status = COMPLETED** (tất cả assignments đã APPROVED).

**API:**
| Format | API |
|--------|-----|
| COCO JSON | `GET /api/datasets/:id/export/coco?status=APPROVED` |
| YOLO | `GET /api/datasets/:id/export/yolo?status=APPROVED` |
| Pascal VOC | `GET /api/datasets/:id/export/pascal-voc?status=APPROVED` |
| CSV | `GET /api/datasets/:id/export/csv?status=APPROVED` |

Tất cả trả về blob → trigger download tự động.

---

### ProjectErrors.tsx — tab Errors
**Hiển thị:** Policies đã gán cho project + danh sách global policies để thêm/gỡ.

**Lưu ý:** File này dùng `policiesAPI` từ `services/api.ts` (legacy) thay vì `policyApi` từ `api/policyApi.js`. Đây là inconsistency cần fix sau.

**API:**
- `GET /api/policies?page=0&size=200`
- `GET /api/policies/project/:id`
- `POST /api/policies/assign?projectId=&policyId=`
- `DELETE /api/policies/remove?projectId=&policyId=`

---

### LabelsPage.tsx — `/manager/labels`
**Hiển thị:** 2 tabs — Labels (grid cards) và Label Rules (list).

**Labels:**
- Xem tất cả (kể cả inactive)
- Filter: All / Active / Inactive
- Tạo, sửa, deactivate (soft delete), reactivate

**Label Rules:**
- Tạo rule với labels đính kèm
- Sửa rule, xóa rule
- Attach thêm labels (additive)
- Remove labels (replace toàn bộ)

**Đặc biệt:** Khi manager xem labels, ghi vào localStorage để Workspace annotator đọc:
```js
localStorage["dlss_project_name_pid_map"]
localStorage["dlss_project_rules_full::{projectId}"]
```

**API:**
| Hành động | API |
|-----------|-----|
| Load labels | `GET /api/labels` |
| Tạo label | `POST /api/labels` |
| Sửa label | `PUT /api/labels/:id` |
| Deactivate | `DELETE /api/labels/:id` |
| Reactivate | `PATCH /api/labels/:id/activate` |
| Load rules | `GET /api/label-rules` |
| Tạo rule | `POST /api/label-rules` |
| Sửa rule | `PUT /api/label-rules/:id` |
| Xóa rule | `DELETE /api/label-rules/:id` |
| Attach labels | `POST /api/label-rules/:id/labels` |
| Replace labels | `POST /api/label-rules/:id/labels/bulk` |

---

### CreateLabel.tsx — `/manager/labels/new`
Form tạo label global: tên, color picker (8 preset + hex), type, description, shortcut key.

**API:** `POST /api/labels`

---

### PoliciesPage.tsx — `/manager/policies`
**Hiển thị:** Grid cards policies với stats (total, applied projects, theo severity), detail modal, CRUD.

**Đặc biệt:** Backend thường không trả về `projects[]` trong policy → component tự enrich bằng cách fetch tất cả projects rồi build map `policyId → projects[]`.

**API:**
| Hành động | API |
|-----------|-----|
| Load | `GET /api/policies?page=0&size=20` |
| Enrich projects | `GET /api/projects/my-projects` + `GET /api/policies/project/:id` |
| Tạo | `POST /api/policies` |
| Sửa | `PUT /api/policies/:id` |
| Xóa | `DELETE /api/policies/:id` |

**Route `/manager/error-types`** → redirect về `/manager/policies` (đã xóa ErrorTypes).

---

### Tasks.tsx — `/manager/tasks`
⚠️ **MOCK DATA** — dùng `getMockData()` từ localStorage, không gọi API thật.

---

### ActivityLogs.tsx — `/manager/logs`
⚠️ **BUG** — gọi `activityLogApi.list()` không tồn tại → runtime error khi load.

Cần sửa thành `activityLogApi.getAllLogs()`.

---

### UploadData.tsx — `/manager/upload-data`
Upload data standalone (không trong context project). Chọn project từ dropdown, upload files/folder.

**API:** `GET /api/projects/my-projects`, `POST /api/projects/:id/datasets`

---

### ProjectCreateLabel.tsx — `/manager/projects/:id/labels/new`
Giống `CreateLabel.tsx` nhưng sau khi save navigate về `/manager/projects/:id/labels`.

---

## 10. src/utils/ — UTILITIES

### blobAssetCache.js
LRU cache (40 entries) cho blob URLs. Dùng để load ảnh cần JWT token.

```js
getCachedBlobUrl(path)   // fetch + cache blob URL
preloadBlobUrl(path)     // preload ảnh tiếp theo
clearBlobAssetCache()    // xóa toàn bộ cache
```

**Tại sao cần:** Ảnh từ `/uploads/*` cần header `Authorization: Bearer <token>` → không thể dùng `<img src>` trực tiếp.

### cn.js
Merge Tailwind classes: `clsx` + `tailwind-merge`.

### roleUtils.js
- `normalizeRole(role)` — xóa `ROLE_` prefix, uppercase
- `getRoleBasedRedirect(role)` — role → route path

### mockStorage.ts
Helper cho mock data (localStorage). Cần xóa khi tất cả APIs sẵn sàng.

---

## 11. src/config/featureFlags.js

Bật/tắt tính năng không cần deploy lại.

| Flag | Mặc định | Tác dụng |
|------|----------|---------|
| `perf_project_list_summary` | true | Dùng React Query cho project list |
| `perf_hotspot_cache` | true | Cache staleTime/gcTime cho queries |
| `perf_project_tab_persistence` | true | Nhớ tab + scroll position |
| `perf_image_preview_fields` | true | Optimize image preview |
| `perf_image_lazyload` | true | Lazy load ảnh trong workspace |
| `perf_workspace_safe_cache` | true | Dùng blob cache trong workspace |

**Override runtime:**
```js
localStorage.setItem("feature:perf_hotspot_cache", "false")
```

---

## 12. ROUTING — App.tsx

```
/                    → redirect theo role
/login               → Login (public)
/register            → Register (public)

/annotator           → RoleGuard(ANNOTATOR) → AnnotatorLayout
  /tasks             → TaskList
  /dashboard         → AnnotatorDashboard
/annotator/task/:id  → RoleGuard(ANNOTATOR) → Workspace (3-column, no sidebar)

/reviewer            → RoleGuard(REVIEWER) → ReviewerLayout
  /queue             → ReviewQueue
/reviewer/review/:id → ReviewWorkspace (3-column, no sidebar)

/manager             → RoleGuard(MANAGER) → ManagerLayout
  /dashboard         → ManagerDashboard
  /projects          → ProjectsPage
  /projects/:id      → ProjectDetail
    index            → ProjectOverview
    /data            → ProjectData
    /labels          → ProjectLabels
    /labels/new      → ProjectCreateLabel
    /assignments     → ProjectAssignments
    /export          → ProjectExport
    /errors          → ProjectErrors
  /labels            → LabelsPage
  /labels/new        → CreateLabel
  /policies          → PoliciesPage
  /error-types       → redirect → /manager/policies
  /error-types/new   → redirect → /manager/policies
  /tasks             → Tasks (mock)
  /upload-data       → UploadData

/admin               → RoleGuard(ADMIN) → AdminLayout
  /dashboard         → AdminDashboard
  /users             → AdminUsers
  /logs              → AdminActivityLogs

/unauthorized        → Unauthorized
/dev-check           → DevHealthCheck
```

---

## 13. LUỒNG XÁC THỰC

```
1. User nhập username/password → POST /api/auth/login
2. Nhận { accessToken, username, role }
3. Lưu vào localStorage: accessToken, user, sessionExpiry
4. Redirect theo role

Mỗi API request:
→ apiClient tự đính kèm Authorization: Bearer <token>

Response 401:
→ Xóa localStorage → redirect /login

Route protection:
→ RoleGuard đọc user từ AuthContext
→ Không có user → /login
→ Role không match → /unauthorized
```

---

## 14. NHỮNG VẤN ĐỀ CÒN TỒN TẠI

| Vấn đề | File | Mức độ |
|--------|------|--------|
| `activityLogApi.list()` không tồn tại | `Manager/ActivityLogs.tsx` | 🔴 Bug — crash khi load |
| Dùng legacy `policiesAPI` | `Manager/ProjectErrors.tsx` | 🟡 Inconsistency |
| Mock data, không có API | `Manager/Tasks.tsx` | 🟡 Chưa hoàn thiện |
| Folder backup không dùng | `Annotator__backup_before_swap/` | 🟢 Có thể xóa |
| Legacy file không dùng | `services/api.ts` | 🟢 Có thể xóa |
| `ProtectedRoute.tsx` không dùng | `Common/ProtectedRoute.tsx` | 🟢 Có thể xóa |
| `ReviewerDashboard.tsx` mock data | `Reviewer/ReviewerDashboard.tsx` | 🟡 Chưa hoàn thiện |
| `AnnotatorDashboard.tsx` trùng TaskList | `Annotator/AnnotatorDashboard.tsx` | 🟡 Duplicate |

---

## 15. LOCALSTORAGE KEYS QUAN TRỌNG

| Key | Nội dung |
|-----|---------|
| `accessToken` | JWT token |
| `user` | `{ username, role }` JSON |
| `sessionExpiry` | Timestamp hết hạn session |
| `app_language` | "vi" hoặc "en" |
| `anno_done_{assignmentId}_{itemId}` | Flag item đã done (Annotator) |
| `dlss_project_name_pid_map` | Map projectName → projectId |
| `dlss_project_rules_full::{projectId}` | Label rules của project |
| `dlss_users_cache` | Cache users (fallback khi 403) |
| `dlss_project_label_rules::{pid}` | Rule IDs gán cho project |
| `feature:{flagName}` | Override feature flag |
| `export_history_project_{id}` | Lịch sử export (sessionStorage) |
| `perf.manager.projects.state` | View state của ProjectsPage (sessionStorage) |

---

## 16. PHÂN TÍCH CHI TIẾT TỪNG FILE — MANAGER

---

### ManagerDashboard.tsx

**Mục đích:** Trang đầu tiên manager thấy sau khi đăng nhập. Cung cấp cái nhìn tổng quan nhanh.

**Cách hoạt động:**
1. Load song song: danh sách projects + tất cả users
2. Filter users lấy annotators (roleId=3 hoặc roleName=ANNOTATOR)
3. Với mỗi project, gọi API lấy assignments → tính progress từng annotator
4. Hiển thị: stats cards, danh sách projects phân trang 5/trang, annotator progress cards

**State quan trọng:**
- `myProjects` — danh sách projects của manager
- `annotators` — danh sách annotators trong hệ thống
- `annotatorProgress` — map `userId → { total, completed, inProgress, pending, avgProgress }`

**Tính toán progress annotator:**
```
completed = assignments có status COMPLETED hoặc APPROVED
inProgress = assignments có status IN_PROGRESS, SUBMITTED, RE_SUBMITTED, REJECTED
pending = assignments có status PENDING hoặc DRAFT
avgProgress = trung bình field `progress` của tất cả assignments
```

---

### ProjectsPage.tsx

**Mục đích:** Danh sách tất cả projects của manager. Trang chính để quản lý projects.

**Hai chế độ fetch:**
- `perf_project_list_summary = true` (mặc định): dùng React Query, cache 60s
- `perf_project_list_summary = false`: fetch thủ công + gọi thêm assignments để tính status thực tế

**Tính status thực tế từ assignments:**
```
Tất cả APPROVED → "completed"
Có REJECTED → "in_progress"
Có IN_PROGRESS/SUBMITTED/RE_SUBMITTED → "in_progress"
Còn lại → "draft"
Ngoại lệ: backend set "paused" hoặc "inactive" → giữ nguyên
```

**State persistence (sessionStorage):**
- Nhớ viewMode (grid/list), filter status, showDeletedProjects
- Nhớ scroll position → restore khi navigate back

**Status transition hợp lệ khi edit:**
- DRAFT → DRAFT hoặc IN_PROGRESS
- IN_PROGRESS → IN_PROGRESS hoặc PAUSED
- PAUSED → PAUSED hoặc IN_PROGRESS
- COMPLETED → chỉ COMPLETED (không thể thay đổi)

**Tab "Đã xóa":** Projects có status INACTIVE. Có thể restore bằng `activateProject()`.

---

### ProjectDetail.tsx

**Mục đích:** Shell container cho tất cả tabs của một project. Không render nội dung tab.

**Cách hoạt động:**
1. Đọc `projectId` từ URL params
2. Load project data qua React Query (stale 60s, gcTime 600s)
3. Render header (tên, type, status, ngày tạo) + tab bar
4. Truyền `project` xuống tabs con qua `<Outlet context={{ project }}>`
5. Tabs con đọc bằng `useOutletContext()`

**Active tab detection:** Đọc `location.pathname`, không dùng state.

**isProjectCompleted:** Tất cả tabs con đều check `parentProject?.status?.toLowerCase() === "completed"` để lock UI.

---

### ProjectOverview.tsx

**Mục đích:** Tab tổng quan analytics của project. Hiển thị KPIs, tiến độ, chất lượng, team.

**7 API gọi song song (Promise.all):**
```
analytics/summary → tổng hợp
analytics/progress → tiến độ labeling/review/approval
analytics/quality → chất lượng annotations
analytics/contributions → đóng góp từng thành viên
analytics/member-scores → điểm performance
assignments → danh sách assignments
datasets → danh sách datasets
```

**Tính derived values (bù khi backend trả về 0):**
```
derivedLabeledItems = tổng items của datasets có assignment status SUBMITTED/RE_SUBMITTED/APPROVED/REJECTED/COMPLETED
derivedReviewedItems = tổng items của datasets có assignment status APPROVED/REJECTED/COMPLETED
derivedApprovedItems = tổng items của datasets có assignment status APPROVED/COMPLETED
```
Dùng `Math.max(backendValue, derivedValue)` để lấy giá trị lớn hơn.

**Annotation Guideline editor:**
- Textarea nội dung, input version, input file URL
- Lock khi project COMPLETED
- Save: `PUT /api/projects/:id` với `{ guidelineContent, guidelineFileUrl, guidelineVersion }`

---

### ProjectData.tsx

**Mục đích:** Tab quản lý datasets — upload ảnh, xem ảnh, xóa dataset.

**Upload modes:**
- Files: chọn nhiều file riêng lẻ
- Folder: dùng `webkitdirectory` attribute, tự extract tên folder làm batch name
- Drag & drop: hỗ trợ cả files và folder

**Folder drop (webkitGetAsEntry):**
Dùng File System API để đọc đệ quy toàn bộ files trong folder, kể cả nested folders.

**Validation:**
- Extension: `.png .jpg .jpeg .gif .bmp .webp`
- Max file: 10MB
- Max total: 100MB

**Upload progress:** Callback `onUploadProgress` của axios → cập nhật progress bar real-time.

**Auto-refresh:** Dataset list refetch mỗi 10 giây (polling) vì dataset status thay đổi async.

**ImagePreviewModal:** Click "Preview" → mở modal xem ảnh, có thể xóa/thêm ảnh trực tiếp.

---

### ProjectLabels.tsx

**Mục đích:** Tab quản lý label rules gán cho project.

**Cách hoạt động:**
1. Load tất cả global label rules từ API
2. Đọc rule IDs đã gán từ localStorage (`dlss_project_label_rules::{pid}`)
3. Hiển thị rules đã gán + modal để thêm từ global list
4. Khi thêm/gỡ rule → cập nhật localStorage + sync lên backend

**Fallback:** Nếu API label rules trả về rỗng → dùng mock data (3 rules mẫu).

**Sync backend:** `PUT /api/projects/:id/label-rules` `{ ruleIds: number[] }`

**localStorage bridge:** Sau khi gán rules, Workspace annotator đọc rules này để hiển thị labels đúng.

---

### ProjectAssignments.tsx

**Mục đích:** Tab tạo và quản lý assignments (giao việc cho annotator + reviewer).

**Form tạo assignment:** Chọn Dataset → Annotator → Reviewer → Tạo.

**User cache fallback (quan trọng):**
Nếu `GET /api/users` trả về 403 (manager không có quyền xem users):
1. Thử load từ `localStorage["dlss_users_cache"]`
2. Nếu có cache → dùng + hiển thị warning
3. Nếu không có → hiển thị error + nút retry

Mỗi lần fetch users thành công → cache vào localStorage.

**displayStatus:** Backend có thể trả về `displayStatus` (đã dịch sẵn). Component ưu tiên `displayStatus` hơn `status` raw.

**Xóa assignment:** Chỉ được xóa khi status = PENDING. Các status khác không có nút xóa.

**React Query stale times:**
- Datasets: 30s (có thể upload mới)
- Assignments: 30s (status thay đổi thường xuyên)
- Users: 300s (ít thay đổi)

---

### ProjectExport.tsx

**Mục đích:** Tab export dataset ra các format khác nhau.

**Điều kiện export:** Batch status phải là COMPLETED.

**Tính batch status từ assignments:**
```
Tất cả APPROVED/COMPLETED → "COMPLETED"
Có IN_PROGRESS/SUBMITTED/RE_SUBMITTED → "IN_PROGRESS"
Còn lại → "PENDING"
```

**Export flow:**
1. Gọi API tương ứng → nhận blob response
2. `URL.createObjectURL(blob)` → tạo link download
3. Tạo `<a>` element ẩn → click() → trigger download
4. Cleanup URL

**Filename format:** `dataset_{id}_{format}_{YYYYMMDD}.{ext}`

**Export history:** Lưu vào `sessionStorage` (mất khi đóng tab). Key: `export_history_project_{projectId}`.

---

### ProjectErrors.tsx

**Mục đích:** Tab gán/gỡ policies (error types) cho project.

**⚠️ Inconsistency:** File này dùng `policiesAPI` từ `services/api.ts` (legacy) thay vì `policyApi` từ `api/policyApi.js`. Cần fix sau.

**Hai danh sách:**
- "Policies của project": đã gán, có nút Remove
- "Tất cả policies": global, có nút Add (disabled nếu đã gán)

**Optimistic update:** Add/Remove cập nhật local state ngay, không chờ API.

**`projectPolicyIds` Set:** Check O(1) xem policy đã gán chưa.

---

### LabelsPage.tsx

**Mục đích:** Quản lý labels và label rules toàn hệ thống (không theo project cụ thể).

**Tab Labels:**
- Xem tất cả labels kể cả inactive
- Filter: All / Active / Inactive
- Tạo label: tên, màu, type (OBJECT/CLASSIFICATION/SEGMENTATION/DETECTION), description, shortcut key
- Deactivate = soft delete (`DELETE /api/labels/:id`)
- Reactivate = khôi phục (`PATCH /api/labels/:id/activate`)

**Tab Label Rules:**
- Mỗi rule có tên, nội dung, danh sách labels đính kèm
- Tạo rule: phải chọn ít nhất 1 label
- Attach labels: additive — thêm labels mới, không xóa cũ
- Remove labels: dùng `replaceLabels` với danh sách còn lại
- Xóa rule: nếu có foreign key constraint → hiển thị "đang được sử dụng"

**localStorage bridge (quan trọng):**
Khi manager xem labels, ghi vào localStorage để Workspace annotator đọc khi `workspace.labelGroups` rỗng:
```js
localStorage["dlss_project_name_pid_map"] = { [projectName]: projectId }
localStorage["dlss_project_rules_full::{projectId}"] = rules[]
```

**Optimistic modal close:** Modal đóng ngay trước khi API call hoàn thành (UX tốt hơn).

---

### CreateLabel.tsx

**Mục đích:** Form tạo label global (route `/manager/labels/new`).

**Validation client-side:**
- Tên: bắt buộc, max 50 ký tự
- Màu: phải đúng format `#RRGGBB`
- Type: bắt buộc
- Description: max 200 ký tự
- Shortcut: max 20 ký tự

**Sau save:** Navigate về `/manager/labels`.

---

### ProjectCreateLabel.tsx

**Mục đích:** Giống `CreateLabel.tsx` nhưng trong context project (route `/manager/projects/:id/labels/new`).

**Khác biệt duy nhất:** Sau save navigate về `/manager/projects/:id/labels` thay vì `/manager/labels`.

---

### PoliciesPage.tsx

**Mục đích:** Quản lý policies (error types) toàn hệ thống.

**Policy là gì:** Định nghĩa loại lỗi annotation (ví dụ: "Bounding box quá nhỏ", severity: HIGH). Reviewer dùng khi reject annotation.

**Enrichment flow (đặc biệt):**
Backend thường không trả về `projects[]` trong policy response. Component tự build:
1. Fetch tất cả policies
2. Fetch tất cả projects của manager
3. Với mỗi project: fetch policies của project đó
4. Build map `policyId → Project[]`
5. Gắn vào từng policy

**Detail modal:** Click card → xem description đầy đủ + danh sách projects đang dùng policy.

**Xóa policy:** Nếu có foreign key (đang được dùng trong review) → hiển thị "không thể xóa".

---

### Tasks.tsx

**Mục đích:** Bảng tasks với filter status.

**⚠️ MOCK DATA:** Dùng `getMockData()` từ localStorage, không gọi API thật. Cần implement API thật sau.

---

### ActivityLogs.tsx (Manager)

**Mục đích:** Xem activity logs của hệ thống (dành cho manager).

**Bug đã fix:** Trước đây gọi `activityLogApi.list()` không tồn tại → đã sửa thành `activityLogApi.getAllLogs()`.

**Filter:** Search text + filter action type. Hiện tại filter chỉ là UI, không filter server-side (gọi `getAllLogs` rồi filter client-side).

---

### UploadData.tsx

**Mục đích:** Upload data standalone — chọn project từ dropdown rồi upload.

**Khác với ProjectData.tsx:** Không nằm trong context project, phải chọn project từ dropdown. Ít tính năng hơn (không có preview, không có delete).

---

## 17. PHÂN TÍCH CHI TIẾT TỪNG FILE — ADMIN

---

### AdminDashboard.tsx

**Mục đích:** Trang tổng quan cho admin. Hiển thị stats hệ thống và activity gần đây.

**Cách hoạt động:**
1. Fetch users (size=1000) → đếm theo role → hiển thị bar chart
2. Fetch 5 logs gần nhất → format thành messages có ngữ nghĩa
3. Hai fetch chạy song song (không await nhau)

**formatTimeAgo:** Tính thời gian tương đối (vừa xong / X phút trước / X giờ trước / hôm qua / X ngày trước).

**Activity messages:** Dùng `translateAdminLogAction`, `translateAdminLogTargetNoun` để tạo câu có nghĩa từ log data.

---

### Users.tsx

**Mục đích:** Quản lý toàn bộ users trong hệ thống.

**Filter tabs:**
- All: tất cả trừ banned/suspended/inactive
- Pending: chờ duyệt
- Active: đang hoạt động
- Banned: bị khóa (bao gồm suspended + inactive)

**Action buttons theo status:**
- PENDING → Approve + Reject
- ACTIVE (không phải ADMIN) → Change Role + Ban
- BANNED/SUSPENDED/INACTIVE → Unban
- ADMIN → không có action (bảo vệ admin)

**URL trigger:** Nếu URL có `?action=create` → tự mở modal tạo user.

**Pagination:** Client-side, 10 users/trang.

**Ban vs Suspend:** UI gọi là "ban" nhưng thực tế gọi `suspendUser()`. Unban gọi `activateUser()`.

---

### PendingUsersPage.tsx

**Mục đích:** Trang chuyên biệt để duyệt users đăng ký mới.

**Khác với Users.tsx:** Hiển thị dạng cards (không phải bảng), server-side pagination, chỉ hiện PENDING users.

**Reject:** Dùng `window.prompt()` để nhập lý do từ chối.

---

### ActivityLogs.tsx (Admin)

**Mục đích:** Xem và tìm kiếm activity logs toàn hệ thống.

**Search modes:**
- Có date range → `getLogsByDateRange(startDate, endDate)`
- Có action filter → `getLogsByAction(action)`
- Không filter → `getAllLogs()`

**translateAdminLogDetails(log):** Hàm phức tạp trong `i18n/helpers.js` — parse log detail string bằng regex để dịch sang ngôn ngữ hiện tại. Hỗ trợ nhiều format tiếng Việt và tiếng Anh.

**Action badge colors:**
- LOGIN/AUTH → xanh lá
- CREATE/ADD → xanh dương
- UPDATE/EDIT → vàng
- DELETE/REMOVE → đỏ

---

## 18. PHÂN TÍCH CHI TIẾT TỪNG FILE — AUTH & COMMON

---

### Login.tsx

**Mục đích:** Trang đăng nhập. Đặc biệt: chứa cả form đăng ký trong cùng 1 trang, toggle bằng state `mode`.

**Visual effects:** Background ảnh, scanning line animation, AI bounding boxes animation, card float animation.

**Login flow:**
```
submit → useAuth().login() → POST /api/auth/login
→ lưu token + user vào localStorage
→ navigate theo role
```

**Register flow (trong Login.tsx):**
```
submit → useAuth().register() → POST /api/auth/register
→ toast success → switch về LoginForm
```

---

### Register.tsx

**Mục đích:** Trang đăng ký riêng biệt (route `/register`). Dùng `ModernRegisterForm` component.

**Sau register:** Toast "Chờ admin duyệt" → navigate `/login`.

**Error mapping:**
```
"Email already exists" → message tiếng Việt
"Username already exists" → message tiếng Việt
"Role not found" → message tiếng Việt
```

---

### AuthContext.tsx

**Mục đích:** Quản lý auth state toàn app.

**Session management chi tiết:**
- `IDLE_TIMEOUT = 30 phút` — reset mỗi khi user có activity
- `SESSION_DURATION = 24h` — trong apiClient, reset mỗi API response thành công
- Events theo dõi: mousemove, mousedown, keydown, touchstart, scroll, click
- Check mỗi 30 giây: nếu hết hạn → logout + redirect `/login`

**Restore session khi reload:**
Đọc `localStorage.user`, `localStorage.accessToken`, `localStorage.sessionExpiry`.
Nếu còn hạn → restore user state. Nếu hết hạn → xóa tất cả.

---

### ToastContext.tsx

**Mục đích:** Hệ thống thông báo toast toàn app.

**Cách dùng:**
```ts
addToast("message", "success")
addToast({ message: "msg", type: "error" })
```

**Auto-dismiss:** success/info = 3s, error/warning = 5s.

**Render:** `createPortal` vào `document.body`, góc trên phải, slide-in animation.

---

### RoleGuard.tsx

**Mục đích:** Bảo vệ routes theo role. Được dùng trong App.tsx.

**Logic:**
1. `isLoading` → hiển thị loading text
2. Không có user → redirect `/login` (kèm `state.from` để redirect back)
3. Role không match → redirect `/unauthorized`
4. OK → render children

**Dùng `normalizeRole()`** để so sánh (xử lý `ROLE_ADMIN` → `ADMIN`).

---

### Sidebar.tsx

**Mục đích:** Navigation sidebar cố định bên trái, role-aware.

**Navigation links:**
- ADMIN: Dashboard, Users, Activity Logs
- MANAGER: Dashboard, Projects, Labels, Policies
- ANNOTATOR: Dashboard, My Tasks
- REVIEWER: Review Queue

**Click logo/title** → navigate về home route của role.
**Click user info (bottom)** → logout + redirect `/login`.

**NavLink active state:** Dùng `isActive` prop để highlight route đang active.

---

## 19. NHỮNG FILE CÓ THỂ XÓA AN TOÀN

| File | Lý do |
|------|-------|
| `src/services/api.ts` | Legacy axios instance, không được dùng trong app |
| `src/pages/Annotator__backup_before_swap/` | Backup JSX cũ trước khi refactor |
| `src/components/Common/ProtectedRoute.tsx` | Không được dùng trong App.tsx (thay bằng RoleGuard) |
| `src/components/Notifications/Toast.tsx` | Standalone Toast, không dùng (app dùng ToastContext) |
| `src/components/ui/BadgeStatus.jsx` | Duplicate với BadgeStatus.tsx |
| `src/types/project.js` | Legacy JS types |
| `src/types/user.js` | Legacy JS types |

---

## 20. NHỮNG VẤN ĐỀ CẦN FIX

| # | Vấn đề | File | Cách fix |
|---|--------|------|---------|
| 1 | Dùng legacy `policiesAPI` | `ProjectErrors.tsx` | Thay bằng `policyApi` từ `api/policyApi.js` |
| 2 | Mock data, không có API | `Tasks.tsx` | Implement `GET /api/projects/my-projects/tasks` hoặc tương đương |
| 3 | `ReviewerDashboard.tsx` dùng mock data | `Reviewer/ReviewerDashboard.tsx` | Implement API thật |
| 4 | `AnnotatorDashboard.tsx` trùng với `TaskList.tsx` | `Annotator/AnnotatorDashboard.tsx` | Xem xét merge hoặc xóa |
| 5 | `ProjectLabels.tsx` fallback mock rules | `ProjectLabels.tsx` | Xóa mock khi API ổn định |
