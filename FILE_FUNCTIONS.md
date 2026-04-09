# FILE FUNCTIONS — Chức năng từng file (ngoài Annotator & Reviewer)

> Mỗi file: làm gì, hiển thị màn hình gì, gọi API nào

---

## AUTH

### `src/pages/Login/Login.tsx`
**Route:** `/login`
**Màn hình:** Trang đăng nhập + đăng ký (2 form trong 1 trang, chuyển đổi bằng state `mode`)
**Hiển thị:**
- Form đăng nhập: username/password, nút đăng nhập, link chuyển sang đăng ký
- Form đăng ký: username, fullName, email, password, confirmPassword
- Background ảnh với bounding box animation (minh họa AI labeling)
**API:**
- `authApi.login()` → `POST /api/auth/login` → nhận `{ accessToken, username, role }`
- `authApi.register()` → `POST /api/auth/register` → tạo tài khoản PENDING

---

### `src/pages/Register/Register.tsx`
**Route:** `/register`
**Màn hình:** Trang đăng ký riêng biệt (dùng `ModernRegisterForm` component)
**Hiển thị:** Form đăng ký với validation
**API:** `authApi.register()` → `POST /api/auth/register`

---

### `src/pages/Unauthorized.tsx`
**Route:** `/unauthorized`
**Màn hình:** Trang "Không có quyền truy cập"
**Hiển thị:** Icon 🚫, thông báo lỗi, nút về trang chủ và nút quay lại
**API:** Không gọi API

---

## ADMIN

### `src/pages/Admin/AdminDashboard.tsx`
**Route:** `/admin/dashboard`
**Màn hình:** Dashboard tổng quan của Admin
**Hiển thị:**
- Tổng số users trong hệ thống
- Biểu đồ thanh phân bổ role (Annotator / Reviewer / Manager / Admin) với % tương ứng
- Danh sách 5 hoạt động gần đây (login, create, update, delete)
- Nút nhanh: Quản lý người dùng, Theo dõi nhật ký
**API:**
- `userApi.getAllUsers({ page: 0, size: 1000 })` → `GET /api/users?page=0&size=1000`
- `activityLogApi.getAllLogs({ page: 0, size: 5 })` → `GET /api/activity-logs?page=0&size=5`

---

### `src/pages/Admin/Users.tsx`
**Route:** `/admin/users`
**Màn hình:** Quản lý toàn bộ người dùng hệ thống
**Hiển thị:**
- Tabs filter: Tất cả / Chờ duyệt / Hoạt động / Bị cấm (kèm số lượng)
- Bảng users: avatar, tên, email, role badge, status badge, ngày tạo, nút hành động
- Nút hành động theo status:
  - PENDING → Duyệt ✔ / Từ chối ✖
  - ACTIVE (không phải ADMIN) → Đổi role / Cấm
  - BANNED/SUSPENDED → Bỏ cấm
- Modal tạo user mới: username, email, fullName, password, chọn role
- Modal đổi role: dropdown chọn role mới
**API:**
- `userApi.getAllUsers({ page: 0, size: 50 })` → `GET /api/users?page=0&size=50`
- `userApi.approveUser(userId)` → `PATCH /api/users/{id}/approve`
- `userApi.rejectUser(userId, reason)` → `PATCH /api/users/{id}/reject?reason=...`
- `userApi.suspendUser(userId)` → `PATCH /api/users/{id}/suspend`
- `userApi.activateUser(userId)` → `PATCH /api/users/{id}/activate`
- `userApi.updateUser(userId, { roleId })` → `PUT /api/users/{id}` (đổi role)
- `userApi.createUser(payload)` → `POST /api/users`

---

### `src/pages/Admin/ActivityLogs.tsx`
**Route:** `/admin/logs`
**Màn hình:** Nhật ký hoạt động toàn hệ thống
**Hiển thị:**
- Bảng logs: thời gian, người dùng (kèm role badge), hành động (badge màu), nội dung
- Filter: tìm kiếm text, dropdown lọc theo action type
- Phân trang
**API:**
- `activityLogApi.getAllLogs({ page, size })` → `GET /api/activity-logs?page=&size=`
- `activityLogApi.getLogsByAction(action)` → `GET /api/activity-logs/action/{action}`
- `activityLogApi.getLogsByDateRange(start, end)` → `GET /api/activity-logs/date-range`

