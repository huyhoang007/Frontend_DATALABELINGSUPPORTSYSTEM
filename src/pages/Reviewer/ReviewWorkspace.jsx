import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Workspace3Column } from "../../components/layout/WorkspaceLayout";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../utils/cn";
import useReviewWorkspace from "./useReviewWorkspace";
import AnnotationOverlay from "../Annotator/AnnotationOverlay";
import { groupAnnotationsByKey } from "../Annotator/geometryUtils";

export default function ReviewWorkspace() {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    // ── Type safety: parse assignmentId ──
    const assignmentIdNum = Number(assignmentId);
    if (!assignmentId || isNaN(assignmentIdNum)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
                    <h2 className="text-xl font-bold text-foreground mb-2">Invalid Assignment ID</h2>
                    <p className="text-muted-foreground mb-4">The assignment ID "{assignmentId}" is not valid.</p>
                    <Button variant="secondary" onClick={() => navigate("/reviewer/queue")} leftIcon="arrow_back">Back to Queue</Button>
                </div>
            </div>
        );
    }

    return <ReviewWorkspaceInner assignmentIdNum={assignmentIdNum} />;
}

function ReviewWorkspaceInner({ assignmentIdNum }) {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const {
        workspace,
        workspaceLoading,
        workspaceError,
        items,
        currentItemIndex,
        setCurrentItemIndex,
        currentItem,
        currentItemId,
        currentAnnotations,
        itemAnnoLoading,
        imageBlobUrl,
        imageLoading,
        imageError,
        policies,
        reviewSubmitting,
        handleReviewAnnotation,
        reviewStats,
        getItemStats,
    } = useReviewWorkspace(assignmentIdNum);

    // ── UI local state ──
    const [selectedGroupKey, setSelectedGroupKey] = React.useState(null);
    const [rejectingAnnoId, setRejectingAnnoId] = React.useState(null);
    const [selectedPolicyId, setSelectedPolicyId] = React.useState(null);
    const [rejectNote, setRejectNote] = React.useState("");

    // Reset selection when switching items
    React.useEffect(() => {
        setSelectedGroupKey(null);
        setRejectingAnnoId(null);
        setSelectedPolicyId(null);
        setRejectNote("");
    }, [currentItemIndex]);

    // ── Convert BE annotations → AnnotationGroup[] for canvas ──
    const annotationGroups = React.useMemo(
        () => groupAnnotationsByKey(currentAnnotations),
        [currentAnnotations]
    );

    // ── Review handlers ──
    const handleApproveAnnotation = async (reviewingId) => {
        const result = await handleReviewAnnotation(reviewingId, false, null);
        if (result.success) {
            addToast("Annotation approved ✓", "success");
            if (result.allDone) {
                const msg = result.finalStatus === "APPROVED"
                    ? "All annotations approved! Assignment → APPROVED."
                    : "Review complete. Some annotations rejected → Assignment REJECTED.";
                addToast(msg, result.finalStatus === "APPROVED" ? "success" : "warning");
                setTimeout(() => navigate("/reviewer/queue"), 1500);
            }
        } else {
            addToast(result.error || "Failed to approve annotation", "error");
        }
    };

    const handleRejectAnnotation = async (reviewingId) => {
        if (!selectedPolicyId) {
            addToast("Please select a policy/error type.", "error");
            return;
        }
        const result = await handleReviewAnnotation(reviewingId, true, selectedPolicyId, rejectNote.trim() || undefined);
        if (result.success) {
            addToast("Annotation rejected ✗", "warning");
            setRejectingAnnoId(null);
            setSelectedPolicyId(null);
            setRejectNote("");
            if (result.allDone) {
                addToast("Review complete. Assignment → REJECTED.", "warning");
                setTimeout(() => navigate("/reviewer/queue"), 1500);
            }
        } else {
            addToast(result.error || "Failed to reject annotation", "error");
        }
    };

    // ── Loading state ──
    if (workspaceLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-muted-foreground">progress_activity</span>
                <span className="ml-3 text-lg text-muted-foreground">Loading workspace...</span>
            </div>
        );
    }

    // ── Error state ──
    if (workspaceError) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
                    <h2 className="text-xl font-bold text-foreground mb-2">Cannot Load Workspace</h2>
                    <p className="text-muted-foreground mb-4">{workspaceError}</p>
                    <Button variant="secondary" onClick={() => navigate("/reviewer/queue")} leftIcon="arrow_back">Back to Queue</Button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  LEFT PANEL: Assignment Info + Item List
    // ═══════════════════════════════════════════
    const LeftPanel = (
        <div className="p-4 bg-card h-full flex flex-col overflow-hidden">
            <Button variant="ghost" size="sm" onClick={() => navigate("/reviewer/queue")} leftIcon="arrow_back" className="mb-4 text-muted-foreground hover:text-foreground shrink-0">
                Back to Queue
            </Button>

            {/* Assignment Info */}
            <div className="bg-muted/10 p-4 rounded-xl border border-border mb-4 shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Project</p>
                <h3 className="text-lg font-bold text-foreground mb-3">{workspace?.projectName || "—"}</h3>

                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                <p className="text-sm font-medium text-foreground mb-3">
                    <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold",
                        workspace?.assignmentStatus === "SUBMITTED" && "bg-blue-500/10 text-blue-400",
                        workspace?.assignmentStatus === "REJECTED" && "bg-red-500/10 text-red-400",
                        workspace?.assignmentStatus === "APPROVED" && "bg-green-500/10 text-green-400",
                    )}>
                        {workspace?.assignmentStatus}
                    </span>
                </p>

                {/* Review Progress */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Review Progress</p>
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-annotator-primary rounded-full transition-all"
                            style={{ width: reviewStats.total > 0 ? `${(reviewStats.reviewed / reviewStats.total) * 100}%` : "0%" }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{reviewStats.reviewed}/{reviewStats.total}</span>
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span className="text-green-400">✓ {reviewStats.approved}</span>
                    <span className="text-red-400">✗ {reviewStats.rejected}</span>
                    <span>⏳ {reviewStats.pending}</span>
                </div>
            </div>

            {/* Item List */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 shrink-0">
                Items ({items.length})
            </p>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                {items.map((item, idx) => {
                    const stats = getItemStats(item.itemId);
                    const isActive = idx === currentItemIndex;
                    return (
                        <button
                            key={item.itemId}
                            onClick={() => setCurrentItemIndex(idx)}
                            className={cn(
                                "w-full text-left p-2 rounded-lg border transition-all text-sm",
                                isActive
                                    ? "bg-annotator-primary/10 border-annotator-primary text-foreground"
                                    : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs truncate flex-1">#{item.itemId}</span>
                                <div className="flex gap-1 text-[10px] shrink-0">
                                    {stats.approved > 0 && <span className="text-green-400">✓{stats.approved}</span>}
                                    {stats.rejected > 0 && <span className="text-red-400">✗{stats.rejected}</span>}
                                    {stats.pending > 0 && <span className="text-yellow-400">⏳{stats.pending}</span>}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // ═══════════════════════════════════════════
    //  CENTER PANEL: Read-only Canvas
    // ═══════════════════════════════════════════
    const CenterPanel = (
        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-transparent">
            {currentItem ? (
                <div className="relative max-w-full max-h-full" style={{ display: "inline-block" }}>
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                            <span className="material-symbols-outlined animate-spin text-3xl text-muted-foreground">progress_activity</span>
                        </div>
                    )}
                    {imageError && (
                        <div className="flex items-center justify-center p-8 text-center">
                            <div>
                                <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">broken_image</span>
                                <p className="text-sm text-red-400">{imageError.message}</p>
                            </div>
                        </div>
                    )}
                    {imageBlobUrl && (
                        <>
                            <img
                                src={imageBlobUrl}
                                alt={`Item #${currentItem.itemId}`}
                                className="max-w-full max-h-[calc(100vh-80px)] object-contain block"
                            />
                            {/* Read-only annotation overlay */}
                            <AnnotationOverlay
                                annotations={annotationGroups}
                                draftShape={null}
                                cursorPt={null}
                                activeTool="select"
                                selectedGroupKey={selectedGroupKey}
                                activeLabelFilterId={null}
                                onSelect={setSelectedGroupKey}
                                onUpdateGeometry={null}
                                drawingHandlers={null}
                            />
                        </>
                    )}
                </div>
            ) : (
                <div className="text-center opacity-30">
                    <span className="material-symbols-outlined text-6xl mb-4 block">image</span>
                    <p className="text-xs font-mono tracking-wide uppercase">No item selected</p>
                </div>
            )}
        </div>
    );

    // ═══════════════════════════════════════════
    //  RIGHT PANEL: Annotation List + Review Actions
    // ═══════════════════════════════════════════
    const RightPanel = (
        <div className="flex flex-col h-full bg-card overflow-hidden">
            <div className="p-4 border-b border-border shrink-0">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Annotations — Item #{currentItemId || "—"}
                </h4>
            </div>

            {/* Annotation list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                {itemAnnoLoading && (
                    <div className="flex items-center justify-center py-8">
                        <span className="material-symbols-outlined animate-spin text-xl text-muted-foreground">progress_activity</span>
                    </div>
                )}

                {!itemAnnoLoading && currentAnnotations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <span className="material-symbols-outlined text-3xl mb-2 block opacity-20">label_off</span>
                        <p className="text-xs">No annotations for this item.</p>
                    </div>
                )}

                {!itemAnnoLoading && currentAnnotations.map((anno) => {
                    const isRejecting = rejectingAnnoId === anno.reviewingId;
                    const groupKey = `solo_${anno.reviewingId}`;
                    const isHighlighted = selectedGroupKey === groupKey ||
                        annotationGroups.some(g =>
                            g.groupKey === selectedGroupKey && g.beReviewingIds?.includes(anno.reviewingId)
                        );

                    return (
                        <div
                            key={anno.reviewingId}
                            className={cn(
                                "p-3 rounded-lg border transition-all",
                                isHighlighted ? "border-annotator-primary bg-annotator-primary/5" : "border-border bg-muted/5",
                            )}
                            onClick={() => {
                                // Find the group containing this annotation
                                const group = annotationGroups.find(g => g.beReviewingIds?.includes(anno.reviewingId));
                                setSelectedGroupKey(group?.groupKey || groupKey);
                            }}
                        >
                            {/* Header: label + status */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: anno.colorCode || "#6b7280" }}
                                    />
                                    <span className="text-sm font-medium text-foreground truncate">
                                        {anno.labelName || `Label #${anno.labelId}`}
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                    anno.status === "APPROVED" && "bg-green-500/10 text-green-400",
                                    anno.status === "REJECTED" && "bg-red-500/10 text-red-400",
                                    (!anno.status || anno.status === "PENDING") && "bg-yellow-500/10 text-yellow-400",
                                )}>
                                    {anno.status || "PENDING"}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="text-[10px] text-muted-foreground mb-2">
                                <span className="uppercase">{anno.labelType || "bbox"}</span>
                                {anno.policyName && <span className="ml-2 text-red-400">Policy: {anno.policyName}</span>}
                                {anno.isImproved && <span className="ml-2 text-blue-400">(improved)</span>}
                            </div>

                            {/* Action buttons (only for PENDING or re-review) */}
                            {(!anno.status || anno.status === "PENDING") && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleApproveAnnotation(anno.reviewingId); }}
                                        disabled={reviewSubmitting}
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-bold bg-green-600/10 text-green-400 border border-green-600/20 hover:bg-green-600/20 transition disabled:opacity-50"
                                    >
                                        {reviewSubmitting ? (
                                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-sm">check</span>
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRejectingAnnoId(isRejecting ? null : anno.reviewingId);
                                            setSelectedPolicyId(null);
                                        }}
                                        disabled={reviewSubmitting || policies.length === 0}
                                        title={policies.length === 0 ? "No policies configured. Contact Manager." : "Reject this annotation"}
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-bold bg-red-600/10 text-red-400 border border-red-600/20 hover:bg-red-600/20 transition disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                        Reject
                                    </button>
                                </div>
                            )}

                            {/* Reject form (inline) */}
                            {isRejecting && (
                                <div className="mt-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20 space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-red-400">Select Error Policy</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {policies.map(p => (
                                            <button
                                                key={p.policyId}
                                                onClick={(e) => { e.stopPropagation(); setSelectedPolicyId(p.policyId); }}
                                                className={cn(
                                                    "w-full text-left px-2 py-1.5 rounded text-xs border transition",
                                                    selectedPolicyId === p.policyId
                                                        ? "bg-red-500/10 text-red-400 border-red-500"
                                                        : "text-muted-foreground border-border hover:bg-muted/10"
                                                )}
                                            >
                                                <span className="font-medium">{p.errorName}</span>
                                                {p.errorLevel && <span className="ml-2 opacity-50">({p.errorLevel})</span>}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Reject note */}
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-red-400 mb-1">Reason / Note</p>
                                        <textarea
                                            value={rejectNote}
                                            onChange={(e) => setRejectNote(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="Enter reason for rejection (optional)..."
                                            rows={2}
                                            className="w-full px-2 py-1.5 rounded text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setRejectingAnnoId(null); setRejectNote(""); }}
                                            className="flex-1 px-2 py-1 rounded text-xs text-muted-foreground border border-border hover:bg-muted/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRejectAnnotation(anno.reviewingId); }}
                                            disabled={!selectedPolicyId || reviewSubmitting}
                                            className="flex-1 px-2 py-1 rounded text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition disabled:opacity-50"
                                        >
                                            {reviewSubmitting ? "Submitting..." : "Confirm Reject"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom: keyboard shortcuts hint */}
            <div className="p-3 border-t border-border shrink-0">
                <p className="text-[10px] text-muted-foreground text-center">
                    Click annotation to highlight on canvas
                </p>
            </div>
        </div>
    );

    return (
        <Workspace3Column
            left={LeftPanel}
            center={CenterPanel}
            right={RightPanel}
            leftWidth="w-64"
            rightWidth="w-80"
        />
    );
}
