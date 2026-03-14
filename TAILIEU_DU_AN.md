# TÀI LIỆU DỰ ÁN: HỆ THỐNG HỖ TRỢ GÁN NHÃN DỮ LIỆU (DataLabel)

> Tài liệu này mô tả toàn bộ kiến trúc, chức năng đã triển khai, và các chức năng có thể mở rộng từ Backend.

---

## 1. TỔNG QUAN HỆ THỐNG

**Tên dự án:** Data Labeling Support System (DataLabel)  
**Mục tiêu:** Nền tảng nội bộ hỗ trợ quản lý, phân công và theo dõi tiến độ gán nhãn dữ liệu cho các dự án AI/ML.

### Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 18, TypeScript/JSX, Tailwind CSS, React Router v6 |
| Backend | Java Spring Boot, Spring Security (JWT), JPA/Hibernate |
| Database | PostgreSQL |
| File Storage | Azure Blob Storage |
| Auth | JWT Bearer Token |
| API Docs | Swagger/OpenAPI 3 |

---

## 2. KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  Login → Role-based routing → Dashboard/Workspace/...   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST (JWT Bearer)
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND (Spring Boot)                   │
│  AuthController → UserController → ProjectController    │
│  AssignmentController → AnnotationController            │
│  DatasetController → LabelController → PolicyController │
│  ActivityLogController → ProjectAnalyticsController     │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼──────┐            ┌────────▼────────┐
│  PostgreSQL  │            │  Azure Blob     │
│  (dữ liệu)  │            │  (file ảnh)     │
└──────────────┘            └─────────────────┘
```

---

## 3. PHÂN QUYỀN (ROLES)

| Role | ID | Mô tả |
|---|---|---|
| ADMIN | 1 | Quản trị hệ thống, quản lý người dùng |
| MANAGER | 2 | Tạo dự án, phân công, theo dõi tiến độ |
| ANNOTATOR | 3 | Thực hiện gán nhãn dữ liệu |
| REVIEWER | 4 | Kiểm duyệt kết quả gán nhãn |

### Luồng đăng ký tài khoản
- Người dùng tự đăng ký → status = **PENDING**
- Admin duyệt → status = **ACTIVE** (mới được đăng nhập)
- Admin có thể: Approve / Reject / Suspend / Activate / Ban

---

## 4. LUỒNG NGHIỆP VỤ CHÍNH

### 4.1 Luồng gán nhãn hoàn chỉnh

```
MANAGER tạo Project
    → Upload Dataset (batch ảnh)
    → Tạo Labels (nhãn phân loại)
    → Tạo Policies (quy tắc lỗi)
    → Tạo Assignment (giao dataset cho Annotator + Reviewer)
         ↓
ANNOTATOR nhận task
    → Mở Workspace (gán nhãn từng ảnh)
    → Lưu annotations
    → Submit assignment
         ↓
REVIEWER nhận assignment đã submit
    → Mở Review Workspace
    → Duyệt từng annotation (Approve/Reject + gắn Policy lỗi)
    → Submit review
         ↓
Kết quả: APPROVED / REJECTED
    → Nếu REJECTED: Annotator sửa lại (fix) → Submit lại
         ↓
MANAGER xem Analytics, Export dữ liệu
```

### 4.2 Trạng thái Assignment

```
PENDING → IN_PROGRESS → SUBMITTED → APPROVED
                                  ↘ REJECTED → (Annotator fix) → SUBMITTED
```

### 4.3 Trạng thái Annotation (Reviewing)

```
PENDING → APPROVED
        ↘ REJECTED → IMPROVED (sau khi annotator sửa)