---

### `src/pages/Admin/PendingUsersPage.tsx`
**Route:** Không có route trong App.tsx (dead page)
**Màn hình:** Tài khoản chờ duyệt (chức năng đã được tích hợp vào Users.tsx)
**Hiển thị:** Danh sách users status=PENDING, nút Duyệt/Từ chối
**API:** `userApi.getPendingUsers()`, `userApi.approveUser()`, `userApi.rejectUser()`

---

## MANAGER — Dashboard & Navigation

### `src/pages/Manager/ManagerDashboard.tsx`
**Route:** `/manager/dashboard`
**Màn hình:** Dashboard tổng quan của Manager
**Hiển thị:**
- Header chào mừng + nút hành động nhanh (Tạo dự án, Tạo nhãn, Tạo policy)
- Stats: số projects, số datasets, số annotators
- Danh sách projects của mình (có phân trang 5/trang)
- Panel tiến độ từng annotator: progress bar, số hoàn thành/đang làm/chờ
**API:**
- `projectApi.getMyProjects()` → `GET /api/projects/my-projects`
- `userApi.getAllUsers({ page: 0, size: 200 })` → `GET /api/users?page=0&size=200`
- `assignmentApi.getAssignmentsByProject(projectId)` → `GET /api/projects/{id}/assignments` (loop qua từng project)

---

### `src/pages/Manager/ProjectsPage.tsx`
**Route:** `/manager/projects`
**Màn hình:** Danh sách tất cả projects của Manager
**Hiển thị:**
- Grid/list projects với status badge, loại dữ liệu, số datasets
- Nút tạo project mới (modal)
- Filter theo status
- Nút xem chi tiết → navigate đến ProjectDetail
**API:**
- `projectApi.getMyProjects()` → `GET /api/projects/my-projects`
- `projectApi.createProject(payload)` → `POST /api/projects`
- `projectApi.deleteProject(id)` → `DELETE /api/projects/{id}`
- `projectApi.updateProjectStatus(id, status)` → `PATCH /api/projects/{id}/status`

---

### `src/pages/Manager/ProjectDetail.tsx`
**Route:** `/manager/projects/:projectId`
**Màn hình:** Shell chứa tabs của một project cụ thể
**Hiển thị:**
- Header: tên project, loại dữ liệu, status (với dot màu), ngày tạo, nút back
- Tab navigation: Overview / Data / Labels / Assignments / Errors / Export
- `<Outlet context={{ project }}>` → render tab con tương ứng
**API:**
- `projectApi.getProjectById(projectId)` → `GET /api/projects/{id}` (qua TanStack Query)

---

## MANAGER — Project Tabs

### `src/pages/Manager/ProjectOverview.tsx`
**Route:** `/manager/projects/:id` (tab mặc định)
**Màn hình:** Tổng quan analytics của project
**Hiển thị:**
- 5 KPI cards: Tổng items, Nhóm (team size + điểm TB), Annotations (đã duyệt/chờ/từ chối), Chất lượng (%), Tuân thủ policy (%)
- 2 biểu đồ thanh: Tiến độ gán nhãn / review / duyệt
- Chỉ số chất lượng: accuracy, cân bằng nhãn, nhãn dùng nhiều/ít nhất
- Bảng đóng góp team: thành viên, vai trò, số nhiệm vụ, hoàn thành, điểm
- Cảnh báo tự động (alerts)
- Form soạn thảo Annotation Guideline (text + file URL + version)
**API (qua TanStack Query `fetchProjectOverview`):**
- `analyticsApi.getProjectSummary(id)` → `GET /api/analytics/projects/{id}/summary`
- `analyticsApi.getProjectProgress(id)` → `GET /api/analytics/projects/{id}/progress`
- `analyticsApi.getQualityMetrics(id)` → `GET /api/analytics/projects/{id}/quality`
- `analyticsApi.getTeamContributions(id)` → `GET /api/analytics/projects/{id}/contributions`
- `analyticsApi.getMemberScores(id)` → `GET /api/analytics/projects/{id}/member-scores`
- `assignmentApi.getAssignmentsByProject(id)` → `GET /api/projects/{id}/assignments`
- `datasetApi.getDatasetsByProject(id)` → `GET /api/projects/{id}/datasets`
- `projectApi.updateProject(id, payload)` → `PUT /api/projects/{id}` (lưu guideline)

