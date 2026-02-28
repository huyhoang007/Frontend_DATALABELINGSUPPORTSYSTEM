import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Workspace3Column } from "../../components/layout/WorkspaceLayout";
import { Button } from "../../components/ui/Button";
import { annotationApi } from "../../api/annotationApi";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../utils/cn";

/* ── Helpers ── */
function getImageUrl(fileUrl) {
    if (!fileUrl) return null;
    // If fileUrl is already absolute, use it
    if (fileUrl.startsWith("http")) return fileUrl;
    // Otherwise prepend the API base URL
    const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    return base ? `${base}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}` : fileUrl;
}

function getItemStatus(item) {
    // DONE = has at least 1 annotation
    if (item.annotations && item.annotations.length > 0) return "DONE";
    return "TODO";
}

export default function Workspace() {
    const { taskId } = useParams(); // taskId = assignmentId from BE
    const navigate = useNavigate();
    const { addToast } = useToast();
    const assignmentId = taskId; // semantic alias

    /* ── Workspace data from API ── */
    const [workspace, setWorkspace] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    /* ── Items & navigation ── */
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const items = workspace?.items || [];
    const currentItem = items[currentImageIndex] || null;
    const totalImages = items.length;

    /* ── Labels (from workspace labelGroups) ── */
    const allLabels = React.useMemo(() => {
        if (!workspace?.labelGroups) return [];
        const labels = [];
        workspace.labelGroups.forEach((group) => {
            (group.labels || []).forEach((label) => {
                labels.push({
                    id: label.labelId,
                    name: label.labelName,
                    color: label.colorCode || "#6b7280",
                    type: label.labelType || "BBOX",
                    groupName: group.ruleName,
                });
            });
        });
        return labels;
    }, [workspace]);

    /* ── Current item annotations ── */
    const currentAnnotations = currentItem?.annotations || [];

    /* ── Tools State ── */
    const [activeTool, setActiveTool] = React.useState("select");
    const [zoom, setZoom] = React.useState(100);

    /* ── Label Row State (Visibility & Lock) ── */
    const [labelState, setLabelState] = React.useState({});

    /* ── Progress ── */
    const doneCount = items.filter((i) => getItemStatus(i) === "DONE").length;
    const progressPercent = totalImages > 0 ? Math.round((doneCount / totalImages) * 100) : 0;

    /* ── Fetch workspace ── */
    const fetchWorkspace = React.useCallback(async () => {
        if (!assignmentId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await annotationApi.openWorkspace(assignmentId);
            console.log("[WORKSPACE] loaded", data);
            setWorkspace(data);
            // Select first TODO item by default
            const firstTodoIdx = (data?.items || []).findIndex((i) => getItemStatus(i) === "TODO");
            setCurrentImageIndex(firstTodoIdx >= 0 ? firstTodoIdx : 0);
        } catch (err) {
            console.error("[WORKSPACE] fetch error", err);
            const status = err?.status;
            if (status === 403) {
                setError("Bạn không có quyền mở workspace này.");
            } else if (status === 401) {
                setError("Hết phiên đăng nhập — vui lòng đăng nhập lại.");
            } else {
                setError(err?.message || "Không thể tải workspace.");
            }
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    React.useEffect(() => {
        fetchWorkspace();
    }, [fetchWorkspace]);

    /* ── Navigation ── */
    const handleNavigate = (direction) => {
        let newIndex = currentImageIndex;
        if (direction === "first") newIndex = 0;
        if (direction === "prev") newIndex = Math.max(0, currentImageIndex - 1);
        if (direction === "next") newIndex = Math.min(totalImages - 1, currentImageIndex + 1);
        if (direction === "last") newIndex = totalImages - 1;

        if (newIndex !== currentImageIndex) {
            setCurrentImageIndex(newIndex);
            setLabelState({}); // reset per-image label UI state
        }
    };

    /* ── Save annotations ── */
    const handleSave = async () => {
        if (!currentItem) return;
        // TODO: Implement save logic when annotation editing is built
        addToast("Đã lưu nháp", "success");
    };

    /* ── Submit assignment ── */
    const handleSubmit = async () => {
        try {
            await annotationApi.submitAssignment(assignmentId);
            addToast("Đã nộp bài — chờ reviewer đánh giá", "success");
            navigate("/annotator/tasks");
        } catch (err) {
            addToast(err?.message || "Không thể nộp bài", "error");
        }
    };

    const toggleLabelState = (annId, key) => {
        setLabelState((prev) => ({
            ...prev,
            [annId]: {
                ...prev[annId],
                [key]: !prev[annId]?.[key],
            },
        }));
    };

    /* ── Loading / Error states ── */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <span className="material-symbols-outlined text-3xl text-muted-foreground animate-spin mr-2">progress_activity</span>
                <span className="text-muted-foreground">Loading workspace...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4">
                <span className="material-symbols-outlined text-5xl text-destructive">error</span>
                <p className="text-sm text-destructive">{error}</p>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => navigate("/annotator/tasks")} leftIcon="arrow_back">Back to List</Button>
                    <Button variant="primary" onClick={fetchWorkspace}>Retry</Button>
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4">
                <span className="material-symbols-outlined text-5xl text-muted-foreground/40">assignment</span>
                <p className="text-muted-foreground">Assignment not found</p>
                <Button variant="secondary" onClick={() => navigate("/annotator/tasks")} leftIcon="arrow_back">Back to List</Button>
            </div>
        );
    }

    /* ── Image dimensions for canvas ── */
    const imgWidth = currentItem?.width || 800;
    const imgHeight = currentItem?.height || 600;

    // --- Left Column: Context / Item List ---
    const LeftPanel = (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-border bg-card">
                <Button variant="ghost" size="sm" onClick={() => navigate("/annotator/tasks")} leftIcon="arrow_back" className="mb-3 -ml-2 text-muted-foreground hover:text-foreground">
                    Back to List
                </Button>
                <div className="space-y-1">
                    <h2 className="text-lg font-bold tracking-tight text-foreground truncate">{workspace.projectName || "Project"}</h2>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                        Assignment #{assignmentId} · {(workspace.assignmentStatus || "").replace("_", " ")}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Progress Block */}
                <div className="mx-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progress</span>
                        <span className="text-[10px] font-mono font-bold text-annotator-primary">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-annotator-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="mt-2 text-right">
                        <span className="text-[10px] text-muted-foreground">{doneCount}/{totalImages} items</span>
                    </div>
                </div>

                <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Items ({totalImages})
                </p>

                {/* Item List */}
                {items.map((item, idx) => {
                    const status = getItemStatus(item);
                    return (
                        <div
                            key={item.itemId}
                            onClick={() => { setCurrentImageIndex(idx); setLabelState({}); }}
                            className={cn(
                                "flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent",
                                idx === currentImageIndex
                                    ? "bg-annotator-primary/10 border-annotator-primary/20 shadow-sm"
                                    : "hover:bg-muted hover:border-border"
                            )}
                        >
                            {/* Thumbnail */}
                            <div className={cn(
                                "w-10 h-10 rounded-md flex items-center justify-center mr-3 transition-colors overflow-hidden bg-muted",
                                idx === currentImageIndex ? "ring-2 ring-annotator-primary/30" : ""
                            )}>
                                {item.fileUrl ? (
                                    <img
                                        src={getImageUrl(item.fileUrl)}
                                        alt={item.fileName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = "none"; e.target.nextSibling?.classList.remove("hidden"); }}
                                    />
                                ) : null}
                                <span className={cn(
                                    "material-symbols-outlined text-[16px] text-muted-foreground",
                                    item.fileUrl ? "hidden" : ""
                                )}>image</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-xs font-medium truncate mb-0.5",
                                    idx === currentImageIndex ? "text-annotator-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {item.fileName || `Item #${item.itemId}`}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        status === "DONE" ? "bg-green-500" : "bg-gray-400"
                                    )} />
                                    <span className="text-[10px] text-muted-foreground">{status}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                        <span className="material-symbols-outlined text-3xl mb-2">image</span>
                        <p>No items in this assignment</p>
                    </div>
                )}
            </div>
        </div>
    );

    // --- Center Column: Canvas ---
    const CenterPanel = (
        <>
            {/* Image Navigation Control */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-card/90 backdrop-blur border border-border rounded-lg p-1 shadow-sm">
                <button onClick={() => handleNavigate("first")} disabled={currentImageIndex === 0}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
                </button>
                <button onClick={() => handleNavigate("prev")} disabled={currentImageIndex === 0}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="font-mono text-xs font-bold w-16 text-center select-none">
                    {currentImageIndex + 1} / {totalImages}
                </span>
                <button onClick={() => handleNavigate("next")} disabled={currentImageIndex === totalImages - 1}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button onClick={() => handleNavigate("last")} disabled={currentImageIndex === totalImages - 1}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_right</span>
                </button>
            </div>

            {/* Floating Toolbar */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                <div className="bg-popover/90 backdrop-blur-md border border-border rounded-full p-1.5 flex items-center shadow-xl shadow-black/5 ring-1 ring-black/5">
                    {[
                        { id: "select", icon: "arrow_selector_tool", label: "Select (V)" },
                        { id: "pan", icon: "pan_tool", label: "Pan (Space)" },
                        { id: "box", icon: "crop_free", label: "Box (R)" },
                        { id: "polygon", icon: "pentagon", label: "Poly (P)" },
                    ].map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                                activeTool === tool.id
                                    ? "bg-annotator-primary text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            title={tool.label}
                        >
                            <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
                        </button>
                    ))}
                    <div className="w-px h-4 bg-border mx-2" />
                    <div className="flex items-center gap-1 px-1">
                        <button onClick={() => setZoom((z) => Math.max(10, z - 10))} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="text-[10px] font-mono font-bold w-10 text-center text-muted-foreground tabular-nums select-none">{zoom}%</span>
                        <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-transparent">
                <div
                    className="relative bg-black shadow-2xl transition-transform duration-200 ease-out border border-white/10 ring-1 ring-black/40"
                    style={{ width: imgWidth * (zoom / 100), height: imgHeight * (zoom / 100) }}
                >
                    {/* Real Image */}
                    {currentItem?.fileUrl ? (
                        <img
                            src={getImageUrl(currentItem.fileUrl)}
                            alt={currentItem.fileName || `Image ${currentImageIndex + 1}`}
                            className="absolute inset-0 w-full h-full object-contain"
                            draggable={false}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 select-none">
                            <div className="text-center opacity-30">
                                <span className="material-symbols-outlined text-6xl mb-4">image</span>
                                <p className="text-xs font-mono tracking-wide uppercase">Image {currentImageIndex + 1}</p>
                            </div>
                        </div>
                    )}

                    {/* Annotation Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {currentAnnotations
                            .filter((ann) => !labelState[ann.reviewingId]?.hidden)
                            .map((ann) => {
                                // Parse geometry from BE (expected: JSON with x,y,w,h or points array)
                                let geom = null;
                                try {
                                    geom = ann.geometry ? JSON.parse(ann.geometry) : null;
                                } catch { /* not JSON */ }

                                if (!geom) return null;

                                const color = ann.colorCode || "#6b7280";

                                // Bounding box
                                if (geom.x !== undefined && geom.y !== undefined && geom.w !== undefined && geom.h !== undefined) {
                                    return (
                                        <rect
                                            key={ann.reviewingId}
                                            x={`${(geom.x / imgWidth) * 100}%`}
                                            y={`${(geom.y / imgHeight) * 100}%`}
                                            width={`${(geom.w / imgWidth) * 100}%`}
                                            height={`${(geom.h / imgHeight) * 100}%`}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                            className={cn(
                                                "drop-shadow-md transition-opacity duration-200",
                                                labelState[ann.reviewingId]?.locked ? "stroke-dashed" : ""
                                            )}
                                        />
                                    );
                                }

                                // Polygon
                                if (geom.points && Array.isArray(geom.points)) {
                                    const pointsStr = geom.points
                                        .map((p) => `${(p.x / imgWidth) * 100}%,${(p.y / imgHeight) * 100}%`)
                                        .join(" ");
                                    return (
                                        <polygon
                                            key={ann.reviewingId}
                                            points={pointsStr}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    );
                                }

                                return null;
                            })}
                    </svg>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="h-14 border-t border-border bg-card flex items-center justify-between px-6 z-10">
                <div className="flex space-x-6 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span><strong className="text-foreground">V</strong> Select</span>
                    <span><strong className="text-foreground">R</strong> Box</span>
                    <span><strong className="text-foreground">Space</strong> Pan</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {currentItem?.fileName || `Item ${currentImageIndex + 1}`}
                        {" · "}
                        {getItemStatus(currentItem || {})}
                    </span>
                    <Button variant="secondary" onClick={handleSave} className="h-9 text-xs">Lưu</Button>
                    <Button variant="primary" onClick={handleSubmit} className="h-9 text-xs font-bold px-6 shadow-lg shadow-annotator-primary/20">Submit</Button>
                </div>
            </div>
        </>
    );

    // --- Right Column: Labels & Annotations ---
    const RightPanel = (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-border">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Labels</h4>
                <div className="grid grid-cols-1 gap-2">
                    {allLabels.map((label) => {
                        const count = currentAnnotations.filter((a) => a.labelId === label.id).length;
                        return (
                            <button key={label.id} className="flex items-center space-x-2 px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted hover:border-muted-foreground/20 transition-all text-left group">
                                <span className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: label.color }} />
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground flex-1 truncate">{label.name}</span>
                                {count > 0 && (
                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 rounded">{count}</span>
                                )}
                            </button>
                        );
                    })}
                    {allLabels.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No labels configured</p>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Annotations ({currentAnnotations.length})
                </h4>
                <div className="space-y-2">
                    {currentAnnotations.map((ann, i) => {
                        const label = allLabels.find((l) => l.id === ann.labelId);
                        const isHidden = labelState[ann.reviewingId]?.hidden;
                        const isLocked = labelState[ann.reviewingId]?.locked;

                        return (
                            <div key={ann.reviewingId} className={cn(
                                "p-3 rounded-lg border flex items-center group transition-all",
                                isHidden ? "bg-muted/10 border-transparent opacity-60" : "bg-muted/30 border-border hover:border-annotator-primary/30 hover:bg-muted/60"
                            )}>
                                <span className="text-[10px] font-mono text-muted-foreground w-6 opacity-50">#{i + 1}</span>
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ann.colorCode || label?.color || "#6b7280" }} />
                                        <p className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                            {ann.labelName || label?.name || "Unknown"}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground pl-3.5">{ann.labelType || label?.type || "—"}</p>
                                </div>

                                {/* Review status badge */}
                                {ann.status && (
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mr-2",
                                        ann.status === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                            ann.status === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                "bg-muted text-muted-foreground"
                                    )}>
                                        {ann.status}
                                    </span>
                                )}

                                {/* Row Tools */}
                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleLabelState(ann.reviewingId, "hidden"); }}
                                        className="p-1 hover:bg-background rounded hover:text-foreground text-muted-foreground transition-colors"
                                        title={isHidden ? "Show" : "Hide"}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{isHidden ? "visibility_off" : "visibility"}</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleLabelState(ann.reviewingId, "locked"); }}
                                        className={cn(
                                            "p-1 hover:bg-background rounded transition-colors",
                                            isLocked ? "text-annotator-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title={isLocked ? "Unlock" : "Lock"}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{isLocked ? "lock" : "lock_open"}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {currentAnnotations.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground/60">
                            <span className="material-symbols-outlined text-3xl mb-2">draw</span>
                            <p className="text-xs">No annotations on this item</p>
                            <p className="text-[10px] mt-1">Use the tools above to start labeling</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return <Workspace3Column left={LeftPanel} center={CenterPanel} right={RightPanel} rightWidth="w-[420px]" />;
}
