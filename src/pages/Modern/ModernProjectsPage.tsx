import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { Project, User } from '../../types/cvat'; // Optional if types match, or define local interface
import { projectApi } from "../../api/projectApi";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";

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
  manager_id?: number;
  manager?: { full_name: string };
  datasets?: any[];
}

const ModernProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [newName, setNewName] = useState("");
  const [newDataType, setNewDataType] = useState("");
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

  // Load Projects on Mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Use getMyProjects or getAllProjects based on requirement.
      // Manager dashboard usually shows their own projects.
      const data = await projectApi.getMyProjects();
      // Map backend response fields to UI constraints if necessary
      // Backend: { id, name, type (IMAGE/VIDEO...), status, ... }
      // UI expects: project_id, name, data_type, status...
      const mappedProjects = data.map((p: any) => ({
        project_id: p.projectId, // Backend returns projectId, not id
        name: p.name,
        data_type: p.type
          ? p.type.toLowerCase()
          : p.dataType
            ? p.dataType.toLowerCase()
            : "unknown", // Handle type vs dataType naming
        status: p.status ? p.status.toLowerCase() : "unknown",
        manager_id: p.managerId,
        manager: { full_name: user?.username || "Me" }, // Backend might not return full manager obj in list
        datasets: [], // Backend might not return datasets in list summary
      }));
      setProjects(mappedProjects);
    } catch (error: any) {
      console.error("Failed to fetch projects", error);
      // addToast("Could not load projects", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newName || !newDataType) {
      addToast("Vui lòng nhập tên và chọn loại dữ liệu", "error");
      return;
    }

    setIsCreating(true);
    try {
      await projectApi.createProject({
        name: newName,
        dataType: newDataType.toUpperCase(), // Backend expects uppercase enum
        description: newDescription.trim(), // Use actual description from form
      });
      addToast("Tạo dự án thành công!", "success");
      setShowCreateModal(false);
      setNewName("");
      setNewDataType("");
      setNewDescription("");
      fetchProjects(); // Refresh list
    } catch (error: any) {
      addToast(error.message || "Không thể tạo dự án", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDataType(project.data_type);
    setEditDescription("");
    setEditStatus(project.status);
    setShowEditModal(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editName.trim()) {
      addToast("Tên dự án là bắt buộc", "error");
      return;
    }

    setIsUpdating(true);
    try {
      await projectApi.updateProject(editingProject.project_id, {
        name: editName.trim(),
        dataType: editDataType.toUpperCase(),
        description: editDescription || null,
        status: editStatus.toUpperCase(),
      });
      addToast("Cập nhật dự án thành công!", "success");
      setShowEditModal(false);
      setEditingProject(null);
      fetchProjects();
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
      addToast("Đã ẩn dự án thành công!", "success");
      fetchProjects();
    } catch (error: any) {
      addToast(error.message || "Không thể ẩn dự án", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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
    switch (status) {
      case "draft":
        return "D";
      case "in_progress":
        return "P";
      case "completed":
        return "C";
      case "paused":
        return "T";
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

  const filteredProjects = projects.filter(
    (project) => selectedStatus === "all" || project.status === selectedStatus,
  );

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
              Quản lý các dự án gán nhãn dữ liệu và datasets
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              leftIcon="add"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            >
              Tạo dự án mới
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Bản nháp", status: "draft", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
            { label: "Đang tiến hành", status: "in_progress", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            { label: "Tạm dừng", status: "paused", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
            { label: "Hoàn thành", status: "completed", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
          ].map((stat) => (
            <div
              key={stat.status}
              className={cn("p-4 rounded-xl border flex flex-col items-center justify-center text-center", stat.color)}
            >
              <div className="text-2xl font-bold mb-1">
                {projects.filter((p) => p.status === stat.status).length}
              </div>
              <div className="text-xs font-medium opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
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
      </Card>

      {/* Projects Display */}
      {viewMode === "grid" ? (
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
                <Button
                  variant="ghost"
                  className="flex-1 h-9 text-xs"
                  onClick={() => navigate(`/manager/projects/${project.project_id}`)}
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
                />
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/manager/projects/${project.project_id}`)}
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
                <select
                  value={newDataType}
                  onChange={(e) => setNewDataType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                >
                  <option value="">Chọn loại dữ liệu</option>
                  <option value="IMAGE">Hình ảnh</option>
                  <option value="TEXT">Văn bản</option>
                  <option value="AUDIO">Âm thanh</option>
                </select>
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
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="in_progress">Đang tiến hành</option>
                  <option value="paused">Tạm dừng</option>
                  <option value="completed">Hoàn thành</option>
                </select>
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
