import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { projectApi } from "../../api/projectApi";
import { assignmentApi } from "../../api/assignmentApi";
import { isFeatureEnabled } from "../../config/featureFlags";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import {
  fetchProjectSummaryList,
  getHotspotQueryBehavior,
  invalidateProjectSummaryData,
  projectQueryKeys,
} from "../../query/projectQueries";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";

function computeProjectStatus(assignments: any[]): string {
  if (!assignments || assignments.length === 0) return "draft";
  const statuses = assignments.map((a) => (a.status ?? "").toUpperCase());
  if (statuses.every((s) => s === "APPROVED")) return "completed";
  if (statuses.some((s) => s === "REJECTED")) return "in_progress";
  if (statuses.some((s) => ["IN_PROGRESS", "SUBMITTED", "RE_SUBMITTED"].includes(s))) return "in_progress";
  return "draft";
}

// Bảng màu Modern Enterprise UI (Atlassian/Jira style)
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  borderStrong: "#B3B9C4",
  textPrimary: "#172B4D",
  textSecondary: "#44546F",
  textMuted: "#626F86",
  brand: "#0C66E4",
  brandHover: "#0055CC",
  brandLight: "#E9F2FF",
  green: "#1F845A",
  greenBg: "#DCFFF1",
  amber: "#A54800",
  amberBg: "#FFF7D6",
  purple: "#5E4DB2",
  purpleBg: "#F3F0FF",
  red: "#DE350B",
  redBg: "#FFEBE6",
};

// Define local interfaces matching backend response if needed,
// or mapped from 'types/cvat'.
// Backend ProjectResponse: { id, name, type, status, managerId, ... }
// We map it to UI expectation.

interface Project {
  project_id: number;
  name: string;
  data_type: string;
  status: string;
  raw_status?: string;
  description?: string;
  manager_id?: number;
  manager?: { full_name: string };
  created_at?: string | null;
  assignment_count?: number;
  approved_assignment_count?: number;
  in_progress_assignment_count?: number;
  rejected_assignment_count?: number;
  dataset_count?: number;
  datasets?: any[];
}

const PROJECT_LIST_STATE_KEY = "perf.manager.projects.state";
const PROJECT_LIST_SCROLL_KEY = "perf.manager.projects.scrollY";

const readPersistedState = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem(PROJECT_LIST_STATE_KEY) || "null");
  } catch {
    return null;
  }
};

const ModernProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const persistedState = readPersistedState();
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    persistedState?.viewMode === "list" ? "list" : "grid",
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(
    persistedState?.selectedStatus || "all",
  );
  const [showDeletedProjects, setShowDeletedProjects] = useState(
    Boolean(persistedState?.showDeletedProjects),
  );

  // Data State
  const [legacyProjects, setLegacyProjects] = useState<Project[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const hasRestoredScrollRef = useRef(false);
  const summaryModeEnabled = isFeatureEnabled("perf_project_list_summary");
  const cacheEnabled = isFeatureEnabled("perf_hotspot_cache");
  const persistenceEnabled = isFeatureEnabled("perf_project_tab_persistence");

  // Form State
  const [newName, setNewName] = useState("");
  const [newDataType, setNewDataType] = useState("IMAGE");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editDataType, setEditDataType] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { addToast } = useToast() as { addToast: (message: string, type?: 'success' | 'error' | 'info') => void };
  const { user } = useAuth();

  const legacyViewerName = user?.fullName || user?.username || "Me";

  const fetchProjectsLegacy = async () => {
    setLegacyLoading(true);
    try {
      const raw: any = await projectApi.getMyProjects();
      const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.content ?? []);

      const mapped = list.map((p: any) => ({
        project_id: p.projectId,
        name: p.name,
        data_type: p.type ? p.type.toLowerCase() : p.dataType ? p.dataType.toLowerCase() : "unknown",
        status: p.status ? p.status.toLowerCase() : "unknown",
        raw_status: p.status ? p.status.toLowerCase() : "unknown",
        manager_id: p.managerId,
        manager: { full_name: legacyViewerName },
        datasets: [],
      }));

      // Compute real status from assignments, but preserve backend status if paused/completed/inactive
      const withStatus = await Promise.all(
        mapped.map(async (proj: any) => {
          // If backend explicitly set paused/inactive, keep it
          if (["paused", "inactive"].includes(proj.status)) return proj;
          try {
            const aRaw: any = await assignmentApi.getAssignmentsByProject(proj.project_id);
            const aList = Array.isArray(aRaw) ? aRaw : (aRaw?.data ?? aRaw?.content ?? []);
            return { ...proj, status: computeProjectStatus(aList) };
          } catch {
            return proj;
          }
        })
      );

      setLegacyProjects(withStatus);
    } catch (error: any) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLegacyLoading(false);
    }
  };

  useEffect(() => {
    if (!summaryModeEnabled) {
      fetchProjectsLegacy();
    }
  }, [summaryModeEnabled, legacyViewerName]);

  const {
    data: summaryProjects = [],
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: projectQueryKeys.summaryList(user?.userId ?? user?.id ?? "me"),
    queryFn: () => fetchProjectSummaryList(legacyViewerName),
    enabled: summaryModeEnabled,
    placeholderData: cacheEnabled ? (previousData) => previousData : undefined,
    ...getHotspotQueryBehavior(60_000, 600_000),
  });

  const projects = summaryModeEnabled ? summaryProjects : legacyProjects;
  const isLoading = summaryModeEnabled ? summaryLoading : legacyLoading;

  useEffect(() => {
    if (!persistenceEnabled) return;
    sessionStorage.setItem(
      PROJECT_LIST_STATE_KEY,
      JSON.stringify({ viewMode, selectedStatus, showDeletedProjects }),
    );
  }, [persistenceEnabled, viewMode, selectedStatus, showDeletedProjects]);

  useEffect(() => {
    if (!persistenceEnabled || isLoading || hasRestoredScrollRef.current) return;
    const savedY = Number(sessionStorage.getItem(PROJECT_LIST_SCROLL_KEY) || "0");
    hasRestoredScrollRef.current = true;
    if (savedY > 0) {
      window.requestAnimationFrame(() => window.scrollTo({ top: savedY, behavior: "auto" }));
    }
  }, [persistenceEnabled, isLoading]);

  const rememberScrollPosition = () => {
    if (!persistenceEnabled) return;
    sessionStorage.setItem(PROJECT_LIST_SCROLL_KEY, String(window.scrollY));
  };

  const handleOpenProject = (projectId: number) => {
    rememberScrollPosition();
    navigate(`/manager/projects/${projectId}`);
  };

  const handleCreateProject = async () => {
    if (!newName) {
      addToast("Vui lòng nhập tên dự án", "error");
      return;
    }

    setIsCreating(true);
    try {
      await projectApi.createProject({
        name: newName,
        dataType: "IMAGE",
        description: newDescription.trim(), // Use actual description from form
      });
      addToast("Tạo dự án thành công!", "success");
      setShowCreateModal(false);
      setNewName("");
      setNewDataType("IMAGE");
      setNewDescription("");
      await queryClient.invalidateQueries({ queryKey: ["projects", "summary-list"] });
      if (!summaryModeEnabled) {
        await fetchProjectsLegacy();
      }
    } catch (error: any) {
      const raw = error?.response?.data?.message || error?.message || "";
      const msg = typeof raw === "string" && raw.toLowerCase().includes("already exist")
        ? "Tên dự án đã tồn tại, vui lòng chọn tên khác"
        : raw || "Không thể tạo dự án";
      addToast(msg, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDataType(project.data_type);
    setEditDescription("");
    setEditStatus(project.raw_status || project.status);
    setShowEditModal(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editName.trim()) {
      addToast("Tên dự án là bắt buộc", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await projectApi.updateProject(editingProject.project_id, {
        name: editName.trim(),
        dataType: editDataType.toUpperCase(),
        description: editDescription || null,
        status: editStatus,
      });
      
      // Use the response data from API which has the actual updated status
      const updatedProject = response.data || response;
      
      await invalidateProjectSummaryData(queryClient, editingProject.project_id);
      if (!summaryModeEnabled) {
        setLegacyProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.project_id === editingProject.project_id
              ? {
                  ...p,
                  name: updatedProject.name || editName.trim(),
                  data_type: updatedProject.data_type || editDataType,
                  description: updatedProject.description || editDescription,
                  status: (updatedProject.computedDisplayStatus || updatedProject.status || editStatus).toLowerCase(),
                  raw_status: (updatedProject.status || editStatus).toLowerCase(),
                }
              : p,
          ),
        );
      }
      
      addToast("Cập nhật dự án thành công!", "success");
      setShowEditModal(false);
      setEditingProject(null);
    } catch (error: any) {
      addToast(error.message || "Không thể cập nhật dự án", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn ẩn dự án này? Dự án sẽ được chuyển sang trạng thái Inactive.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await projectApi.deleteProject(projectId);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for DB transaction
      await queryClient.invalidateQueries({ queryKey: ["projects", "summary-list"] });
      if (!summaryModeEnabled) {
        await fetchProjectsLegacy();
      }
      addToast("Đã ẩn dự án thành công!", "success");
      setShowDeletedProjects(true); // Auto-switch to deleted projects tab
    } catch (error: any) {
      addToast(error.message || "Không thể ẩn dự án", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateProject = async (projectId: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn kích hoạt lại dự án này?",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await projectApi.activateProject(projectId);
      addToast("Đã kích hoạt lại dự án thành công!", "success");
      await queryClient.invalidateQueries({ queryKey: ["projects", "summary-list"] });
      if (!summaryModeEnabled) {
        await fetchProjectsLegacy();
      }
    } catch (error: any) {
      addToast(error.message || "Không thể kích hoạt lại dự án", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getValidStatusOptions = (currentStatus: string) => {
    const normalized = currentStatus?.toUpperCase() || "DRAFT";
    switch (normalized) {
      case "DRAFT":
        return [{ value: "DRAFT", label: "Bản nháp" }, { value: "IN_PROGRESS", label: "Đang tiến hành" }];
      case "IN_PROGRESS":
        return [{ value: "IN_PROGRESS", label: "Đang tiến hành" }, { value: "PAUSED", label: "Tạm dừng" }];
      case "PAUSED":
        return [{ value: "PAUSED", label: "Tạm dừng" }, { value: "IN_PROGRESS", label: "Đang tiến hành" }];
      case "COMPLETED":
        return [{ value: "COMPLETED", label: "Hoàn thành" }]; // Locked
      default:
        return [{ value: normalized, label: normalized }];
    }
  };

  const getStatusLabel = (status: string) => {
    const map: { [key: string]: string } = {
      "DRAFT": "Bản nháp",
      "IN_PROGRESS": "Đang tiến hành",
      "PAUSED": "Tạm dừng",
      "COMPLETED": "Hoàn thành"
    };
    return map[status?.toUpperCase() || ""] || status;
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "";
    switch (normalizedStatus) {
      case "draft":
        return "#94a3b8";
      case "in_progress":
        return "#10b981";
      case "completed":
        return "#3b82f6";
      case "paused":
        return "#f59e0b";
      case "inactive":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "";
    switch (normalizedStatus) {
      case "draft":
        return "D";
      case "in_progress":
        return "P";
      case "completed":
        return "C";
      case "paused":
        return "T";
      case "inactive":
        return "X";
      default:
        return "?";
    }
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case "image":
        return "#8b5cf6";
      case "text":
        return "#06b6d4";
      case "video":
        return "#f59e0b";
      case "audio":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const normalizedStatus = project.status?.toUpperCase() || "";
    
    // First filter by active/deleted status
    if (showDeletedProjects && normalizedStatus !== "INACTIVE") return false;
    if (!showDeletedProjects && normalizedStatus === "INACTIVE") return false;
    
    // Then filter by selected status (only when viewing active projects)
    if (!showDeletedProjects && selectedStatus !== "all" && normalizedStatus !== selectedStatus.toUpperCase()) return false;
    
    return true;
  }), [projects, selectedStatus, showDeletedProjects]);

  return (
    <div style={{
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: T.bg,
    }}>
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 0,
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: T.textPrimary,
              marginBottom: '8px',
            }}>
              Quản lý dự án
            </h1>
            <p style={{
              fontSize: '15px',
              color: T.textSecondary,
            }}>
              {showDeletedProjects ? 'Các dự án đã xóa' : 'Quản lý các dự án gán nhãn dữ liệu và datasets'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab Toggle */}
            <div className="flex bg-muted/50 rounded-lg p-1 border border-border/50">
              <button
                onClick={() => setShowDeletedProjects(false)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  !showDeletedProjects
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Dự án của tôi
              </button>
              <button
                onClick={() => setShowDeletedProjects(true)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  showDeletedProjects
                    ? "bg-background shadow-sm text-orange-600"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Dự án đã xóa ({projects.filter(p => p.status?.toUpperCase() === "INACTIVE").length})
              </button>
            </div>

            {/* View Mode */}
            <div className="flex bg-muted/50 rounded-lg p-1 border border-border/50">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-2 rounded-md text-xs font-medium transition-all",
                  viewMode === "grid"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Lưới
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-3 py-2 rounded-md text-xs font-medium transition-all",
                  viewMode === "list"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Danh sách
              </button>
            </div>
            {!showDeletedProjects && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                leftIcon="add"
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                Tạo dự án mới
              </Button>
            )}
          </div>
        </div>

        {/* Stats - Only show for active projects */}
        {!showDeletedProjects && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Bản nháp", status: "DRAFT", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
              { label: "Đang tiến hành", status: "IN_PROGRESS", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
              { label: "Tạm dừng", status: "PAUSED", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
              { label: "Hoàn thành", status: "COMPLETED", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
            ].map((stat) => (
              <div
                key={stat.status}
                className={cn("p-4 rounded-xl border flex flex-col items-center justify-center text-center", stat.color)}
              >
                <div className="text-2xl font-bold mb-1">
                  {projects.filter((p) => p.status?.toUpperCase() === stat.status).length}
                </div>
                <div className="text-xs font-medium opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        {!showDeletedProjects && (
          <div className="mt-6 flex justify-end">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer min-w-[180px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="in_progress">Đang tiến hành</option>
              <option value="paused">Tạm dừng</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
        )}
      </Card>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <Card className="p-16 text-center bg-card/80 backdrop-blur border-border/60">
          <div className="text-4xl mb-4">
            {showDeletedProjects ? "📦" : "📋"}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {showDeletedProjects ? "Không có dự án đã xóa" : "Không có dự án"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {showDeletedProjects ? "Tất cả dự án của bạn đều đang hoạt động" : "Hãy tạo dự án mới để bắt đầu"}
          </p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.project_id}
              className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60 hover:border-primary/30 group"
            >
              {/* Project Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground truncate mb-1" title={project.name}>
                    {project.name}
                  </h3>
                  <div
                    className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${getDataTypeColor(project.data_type)}20`,
                      color: getDataTypeColor(project.data_type)
                    }}
                  >
                    {project.data_type}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border"
                  style={{
                    backgroundColor: `${getStatusColor(project.status)}10`,
                    borderColor: `${getStatusColor(project.status)}20`,
                    color: getStatusColor(project.status)
                  }}
                >
                  {getStatusIcon(project.status)}
                  <span className="uppercase">{project.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Project Info */}
              <div className="space-y-3 mb-5 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Manager:</span>
                  <span className="font-semibold text-foreground">
                    {project.manager?.full_name || "Unknown"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Datasets:</span>
                  <span className="font-semibold text-foreground">
                    {project.datasets?.length || 0} datasets
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border/50">
                {project.status?.toUpperCase() !== "INACTIVE" ? (
                  <>
                    <Button
                      variant="ghost"
                      className="flex-1 h-9 text-xs"
                        onClick={() => handleOpenProject(project.project_id)}
                      leftIcon="visibility"
                    >
                      Chi tiết
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 h-9 text-xs"
                      onClick={() => handleEditClick(project)}
                      disabled={isDeleting}
                      leftIcon="edit"
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-9 w-9 px-0 text-destructive bg-destructive/10 hover:bg-destructive/20 border-transparent"
                      onClick={() => handleDeleteProject(project.project_id)}
                      disabled={isDeleting}
                      leftIcon="delete"
                      title="Ẩn dự án"
                    />
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    className="flex-1 h-9 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/30"
                    onClick={() => handleActivateProject(project.project_id)}
                    disabled={isDeleting}
                    leftIcon="restore"
                  >
                    Kích hoạt lại
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card className="bg-card/80 backdrop-blur-xl border-border/60 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Tên dự án</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Quản lý</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {filteredProjects.map((project) => (
                <tr key={project.project_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {project.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2 py-1 rounded-md text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: `${getDataTypeColor(project.data_type)}20`,
                        color: getDataTypeColor(project.data_type)
                      }}
                    >
                      {project.data_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                      style={{
                        backgroundColor: `${getStatusColor(project.status)}10`,
                        borderColor: `${getStatusColor(project.status)}20`,
                        color: getStatusColor(project.status)
                      }}
                    >
                      {getStatusIcon(project.status)}
                      <span className="uppercase">{project.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{project.manager?.full_name}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {project.status?.toUpperCase() !== "INACTIVE" ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                            onClick={() => handleOpenProject(project.project_id)}
                          title="Xem chi tiết"
                        >
                          Xem
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(project)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProject(project.project_id)}
                        >
                          Xóa
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-green-600 border-green-500/30 bg-green-500/10 hover:bg-green-500/20"
                        onClick={() => handleActivateProject(project.project_id)}
                      >
                        Kích hoạt lại
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Tạo dự án mới
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tên dự án *</label>
                <input
                  type="text"
                  placeholder="Tên dự án"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Loại dữ liệu *</label>
                <input
                  type="text"
                  value="Hình ảnh"
                  disabled
                  className="w-full px-4 py-2.5 bg-muted border border-input rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Mô tả</label>
                <textarea
                  placeholder="Mô tả dự án..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[100px]"
                />
              </div>

            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateProject}
                isLoading={isCreating}
              >
                Tạo mới
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Chỉnh sửa dự án
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tên dự án *</label>
                <input
                  type="text"
                  placeholder="Tên dự án"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Loại dữ liệu</label>
                <select
                  value={editDataType}
                  onChange={(e) => setEditDataType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                  disabled
                >
                  <option value="image">Hình ảnh</option>
                  <option value="text">Văn bản</option>
                  <option value="audio">Âm thanh</option>
                  <option value="video">Video</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Không thể thay đổi loại dữ liệu sau khi tạo.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Trạng thái</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  disabled={editStatus?.toUpperCase() === "COMPLETED"}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getValidStatusOptions(editingProject?.status || "DRAFT").map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {editStatus?.toUpperCase() === "COMPLETED" && (
                  <p className="text-xs text-muted-foreground mt-1">Dự án đã hoàn thành không thể thay đổi trạng thái.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateProject}
                isLoading={isUpdating}
              >
                Lưu thay đổi
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernProjectsPage;
