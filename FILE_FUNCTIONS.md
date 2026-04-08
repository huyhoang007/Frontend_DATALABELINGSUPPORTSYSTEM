# Chuc Nang Tung File

Tai lieu nay mo ta ngan gon vai tro cua tung file trong frontend hien tai.

## Thu muc goc

- `.gitignore`: Khai bao file va thu muc khong dua vao Git.
- `DOCUMENTATION.md`: Tai lieu ky thuat tong quan cua du an, mo ta module va luong nghiep vu chinh.
- `eslint.config.js`: Cau hinh quy tac lint cho JavaScript, TypeScript va React.
- `index.html`: HTML goc de Vite gan ung dung React vao `#root`.
- `package-lock.json`: Khoa phien ban dependency de cai dat dong nhat.
- `package.json`: Khai bao thong tin du an, script build/chay va danh sach dependency.
- `postcss.config.js`: Cau hinh PostCSS cho Tailwind va Autoprefixer.
- `README.md`: Huong dan khoi dong nhanh va gioi thieu du an.
- `tailwind.config.js`: Cau hinh theme, mau, token va utility cho Tailwind CSS.
- `tsconfig.json`: Cau hinh TypeScript cho trinh bien dich va IDE.
- `vite.config.js`: Cau hinh Vite, plugin React va proxy/dev server.

## public

- `public/favicon.ico`: Icon tab trinh duyet.
- `public/index.html`: Ban HTML public du phong.
- `public/login-bg.jpg`: Anh nen man hinh dang nhap.
- `public/logo.svg`: Logo vector dung trong giao dien.
- `public/logo192.png`: Logo kich thuoc 192x192 cho PWA/icon.
- `public/logo512.png`: Logo kich thuoc 512x512 cho PWA/icon.
- `public/manifest.json`: Cau hinh manifest cho cai dat web app.
- `public/robots.txt`: Chi dan cho bot tim kiem.
- `public/vite.svg`: Tai nguyen mac dinh cua Vite.

## src goc

- `src/App.tsx`: Dinh nghia routing toan bo he thong, phan quyen theo role va map route den page/layout tuong ung.
- `src/index.css`: CSS global, token mau, utility layer va style dung chung.
- `src/logo.svg`: Logo SVG su dung trong phan ma nguon.
- `src/main.tsx`: Diem vao cua app, mount React, khoi tao i18n, React Query, AuthContext va ToastContext.
- `src/vite-env.d.ts`: Khai bao kieu cho bien moi truong cua Vite.

## src/api

- `src/api/activityLogApi.js`: Goi API xem danh sach nhat ky hoat dong, loc theo user, hanh dong, thoi gian.
- `src/api/adapters.js`: Chuyen doi du lieu giua dinh dang frontend va DTO backend.
- `src/api/analyticsApi.js`: Goi API thong ke du an, tien do, chat luong va dong gop thanh vien.
- `src/api/annotationApi.js`: Goi API cho workspace gan nhan, tai task, luu ban ve, nop ket qua.
- `src/api/apiClient.js`: Axios client trung tam, tu gan token, xu ly 401/403, gia han session va chuan hoa loi.
- `src/api/assignmentApi.js`: Goi API quan ly phan cong annotator/reviewer theo project va dataset.
- `src/api/authApi.js`: Goi API dang nhap, dang ky va nghiep vu lien quan xac thuc.
- `src/api/datasetApi.js`: Goi API upload dataset, doc danh sach item, them/xoa file va export du lieu.
- `src/api/labelApi.js`: Goi API CRUD label va thao tac kich hoat/vo hieu hoa label.
- `src/api/labelRuleApi.js`: Goi API CRUD rule va lien ket rule voi nhom label.
- `src/api/policyApi.js`: Goi API CRUD policy va gan policy cho project.
- `src/api/projectApi.js`: Goi API CRUD project, lay chi tiet, cap nhat trang thai va danh sach project.
- `src/api/reviewApi.js`: Goi API cho reviewer, tai assignment, danh gia va nop ket qua review.
- `src/api/userApi.js`: Goi API quan ly nguoi dung, phe duyet, khoa, mo khoa, cap nhat trang thai.

## src/assets

- `src/assets/language-en.png`: Icon co/ngon ngu tieng Anh.
- `src/assets/language-vn.png`: Icon co/ngon ngu tieng Viet.
- `src/assets/react.svg`: Tai nguyen SVG mac dinh cua React/Vite.

## src/components

- `src/components/DevHealthCheck.tsx`: Trang kiem tra nhanh backend, ping API health trong moi truong dev.
- `src/components/LabelSummaryPanel.tsx`: Panel thong ke nhan, so shape va ty le annotate trong workspace.