```

---

## 5. DANH SÁCH API BACKEND ĐÃ TRIỂN KHAI

### 5.1 Authentication (`/api/auth`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản mới | Public |
| POST | `/api/auth/login` | Đăng nhập, nhận JWT | Public |

**Response login:**
```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "username": "john",
  "role": "ANNOTATOR"
}
```

---

### 5.2 User Management (`/api/users`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/api/users` | Lấy tất cả users (phân trang) | ADMIN, MANAGER |
| GET | `/api/users/me` | Xem profile bản thân | Tất cả |
| PUT | `/api/users/me` | Cập nhật profile bản thân | Tất cả |
| GET | `/api/users/{userId}` | Xem user theo ID | ADMIN |
| PUT | `/api/users/{userId}` | Cập nhật user | ADMIN hoặc chính user |
| POST | `/api/users` | Tạo user mới | ADMIN |
| GET | `/api/users/pending` | Danh sách chờ duyệt | ADMIN |
| PATCH | `/api/users/{userId}/approve` | Duyệt user | ADMIN |
| PATCH | `/api/users/{userId}/reject` | Từ chối user | ADMIN |
| PATCH | `/api/users/{userId}/suspend` | Tạm khóa user | ADMIN |
| PATCH | `/api/users/{userId}/activate` | Kích hoạt lại user | ADMIN |
| PATCH | `/api/users/{userId}/ban` | Cấm vĩnh viễn | ADMIN |
| PATCH | `/api/users/{userId}/unban` | Bỏ cấm | ADMIN |
| DELETE | `/api/users/{userId}` | Xóa user | ADMIN |

---

### 5.3 Project Management (`/api/projects`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/api/projects` | Tạo dự án mới | MANAGER |
| GET | `/api/projects/my-projects` | Lấy dự án của tôi | MANAGER |
| GET | `/api/projects/{projectId}` | Chi tiết dự án | MANAGER |
| PUT | `/api/projects/{projectId}` | Cập nhật dự án | MANAGER |
| PATCH | `/api/projects/{projectId}/status` | Đổi trạng thái | MANAGER |
| DELETE | `/api/projects/{projectId}` | Xóa dự án | MANAGER |
| GET | `/api/projects/{projectId}/label-rules` | Lấy label rules | MANAGER, ANNOTATOR |
| PUT | `/api/projects/{projectId}/label-rules` | Gán label rules | MANAGER |

**Trạng thái project:** `ACTIVE` / `INACTIVE` / `COMPLETED`

---

### 5.4 Dataset Management (`/api/projects/{projectId}/datasets`, `/api/datasets`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/api/projects/{projectId}/datasets` | Upload batch ảnh mới | MANAGER |
| GET | `/api/projects/{projectId}/datasets` | Danh sách batch | MANAGER |
| GET | `/api/datasets/{datasetId}/items` | Danh sách ảnh trong batch | MANAGER |
| PATCH | `/api/datasets/{datasetId}` | Đổi tên batch | MANAGER |
| POST | `/api/datasets/{datasetId}/items` | Thêm ảnh vào batch | MANAGER |
| DELETE | `/api/items/{itemId}` | Xóa mềm 1 ảnh | MANAGER |

**Export formats:**

| Method | Endpoint | Format |
|---|---|---|
| GET | `/api/datasets/{id}/export/json` | Custom JSON |
| GET | `/api/datasets/{id}/export/csv` | CSV |
| GET | `/api/datasets/{id}/export/coco` | COCO JSON |
| GET | `/api/datasets/{id}/export/yolo` | YOLO ZIP |
| GET | `/api/datasets/{id}/export/pascal-voc` | Pascal VOC ZIP |

> Tham số `?status=APPROVED|PENDING|REJECTED|IMPROVED|ALL`

---

### 5.5 Assignment Management (`/api/projects/{projectId}/assignments`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/api/projects/{projectId}/assignments` | Tạo phân công | MANAGER |
| GET | `/api/projects/{projectId}/assignments` | Danh sách phân công | MANAGER |
| DELETE | `/api/assignments/{assignmentId}` | Xóa phân công (chỉ PENDING) | MANAGER |

---

