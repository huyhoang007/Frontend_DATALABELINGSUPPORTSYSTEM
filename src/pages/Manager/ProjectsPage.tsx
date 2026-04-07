import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { translateDataType, translateProjectStatus } from "../../i18n/helpers";

function computeProjectStatus(assignments: any[]): string {
  if (!assignments || assignments.length === 0) return "draft";
  const statuses = assignments.map((a) => (a.status ?? "").toUpperCase());
  if (statuses.every((s) => s === "APPROVED")) return "completed";
  if (statuses.some((s) => s === "REJECTED")) return "in_progress";
  if (statuses.some((s) => ["IN_PROGRESS", "SUBMITTED", "RE_SUBMITTED"].includes(s))) return "in_progress";
  return "draft";
}

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
  const { t } = useTranslation(["manager", "common"]);
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
  const { user: rawUser } = useAuth();
  const user = rawUser as any;

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
        dataset_count: Number(p.datasetCount ?? p.dataset_count ?? 0),
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

  const hotspot = getHotspotQueryBehavior(60_000, 600_000) as {
    staleTime: number; gcTime: number; refetchOnMount: boolean | "always";
  };

  const {
    data: summaryProjects = [],
    isLoading: summaryLoading,
  } = useQuery<Project[]>({
    queryKey: projectQueryKeys.summaryList(user?.userId ?? user?.id ?? "me"),
    queryFn: () => fetchProjectSummaryList(legacyViewerName),
    enabled: summaryModeEnabled,
    placeholderData: cacheEnabled ? (previousData: Project[] | undefined) => previousData : undefined,
    ...hotspot,
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
      addToast(t("manager:projects.messages.nameRequired"), "error");
      return;
    }

    setIsCreating(true);
    try {
      await projectApi.createProject({
        name: newName,
        dataType: "IMAGE",
        description: newDescription.trim(), // Use actual description from form
      });
      addToast(t("manager:projects.messages.created"), "success");
      setShowCreateModal(false);
      setNewName("");
      setNewDescription("");
      await queryClient.invalidateQueries({ queryKey: ["projects", "summary-list"] });
      if (!summaryModeEnabled) {
        await fetchProjectsLegacy();
      }
    } catch (error: any) {
      const raw = error?.response?.data?.message || error?.message || "";
      const msg =
        typeof raw === "string" && raw.toLowerCase().includes("already exist")
          ? t("manager:projects.messages.duplicateName")
          : raw || t("manager:projects.messages.createFailed");
      addToast(msg || t("manager:projects.messages.createFailed"), "error");
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
      addToast(t("manager:projects.messages.nameRequired"), "error");
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
      const updatedProject = (response as any).data || response;
      
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
      
      addToast(t("manager:projects.messages.updated"), "success");
      setShowEditModal(false);
      setEditingProject(null);
    } catch (error: any) {
      addToast(error.message || t("manager:projects.messages.updateFailed"), "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (
      !window.confirm(
        t("manager:projects.messages.confirmDelete"),
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
      addToast(t("manager:projects.messages.deleted"), "success");
      setShowDeletedProjects(true); // Auto-switch to deleted projects tab
    } catch (error: any) {
      addToast(error.message || t("manager:projects.messages.createFailed"), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateProject = async (projectId: number) => {
    if (
      !window.confirm(
        t("manager:projects.messages.confirmRestore"),
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await projectApi.activateProject(projectId);
      addToast(t("manager:projects.messages.restored"), "success");
      await queryClient.invalidateQueries({ queryKey: ["projects", "summary-list"] });
      if (!summaryModeEnabled) {
        await fetchProjectsLegacy();
      }
    } catch (error: any) {
      addToast(error.message || t("manager:projects.messages.restoreFailed"), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getValidStatusOptions = (currentStatus: string) => {
    const normalized = currentStatus?.toUpperCase() || "DRAFT";
    switch (normalized) {
      case "DRAFT":
        return [
          { value: "DRAFT", label: translateProjectStatus("DRAFT") },
          {
            value: "IN_PROGRESS",
            label: translateProjectStatus("IN_PROGRESS"),
          },
        ];
      case "IN_PROGRESS":
        return [
          {
            value: "IN_PROGRESS",
            label: translateProjectStatus("IN_PROGRESS"),
          },
          { value: "PAUSED", label: translateProjectStatus("PAUSED") },
        ];
      case "PAUSED":
        return [
          { value: "PAUSED", label: translateProjectStatus("PAUSED") },
          {
            value: "IN_PROGRESS",
            label: translateProjectStatus("IN_PROGRESS"),
          },
        ];
      case "COMPLETED":
        return [
          {
            value: "COMPLETED",
            label: translateProjectStatus("COMPLETED"),
          },
        ];
      default:
        return [{ value: normalized, label: normalized }];
    }
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
    <div className="p-8 min-h-screen bg-[#F7F8F9]">
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#172B4D] mb-2">
              {t("manager:projects.title")}
            </h1>
            <p className="text-[15px] text-[#44546F]">
              {showDeletedProjects ? t("manager:projects.deletedSubtitle") : t("manager:projects.subtitle")}
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
                {t("manager:projects.mine")}
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
                {t("manager:projects.deleted")} ({projects.filter(p => p.status?.toUpperCase() === "INACTIVE").length})
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
                {t("manager:projects.viewModes.grid")}
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
                {t("manager:projects.viewModes.list")}
              </button>
            </div>
            {!showDeletedProjects && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                leftIcon="add"
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                {t("manager:projects.createProject")}
              </Button>
            )}
          </div>
        </div>

        {/* Stats - Only show for active projects */}
        {!showDeletedProjects && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: translateProjectStatus("DRAFT"), status: "DRAFT", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
              { label: translateProjectStatus("IN_PROGRESS"), status: "IN_PROGRESS", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
              { label: translateProjectStatus("PAUSED"), status: "PAUSED", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
              { label: translateProjectStatus("COMPLETED"), status: "COMPLETED", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
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
              <option value="all">{t("manager:projects.filters.allStatus")}</option>
              <option value="draft">{translateProjectStatus("DRAFT")}</option>
              <option value="in_progress">{translateProjectStatus("IN_PROGRESS")}</option>
              <option value="paused">{translateProjectStatus("PAUSED")}</option>
              <option value="completed">{translateProjectStatus("COMPLETED")}</option>
            </select>
          </div>
        )}
      </Card>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <Card className="p-16 text-center bg-card/80 backdrop-blur border-border/60">
          <div className="text-4xl mb-4">
            {showDeletedProjects ? "📦" : "❌"}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
                  {showDeletedProjects ? t("manager:projects.noDeleted") : t("manager:projects.noProject")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {showDeletedProjects ? t("manager:projects.allActive") : t("manager:projects.startCreate")}
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
                    {translateDataType(project.data_type)}
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
                  <span className="uppercase">{translateProjectStatus(project.status)}</span>
                </div>
              </div>

              {/* Project Info */}
              <div className="space-y-3 mb-5 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("manager:projects.card.manager")}:</span>
                  <span className="font-semibold text-foreground">
                    {project.manager?.full_name || t("common:labels.unknown")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("common:labels.datasets")}:</span>
                  <span className="font-semibold text-foreground">
                    {t("manager:projects.card.datasets", { count: project.dataset_count ?? project.datasets?.length ?? 0 })}
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
                      {t("common:actions.viewDetail")}
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 h-9 text-xs"
                      onClick={() => handleEditClick(project)}
                      disabled={isDeleting}
                      leftIcon="edit"
                    >
                      {t("common:actions.edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-9 w-9 px-0 text-destructive bg-destructive/10 hover:bg-destructive/20 border-transparent"
                      onClick={() => handleDeleteProject(project.project_id)}
                      disabled={isDeleting}
                      leftIcon="delete"
                      title={t("manager:projects.actions.hideProject")}
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
                    {t("common:actions.restore")}
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
                <th className="px-6 py-4">{t("manager:projects.form.projectName")}</th>
                <th className="px-6 py-4">{t("common:labels.type")}</th>
                <th className="px-6 py-4">{t("common:labels.status")}</th>
                <th className="px-6 py-4">{t("common:labels.manager")}</th>
                <th className="px-6 py-4 text-right">{t("common:labels.action")}</th>
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
                      {translateDataType(project.data_type)}
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
                      <span className="uppercase">{translateProjectStatus(project.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{project.manager?.full_name || t("common:labels.unknown")}</td>
                  <td className="px-6 py-4">
                    {project.status?.toUpperCase() !== "INACTIVE" ? (
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleOpenProject(project.project_id)}
                          title={t("common:actions.viewDetail")}
                        >
                          {t("common:actions.view")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleEditClick(project)}
                        >
                          {t("common:actions.edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProject(project.project_id)}
                        >
                          {t("common:actions.delete")}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-green-600 border-green-500/30 bg-green-500/10 hover:bg-green-500/20"
                          onClick={() => handleActivateProject(project.project_id)}
                        >
                          {t("common:actions.restore")}
                        </Button>
                      </div>
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
              {t("manager:projects.form.createTitle")}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("manager:projects.form.projectName")} *</label>
                <input
                  type="text"
                  placeholder={t("manager:projects.form.projectName")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("manager:projects.form.dataType")} *</label>
                <input
                  type="text"
                  value={t("manager:projects.form.imageType")}
                  disabled
                  className="w-full px-4 py-2.5 bg-muted border border-input rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("manager:projects.form.description")}</label>
                <textarea
                  placeholder={t("manager:projects.form.description")}
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
                {t("common:actions.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateProject}
                isLoading={isCreating}
              >
                {t("common:actions.createNew")}
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
              {t("manager:projects.form.editTitle")}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("manager:projects.form.projectName")} *</label>
                <input
                  type="text"
                  placeholder={t("manager:projects.form.projectName")}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("manager:projects.form.dataType")}</label>
                <select
                  value={editDataType}
                  onChange={(e) => setEditDataType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                  disabled
                >
                  <option value="image">{t("manager:projects.form.imageType")}</option>
                  <option value="text">{t("manager:projects.form.textType")}</option>
                  <option value="audio">{t("manager:projects.form.audioType")}</option>
                  <option value="video">{t("manager:projects.form.videoType")}</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">{t("manager:projects.form.cannotChangeType")}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("manager:projects.form.status")}</label>
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
                  <p className="text-xs text-muted-foreground mt-1">{t("manager:projects.form.completedLocked")}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateProject}
                isLoading={isUpdating}
              >
                {t("common:actions.save")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernProjectsPage;