### src/components/Auth

- `src/components/Auth/ModernRegisterForm.tsx`: Form dang ky giao dien moi, gom validate va submit du lieu dang ky.

### src/components/Common

- `src/components/Common/LoadingSpinner.tsx`: Hien thi spinner tai trang thai dang tai.
- `src/components/Common/LogoutButton.tsx`: Nut dang xuat dung chung.
- `src/components/Common/NotFound.tsx`: Giao dien 404 khi route khong ton tai.
- `src/components/Common/ProtectedRoute.tsx`: Component bao ve route kieu cu, hien dang de lai cho tuong thich.
- `src/components/Common/RoleGuard.tsx`: Bao ve route theo role, redirect ve login hoac unauthorized neu khong hop le.

### src/components/dev

- `src/components/dev/SourceInspector.tsx`: Cong cu dev de soi thong tin nguon du lieu hoac metadata trong luc debug.

### src/components/i18n

- `src/components/i18n/LanguageSwitcher.tsx`: Nut chuyen ngon ngu VI/EN, hien thi noi tren giao dien.

### src/components/layout

- `src/components/layout/Sidebar.tsx`: Thanh dieu huong ben trai theo tung role.
- `src/components/layout/WorkspaceLayout.tsx`: Khung 3 cot cho man hinh workspace annotator/reviewer.

### src/components/Manager

- `src/components/Manager/ImagePreviewModal.tsx`: Modal xem truoc anh dataset, chuyen anh, xoa anh va them anh.

### src/components/Modals

- `src/components/Modals/ConfirmDialog.tsx`: Hop thoai xac nhan hanh dong voi cac muc do canh bao khac nhau.

### src/components/Notifications

- `src/components/Notifications/Toast.tsx`: Hien thi thong bao toast cho thanh cong, loi, canh bao va thong tin.

### src/components/ui

- `src/components/ui/BadgeStatus.tsx`: Hien thi badge mau theo trang thai.
- `src/components/ui/Button.tsx`: Button dung chung co variant, icon va loading state.
- `src/components/ui/Card.tsx`: Khung card dung chung cho cac panel/noi dung.
- `src/components/ui/Input.tsx`: O nhap lieu dung chung co label va hien loi.
- `src/components/ui/Modal.tsx`: Modal dialog dung chung, xu ly portal va dong mo.
- `src/components/ui/Table.tsx`: Bo component bang du lieu co header, row va cell.
- `src/components/ui/ThemeToggle.tsx`: Nut doi theme, hien tai chi giu vai tro giao dien.

## src/config

- `src/config/featureFlags.js`: Quan ly cac co bat/tat tinh nang de thu nghiem hoac toi uu hieu nang.

## src/context

- `src/context/AuthContext.tsx`: Quan ly user dang nhap, session timeout, login, logout va register.
- `src/context/ThemeContext.tsx`: Cung cap context theme cho toan app.
- `src/context/ToastContext.tsx`: Cung cap ham tao toast va danh sach toast toan cuc.

## src/i18n

- `src/i18n/helpers.js`: Ham ho tro xu ly namespace, key va logic phu cho da ngon ngu.
- `src/i18n/index.js`: Khoi tao i18next, nap resource VI/EN va cau hinh ngon ngu mac dinh.

### src/i18n/locales/en

- `src/i18n/locales/en/admin.js`: Chuoi tieng Anh cho man hinh admin.
- `src/i18n/locales/en/annotator.js`: Chuoi tieng Anh cho man hinh annotator.
- `src/i18n/locales/en/auth.js`: Chuoi tieng Anh cho dang nhap, dang ky, xac thuc.
- `src/i18n/locales/en/common.js`: Chuoi tieng Anh dung chung.
- `src/i18n/locales/en/manager.js`: Chuoi tieng Anh cho man hinh manager.
- `src/i18n/locales/en/reviewer.js`: Chuoi tieng Anh cho man hinh reviewer.
- `src/i18n/locales/en/role.js`: Chuoi tieng Anh cho ten role.
- `src/i18n/locales/en/status.js`: Chuoi tieng Anh cho trang thai he thong.

### src/i18n/locales/vi

- `src/i18n/locales/vi/admin.js`: Chuoi tieng Viet cho man hinh admin.
- `src/i18n/locales/vi/annotator.js`: Chuoi tieng Viet cho man hinh annotator.
- `src/i18n/locales/vi/auth.js`: Chuoi tieng Viet cho dang nhap, dang ky, xac thuc.
- `src/i18n/locales/vi/common.js`: Chuoi tieng Viet dung chung.
- `src/i18n/locales/vi/manager.js`: Chuoi tieng Viet cho man hinh manager.
- `src/i18n/locales/vi/reviewer.js`: Chuoi tieng Viet cho man hinh reviewer.
- `src/i18n/locales/vi/role.js`: Chuoi tieng Viet cho ten role.
- `src/i18n/locales/vi/status.js`: Chuoi tieng Viet cho trang thai he thong.

