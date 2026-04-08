import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import {
    fetchProjectDetail,
    getHotspotQueryBehavior,
    projectQueryKeys,
} from "../../query/projectQueries";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { translateDataType, translateProjectStatus } from "../../i18n/helpers";
import { SOURCE_FILES } from "../../utils/sourceMeta";

interface ProjectData {
    project_id: number;
    name: string;
    data_type: string;
    status: string;
    description?: string;
    guidelineContent?: string;
    guidelineVersion?: string;
    manager_name?: string;
    created_at?: string;
}

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation(["manager", "common"]);
    const TABS = [
        { key: "", label: t("manager:projectDetail.tabs.overview"), icon: "dashboard" },
        { key: "data", label: t("manager:projectDetail.tabs.data"), icon: "cloud_upload" },
        { key: "labels", label: t("manager:projectDetail.tabs.labels"), icon: "rule" },
        { key: "assignments", label: t("manager:projectDetail.tabs.assignments"), icon: "assignment" },
        { key: "errors", label: t("manager:projectDetail.tabs.errors"), icon: "bug_report" },
        { key: "export", label: t("manager:projectDetail.tabs.export"), icon: "download" },
    ];

    // Determine active tab from URL
    const basePath = `/manager/projects/${projectId}`;
    const currentSuffix = location.pathname.replace(basePath, "").replace(/^\//, "").split("/")[0] || "";
    const activeTab = TABS.find((t) => t.key === currentSuffix) ? currentSuffix : "";
    const hotspot = getHotspotQueryBehavior(60_000, 600_000) as {
        staleTime: number; gcTime: number; refetchOnMount: boolean | "always";
    };

    const {
        data: project,
        isLoading,
        error,
    } = useQuery<ProjectData>({
        queryKey: projectQueryKeys.detail(projectId),
        queryFn: () => fetchProjectDetail(projectId),
        enabled: Boolean(projectId),
        placeholderData: (previousData: ProjectData | undefined) => previousData,
        ...hotspot,
    });

    const getStatusDot = (status: string) => {
        switch (status) {
            case "in_progress": return "bg-emerald-500";
            case "completed": return "bg-blue-500";
            case "paused": return "bg-amber-500";
            default: return "bg-gray-400";
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        try { return new Date(dateStr).toLocaleDateString(i18n.language === "en" ? "en-US" : "vi-VN"); } catch { return dateStr; }
    };

    if (isLoading) {
        return (
            <div
                className="p-8 min-h-full bg-transparent flex items-center justify-center"
                data-source-file={SOURCE_FILES.managerProjectDetail}
      data-source-label="section:manager-project-detail-page"
            >
                <div className="text-muted-foreground text-sm">{t("common:states.loadingData")}</div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div
                className="p-8 min-h-full bg-transparent"
                data-source-file={SOURCE_FILES.managerProjectDetail}
        data-source-label="section:manager-project-detail-page"
            >
                <Card className="p-12 bg-card/80 backdrop-blur border-border/60 text-center max-w-lg mx-auto">
                    <div className="text-4xl mb-4">P</div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{t("manager:projectDetail.notFoundTitle")}</h2>
                    <p className="text-muted-foreground mb-6 text-sm">
                        {t("manager:projectDetail.notFoundDescription", { projectId })}
                    </p>
                    <Button variant="secondary" onClick={() => navigate("/manager/projects")} leftIcon="arrow_back">
                        {t("common:actions.backToList")}
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div
            className="p-8 min-h-full bg-transparent space-y-6"
            data-source-file={SOURCE_FILES.managerProjectDetail}
        data-source-label="section:manager-project-detail-page"
        >
            {/* Header */}
      <Card className="p-6 bg-white/60 backdrop-blur-xl border-border/50">
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
                                {t("common:labels.type")}: {translateDataType(project.data_type)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className={cn("w-2 h-2 rounded-full", getStatusDot(project.status))} />
                                {t("common:labels.status")}: <span className="capitalize">{translateProjectStatus(project.status)}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                {t("common:labels.createdAt")}: {formatDate(project.created_at)}
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