### 5.6 Annotation / Workspace (Annotator)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/api/my-assignments` | Danh sách task được giao | ANNOTATOR |
| GET | `/api/assignments/{id}/workspace` | Mở workspace gán nhãn | ANNOTATOR |
| GET | `/api/assignments/{id}/items/{itemId}/annotations` | Lấy annotations theo ảnh | ANNOTATOR |
| POST | `/api/assignments/{id}/annotations` | Lưu annotations (replace toàn bộ) | ANNOTATOR |
| PUT | `/api/assignments/{id}/annotations/fix` | Sửa sau khi bị reject | ANNOTATOR |
| POST | `/api/assignments/{id}/submit` | Nộp để reviewer duyệt | ANNOTATOR |

---

### 5.7 Review / Workspace (Reviewer)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/api/my-review-assignments` | Danh sách assignment cần duyệt | REVIEWER |
| GET | `/api/assignments/{id}/review-workspace` | Mở workspace duyệt | REVIEWER |
| GET | `/api/assignments/{id}/review-annotations` | Tất cả annotations của assignment | REVIEWER |
| GET | `/api/assignments/{id}/items/{itemId}/review-annotations` | Annotations theo ảnh | REVIEWER |
| POST | `/api/annotations/{reviewingId}/review` | Duyệt 1 annotation | REVIEWER |
| POST | `/api/assignments/{id}/submit-review` | Nộp kết quả duyệt | REVIEWER |

---

### 5.8 Label Management (`/api/labels`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/api/labels` | Tạo nhãn mới | MANAGER |
| GET | `/api/labels` | Tất cả nhãn | MANAGER, ANNOTATOR, REVIEWER |
| GET | `/api/labels/active` | Nhãn đang active | MANAGER, ANNOTATOR, REVIEWER |
| GET | `/api/labels/{id}` | Chi tiết nhãn | MANAGER, ANNOTATOR, REVIEWER |
| PUT | `/api/labels/{id}` | Cập nhật nhãn | MANAGER |
| DELETE | `/api/labels/{id}` | Xóa mềm nhãn | MANAGER |

---

### 5.9 Policy Management (`/api/policies`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/api/policies` | Tạo policy lỗi | MANAGER |
| GET | `/api/policies` | Danh sách policies | MANAGER, REVIEWER |
| GET | `/api/policies/{id}` | Chi tiết policy | MANAGER, REVIEWER |
| GET | `/api/policies/error-level/{level}` | Lọc theo mức lỗi | MANAGER |
| PUT | `/api/policies/{id}` | Cập nhật policy | MANAGER |
| DELETE | `/api/policies/{id}` | Xóa policy | MANAGER |
| POST | `/api/policies/assign` | Gán policy vào project | MANAGER |
| DELETE | `/api/policies/remove` | Gỡ policy khỏi project | MANAGER |
| GET | `/api/policies/project/{projectId}` | Policies của project | MANAGER, REVIEWER |

**Mức lỗi (ErrorLevel):** `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`

---

### 5.10 Analytics (`/api/analytics/projects/{projectId}`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `.../progress` | Tiến độ dự án | MANAGER |
| GET | `.../quality` | Chỉ số chất lượng | MANAGER |
| GET | `.../contributions` | Đóng góp của team | MANAGER |
| GET | `.../contributions/{userId}` | Đóng góp của 1 người | MANAGER |
| GET | `.../components` | Chất lượng từng thành phần | MANAGER |
| GET | `.../summary` | Tóm tắt toàn diện | MANAGER |

---

### 5.11 Activity Logs (`/api/activity-logs`)

| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/api/activity-logs` | Tất cả logs (phân trang) | ADMIN |
| GET | `/api/activity-logs/user/{userId}` | Logs theo user | ADMIN |
| GET | `/api/activity-logs/action/{action}` | Logs theo hành động | ADMIN |
| GET | `/api/activity-logs/target/{target}` | Logs theo đối tượng | ADMIN |
| GET | `/api/activity-logs/date-range` | Logs theo khoảng thời gian | ADMIN |

> Activity logs được ghi tự động qua **AOP (ActivityLogAspect)** — không cần gọi thủ công.

---

## 6. CÁC TRANG FRONTEND ĐÃ TRIỂN KHAI

### Admin
| Route | Trang | Chức năng |
|---|---|---|
| `/admin/dashboard` | AdminDashboard | Tổng quan hệ thống |
| `/admin/users` | Users | Quản lý người dùng, duyệt tài khoản |
| `/admin/logs` | ActivityLogs | Xem nhật ký hoạt động |

### Manager
| Route | Trang | Chức năng |
|---|---|---|
| `/manager/dashboard` | ManagerDashboard | Dashboard + tiến độ annotators |
| `/manager/projects` | Projects | Danh sách dự án |
| `/manager/projects/:id` | ProjectDetail | Chi tiết dự án (tabs) |
| `/manager/projects/:id/data` | ProjectData | Upload/quản lý dataset |
| `/manager/projects/:id/labels` | ProjectLabels | Nhãn của dự án |
| `/manager/projects/:id/assignments` | ProjectAssignments | Phân công |
| `/manager/projects/:id/export` | ProjectExport | Xuất dữ liệu |
| `/manager/labels` | Labels | Quản lý nhãn toàn cục |
| `/manager/policies` | Policies | Quản lý policy lỗi |

### Annotator
| Route | Trang | Chức năng |
|---|---|---|
| `/annotator/dashboard` | AnnotatorDashboard | Tiến độ cá nhân |
| `/annotator/tasks` | TaskList | Danh sách task được giao |
| `/annotator/task/:taskId` | Workspace | Gán nhãn ảnh (bounding box, polygon...) |

### Reviewer
| Route | Trang | Chức năng |
|---|---|---|
| `/reviewer/queue` | ReviewQueue | Danh sách assignment cần duyệt |
| `/reviewer/review/:assignmentId` | ReviewWorkspace | Duyệt annotations |

---

## 7. CÁC CHỨC NĂNG CÓ THỂ MỞ RỘNG TỪ BACKEND

Backend đã có đầy đủ API nhưng Frontend chưa tận dụng hết. Dưới đây là các chức năng có thể thêm vào:

### 7.1 Analytics Dashboard cho Manager (API đã có, UI chưa làm)
- **API:** `/api/analytics/projects/{id}/summary`, `/progress`, `/quality`, `/contributions`
- **Có thể làm:** Trang phân tích chi tiết từng dự án với biểu đồ tiến độ, chất lượng, đóng góp từng thành viên

### 7.2 Xóa Policy khỏi Project (API đã có)
- **API:** `DELETE /api/policies/remove?projectId=&policyId=`
- **Có thể làm:** Nút "Gỡ policy" trong trang quản lý policy của project

### 7.3 Lọc Policy theo mức lỗi (API đã có)
- **API:** `GET /api/policies/error-level/{LOW|MEDIUM|HIGH|CRITICAL}`
- **Có thể làm:** Filter dropdown trong trang Policies

### 7.4 Xem đóng góp cá nhân (API đã có)
- **API:** `GET /api/analytics/projects/{id}/contributions/{userId}`
- **Có thể làm:** Click vào annotator trong dashboard để xem chi tiết đóng góp

### 7.5 Cập nhật tên Dataset (API đã có)
- **API:** `PATCH /api/datasets/{datasetId}` với `{ "name": "..." }`
- **Có thể làm:** Nút đổi tên batch trong trang ProjectData

### 7.6 Thêm ảnh vào batch đã tồn tại (API đã có)
- **API:** `POST /api/datasets/{datasetId}/items`
- **Có thể làm:** Nút "Thêm ảnh" trong batch đã tạo

### 7.7 Xóa mềm ảnh trong dataset (API đã có)
- **API:** `DELETE /api/items/{itemId}`
- **Có thể làm:** Nút xóa từng ảnh trong danh sách items

### 7.8 Reviewer xem toàn bộ annotations của assignment (API đã có)
- **API:** `GET /api/assignments/{id}/review-annotations`
- **Có thể làm:** Trang tổng hợp tất cả annotations trước khi vào workspace

### 7.9 Lọc Activity Logs theo action/target/date (API đã có)
- **API:** `/api/activity-logs/action/{action}`, `/target/{target}`, `/date-range`
- **Có thể làm:** Bộ lọc nâng cao trong trang Activity Logs của Admin

### 7.10 Reviewer Dashboard (chưa có trang riêng)
- **API:** `/api/my-review-assignments` đã có
- **Có thể làm:** Trang dashboard cho Reviewer với thống kê số lượng đã duyệt, tỷ lệ approve/reject

### 7.11 Export dữ liệu từ trang Manager (UI chưa hoàn thiện)
- **API:** 5 format export đã có (JSON, CSV, COCO, YOLO, Pascal VOC)
- **Có thể làm:** Trang export với preview và download từng format

### 7.12 Label Rules (API đã có, UI chưa đầy đủ)
- **API:** `GET/PUT /api/projects/{id}/label-rules`
- **Có thể làm:** Giao diện gán label rules vào project, annotator thấy rules khi gán nhãn

---

## 8. CẤU TRÚC DỮ LIỆU CHÍNH

### User
```
userId, username, email, fullName, role (ADMIN/MANAGER/ANNOTATOR/REVIEWER), 
status (PENDING/ACTIVE/SUSPENDED/REJECTED/BANNED), createdAt
```

### Project
```
projectId, name, dataType, description, status (ACTIVE/INACTIVE/COMPLETED),
managerId, createdAt, datasets[], policies[]
```

### Dataset (Batch)
```
datasetId, name, status (PENDING/ASSIGNED/COMPLETED), projectId, 
totalItems, createdAt, items[]
```

### Assignment
```
assignmentId, projectId, datasetId, annotatorId, reviewerId,
status (PENDING/IN_PROGRESS/SUBMITTED/APPROVED/REJECTED), 
progress (%), createdAt, completedAt
```

### Annotation (Reviewing)
```
reviewingId, itemId, labelId, labelName, colorCode, labelType,
geometry (JSON - bbox/polygon/point), 
status (PENDING/APPROVED/REJECTED/IMPROVED), isImproved
```

### Label
```
labelId, labelName, colorCode, labelType, description, shortcutKey, isActive
```

### Policy
```
policyId, errorName, description, errorLevel (LOW/MEDIUM/HIGH/CRITICAL)
```

---

## 9. BẢO MẬT

- **JWT Authentication:** Token được gửi qua header `Authorization: Bearer {token}`
- **Role-based Authorization:** Mỗi endpoint được bảo vệ bằng `@PreAuthorize`
- **Activity Logging:** Mọi hành động quan trọng được ghi log tự động qua AOP
- **Frontend Route Guard:** `RoleGuard` component kiểm tra role trước khi render trang

---

## 10. ĐIỂM NỔI BẬT KỸ THUẬT

1. **Workspace gán nhãn:** Hỗ trợ vẽ bounding box, polygon trực tiếp trên ảnh với undo/redo
2. **Export đa định dạng:** JSON, CSV, COCO, YOLO, Pascal VOC — phục vụ nhiều framework ML khác nhau
3. **Azure Blob Storage:** File ảnh được lưu trên cloud, không lưu local
4. **AOP Activity Logging:** Tự động ghi log mà không cần code thủ công trong từng service
5. **Phân quyền 4 cấp:** Admin → Manager → Annotator → Reviewer với luồng nghiệp vụ rõ ràng
6. **Analytics API:** Theo dõi tiến độ, chất lượng, đóng góp theo thời gian thực