## src/layouts

- `src/layouts/AdminLayout.tsx`: Layout khung trang admin, gom sidebar va outlet noi dung.
- `src/layouts/AnnotatorLayout.tsx`: Layout khung trang annotator ngoai workspace.
- `src/layouts/ManagerLayout.tsx`: Layout khung trang manager.
- `src/layouts/ReviewerLayout.tsx`: Layout khung trang reviewer ngoai review workspace.

## src/pages

- `src/pages/Unauthorized.tsx`: Trang thong bao khong du quyen truy cap.

### src/pages/Admin

- `src/pages/Admin/ActivityLogs.tsx`: Trang admin xem va loc lich su hoat dong he thong.
- `src/pages/Admin/AdminDashboard.tsx`: Dashboard admin tong hop so lieu user va log gan day.
- `src/pages/Admin/PendingUsersPage.tsx`: Trang xu ly user cho phe duyet, hien co kha nang la file cu hoac chua duoc route toi.
- `src/pages/Admin/Users.tsx`: Trang quan ly danh sach user, filter va thao tac thay doi trang thai.

### src/pages/Annotator

- `src/pages/Annotator/AnnotationList.tsx`: Danh sach annotation hien co cua task dang mo.
- `src/pages/Annotator/AnnotationOverlay.tsx`: Lop ve overlay hien bounding box/polygon/shape tren anh.
- `src/pages/Annotator/AnnotatorDashboard.tsx`: Dashboard annotator, tong hop task va thong tin can lam.
- `src/pages/Annotator/geometryUtils.js`: Ham tinh toan toa do, kich thuoc, chuyen doi hinh hoc cho thao tac ve.
- `src/pages/Annotator/LabelSelectModal.tsx`: Modal chon label khi tao hoac sua annotation.
- `src/pages/Annotator/LabelSummaryPanel.tsx`: Ban rieng cua panel tong hop label ngay trong module annotator.
- `src/pages/Annotator/ShortcutHelpModal.tsx`: Modal hien thi phim tat cho workspace.
- `src/pages/Annotator/TaskList.tsx`: Trang danh sach task annotator co the mo de gan nhan.
- `src/pages/Annotator/useAnnotations.js`: Custom hook quan ly state annotation, tao/sua/xoa/submit.
- `src/pages/Annotator/useDrawingTools.js`: Custom hook quan ly cong cu ve, drag, zoom va thao tac tren canvas.
- `src/pages/Annotator/useKeyboardShortcuts.js`: Custom hook dang ky phim tat cho workspace annotate.
- `src/pages/Annotator/useUndoRedo.js`: Custom hook quan ly lich su undo/redo cho annotation.
- `src/pages/Annotator/Workspace.tsx`: Man hinh lam viec chinh cua annotator, ket hop canvas, panel va luong submit.

### src/pages/Annotator__backup_before_swap

- `src/pages/Annotator__backup_before_swap/AnnotationList.jsx`: Ban backup cua danh sach annotation truoc khi doi module.
- `src/pages/Annotator__backup_before_swap/AnnotationOverlay.jsx`: Ban backup cua lop overlay annotate.
- `src/pages/Annotator__backup_before_swap/AnnotatorDashboard.tsx`: Ban backup dashboard annotator.
- `src/pages/Annotator__backup_before_swap/geometryUtils.js`: Ban backup utility hinh hoc.
- `src/pages/Annotator__backup_before_swap/LabelSelectModal.jsx`: Ban backup modal chon label.
- `src/pages/Annotator__backup_before_swap/TaskList.jsx`: Ban backup trang danh sach task.
- `src/pages/Annotator__backup_before_swap/useAnnotations.js`: Ban backup hook annotation.
- `src/pages/Annotator__backup_before_swap/useDrawingTools.js`: Ban backup hook cong cu ve.
- `src/pages/Annotator__backup_before_swap/useUndoRedo.js`: Ban backup hook undo/redo.
- `src/pages/Annotator__backup_before_swap/Workspace.jsx`: Ban backup workspace annotate cu.

### src/pages/Login

- `src/pages/Login/Login.tsx`: Trang dang nhap, xu ly form login va dieu huong theo role sau khi dang nhap.

### src/pages/Manager

