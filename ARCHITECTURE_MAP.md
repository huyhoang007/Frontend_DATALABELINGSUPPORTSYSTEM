# Architecture Map

## Luong tong quan

`src/main.tsx`
-> khoi tao provider
-> render `src/App.tsx`
-> route vao tung `layout`
-> layout render `page`
-> page goi `api/*`
-> backend tra du lieu
-> page render bang `components/*`

## Route map

- `/login` -> `src/pages/Login/Login.tsx`
- `/register` -> `src/pages/Register/Register.tsx`
- `/admin/*` -> `src/layouts/AdminLayout.tsx` + `src/pages/Admin/*`
- `/manager/*` -> `src/layouts/ManagerLayout.tsx` + `src/pages/Manager/*`
- `/annotator/*` -> `src/layouts/AnnotatorLayout.tsx` + `src/pages/Annotator/*`
- `/reviewer/*` -> `src/layouts/ReviewerLayout.tsx` + `src/pages/Reviewer/*`

## Bao ve route

- `src/context/AuthContext.tsx`: giu user va session
- `src/components/Common/RoleGuard.tsx`: chan truy cap sai role

## Backend layer

- `src/api/apiClient.js`: client trung tam
- `src/api/authApi.js`: dang nhap, dang ky
- `src/api/userApi.js`: nguoi dung
- `src/api/projectApi.js`: du an
- `src/api/datasetApi.js`: du lieu
- `src/api/assignmentApi.js`: phan cong
- `src/api/annotationApi.js`: gan nhan
- `src/api/reviewApi.js`: review
- `src/api/labelApi.js`: nhan
- `src/api/labelRuleApi.js`: rule nhan
- `src/api/policyApi.js`: policy / error type
- `src/api/analyticsApi.js`: thong ke

## Cac diem can nho khi sua

- Manager la cum man hinh lon nhat va de hoi dong hoi nhat
- Annotator workspace la man hinh phuc tap nhat
- `src/services/api.ts` la legacy nhung chua xoa duoc
- `src/pages/Annotator__backup_before_swap` chi la backup
