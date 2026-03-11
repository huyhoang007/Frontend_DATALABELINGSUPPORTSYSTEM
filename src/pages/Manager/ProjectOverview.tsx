import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";
import { analyticsApi } from "../../api/analyticsApi";

export default function ProjectOverview() {
    const { project } = useOutletContext<{ project: any }>();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchSummary() {
            setLoading(true);
            setError(null);
            try {
                const data = await analyticsApi.getProjectSummary(project.projectId ?? project.project_id);
                if (!cancelled) setSummary(data);
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Không thể tải dữ liệu analytics");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchSummary();
        return () => { cancelled = true; };
    }, [project.projectId, project.project_id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Đang tải dữ liệu...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-8 bg-card/80 backdrop-blur border-border/60 text-center">
                <div className="text-red-400 text-sm mb-2">⚠️ {error}</div>
                <button onClick={() => window.location.reload()} className="text-xs text-primary underline">
                    Thử lại
                </button>
            </Card>
        );
    }

    const progress = summary?.progress;
    const quality = summary?.qualityMetrics;
    const contributors = summary?.topContributors || [];

    // Safe values with defaults
    const totalItems = progress?.totalItems ?? 0;
    const labeledItems = progress?.labeledItems ?? 0;
    const reviewedItems = progress?.reviewedItems ?? 0;
    const approvedItems = progress?.approvedItems ?? 0;
    const overallProgress = progress?.overallProgress ?? 0;

    const overallQualityScore = quality?.overallQualityScore ?? 0;
    const qualityLevel = quality?.qualityLevel ?? "N/A";
    const totalAnnotations = quality?.totalAnnotations ?? 0;
    const acceptedAnnotations = quality?.acceptedAnnotations ?? 0;
    const rejectedAnnotations = quality?.rejectedAnnotations ?? 0;
    const annotationAccuracy = quality?.annotationAccuracy ?? 0;
    const policyComplianceRate = quality?.policyComplianceRate ?? 0;
    const totalPolicyViolations = quality?.totalPolicyViolations ?? 0;
    const labelDistributionBalance = quality?.labelDistributionBalance ?? 0;

    const totalTeamMembers = summary?.totalTeamMembers ?? 0;
    const teamAvgScore = summary?.teamAveragePerformanceScore ?? 0;
    const alerts = summary?.alerts || [];

    return (
        <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Data</div>
                    <div className="text-3xl font-bold text-foreground">{totalItems.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">items</div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Team</div>
                    <div className="text-3xl font-bold text-foreground">{totalTeamMembers}</div>
                    <div className="text-xs text-emerald-500 font-medium mt-1">Avg Score: {teamAvgScore.toFixed(1)}</div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Annotations</div>
                    <div className="flex items-center justify-center gap-3 mt-1">
                        <div>
                            <span className="text-sm font-bold text-emerald-500">{acceptedAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">Approved</div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-amber-500">{totalAnnotations - acceptedAnnotations - rejectedAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">Pending</div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-red-400">{rejectedAnnotations}</span>
                            <div className="text-[10px] text-muted-foreground">Rejected</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quality</div>
                    <div className="text-3xl font-bold text-foreground">{overallQualityScore.toFixed(0)}%</div>
                    <div className={cn(
                        "text-xs font-medium mt-1",
                        qualityLevel === "EXCELLENT" || qualityLevel === "GOOD" ? "text-emerald-500" : "text-red-400"
                    )}>
                        {qualityLevel}
                    </div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Policy</div>
                    <div className="text-3xl font-bold text-foreground">{policyComplianceRate.toFixed(0)}%</div>
                    <div className="text-xs text-red-400 font-medium mt-1">{totalPolicyViolations} Violations</div>
                </Card>
            </div>

            {/* Progress + Quality Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card/80 backdrop-blur border-border/60">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-bold text-foreground">Progress Overview</h3>
                        <span className="text-xs text-muted-foreground">
                            Overall: {overallProgress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="space-y-5">
                        {[
                            { label: "Labeled", value: labeledItems, pct: progress?.labelingProgress ?? 0, color: "bg-blue-500" },
                            { label: "Reviewed", value: reviewedItems, pct: progress?.reviewingProgress ?? 0, color: "bg-emerald-500" },
                            { label: "Approved", value: approvedItems, pct: progress?.approvalProgress ?? 0, color: "bg-amber-500" },
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
                    <h3 className="text-base font-bold text-foreground mb-6">Quality Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">Annotation Accuracy</span>
                            <span className="text-sm font-bold text-emerald-500">{annotationAccuracy.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">Label Distribution Balance</span>
                            <span className="text-sm font-bold text-blue-500">{labelDistributionBalance.toFixed(1)}%</span>
                        </div>
                        {quality?.mostUsedLabel && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground font-medium">Most Used Label</span>
                                <span className="text-sm font-bold text-amber-500">
                                    {quality.mostUsedLabel} ({quality.mostUsedLabelCount})
                                </span>
                            </div>
                        )}
                        {quality?.leastUsedLabel && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground font-medium">Least Used Label</span>
                                <span className="text-sm font-bold text-muted-foreground">
                                    {quality.leastUsedLabel} ({quality.leastUsedLabelCount})
                                </span>
                            </div>
                        )}
                        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground font-medium">Overall Quality</span>
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
                    <h3 className="text-base font-bold text-foreground mb-4">Top Contributors</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left py-2 text-muted-foreground font-medium">Member</th>
                                    <th className="text-left py-2 text-muted-foreground font-medium">Role</th>
                                    <th className="text-center py-2 text-muted-foreground font-medium">Tasks</th>
                                    <th className="text-center py-2 text-muted-foreground font-medium">Completed</th>
                                    <th className="text-center py-2 text-muted-foreground font-medium">Score</th>
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
                                                {c.role}
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
                    <h3 className="text-base font-bold text-amber-500 mb-3">⚠️ Alerts</h3>
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
                    <h3 className="text-base font-bold text-foreground mb-3">Mô tả dự án</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                </Card>
            )}
        </>
    );
}