- `src/pages/Manager/ActivityLogs.tsx`: Trang log rieng cho manager de theo doi hanh dong lien quan nghiep vu.
- `src/pages/Manager/CreateErrorType.tsx`: Form tao loai loi, kha nang la man hinh cu va co the da duoc thay bang policy/error flow moi.
- `src/pages/Manager/CreateLabel.tsx`: Form tao label moi o cap manager.
- `src/pages/Manager/ErrorTypes.tsx`: Trang danh sach loai loi, co kha nang la module cu hoac da bi thay the.
- `src/pages/Manager/LabelsPage.tsx`: Trang quan ly danh sach label.
- `src/pages/Manager/ManagerDashboard.tsx`: Dashboard manager tong hop project, tien do va thong tin van hanh.
- `src/pages/Manager/PoliciesPage.tsx`: Trang quan ly policy/rule nghiep vu.
- `src/pages/Manager/ProjectAssignments.tsx`: Tab quan ly assignment trong chi tiet project.
- `src/pages/Manager/ProjectCreateLabel.tsx`: Form tao label moi ben trong ngu canh mot project.
- `src/pages/Manager/ProjectData.tsx`: Tab du lieu cua project, xem dataset va item thuoc project.
- `src/pages/Manager/ProjectDetail.tsx`: Trang vo boc chi tiet project, chua nested tabs overview/data/labels/assignments/export/errors.
- `src/pages/Manager/ProjectErrors.tsx`: Tab quan ly loi hoac quy tac loi trong project.
- `src/pages/Manager/ProjectExport.tsx`: Tab xuat du lieu du an sang dinh dang can dung.
- `src/pages/Manager/ProjectLabels.tsx`: Tab quan ly label trong pham vi project.
- `src/pages/Manager/ProjectOverview.tsx`: Tab tong quan project, hien thong ke, team, progress va chi so chat luong.
- `src/pages/Manager/ProjectsPage.tsx`: Trang danh sach project cua manager.
- `src/pages/Manager/Tasks.tsx`: Trang tong hop task/assignment cho manager.
- `src/pages/Manager/UploadData.tsx`: Trang upload du lieu moi vao he thong hoac vao project.

### src/pages/Register

- `src/pages/Register/Register.tsx`: Trang dang ky tai khoan.

### src/pages/Reviewer

- `src/pages/Reviewer/ReviewerDashboard.tsx`: Dashboard reviewer tong hop cong viec can review.
- `src/pages/Reviewer/ReviewQueue.tsx`: Trang danh sach assignment cho reviewer.
- `src/pages/Reviewer/ReviewWorkspace.tsx`: Man hinh review chinh, xem annotation va dua ra ket qua chap nhan/tu choi.
- `src/pages/Reviewer/useReviewWorkspace.js`: Custom hook xu ly state, tai du lieu va thao tac review workspace.

## src/query

- `src/query/projectQueries.js`: Query key, normalize data, fetch tong hop va helper invalidate cho du lieu project.
- `src/query/queryClient.js`: Khoi tao `QueryClient` voi cau hinh cache va retry dung chung.

## src/services

- `src/services/api.ts`: Lop service API kieu cu; hien tai mang tinh legacy va can kiem tra truoc khi tiep tuc su dung.

## src/types

- `src/types/cvat.ts`: Khai bao type lien quan dinh dang annotation/cvat.
- `src/types/index.ts`: File tong hop export cac type dung chung.
- `src/types/project.js`: Dinh nghia kieu du lieu project phia frontend.
- `src/types/user.js`: Dinh nghia kieu du lieu user phia frontend.

## src/utils

- `src/utils/blobAssetCache.js`: Cache blob/object URL cho tai nguyen media de giam tai lai.
- `src/utils/cn.js`: Ham ghep className, thuong ket hop `clsx` va `tailwind-merge`.
- `src/utils/mockStorage.ts`: Kho luu tam/mock storage phuc vu dev hoac test.
- `src/utils/roleUtils.js`: Chuan hoa role va tra ve route mac dinh theo role.
- `src/utils/sourceMeta.ts`: Helper xu ly metadata cua nguon du lieu, file hoac dataset item.

## Ghi chu nhanh

- Cac file trong `src/pages/Annotator__backup_before_swap` la ban sao luu, khong nen dung cho code chinh.
- Mot so file nhu `PendingUsersPage.tsx`, `CreateErrorType.tsx`, `ErrorTypes.tsx`, `src/services/api.ts` co dau hieu la file cu hoac chua duoc route truc tiep.
- Neu ban muon, buoc tiep theo minh co the viet them mot ban `SO_DO_HE_THONG.md` mo ta luong chay tu `App.tsx` -> `layout` -> `page` -> `api` de de thuyet trinh hoac nop bao cao.
