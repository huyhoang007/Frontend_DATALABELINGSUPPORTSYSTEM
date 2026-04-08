# Study Guide

Tai lieu nay giup hoc nhanh codebase trong 24 gio.

## Doc theo thu tu nay

1. `src/main.tsx`
   Diem vao cua frontend. Noi app voi React Query, AuthContext, ToastContext va i18n.

2. `src/App.tsx`
   Ban do route toan he thong. Neu muon biet man hinh nao hien ra o dau, doc file nay truoc.

3. `src/components/Common/RoleGuard.tsx`
   Giai thich cach phan quyen va redirect theo role.

4. `src/context/AuthContext.tsx`
   Giai thich login, logout, session timeout va user hien tai.

5. `src/api/apiClient.js`
   File quan trong nhat de hieu frontend noi backend the nao.

6. `src/api/*.js`
   Moi file la 1 nhom API: auth, user, project, dataset, label, review...

## Cach doc theo role

- Admin:
  `src/pages/Admin/AdminDashboard.tsx`
  `src/pages/Admin/Users.tsx`
  `src/pages/Admin/ActivityLogs.tsx`

- Manager:
  `src/pages/Manager/ManagerDashboard.tsx`
  `src/pages/Manager/ProjectsPage.tsx`
  `src/pages/Manager/ProjectDetail.tsx`
  `src/pages/Manager/ProjectOverview.tsx`
  `src/pages/Manager/ProjectData.tsx`
  `src/pages/Manager/ProjectAssignments.tsx`
  `src/pages/Manager/ProjectLabels.tsx`
  `src/pages/Manager/ProjectExport.tsx`
  `src/pages/Manager/ProjectErrors.tsx`
  `src/pages/Manager/LabelsPage.tsx`
  `src/pages/Manager/PoliciesPage.tsx`

- Annotator:
  `src/pages/Annotator/TaskList.tsx`
  `src/pages/Annotator/Workspace.tsx`
  `src/pages/Annotator/useAnnotations.js`
  `src/pages/Annotator/useDrawingTools.js`
  `src/components/LabelSummaryPanel.tsx`

- Reviewer:
  `src/pages/Reviewer/ReviewQueue.tsx`
  `src/pages/Reviewer/ReviewWorkspace.tsx`
  `src/pages/Reviewer/useReviewWorkspace.js`

## Quy uoc hien tai cua project

- `src/pages/*`: Man hinh theo route
- `src/components/*`: Thanh phan giao dien dung lai
- `src/api/*`: Goi backend
- `src/context/*`: State toan cuc
- `src/query/*`: React Query layer
- `src/utils/*`: Ham phu tro

## File dang dung that

- `src/components/Auth/RegisterForm.tsx`: Form dang ky dang dung
- `src/components/Common/RoleGuard.tsx`: Guard dang dung
- `src/api/apiClient.js`: API client dang dung
- `src/components/LabelSummaryPanel.tsx`: Panel dang dung trong workspace annotator

## File can can than

- `src/components/Common/ProtectedRoute.tsx`: Legacy, khong phai guard chinh
- `src/pages/Admin/PendingUsersPage.tsx`: Dang khong duoc route
- `src/services/api.ts`: Legacy service layer nhung van con duoc mot so man manager dung
- `src/pages/Annotator__backup_before_swap/*`: File backup, khong phai code chinh

## Cach sua code an toan

1. Tim route trong `src/App.tsx`
2. Tim page tuong ung trong `src/pages`
3. Tim API duoc page goi trong `src/api` hoac `src/services/api.ts`
4. Neu page co modal/form, tim tiep trong `src/components`
5. Sau khi sua xong, chay build de kiem tra

## Bai thuyet trinh ngan gon

- Frontend dung React + Vite + React Router + React Query
- App chia theo 4 role: admin, manager, annotator, reviewer
- `App.tsx` dinh nghia route theo role
- `RoleGuard` kiem soat truy cap
- `apiClient.js` xu ly token, loi va session
- Moi module nghiep vu co page rieng va file API rieng
