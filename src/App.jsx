import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { getRoleBasedRedirect } from "./utils/roleUtils";

// Pages
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import TaskList from "./pages/Annotator/TaskList";
import Workspace from "./pages/Annotator/Workspace";
import ReviewQueue from "./pages/Reviewer/ReviewQueue";
import ReviewWorkspace from "./pages/Reviewer/ReviewWorkspace";
import AnnotatorDashboard from "./pages/Annotator/AnnotatorDashboard";
import ManagerDashboard from "./pages/Manager/ManagerDashboard";
import ManagerProjects from "./pages/Manager/Projects";
import ProjectDetail from "./pages/Manager/ProjectDetail";
import ProjectOverview from "./pages/Manager/ProjectOverview";
import ProjectData from "./pages/Manager/ProjectData";
import ProjectLabels from "./pages/Manager/ProjectLabels";
import ProjectCreateLabel from "./pages/Manager/ProjectCreateLabel";
import ProjectAssignments from "./pages/Manager/ProjectAssignments";
import ProjectExport from "./pages/Manager/ProjectExport";
import ManagerLabels from "./pages/Manager/Labels";
import CreateLabel from "./pages/Manager/CreateLabel";
import ManagerPolicies from "./pages/Manager/Policies";
import UploadData from "./pages/Manager/UploadData";
import ErrorTypes from "./pages/Manager/ErrorTypes";
import ProjectErrors from "./pages/Manager/ProjectErrors";
import CreateErrorType from "./pages/Manager/CreateErrorType";
import ManagerTasks from "./pages/Manager/Tasks";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/Users";
import AdminLabels from "./pages/Admin/Labels";
import AdminPolicies from "./pages/Admin/Policies";
import AdminActivityLogs from "./pages/Admin/ActivityLogs";
import DevHealthCheck from "./components/DevHealthCheck";
import Unauthorized from "./pages/Unauthorized";
import { RoleGuard } from "./components/Common/RoleGuard";
import { LogoutButton } from "./components/Common/LogoutButton";
import { ManagerLayout } from "./layouts/ManagerLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AnnotatorLayout } from "./layouts/AnnotatorLayout";
import { ReviewerLayout } from "./layouts/ReviewerLayout";
import { LanguageSwitcher } from "./components/i18n/LanguageSwitcher";

// Helper to get role-based redirect
function getRoleBasedRedirectWrapper() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return "/login";

  try {
    const user = JSON.parse(userStr);
    return getRoleBasedRedirect(user.role);
  } catch {
    return "/login";
  }
}

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <BrowserRouter>
          <LanguageSwitcher />
          <Routes>
            <Route
              path="/"
              element={<Navigate to={getRoleBasedRedirectWrapper()} replace />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Role: Annotator */}
            <Route
              path="/annotator"
              element={
                <RoleGuard allowedRoles={["ANNOTATOR"]}>
                  <AnnotatorLayout />
                </RoleGuard>
              }
            >
              <Route
                index
                element={<Navigate to="tasks" replace />}
              />
              <Route path="dashboard" element={<AnnotatorDashboard user={JSON.parse(localStorage.getItem('user') || '{}')} onLogout={() => { localStorage.clear(); window.location.href = '/login'; }} />} />
              <Route path="tasks" element={<TaskList />} />
            </Route>

            {/* Annotator Workspace - no sidebar, uses own 3-column layout */}
            <Route
              path="/annotator/task/:taskId"
              element={
                <RoleGuard allowedRoles={["ANNOTATOR"]}>
                  <Workspace />
                </RoleGuard>
              }
            />

            {/* Role: Reviewer - Layout with sidebar for queue, workspace stays outside */}
            <Route
              path="/reviewer"
              element={
                <RoleGuard allowedRoles={["REVIEWER"]}>
                  <ReviewerLayout />
                </RoleGuard>
              }
            >
              <Route index element={<Navigate to="queue" replace />} />
              <Route path="queue" element={<ReviewQueue />} />
            </Route>
            {/* ReviewWorkspace - no sidebar, uses own 3-column layout */}
            <Route
              path="/reviewer/review/:assignmentId"
              element={<ReviewWorkspace />}
            />

            {/* Role: Manager - Nested routes with persistent sidebar */}
            <Route
              path="/manager"
              element={
                <RoleGuard allowedRoles={["MANAGER"]}>
                  <ManagerLayout />
                </RoleGuard>
              }
            >
              <Route
                index
                element={<Navigate to="/manager/dashboard" replace />}
              />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="projects" element={<ManagerProjects />} />
              {/* Project Detail with nested tab routes */}
              <Route path="projects/:projectId" element={<ProjectDetail />}>
                <Route index element={<ProjectOverview />} />
                <Route path="data" element={<ProjectData />} />
                <Route path="labels" element={<ProjectLabels />} />
                <Route path="labels/new" element={<ProjectCreateLabel />} />
                <Route path="assignments" element={<ProjectAssignments />} />
                <Route path="export" element={<ProjectExport />} />
                <Route path="errors" element={<ProjectErrors />} />
              </Route>
              {/* Legacy global routes (kept for backward compatibility) */}
              <Route path="upload-data" element={<UploadData />} />
              <Route path="labels" element={<ManagerLabels />} />
              <Route path="labels/new" element={<CreateLabel />} />
              <Route path="error-types" element={<ErrorTypes />} />
              <Route path="error-types/new" element={<CreateErrorType />} />
              <Route path="tasks" element={<ManagerTasks />} />
              <Route path="policies" element={<ManagerPolicies />} />
            </Route>

            {/* Role: Admin - Nested routes with persistent sidebar */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={["ADMIN"]}>
                  <AdminLayout />
                </RoleGuard>
              }
            >
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="labels" element={<AdminLabels />} />
              <Route path="policies" element={<AdminPolicies />} />
              <Route path="logs" element={<AdminActivityLogs />} />
            </Route>

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Dev Tools */}
            <Route path="/dev-check" element={<DevHealthCheck />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
