import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
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
import { SOURCE_FILES } from "../../utils/sourceMeta";

const toNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const ANNOTATOR_LABELED_STATUSES = new Set([
    "SUBMITTED",
    "RE_SUBMITTED",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
]);

const REVIEWER_REVIEWED_STATUSES = new Set([
    "APPROVED",
    "REJECTED",
    "COMPLETED",
]);

const REVIEWER_ACCEPTED_STATUSES = new Set([
    "APPROVED",
    "COMPLETED",
]);

const REVIEWER_REJECTED_STATUSES = new Set([
    "REJECTED",
]);

export default function ProjectOverview() {
    const { project } = useOutletContext<{ project: any }>();
    const { t, i18n } = useTranslation(["manager", "common"]);
    const queryClient = useQueryClient();
    const isProjectCompleted = project?.status?.toLowerCase() === "completed";
    const [guidelineContent, setGuidelineContent] = useState("");
    const [guidelineVersion, setGuidelineVersion] = useState("v1.0");
    const [guidelineFileUrl, setGuidelineFileUrl] = useState("");
    const [savingGuideline, setSavingGuideline] = useState(false);
    const [guidelineMessage, setGuidelineMessage] = useState<string | null>(null);
    const [guidelineMessageType, setGuidelineMessageType] = useState<"success" | "error" | null>(null);
    const [hoveredExplainKey, setHoveredExplainKey] = useState<string | null>(null);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });

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
    const derivedLabeledItems = sumItemsForStatuses(ANNOTATOR_LABELED_STATUSES);
    const derivedReviewedItems = sumItemsForStatuses(REVIEWER_REVIEWED_STATUSES);
    const derivedApprovedItems = sumItemsForStatuses(REVIEWER_ACCEPTED_STATUSES);
    const derivedRejectedItems = sumItemsForStatuses(REVIEWER_REJECTED_STATUSES);
    const hasAssignmentProgressSource = assignments.length > 0 && datasets.length > 0;
    const backendLabeledItems = toNumber(progress?.labeledItems);
    const backendReviewedItems = toNumber(progress?.reviewedItems);
    const backendApprovedItems = toNumber(progress?.approvedItems);
    const approvedItems = Math.min(
        totalItems,
        Math.max(
            backendApprovedItems,
            hasAssignmentProgressSource ? derivedApprovedItems : 0,
        ),
    );

    const overallQualityScore = quality?.overallQualityScore ?? 0;
    const qualityLevel = quality?.qualityLevel ?? "N/A";
    const totalAnnotations = quality?.totalAnnotations ?? 0;
    const totalPolicyViolations = quality?.totalPolicyViolations ?? 0;
    void totalPolicyViolations; // kept for future use
    const acceptedAnnotations = toNumber(quality?.acceptedAnnotations);
    const backendRejectedAnnotations = toNumber(quality?.rejectedAnnotations);
    const reviewedItems = Math.min(
        totalItems,
        Math.max(
            approvedItems,
            hasAssignmentProgressSource ? derivedReviewedItems : 0,
            acceptedAnnotations > 0 || backendRejectedAnnotations > 0 ? backendReviewedItems : 0,
        ),
    );
    const labeledItems = Math.min(
        totalItems,
        Math.max(
            reviewedItems,
            approvedItems,
            backendLabeledItems,
            hasAssignmentProgressSource ? derivedLabeledItems : 0,
        ),
    );
    // Rejected only means annotations explicitly rejected by reviewer.
    // Items that reviewer has opened but not decided yet must remain pending.
    const rejectedAnnotations = hasAssignmentProgressSource
        ? Math.min(labeledItems, Math.max(derivedRejectedItems, backendRejectedAnnotations))
        : backendRejectedAnnotations;
    const annotationBaseTotal = Math.max(totalAnnotations, acceptedAnnotations + rejectedAnnotations);
    const reviewedAnnotations = acceptedAnnotations + rejectedAnnotations;
    const pendingAnnotations = Math.max(annotationBaseTotal - reviewedAnnotations, 0);
    const approvalProgressValue = Math.min(
        Math.max(totalAnnotations, toNumber(quality?.acceptedAnnotations)),
        toNumber(quality?.acceptedAnnotations),
    );
    const approvalProgressTotal = Math.max(totalAnnotations, approvalProgressValue);
    const approvalProgressPct = approvalProgressTotal > 0
        ? (approvalProgressValue / approvalProgressTotal) * 100
        : 0;
    const overallProgress = totalItems > 0
        ? (approvedItems / totalItems) * 100
        : 0;
    const annotationAccuracy = quality?.annotationAccuracy ?? 0;
    const policyComplianceRate = quality?.policyComplianceRate ?? 0;
    const labelDistributionBalance = quality?.labelDistributionBalance ?? 0;

    const totalTeamMembers = summary?.totalTeamMembers ?? 0;
    const teamAvgScore = teamAverageScore || toNumber(summary?.teamAveragePerformanceScore);
    const alerts = summary?.alerts || [];
    const isEnglish = i18n.language === "en";

    const explainers = useMemo(() => ({
        totalItems: {
            title: isEnglish ? "Data / total items" : "Dữ liệu / tổng số item",
            api: [
                "GET /api/analytics/projects/:projectId/summary",
                "GET /api/analytics/projects/:projectId/progress",
            ],
            fields: ["summary.progress.totalItems", "progress.totalItems"],
            formula: isEnglish
                ? `Displayed value = progress.totalItems ?? 0 = ${totalItems}`
                : `Giá trị hiển thị = progress.totalItems ?? 0 = ${totalItems}`,
        },
        team: {
            title: isEnglish ? "Team size and average score" : "Quy mô nhóm và điểm trung bình",
            api: [
                "GET /api/analytics/projects/:projectId/summary",
                "GET /api/analytics/projects/:projectId/member-scores",
                "GET /api/analytics/projects/:projectId/contributions",
            ],
            fields: [
                "summary.totalTeamMembers",
                "memberScores[].performanceScore",
                "summary.teamAveragePerformanceScore",
            ],
            formula: isEnglish
                ? `Team count = summary.totalTeamMembers = ${totalTeamMembers}. Average score = average(memberScores.performanceScore) or fallback summary.teamAveragePerformanceScore = ${teamAvgScore.toFixed(1)}`
                : `Số thành viên = summary.totalTeamMembers = ${totalTeamMembers}. Điểm trung bình = average(memberScores.performanceScore) hoặc fallback summary.teamAveragePerformanceScore = ${teamAvgScore.toFixed(1)}`,
        },
        annotations: {
            title: isEnglish ? "Annotation review counts" : "Số chú thích theo trạng thái review",
            api: ["GET /api/analytics/projects/:projectId/quality"],
            fields: [
                "quality.totalAnnotations",
                "quality.acceptedAnnotations",
                "quality.rejectedAnnotations",
            ],
            formula: isEnglish
                ? `Accepted = ${acceptedAnnotations}; Rejected = ${rejectedAnnotations}; Pending = max(baseTotal - (accepted + rejected), 0) = max(${annotationBaseTotal} - (${acceptedAnnotations} + ${rejectedAnnotations}), 0) = ${pendingAnnotations}`
                : `Đã chấp nhận = ${acceptedAnnotations}; Từ chối = ${rejectedAnnotations}; Chờ duyệt = max(tổng cơ sở - (accepted + rejected), 0) = max(${annotationBaseTotal} - (${acceptedAnnotations} + ${rejectedAnnotations}), 0) = ${pendingAnnotations}`,
        },
        qualityScore: {
            title: isEnglish ? "Overall quality score" : "Điểm chất lượng tổng thể",
            api: ["GET /api/analytics/projects/:projectId/quality"],
            fields: ["quality.overallQualityScore", "quality.qualityLevel"],
            formula: isEnglish
                ? `Displayed score = quality.overallQualityScore = ${overallQualityScore.toFixed(1)}. Quality level = ${qualityLevel}`
                : `Điểm hiển thị = quality.overallQualityScore = ${overallQualityScore.toFixed(1)}. Mức chất lượng = ${qualityLevel}`,
        },
        policyCompliance: {
            title: isEnglish ? "Policy compliance and violations" : "Tỷ lệ tuân thủ policy và số vi phạm",
            api: ["GET /api/analytics/projects/:projectId/quality"],
            fields: ["quality.policyComplianceRate", "quality.totalPolicyViolations"],
            formula: isEnglish
                ? `Compliance = quality.policyComplianceRate = ${policyComplianceRate.toFixed(1)}%. Violation count = quality.totalPolicyViolations = ${totalPolicyViolations}`
                : `Tỷ lệ tuân thủ = quality.policyComplianceRate = ${policyComplianceRate.toFixed(1)}%. Số vi phạm = quality.totalPolicyViolations = ${totalPolicyViolations}`,
        },
        labelingProgress: {
            title: isEnglish ? "Labeled progress" : "Tiến độ đã gán nhãn",
            api: [
                "GET /api/analytics/projects/:projectId/progress",
                "GET /api/assignments/project/:projectId",
                "GET /api/datasets/project/:projectId",
            ],
            fields: ["progress.labeledItems", "assignments[].status", "datasets[].totalItems"],
            formula: isEnglish
                ? `Derived labeled items = sum(dataset.totalItems for annotator-completed statuses SUBMITTED, RE_SUBMITTED, APPROVED, REJECTED, COMPLETED) = ${derivedLabeledItems}. Displayed value uses the derived assignment-based result = ${labeledItems}/${totalItems}`
                : `Số item đã gán nhãn suy ra = tổng dataset.totalItems của assignment đã qua bước annotator với trạng thái SUBMITTED, RE_SUBMITTED, APPROVED, REJECTED, COMPLETED = ${derivedLabeledItems}. Giá trị hiển thị dùng trực tiếp kết quả suy ra theo assignment = ${labeledItems}/${totalItems}`,
        },
        reviewingProgress: {
            title: isEnglish ? "Reviewer reviewed progress" : "Tiến độ reviewer đã đánh giá",
            api: [
                "GET /api/analytics/projects/:projectId/progress",
                "GET /api/analytics/projects/:projectId/quality",
                "GET /api/assignments/project/:projectId",
                "GET /api/datasets/project/:projectId",
            ],
            fields: [
                "progress.reviewedItems",
                "quality.acceptedAnnotations",
                "quality.rejectedAnnotations",
                "assignments[].status",
                "datasets[].totalItems",
            ],
            formula: isEnglish
                ? `Reviewer-reviewed items are counted only when reviewer has already made a decision. Derived value = sum(dataset.totalItems for APPROVED, REJECTED, COMPLETED) = ${derivedReviewedItems}. Displayed value uses the derived assignment-based result = ${reviewedItems}/${totalItems}`
                : `Số item reviewer đã đánh giá chỉ được tính khi reviewer đã ra quyết định. Giá trị suy ra = tổng dataset.totalItems của assignment có trạng thái APPROVED, REJECTED, COMPLETED = ${derivedReviewedItems}. Giá trị hiển thị dùng trực tiếp kết quả suy ra theo assignment = ${reviewedItems}/${totalItems}`,
        },
        approvalProgress: {
            title: isEnglish ? "Approved progress" : "Tiến độ đã duyệt",
            api: [
                "GET /api/analytics/projects/:projectId/progress",
                "GET /api/analytics/projects/:projectId/quality",
                "GET /api/assignments/project/:projectId",
                "GET /api/datasets/project/:projectId",
            ],
            fields: [
                "quality.acceptedAnnotations",
                "quality.totalAnnotations",
                "progress.approvedItems",
                "assignments[].status",
                "datasets[].totalItems",
            ],
            formula: isEnglish
                ? `Accepted progress now follows reviewed annotations directly. Displayed value = quality.acceptedAnnotations / quality.totalAnnotations = ${approvalProgressValue}/${approvalProgressTotal}`
                : `Thanh đã chấp nhận giờ đi theo số annotation đã được reviewer chấp nhận trực tiếp. Giá trị hiển thị = quality.acceptedAnnotations / quality.totalAnnotations = ${approvalProgressValue}/${approvalProgressTotal}`,
        },
        annotationAccuracy: {
            title: isEnglish ? "Annotation accuracy" : "Độ chính xác gán nhãn",
            api: ["GET /api/analytics/projects/:projectId/quality"],
            fields: ["quality.annotationAccuracy"],
            formula: isEnglish
                ? `Displayed value = quality.annotationAccuracy = ${annotationAccuracy.toFixed(1)}%`
                : `Giá trị hiển thị = quality.annotationAccuracy = ${annotationAccuracy.toFixed(1)}%`,
        },
        labelBalance: {
            title: isEnglish ? "Label distribution balance" : "Cân bằng phân phối nhãn",
            api: ["GET /api/analytics/projects/:projectId/quality"],
            fields: ["quality.labelDistributionBalance"],
            formula: isEnglish
                ? `Displayed value = quality.labelDistributionBalance = ${labelDistributionBalance.toFixed(1)}%`
                : `Giá trị hiển thị = quality.labelDistributionBalance = ${labelDistributionBalance.toFixed(1)}%`,
        },
        mostUsedLabel: {
            title: isEnglish ? "Most used label" : "Nhãn dùng nhiều nhất",
            api: ["GET /api/analytics/projects/:projectId/quality"],
            fields: ["quality.mostUsedLabel", "quality.mostUsedLabelCount"],
            formula: isEnglish
                ? `Displayed directly from backend quality response: ${quality?.mostUsedLabel ?? "N/A"} (${quality?.mostUsedLabelCount ?? 0})`
                : `Hiển thị trực tiếp từ response quality của backend: ${quality?.mostUsedLabel ?? "N/A"} (${quality?.mostUsedLabelCount ?? 0})`,
        },
        leastUsedLabel: {
            title: isEnglish ? "Least used label" : "Nhãn dùng ít nhất",
            api: ["GET /api/analytics/projects/:projectId/quality"],
            fields: ["quality.leastUsedLabel", "quality.leastUsedLabelCount"],
            formula: isEnglish
                ? `Displayed directly from backend quality response: ${quality?.leastUsedLabel ?? "N/A"} (${quality?.leastUsedLabelCount ?? 0})`
                : `Hiển thị trực tiếp từ response quality của backend: ${quality?.leastUsedLabel ?? "N/A"} (${quality?.leastUsedLabelCount ?? 0})`,
        },
        contributors: {
            title: isEnglish ? "Top contributors table" : "Bảng đóng góp hàng đầu",
            api: [
                "GET /api/analytics/projects/:projectId/contributions",
                "GET /api/analytics/projects/:projectId/member-scores",
            ],
            fields: [
                "contributions[].totalAssignments",
                "contributions[].completedAssignments",
                "memberScores[].performanceScore",
            ],
            formula: isEnglish
                ? "FE merges contribution rows and member-score rows by userId. Tasks = totalAssignments, Completed = completedAssignments, Score = performanceScore. Then FE sorts by score desc, completed desc, task count desc."
                : "FE gộp dữ liệu contribution và member-scores theo userId. Nhiệm vụ = totalAssignments, Hoàn thành = completedAssignments, Điểm = performanceScore. Sau đó FE sắp xếp theo điểm giảm dần, rồi completed giảm dần, rồi tổng nhiệm vụ giảm dần.",
        },
        alerts: {
            title: isEnglish ? "Project alerts" : "Cảnh báo dự án",
            api: ["GET /api/analytics/projects/:projectId/summary"],
            fields: ["summary.alerts[]"],
            formula: isEnglish
                ? `Displayed directly from backend summary alerts array. Current alert count = ${alerts.length}`
                : `Hiển thị trực tiếp từ mảng summary.alerts[] của backend. Số cảnh báo hiện tại = ${alerts.length}`,
        },
        description: {
            title: isEnglish ? "Project description" : "Mô tả dự án",
            api: ["GET /api/projects/:projectId"],
            fields: ["project.description"],
            formula: isEnglish
                ? "Displayed directly from project.description returned by project detail API."
                : "Hiển thị trực tiếp từ project.description của API chi tiết dự án.",
        },
        guideline: {
            title: isEnglish ? "Annotation guideline" : "Hướng dẫn gán nhãn",
            api: ["GET /api/projects/:projectId"],
            fields: [
                "project.guidelineContent",
                "project.guidelineVersion",
                "project.guidelineFileUrl",
            ],
            formula: isEnglish
                ? "Displayed directly from project detail API fields guidelineContent, guidelineVersion, and guidelineFileUrl."
                : "Hiển thị trực tiếp từ API chi tiết dự án qua các field guidelineContent, guidelineVersion và guidelineFileUrl.",
        },
    }), [
        isEnglish,
        totalItems,
        totalTeamMembers,
        teamAvgScore,
        acceptedAnnotations,
        rejectedAnnotations,
        pendingAnnotations,
        totalAnnotations,
        annotationBaseTotal,
        overallQualityScore,
        qualityLevel,
        policyComplianceRate,
        totalPolicyViolations,
        derivedLabeledItems,
        labeledItems,
        derivedReviewedItems,
        reviewedItems,
        derivedApprovedItems,
        approvedItems,
        approvalProgressValue,
        approvalProgressTotal,
        derivedRejectedItems,
        annotationAccuracy,
        labelDistributionBalance,
        alerts.length,
        quality?.leastUsedLabel,
        quality?.leastUsedLabelCount,
        quality?.mostUsedLabel,
        quality?.mostUsedLabelCount,
    ]);

    const currentExplainer = hoveredExplainKey ? explainers[hoveredExplainKey as keyof typeof explainers] : null;
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Shift") setIsShiftPressed(true);
            if (event.key !== "Alt") return;
            if (event.repeat || !currentExplainer) return;
            navigator.clipboard?.writeText([
                currentExplainer.title,
                currentExplainer.api.join(", "),
                currentExplainer.formula,
            ].join("\n")).catch(() => {});
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === "Shift") setIsShiftPressed(false);
        };
        const handleBlur = () => {
            setHoveredExplainKey(null);
            setIsShiftPressed(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, [currentExplainer]);
    const attachExplainProps = (key: string) => ({
        "data-shift-explainer": "custom",
        onMouseEnter: (event: any) => {
            setHoveredExplainKey(key);
            setPointerPosition({ x: event.clientX, y: event.clientY });
        },
        onMouseMove: (event: any) => {
            setHoveredExplainKey(key);
            setPointerPosition({ x: event.clientX, y: event.clientY });
        },
        onMouseLeave: () => setHoveredExplainKey((current) => (current === key ? null : current)),
    });

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

    return (
        <>
            {isShiftPressed && currentExplainer && (
                <div
                    className="pointer-events-none fixed z-[10000] max-w-[420px] rounded-lg border border-emerald-400/30 bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow-2xl backdrop-blur-sm"
                    style={{
                        left: Math.min(pointerPosition.x + 14, window.innerWidth - 440),
                        top: Math.min(pointerPosition.y + 18, window.innerHeight - 140),
                    }}
                >
                    <div className="text-[11px] leading-5">{currentExplainer.title}</div>
                    <div className="mt-1 text-[11px] leading-5 text-slate-300">{currentExplainer.api.join(", ")}</div>
                    <div className="mt-1 text-[11px] leading-5 text-slate-300">{currentExplainer.formula}</div>
                </div>
            )}
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
            <div
                className="grid grid-cols-2 md:grid-cols-5 gap-4"
                data-source-file={SOURCE_FILES.managerProjectOverview}
                data-source-label="section:project-overview-kpi-grid"
            >
                <Card
                    {...attachExplainProps("totalItems")}
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-kpi-data-card"
                    className="p-5 bg-card/80 backdrop-blur border-border/60 text-center"
                >
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("manager:overview.data")}</div>
                    <div className="text-3xl font-bold text-foreground">{totalItems.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t("manager:overview.totalItemsUnit")}</div>
                </Card>
                <Card
                    {...attachExplainProps("team")}
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-kpi-team-card"
                    className="p-5 bg-card/80 backdrop-blur border-border/60 text-center"
                >
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("manager:overview.team")}</div>
                    <div className="text-3xl font-bold text-foreground">{totalTeamMembers}</div>
                    <div className="text-xs text-emerald-500 font-medium mt-1">{t("manager:overview.averageScore", { score: teamAvgScore.toFixed(1) })}</div>
                </Card>
                <Card
                    {...attachExplainProps("annotations")}
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-kpi-annotations-card"
                    className="p-5 bg-card/80 backdrop-blur border-border/60 text-center"
                >
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("manager:overview.annotations")}</div>
                    <div className="flex items-center justify-center gap-3 mt-1">
                        <div>
                            <span className="text-sm font-bold text-emerald-500">{acceptedAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">{t("manager:overview.accepted")}</div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-amber-500">{pendingAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">{t("manager:overview.pending")}</div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-red-400">{rejectedAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">{t("manager:overview.rejected")}</div>
                        </div>
                    </div>
                </Card>
                <Card
                    {...attachExplainProps("qualityScore")}
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-kpi-quality-card"
                    className="p-5 bg-card/80 backdrop-blur border-border/60 text-center"
                >
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("manager:overview.quality")}</div>
                    <div className="text-3xl font-bold text-foreground">{overallQualityScore.toFixed(0)}%</div>
                    <div className={cn(
                        "text-xs font-medium mt-1",
                        qualityLevel === "EXCELLENT" || qualityLevel === "GOOD" ? "text-emerald-500" : "text-red-400"
                    )}>
                        {qualityLevel}
                    </div>
                </Card>
                <Card
                    {...attachExplainProps("policyCompliance")}
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-kpi-policy-card"
                    className="p-5 bg-card/80 backdrop-blur border-border/60 text-center"
                >
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        {t("manager:overview.violations", { count: totalPolicyViolations })}
                    </div>
                    <div className="text-3xl font-bold text-foreground">{policyComplianceRate.toFixed(0)}%</div>
                    <div className="text-xs text-red-400 font-medium mt-1">{t("manager:overview.violationsLabel")}</div>
                </Card>
            </div>

            {/* Progress + Quality Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-progress-card"
                    className="p-6 bg-card/80 backdrop-blur border-border/60"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-bold text-foreground">{t("manager:overview.progressOverview")}</h3>
                        <span className="text-xs text-muted-foreground">
                            {t("manager:overview.overall")}: {overallProgress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="space-y-5">
                        {[
                            { key: "labelingProgress", label: t("manager:overview.labelingDone"), value: labeledItems, pct: totalItems > 0 ? (labeledItems / totalItems) * 100 : 0, color: "bg-blue-500" },
                            { key: "reviewingProgress", label: t("manager:overview.reviewingDone"), value: reviewedItems, pct: totalItems > 0 ? (reviewedItems / totalItems) * 100 : 0, color: "bg-emerald-500" },
                            { key: "approvalProgress", label: t("manager:overview.approvalDone"), value: approvalProgressValue, total: approvalProgressTotal, pct: approvalProgressPct, color: "bg-amber-500" },
                        ].map((bar) => (
                            <div
                                key={bar.label}
                                {...attachExplainProps(bar.key)}
                                data-source-file={SOURCE_FILES.managerProjectOverview}
                                data-source-label={`section:project-overview-progress-${bar.key}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-foreground font-medium">{bar.label}</span>
                                    <span className="text-sm font-bold text-foreground">
                                        {bar.value.toLocaleString()} / {(bar.total ?? totalItems).toLocaleString()}
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

                <Card
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-quality-metrics-card"
                    className="p-6 bg-card/80 backdrop-blur border-border/60"
                >
                    <h3 className="text-base font-bold text-foreground mb-6">{t("manager:overview.qualityMetrics")}</h3>
                    <div className="space-y-4">
                        <div
                            {...attachExplainProps("annotationAccuracy")}
                            data-source-file={SOURCE_FILES.managerProjectOverview}
                            data-source-label="section:project-overview-quality-annotation-accuracy"
                            className="flex items-center justify-between"
                        >
                            <span className="text-sm text-foreground font-medium">{t("manager:overview.annotationAccuracy")}</span>
                            <span className="text-sm font-bold text-emerald-500">{annotationAccuracy.toFixed(1)}%</span>
                        </div>
                        <div
                            {...attachExplainProps("labelBalance")}
                            data-source-file={SOURCE_FILES.managerProjectOverview}
                            data-source-label="section:project-overview-quality-label-balance"
                            className="flex items-center justify-between"
                        >
                            <span className="text-sm text-foreground font-medium">{t("manager:overview.labelBalance")}</span>
                            <span className="text-sm font-bold text-blue-500">{labelDistributionBalance.toFixed(1)}%</span>
                        </div>
                        {quality?.mostUsedLabel && (
                            <div
                                {...attachExplainProps("mostUsedLabel")}
                                data-source-file={SOURCE_FILES.managerProjectOverview}
                                data-source-label="section:project-overview-quality-most-used-label"
                                className="flex items-center justify-between"
                            >
                                <span className="text-sm text-foreground font-medium">{t("manager:overview.mostUsedLabel")}</span>
                                <span className="text-sm font-bold text-amber-500">
                                    {quality.mostUsedLabel} ({quality.mostUsedLabelCount})
                                </span>
                            </div>
                        )}
                        {quality?.leastUsedLabel && (
                            <div
                                {...attachExplainProps("leastUsedLabel")}
                                data-source-file={SOURCE_FILES.managerProjectOverview}
                                data-source-label="section:project-overview-quality-least-used-label"
                                className="flex items-center justify-between"
                            >
                                <span className="text-sm text-foreground font-medium">{t("manager:overview.leastUsedLabel")}</span>
                                <span className="text-sm font-bold text-muted-foreground">
                                    {quality.leastUsedLabel} ({quality.leastUsedLabelCount})
                                </span>
                            </div>
                        )}
                        <div
                            {...attachExplainProps("qualityScore")}
                            data-source-file={SOURCE_FILES.managerProjectOverview}
                            data-source-label="section:project-overview-quality-overall-level"
                            className="pt-4 border-t border-border/50 flex items-center justify-between"
                        >
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
                <Card
                    {...attachExplainProps("contributors")}
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-contributors-card"
                    className="p-6 bg-card/80 backdrop-blur border-border/60"
                >
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
                                    <tr
                                        key={c.userId}
                                        data-source-file={SOURCE_FILES.managerProjectOverview}
                                        data-source-label="section:project-overview-contributors-row"
                                        className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                                    >
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
                <Card
                    {...attachExplainProps("alerts")}
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-alerts-card"
                    className="p-6 bg-card/80 backdrop-blur border-amber-500/30 border"
                >
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
                <Card
                    {...attachExplainProps("description")}
                    data-source-file={SOURCE_FILES.managerProjectOverview}
                    data-source-label="section:project-overview-description-card"
                    className="p-6 bg-card/80 backdrop-blur border-border/60"
                >
                    <h3 className="text-base font-bold text-foreground mb-3">{t("manager:overview.projectDescription")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                </Card>
            )}

            {/* Annotation Guideline */}
            <Card
                {...attachExplainProps("guideline")}
                data-source-file={SOURCE_FILES.managerProjectOverview}
                data-source-label="section:project-overview-guideline-card"
                className="p-6 bg-card/80 backdrop-blur border-border/60"
            >
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
                  <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded mb-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-orange-600 text-sm mt-0.5">lock</span>
                    <p className="text-xs text-orange-900">{t("manager:overview.guidelineLocked")}</p>
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
                        data-source-file={SOURCE_FILES.managerProjectOverview}
                        data-source-label="section:project-overview-guideline-save-button"
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



