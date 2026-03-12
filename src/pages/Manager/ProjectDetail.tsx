import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { projectApi } from "../../api/projectApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";

interface ProjectData {
    project_id: number;
    name: string;
    data_type: string;
    status: string;
    description?: string;
    manager_name?: string;
    created_at?: string;
}

const TABS = [
    { key: "", label: "Overview", icon: "dashboard" },
    { key: "data", label: "Data", icon: "cloud_upload" },
    { key: "labels", label: "Label Rules", icon: "rule" },
    { key: "assignments", label: "Assignments", icon: "assignment" },
    { key: "export", label: "Export", icon: "download" },
    { key: "errors", label: "Errors", icon: "bug_report" },
];

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine active tab from URL
    const basePath = `/manager/projects/${projectId}`;
    const currentSuffix = location.pathname.replace(basePath, "").replace(/^\//, "").split("/")[0] || "";
    const activeTab = TABS.find((t) => t.key === currentSuffix) ? currentSuffix : "";

    useEffect(() => {
        if (!projectId) return;
        fetchProject();
    }, [projectId]);

    const fetchProject = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const raw: any = await projectApi.getProjectById(Number(projectId));
            if (!raw) { setError("not_found"); return; }
            setProject({
                project_id: raw.projectId ?? raw.project_id ?? Number(projectId),
                name: raw.name ?? "Untitled",
                data_type: (raw.type ?? raw.dataType ?? "unknown").toLowerCase(),
                status: (raw.status ?? "unknown").toLowerCase(),
                description: raw.description ?? "",
                manager_name: raw.managerName ?? raw.manager_name ?? "",
                created_at: raw.createdAt ?? raw.created_at ?? "",
            });
        } catch {
            setError("not_found");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case "in_progress": return "bg-emerald-500";
            case "completed": return "bg-blue-500";
            case "paused": return "bg-amber-500";
            default: return "bg-gray-400";
        }
    };

    const getDataTypeLabel = (dt: string) => {
        switch (dt) {
            case "image": return "Image Annotation";
            case "text": return "Text Annotation";
            case "video": return "Video Annotation";
            default: return dt;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        try { return new Date(dateStr).toLocaleDateString("vi-VN"); } catch { return dateStr; }
    };

    if (isLoading) {
        return (
            <div className="p-8 min-h-full bg-transparent flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="p-8 min-h-full bg-transparent">
                <Card className="p-12 bg-card/80 backdrop-blur border-border/60 text-center max-w-lg mx-auto">
                    <div className="text-4xl mb-4">P</div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Không tìm thấy dự án</h2>
                    <p className="text-muted-foreground mb-6 text-sm">
                        Dự án với ID "{projectId}" không tồn tại hoặc đã bị xóa.
                    </p>
                    <Button variant="secondary" onClick={() => navigate("/manager/projects")} leftIcon="arrow_back">
                        Quay lại danh sách
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 min-h-full bg-transparent space-y-6">
            {/* Header */}
            <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("/manager/projects")}>
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            </Button>
                            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">category</span>
                                Type: {getDataTypeLabel(project.data_type)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className={cn("w-2 h-2 rounded-full", getStatusDot(project.status))} />
                                Status: <span className="capitalize">{project.status.replace("_", " ")}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                Created: {formatDate(project.created_at)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-6 border-b border-border/50 overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => navigate(tab.key ? `${basePath}/${tab.key}` : basePath)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                                activeTab === tab.key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Tab content via nested route */}
            <Outlet context={{ project }} />
        </div>
    );
};

export default ProjectDetail;