---

### `src/pages/Manager/ProjectData.tsx`
**Route:** `/manager/projects/:id/data`
**Màn hình:** Quản lý dataset (upload ảnh)
**Hiển thị:**
- Form upload: nhập tên batch, chọn chế độ (files/folder), drag & drop zone
- Danh sách files đã chọn với kích thước, nút xóa từng file
- Progress bar khi đang upload
- Bảng danh sách datasets: tên, số ảnh, status badge, ngày tạo, nút xem ảnh
- Modal xem ảnh trong dataset (`ImagePreviewModal`)
**API:**
- `datasetApi.createDataset(projectId, batchName, files, onProgress)` → `POST /api/projects/{id}/datasets` (multipart)
- `datasetApi.getDatasetsByProject(id)` → `GET /api/projects/{id}/datasets` (TanStack Query, polling 10s)

---

### `src/pages/Manager/ProjectLabels.tsx`
**Route:** `/manager/projects/:id/labels`
**Màn hình:** Quản lý label rules của project
**Hiển thị:**
- Bảng label rules đang gán cho project (tên rule, nội dung, nút gỡ)
- Modal chọn thêm label rules từ danh sách global
- Tìm kiếm rule trong modal
**API:**
- `labelRuleApi.getAllRules()` → `GET /api/label-rules`
- `apiClient.put(/api/projects/{id}/label-rules, { ruleIds })` → gán rules cho project (bulk replace)

---

### `src/pages/Manager/ProjectCreateLabel.tsx`
**Route:** `/manager/projects/:id/labels/new`
**Màn hình:** Form tạo label mới trong context của project
**Hiển thị:** Form: tên nhãn, màu sắc (preset + input hex), loại nhãn, mô tả, phím tắt
**API:** `labelApi.createLabel(payload)` → `POST /api/labels`

---

### `src/pages/Manager/ProjectAssignments.tsx`
**Route:** `/manager/projects/:id/assignments`
**Màn hình:** Quản lý phân công nhiệm vụ
**Hiển thị:**
- Form tạo assignment: 3 dropdown (dataset, annotator, reviewer)
- Bảng assignments: ID, dataset, annotator, reviewer, progress bar, status badge, nút xem/xóa
- Modal xem chi tiết assignment
- Thống kê nhanh: số chờ/đang làm/hoàn thành
**API:**
- `assignmentApi.getAssignmentsByProject(id)` → `GET /api/projects/{id}/assignments` (TanStack Query)
- `datasetApi.getDatasetsByProject(id)` → `GET /api/projects/{id}/datasets` (TanStack Query)
- `userApi.getAllUsers({ page: 0, size: 200 })` → `GET /api/users` (có localStorage fallback khi 403)
- `assignmentApi.createAssignment(projectId, payload)` → `POST /api/projects/{id}/assignments`
- `assignmentApi.deleteAssignment(id)` → `DELETE /api/assignments/{id}` (chỉ khi PENDING)

---

### `src/pages/Manager/ProjectErrors.tsx`
**Route:** `/manager/projects/:id/errors`
**Màn hình:** Quản lý error types (policies) của project
**Hiển thị:**
- Bảng policies đang áp dụng cho project (tên, mức độ, mô tả, nút gỡ)
- Bảng tất cả policies global (tìm kiếm, nút thêm vào project)
**API:**
- `policiesAPI.getAll(0, 200)` → `GET /api/policies?page=0&size=200`
- `policiesAPI.getByProject(pid)` → `GET /api/policies/project/{id}`
- `policiesAPI.assignToProject(pid, policyId)` → `POST /api/policies/assign?projectId=&policyId=`
- `policiesAPI.removeFromProject(pid, policyId)` → `DELETE /api/policies/remove?projectId=&policyId=`

