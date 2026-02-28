import React from "react";
import { useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";

// Mock progress data (FE-only, since backend doesn't have these fields)
function getMockProgress(projectId: number) {
    const seed = projectId * 7;
    const total = 800 + (seed % 600);
    const annotated = Math.min(total, Math.floor(total * (0.5 + (seed % 50) / 100)));
    const reviewed = Math.min(annotated, Math.floor(annotated * (0.5 + (seed % 40) / 100)));
    const exportable = reviewed;
    return {
        total, annotated, reviewed, exportable,
        assignments: 20 + (seed % 30),
        assignmentsCompleted: 10 + (seed % 20),
        quality: 85 + (seed % 12),
        errorsFound: 5 + (seed % 20),
        aiAssistance: 80 + (seed % 18),
        aiUsedOn: Math.floor(total * (0.5 + (seed % 30) / 100)),
        errors: {
            missingLabel: 2 + (seed % 10),
            wrongBoundingBox: 1 + (seed % 6),
            overlapping: seed % 5,
        },
    };
}

export default function ProjectOverview() {
    const { project } = useOutletContext<{ project: any }>();
    const progress = getMockProgress(project.project_id);
    return (
        <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Data</div>
                    <div className="text-3xl font-bold text-foreground">{progress.total.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">images</div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Assignments</div>
                    <div className="text-3xl font-bold text-foreground">{progress.assignments}</div>
                    <div className="text-xs text-emerald-500 font-medium mt-1">{progress.assignmentsCompleted} Completed</div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Annotations</div>
                    <div className="flex items-center justify-center gap-3 mt-1">
                        <div>
                            <span className="text-sm font-bold text-emerald-500">{progress.annotated}</span>
                            <div className="text-[10px] text-muted-foreground">Approved</div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-amber-500">{progress.total - progress.annotated}</span>
                            <div className="text-[10px] text-muted-foreground">Pending</div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-red-400">{Math.floor((progress.total - progress.annotated) * 0.2)}</span>
                            <div className="text-[10px] text-muted-foreground">Rejected</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quality</div>
                    <div className="text-3xl font-bold text-foreground">{progress.quality}%</div>
                    <div className="text-xs text-red-400 font-medium mt-1">{progress.errorsFound} Errors Found</div>
                </Card>
                <Card className="p-5 bg-card/80 backdrop-blur border-border/60 text-center">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Assistance</div>
                    <div className="text-3xl font-bold text-foreground">{progress.aiAssistance}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Used on {progress.aiUsedOn} Items</div>
                </Card>
            </div>

            {/* Progress + Errors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card/80 backdrop-blur border-border/60">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-bold text-foreground">Progress Overview</h3>
                        <span className="text-xs text-muted-foreground">Total: {progress.total.toLocaleString()}</span>
                    </div>
                    <div className="space-y-5">
                        {[
                            { label: "Annotated", value: progress.annotated, color: "bg-blue-500" },
                            { label: "Reviewed", value: progress.reviewed, color: "bg-emerald-500" },
                            { label: "Exportable", value: progress.exportable, color: "bg-amber-500" },
                        ].map((bar) => (
                            <div key={bar.label}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-foreground font-medium">{bar.label}</span>
                                    <span className="text-sm font-bold text-foreground">
                                        {bar.value.toLocaleString()} / {progress.total.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-muted/50 rounded-full h-2.5">
                                    <div className={`${bar.color} h-2.5 rounded-full transition-all duration-500`}
                                        style={{ width: `${Math.round((bar.value / progress.total) * 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="p-6 bg-card/80 backdrop-blur border-border/60">
                    <h3 className="text-base font-bold text-foreground mb-6">Error Distribution</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">Missing Label</span>
                            <span className="text-sm font-bold text-red-500">{progress.errors.missingLabel}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">Wrong Bounding Box</span>
                            <span className="text-sm font-bold text-amber-500">{progress.errors.wrongBoundingBox}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">Overlapping</span>
                            <span className="text-sm font-bold text-amber-500">{progress.errors.overlapping}</span>
                        </div>
                        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground font-medium">Total Quality Impact</span>
                            <span className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-md",
                                progress.quality >= 90 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {progress.quality >= 90 ? "Good" : "Action Required"}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

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
