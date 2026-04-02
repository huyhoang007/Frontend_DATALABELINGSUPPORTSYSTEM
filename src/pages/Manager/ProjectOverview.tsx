import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";
import { projectApi } from "../../api/projectApi";
import {
    fetchProjectOverview,
    getHotspotQueryBehavior,
    invalidateProjectSummaryData,
    projectQueryKeys,
} from "../../query/projectQueries";
import { translateRole } from "../../i18n/helpers";

const toNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export default function ProjectOverview() {
    const { project } = useOutletContext<{ project: any }>();
    const { t } = useTranslation(["manager", "common"]);
    const queryClient = useQueryClient();
    const isProjectCompleted = project?.status?.toLowerCase() === "completed";
    const [guidelineContent, setGuidelineContent] = useState("");
    const [guidelineVersion, setGuidelineVersion] = useState("v1.0");
    const [guidelineFileUrl, setGuidelineFileUrl] = useState("");
    const [savingGuideline, setSavingGuideline] = useState(false);
    const [guidelineMessage, setGuidelineMessage] = useState<string | null>(null);
    const [guidelineMessageType, setGuidelineMessageType] = useState<"success" | "error" | null>(null);

    useEffect(() => {
        setGuidelineContent(project?.guidelineContent || "");
        setGuidelineVersion(project?.guidelineVersion || "v1.0");
        setGuidelineFileUrl(project?.guidelineFileUrl || "");
    }, [project?.projectId, project?.guidelineContent, project?.guidelineVersion, project?.guidelineFileUrl]);

    useEffect(() => {
        if (guidelineMessage) {
            const timer = setTimeout(() => {
                setGuidelineMessage(null);
                setGuidelineMessageType(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [guidelineMessage]);

    const projectId = project?.projectId ?? project?.project_id;
    type OverviewData = {
        summary: any;
        contributors: any[];
        assignments: any[];
        datasets: any[];
        teamAverageScore: number;
    };
    const hotspot = getHotspotQueryBehavior(30_000, 300_000) as {
        staleTime: number;
        gcTime: number;
        refetchOnMount: boolean | "always";
    };
    const {
        data: overviewData,
        isLoading: loading,
        error,
    } = useQuery<OverviewData>({
        queryKey: projectQueryKeys.overview(projectId),
        queryFn: () => fetchProjectOverview(projectId),
        enabled: Boolean(projectId),
        placeholderData: (previousData: OverviewData | undefined) => previousData,
        ...hotspot,
    });
    const errorMessage = error ? (error as any)?.message || String(error) : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">{t("common:states.loadingData")}</span>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <Card className="p-8 bg-card/80 backdrop-blur border-border/60 text-center">
                <div className="text-red-400 text-sm mb-2">! {errorMessage}</div>
                <button onClick={() => window.location.reload()} className="text-xs text-primary underline">
                    {t("common:actions.retry")}
                </button>
            </Card>
        );
    }

    const summary = overviewData?.summary;
    const contributors = overviewData?.contributors || [];
    const assignments = overviewData?.assignments || [];
    const datasets = overviewData?.datasets || [];
    const teamAverageScore = overviewData?.teamAverageScore || 0;
    const progress = summary?.progress;
    const quality = summary?.qualityMetrics;
    const handleSaveGuideline = async () => {
        if (!projectId) return;
        setSavingGuideline(true);
        setGuidelineMessage(null);
        try {
            await projectApi.updateProject(projectId, {
                guidelineContent,
                guidelineFileUrl,
                guidelineVersion,
            });
            await invalidateProjectSummaryData(queryClient, projectId);
            await queryClient.invalidateQueries({ queryKey: projectQueryKeys.overview(projectId) });
            setGuidelineMessage(t("manager:overview.saveGuidelineSuccess"));
            setGuidelineMessageType("success");
        } catch (err: any) {
            setGuidelineMessage(err?.message || t("manager:overview.saveGuidelineFailed"));
            setGuidelineMessageType("error");
        } finally {
            setSavingGuideline(false);
        }
    };

    // Safe values with defaults
    const totalItems = progress?.totalItems ?? 0;
    const datasetItemsById = new Map(
        datasets.map((dataset: any) => [
            Number(dataset?.datasetId ?? dataset?.id),
            toNumber(dataset?.totalItems),
        ]),
    );
    const sumItemsForStatuses = (statuses: Set<string>) =>
        assignments.reduce((sum: number, assignment: any) => {
            const status = String(assignment?.status || "").toUpperCase();
            if (!statuses.has(status)) return sum;
            return sum + toNumber(datasetItemsById.get(Number(assignment?.datasetId)));
        }, 0);
    const derivedLabeledItems = sumItemsForStatuses(new Set(["SUBMITTED", "RE_SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"]));
    const derivedReviewedItems = sumItemsForStatuses(new Set(["APPROVED", "REJECTED", "COMPLETED"]));
    const derivedApprovedItems = sumItemsForStatuses(new Set(["APPROVED", "COMPLETED"]));
    const labeledItems = Math.min(totalItems, Math.max(progress?.labeledItems ?? 0, derivedLabeledItems));
    const approvedItems = Math.min(totalItems, Math.max(progress?.approvedItems ?? 0, derivedApprovedItems));
    const overallProgress = progress?.overallProgress ?? 0;

    const overallQualityScore = quality?.overallQualityScore ?? 0;
    const qualityLevel = quality?.qualityLevel ?? "N/A";
    const totalAnnotations = quality?.totalAnnotations ?? 0;
    const acceptedAnnotations = quality?.acceptedAnnotations ?? 0;
    const totalPolicyViolations = quality?.totalPolicyViolations ?? 0;
    void totalPolicyViolations; // kept for future use
    const rawRejectedAnnotations = quality?.rejectedAnnotations ?? 0;
    const rejectedAnnotations = rawRejectedAnnotations;
    const reviewedAnnotations = acceptedAnnotations + rejectedAnnotations;
    const pendingAnnotations = Math.max(totalAnnotations - reviewedAnnotations, 0);
    const hasActualReviewActivity = acceptedAnnotations > 0 || rejectedAnnotations > 0;
    const reviewedItems = hasActualReviewActivity
        ? Math.min(labeledItems, Math.max(progress?.reviewedItems ?? 0, derivedReviewedItems))
        : 0;
    const annotationAccuracy = quality?.annotationAccuracy ?? 0;
    const policyComplianceRate = quality?.policyComplianceRate ?? 0;
    const labelDistributionBalance = quality?.labelDistributionBalance ?? 0;

    const totalTeamMembers = summary?.totalTeamMembers ?? 0;
    const teamAvgScore = teamAverageScore || toNumber(summary?.teamAveragePerformanceScore);
    const alerts = summary?.alerts || [];

    return (
        <>
            {/* Toast Notification */}
            {guidelineMessage && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
                    guidelineMessageType === "success"
                        ? "bg-emerald-600 text-white border border-emerald-400"
                        : "bg-red-600 text-white border border-red-400"
                }`}>
                    <div className="flex items-center gap-2">
                        {guidelineMessageType === "success" ? (
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                        ) : (
                            <span className="material-symbols-outlined text-sm">error</span>
                        )}
                        <span className="text-sm font-medium">{guidelineMessage}</span>
                    </div>
                </div>
            )}
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("manager:overview.data")}</div>
                    <div className="text-3xl font-bold text-foreground">{totalItems.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t("manager:overview.totalItemsUnit")}</div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("manager:overview.team")}</div>
                    <div className="text-3xl font-bold text-foreground">{totalTeamMembers}</div>
                    <div className="text-xs text-emerald-500 font-medium mt-1">{t("manager:overview.averageScore", { score: teamAvgScore.toFixed(1) })}</div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("manager:overview.annotations")}</div>
                    <div className="flex items-center justify-center gap-3 mt-1">
                        <div>
                            <span className="text-sm font-bold text-emerald-500">{acceptedAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">{t("manager:overview.accepted")}</div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-amber-500">{pendingAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">Chờ duyệt</div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-red-400">{rejectedAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">{t("manager:overview.rejected")}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("manager:overview.quality")}</div>
                    <div className="text-3xl font-bold text-foreground">{overallQualityScore.toFixed(0)}%</div>
                    <div className={cn(
                        "text-xs font-medium mt-1",
                        qualityLevel === "EXCELLENT" || qualityLevel === "GOOD" ? "text-emerald-500" : "text-red-400"
                    )}>
                        {qualityLevel}
                    </div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Vi phạm</div>
                    <div className="text-3xl font-bold text-foreground">{policyComplianceRate.toFixed(0)}%</div>
                    <div className="text-xs text-red-400 font-medium mt-1">{t("manager:overview.violationsLabel")}</div>
                </Card>
            </div>

            {/* Progress + Quality Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card/80 backdrop-blur border-border/60">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-bold text-foreground">{t("manager:overview.progressOverview")}</h3>
                        <span className="text-xs text-muted-foreground">
                            {t("manager:overview.overall")}: {overallProgress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="space-y-5">
                        {[
                            { label: t("manager:overview.labelingDone"), value: labeledItems, pct: totalItems > 0 ? (labeledItems / totalItems) * 100 : 0, color: "bg-blue-500" },
                            { label: t("manager:overview.reviewingDone"), value: reviewedItems, pct: totalItems > 0 ? (reviewedItems / totalItems) * 100 : 0, color: "bg-emerald-500" },
                            { label: t("manager:overview.approvalDone"), value: approvedItems, pct: totalItems > 0 ? (approvedItems / totalItems) * 100 : 0, color: "bg-amber-500" },
                        ].map((bar) => (
                            <div key={bar.label}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-foreground font-medium">{bar.label}</span>
                                    <span className="text-sm font-bold text-foreground">
                                        {bar.value.toLocaleString()} / {totalItems.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-muted/50 rounded-full h-2.5">
                                    <div className={`${bar.color} h-2.5 rounded-full transition-all duration-500`}
                                        style={{ width: `${Math.min(bar.pct, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 bg-card/80 backdrop-blur border-border/60">
                    <h3 className="text-base font-bold text-foreground mb-6">{t("manager:overview.qualityMetrics")}</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">{t("manager:overview.annotationAccuracy")}</span>
                            <span className="text-sm font-bold text-emerald-500">{annotationAccuracy.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">{t("manager:overview.labelBalance")}</span>
                            <span className="text-sm font-bold text-blue-500">{labelDistributionBalance.toFixed(1)}%</span>
                        </div>
                        {quality?.mostUsedLabel && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground font-medium">{t("manager:overview.mostUsedLabel")}</span>
                                <span className="text-sm font-bold text-amber-500">
                                    {quality.mostUsedLabel} ({quality.mostUsedLabelCount})
                                </span>
                            </div>
                        )}
                        {quality?.leastUsedLabel && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground font-medium">{t("manager:overview.leastUsedLabel")}</span>
                                <span className="text-sm font-bold text-muted-foreground">
                                    {quality.leastUsedLabel} ({quality.leastUsedLabelCount})
                                </span>
                            </div>
                        )}
                        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground font-medium">{t("manager:overview.overallQuality")}</span>
                            <span className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-md",
                                overallQualityScore >= 80 ? "bg-emerald-500/10 text-emerald-500" : overallQualityScore >= 50 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {qualityLevel}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Team Contributions */}
            {contributors.length > 0 && (
                <Card className="p-6 bg-card/80 backdrop-blur border-border/60">
                    <h3 className="text-base font-bold text-foreground mb-4">{t("manager:overview.topContributors")}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left py-2 text-muted-foreground font-medium">{t("manager:overview.member")}</th>
                                    <th className="text-left py-2 text-muted-foreground font-medium">{t("manager:overview.role")}</th>
                                    <th className="text-center py-2 text-muted-foreground font-medium">{t("manager:overview.tasks")}</th>
                                    <th className="text-center py-2 text-muted-foreground font-medium">{t("manager:overview.completed")}</th>
                                    <th className="text-center py-2 text-muted-foreground font-medium">{t("manager:overview.score")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contributors.map((c: any) => (
                                    <tr key={c.userId} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                        <td className="py-2.5 text-foreground font-medium">{c.fullName || c.username}</td>
                                        <td className="py-2.5">
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                                c.role === "ANNOTATOR" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                                            )}>
                                                {translateRole(c.role)}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-center text-muted-foreground">{c.totalAssignments ?? 0}</td>
                                        <td className="py-2.5 text-center text-emerald-500 font-medium">{c.completedAssignments ?? 0}</td>
                                        <td className="py-2.5 text-center">
                                            <span className={cn(
                                                "font-bold",
                                                (c.performanceScore ?? 0) >= 80 ? "text-emerald-500" : (c.performanceScore ?? 0) >= 50 ? "text-amber-500" : "text-red-400"
                                            )}>
                                                {(c.performanceScore ?? 0).toFixed(0)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
                <Card className="p-6 bg-card/80 backdrop-blur border-amber-500/30 border">
                    <h3 className="text-base font-bold text-amber-500 mb-3">{t("manager:overview.alerts")}</h3>
                    <ul className="space-y-2">
                        {alerts.map((alert: string, idx: number) => (
                            <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                {alert}
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* Description */}
            {project.description && (
                <Card className="p-6 bg-card/80 backdrop-blur border-border/60">
                    <h3 className="text-base font-bold text-foreground mb-3">{t("manager:overview.projectDescription")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                </Card>
            )}

            {/* Annotation Guideline */}
            <Card className="p-6 bg-card/80 backdrop-blur border-border/60">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-foreground">{t("manager:overview.annotationGuideline")}</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">{t("manager:overview.guidelineVersion")}</label>
                        <input
                            value={guidelineVersion}
                            onChange={(e) => setGuidelineVersion(e.target.value)}
                            disabled={isProjectCompleted}
                            className={`px-2 py-1 rounded border border-border bg-background text-xs text-foreground w-20 ${isProjectCompleted ? "opacity-50 cursor-not-allowed" : ""}`}
                            placeholder="v1.0"
                        />
                    </div>
                </div>
                
                {isProjectCompleted && (
                    <div className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded mb-3 flex items-start gap-2">
                        <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-sm mt-0.5">lock</span>
                        <p className="text-xs text-orange-900 dark:text-orange-200">{t("manager:overview.guidelineLocked")}</p>
                    </div>
                )}
                
                <textarea
                    value={guidelineContent}
                    onChange={(e) => setGuidelineContent(e.target.value)}
                    disabled={isProjectCompleted}
                    rows={8}
                    className={`w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground resize-y ${isProjectCompleted ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder={t("manager:overview.guidelineContentPlaceholder")}
                />
                <div className="mt-3">
                    <label className="text-xs text-muted-foreground block mb-2">{t("manager:overview.guidelineFileLabel")}</label>
                    <input
                        value={guidelineFileUrl}
                        onChange={(e) => setGuidelineFileUrl(e.target.value)}
                        disabled={isProjectCompleted}
                        type="url"
                        className={`w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground ${isProjectCompleted ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder={t("manager:overview.guidelineFilePlaceholder")}
                    />
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        {t("manager:overview.guidelineHint")}
                    </p>
                    <button
                        onClick={handleSaveGuideline}
                        disabled={savingGuideline || isProjectCompleted}
                        className={`px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-semibold ${savingGuideline || isProjectCompleted ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                        {savingGuideline ? t("common:states.saving") : t("manager:overview.saveGuideline")}
                    </button>
                </div>
            </Card>
        </>
    );
}