---

### `src/pages/Manager/ProjectExport.tsx`
**Route:** `/manager/projects/:id/export`
**Màn hình:** Xuất dữ liệu annotation
**Hiển thị:**
- Dropdown chọn dataset, dropdown chọn format (COCO JSON / YOLO / Pascal VOC / CSV)
- Mô tả format đang chọn
- Badge trạng thái batch (PENDING/IN_PROGRESS/COMPLETED)
- Cảnh báo nếu batch chưa hoàn thành
- Nút Export (chỉ active khi batchStatus = COMPLETED)
- Bảng lịch sử export trong session (tên dataset, format, tên file, thời gian, trạng thái)
**API:**
- `datasetApi.getDatasetsByProject(id)` → `GET /api/projects/{id}/datasets`
- `assignmentApi.getAssignmentsByProject(id)` → `GET /api/projects/{id}/assignments` (tính batchStatus)
- `datasetApi.exportCoco(id, "APPROVED")` → `GET /api/datasets/{id}/export/coco?status=APPROVED`
- `datasetApi.exportYolo(id, "APPROVED")` → `GET /api/datasets/{id}/export/yolo?status=APPROVED`
- `datasetApi.exportPascalVoc(id, "APPROVED")` → `GET /api/datasets/{id}/export/pascal-voc?status=APPROVED`
- `datasetApi.exportCsv(id, "APPROVED")` → `GET /api/datasets/{id}/export/csv?status=APPROVED`

---

## MANAGER — Global Pages

### `src/pages/Manager/LabelsPage.tsx`
**Route:** `/manager/labels`
**Màn hình:** Quản lý nhãn và quy tắc nhãn toàn hệ thống
**Hiển thị:**
- 2 tabs: Nhãn (Labels) / Quy tắc (Rules)
- Tab Nhãn: grid cards, filter All/Active/Inactive, nút Edit/Deactivate/Reactivate
- Tab Rules: danh sách rules, labels gắn kèm, nút Edit/Attach Labels/Delete
- Modal tạo nhãn: tên, màu, loại, mô tả, phím tắt
- Modal sửa nhãn
- Modal tạo rule: tên, nội dung, chọn labels
- Modal sửa rule
- Modal gắn labels vào rule
**API:**
- `labelApi.getAllLabels()` → `GET /api/labels`
- `labelApi.createLabel(payload)` → `POST /api/labels`
- `labelApi.updateLabel(id, payload)` → `PUT /api/labels/{id}`
- `labelApi.deleteLabel(id)` → `DELETE /api/labels/{id}` (soft delete)
- `labelApi.activateLabel(id)` → `PATCH /api/labels/{id}/activate`
- `labelRuleApi.getAllRules()` → `GET /api/label-rules`
- `labelRuleApi.createRule(payload)` → `POST /api/label-rules`
- `labelRuleApi.updateRule(id, payload)` → `PUT /api/label-rules/{id}`
- `labelRuleApi.deleteRule(id)` → `DELETE /api/label-rules/{id}`
- `labelRuleApi.attachLabels(id, labelIds)` → `POST /api/label-rules/{id}/labels`

---

### `src/pages/Manager/CreateLabel.tsx`
**Route:** `/manager/labels/new`
**Màn hình:** Form tạo nhãn mới (standalone page)
**Hiển thị:** Form: tên nhãn, màu sắc (preset colors + hex input + preview), loại nhãn, mô tả, phím tắt
**API:** `labelApi.createLabel(payload)` → `POST /api/labels`

---

### `src/pages/Manager/PoliciesPage.tsx`
**Route:** `/manager/policies`
**Màn hình:** Quản lý policies (error types) toàn hệ thống
**Hiển thị:**
- Stats: tổng policies, số áp dụng cho projects, số theo mức độ (CRITICAL/HIGH/MEDIUM/LOW)
- Grid cards policies: tên, mã ID, mô tả, danh sách projects áp dụng, nút Edit/Delete
- Modal tạo/sửa policy: tên lỗi, mô tả, mức độ nghiêm trọng
- Modal xem chi tiết: mô tả đầy đủ, danh sách projects áp dụng
- Modal xác nhận xóa
**API:**
- `policyApi.list()` → `GET /api/policies?page=0&size=20`
- `policyApi.getByProject(pid)` → `GET /api/policies/project/{id}` (build map policy→projects)
- `projectApi.getMyProjects()` → `GET /api/projects/my-projects`
- `policyApi.create(payload)` → `POST /api/policies`
- `policyApi.update(id, payload)` → `PUT /api/policies/{id}`
- `policyApi.delete(id)` → `DELETE /api/policies/{id}`

---

### `src/pages/Manager/ErrorTypes.tsx`
**Route:** `/manager/error-types` → redirect sang `/manager/policies`
**Màn hình:** Danh sách error types (legacy, đã redirect)
**Hiển thị:** Bảng policies: tên, mức độ badge, mô tả, nút xóa
**API:** `policiesAPI.getAll(0, 200)` → `GET /api/policies` (dùng services/api.ts legacy)

---

### `src/pages/Manager/ActivityLogs.tsx`
**Route:** Không có route trong App.tsx (dead page)
**Màn hình:** Nhật ký hoạt động dành cho Manager
**Hiển thị:** Bảng logs với filter action type, phân trang
**API:** `activityLogApi.getAllLogs()` → `GET /api/activity-logs`

---

### `src/pages/Manager/Tasks.tsx`
**Route:** `/manager/tasks`
**Màn hình:** Quản lý nhiệm vụ (dùng mock data)
**Hiển thị:**
- Dropdown filter theo status
- Bảng tasks: tên task, project, người được giao, status badge, progress bar, ngày tạo, nút xem
- Modal xem chi tiết task
**API:** Không gọi API thật — dùng `getMockData()` từ `utils/mockStorage.ts` (localStorage)

---

### `src/pages/Manager/UploadData.tsx`
**Route:** `/manager/upload-data` (legacy route)
**Màn hình:** Upload dữ liệu standalone (phiên bản cũ của ProjectData)
**Hiển thị:**
- Dropdown chọn project, nhập tên batch
- Toggle chế độ upload (files/folder), drag & drop zone
- Danh sách files đã chọn
- Bảng datasets của project đã chọn
**API:**
- `projectApi.getMyProjects()` → `GET /api/projects/my-projects`
- `datasetApi.createDataset(projectId, batchName, files)` → `POST /api/projects/{id}/datasets`
- `datasetApi.getDatasetsByProject(id)` → `GET /api/projects/{id}/datasets`

---

## TỔNG HỢP THEO ROLE

| Role | Trang chính | Số trang |
|------|------------|---------|
| ADMIN | AdminDashboard, Users, ActivityLogs | 3 (+ 1 dead) |
| MANAGER | ManagerDashboard, ProjectsPage, ProjectDetail + 6 tabs, LabelsPage, PoliciesPage, Tasks, UploadData | 13 |
| AUTH | Login, Register, Unauthorized | 3 |

## TỔNG HỢP API THEO TRANG

| Trang | Số API calls | API files dùng |
|-------|-------------|---------------|
| AdminDashboard | 2 | userApi, activityLogApi |
| Admin/Users | 7 | userApi |
| Admin/ActivityLogs | 3 | activityLogApi |
| ManagerDashboard | 3+ | projectApi, userApi, assignmentApi |
| ProjectsPage | 4 | projectApi |
| ProjectDetail | 1 | projectApi |
| ProjectOverview | 7 | analyticsApi, projectApi, assignmentApi, datasetApi |
| ProjectData | 2 | datasetApi |
| ProjectLabels | 2 | labelRuleApi, apiClient |
| ProjectAssignments | 4 | assignmentApi, datasetApi, userApi |
| ProjectErrors | 4 | policiesAPI (services/api.ts) |
| ProjectExport | 6 | datasetApi, assignmentApi |
| LabelsPage | 10 | labelApi, labelRuleApi |
| PoliciesPage | 5 | policyApi, projectApi |
| Tasks | 0 | mockStorage (localStorage) |
| UploadData | 3 | projectApi, datasetApi |
