import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Workspace3Column } from "../../components/layout/WorkspaceLayout";
import { Button } from "../../components/ui/Button";
import { annotationApi } from "../../api/annotationApi";
import apiClient from "../../api/apiClient";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../utils/cn";

/* ── New modules ── */
import { useAnnotations } from "./useAnnotations";
import { useDrawingTools } from "./useDrawingTools";
import AnnotationOverlay from "./AnnotationOverlay";
import LabelSelectModal from "./LabelSelectModal";
import AnnotationList from "./AnnotationList";

/* ── Helpers ── */
function resolveImagePath(fileUrl) {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http")) return fileUrl;
    let url = fileUrl;
    if (!url.startsWith("/uploads")) {
        url = `/uploads${url.startsWith("/") ? "" : "/"}${url}`;
    }
    if (import.meta.env.DEV) {
        console.log("[IMG] resolveImagePath", fileUrl, "→", url);
    }
    return url;
}

/* ── Tool definitions ── */
const TOOLS = [
    { id: "select", icon: "pan_tool_alt", label: "Select" },
    { id: "bbox", icon: "crop_free", label: "Rectangle" },
    { id: "polygon", icon: "pentagon", label: "Polygon" },
    { id: "polyline", icon: "polyline", label: "Polyline" },
    { id: "points", icon: "scatter_plot", label: "Points" },
];

export default function Workspace() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const assignmentId = taskId;

    /* ── Workspace data from API ── */
    const [workspace, setWorkspace] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    /* ── Items & navigation ── */
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const items = workspace?.items || [];
    const currentItem = items[currentImageIndex] || null;
    const totalImages = items.length;

    /* ── Image blob fetch ── */
    const [imageBlobUrl, setImageBlobUrl] = React.useState(null);
    const [imageLoading, setImageLoading] = React.useState(false);
    const [imageError, setImageError] = React.useState(null);

    React.useEffect(() => {
        let cancelled = false;
        let blobUrl = null;
        const fetchImage = async () => {
            const fileUrl = currentItem?.fileUrl;
            if (!fileUrl) { setImageBlobUrl(null); setImageLoading(false); setImageError(null); return; }
            const path = resolveImagePath(fileUrl);
            if (!path) return;
            setImageLoading(true); setImageError(null); setImageBlobUrl(null);
            try {
                const response = await apiClient.get(path, {
                    responseType: "blob",
                    transformResponse: [(data) => data],
                });
                if (cancelled) return;
                const blob = response instanceof Blob ? response : new Blob([response]);
                blobUrl = URL.createObjectURL(blob);
                setImageBlobUrl(blobUrl);
            } catch (err) {
                if (cancelled) return;
                const status = err?.status || err?.response?.status || "?";
                setImageError({ url: path, message: `Status ${status}: ${err?.message || "Failed"}` });
            } finally {
                if (!cancelled) setImageLoading(false);
            }
        };
        fetchImage();
        return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [currentItem?.itemId, currentItem?.fileUrl]);

    /* ══════════════════════════════════════════════════════
       LABELS — robust mapping + fallback API by projectId
       ══════════════════════════════════════════════════════ */

    // Fallback labels state (when workspace labelGroups is empty)
    const [fallbackLabels, setFallbackLabels] = React.useState([]);
    const [labelsLoading, setLabelsLoading] = React.useState(false);

    /** Pick first non-empty array from candidates (avoids || eating []) */
    function pickFirstNonEmptyArray(...candidates) {
        for (const c of candidates) {
            if (Array.isArray(c) && c.length > 0) return c;
        }
        for (const c of candidates) {
            if (Array.isArray(c)) return c;
        }
        return [];
    }

    /** Normalize a single label object from any BE shape */
    function normalizeLabel(label, groupName) {
        const rawId = label.labelId ?? label.id ?? label._id;
        const name = label.labelName ?? label.name ?? label.title ?? "";
        const color = label.colorCode ?? label.color ?? label.hex ?? "#6b7280";
        const type = label.labelType ?? label.type ?? "BBOX";

        if (rawId == null || !name) {
            if (import.meta.env.DEV) console.warn("[LABELS] skip invalid:", label);
            return null;
        }

        // Safe ID — handle both numeric and UUID string IDs
        const idNum = Number(rawId);
        const finalId = Number.isFinite(idNum) ? idNum : String(rawId);

        return { id: finalId, name, color, type, groupName: groupName || "" };
    }

    // Labels parsed from workspace labelGroups
    const labelsFromGroups = React.useMemo(() => {
        const groups = pickFirstNonEmptyArray(
            workspace?.labelGroups,
            workspace?.data?.labelGroups,
            workspace?.data?.data?.labelGroups,
            workspace?.payload?.labelGroups,
        );

        if (import.meta.env.DEV) {
            console.log("[LABELS] workspace keys:", workspace ? Object.keys(workspace) : "null");
            console.log("[LABELS] picked groups:", groups.length, groups);
            if (groups.length > 0) {
                console.log("[LABELS] first group keys:", Object.keys(groups[0]));
                if (groups[0].labels?.length > 0) {
                    console.log("[LABELS] first label obj:", groups[0].labels[0]);
                }
            }
        }

        const labels = [];
        const seen = new Set();

        groups.forEach((group) => {
            const gName = group.ruleName ?? group.groupName ?? group.name ?? "";
            (group.labels || []).forEach((raw) => {
                const label = normalizeLabel(raw, gName);
                if (!label) return;
                const key = String(label.id);
                if (seen.has(key)) return;
                seen.add(key);
                labels.push(label);
            });
        });

        if (import.meta.env.DEV) {
            console.log("[LABELS] from groups:", labels.length, labels);
        }
        return labels;
    }, [workspace]);

    // Fallback: if workspace labelGroups empty → fetch ALL active labels from BE
    React.useEffect(() => {
        if (labelsFromGroups.length > 0) {
            setFallbackLabels([]); // workspace had labels, no fallback needed
            return;
        }
        if (!workspace) return; // workspace not loaded yet

        if (import.meta.env.DEV) {
            console.log("[LABELS] groups empty → fallback via GET /api/labels/active");
        }

        let cancelled = false;
        setLabelsLoading(true);

        (async () => {
            try {
                // Call GET /api/labels/active — now accessible for ANNOTATOR role
                const rawLabels = await apiClient.get("/api/labels/active");
                if (cancelled) return;

                if (import.meta.env.DEV) {
                    console.log("[LABELS] fallback raw:", rawLabels);
                }

                const arr = Array.isArray(rawLabels) ? rawLabels : (rawLabels?.data ?? rawLabels?.content ?? []);
                const labels = [];
                const seen = new Set();
                arr.forEach((raw) => {
                    const label = normalizeLabel(raw, "");
                    if (!label) return;
                    const key = String(label.id);
                    if (seen.has(key)) return;
                    seen.add(key);
                    labels.push(label);
                });

                if (import.meta.env.DEV) {
                    console.log("[LABELS] fallback normalized:", labels.length, labels);
                }
                setFallbackLabels(labels);
            } catch (err) {
                console.error("[LABELS] fallback fetch error:", err);
                addToast?.({ type: "error", message: "Không tải được labels" });
            } finally {
                if (!cancelled) setLabelsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [workspace, labelsFromGroups.length, addToast]);

    // Final merged allLabels: workspace groups (primary) → fallback (secondary)
    const allLabels = labelsFromGroups.length > 0 ? labelsFromGroups : fallbackLabels;

    // DEV log when using fallback
    React.useEffect(() => {
        if (import.meta.env.DEV && labelsFromGroups.length === 0 && fallbackLabels.length > 0) {
            console.log("[LABELS] using FALLBACK labels:", fallbackLabels.length);
        }
    }, [labelsFromGroups.length, fallbackLabels.length]);

    /* ── Annotation state hook ── */
    const anno = useAnnotations({ assignmentId, addToast });

    /* ── Tools state ── */
    const [activeTool, setActiveTool] = React.useState("select");
    const [zoom, setZoom] = React.useState(100);
    const [selectedGroupKey, setSelectedGroupKey] = React.useState(null);
    const [activeLabelFilterId, setActiveLabelFilterId] = React.useState(null);
    const [pendingShape, setPendingShape] = React.useState(null); // shape waiting for label selection

    /* ── Drawing tools hook ── */
    const onShapeComplete = React.useCallback((shape) => {
        setPendingShape(shape);
    }, []);

    const drawing = useDrawingTools({ activeTool, onShapeComplete, addToast });

    /* ── Fetch workspace ── */
    const fetchWorkspace = React.useCallback(async () => {
        if (!assignmentId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await annotationApi.openWorkspace(assignmentId);
            console.log("[WORKSPACE] loaded", data);
            console.log("[WORKSPACE] labelGroups:", data?.labelGroups, "count:", data?.labelGroups?.length);
            if (data?.labelGroups?.length > 0) {
                console.log("[WORKSPACE] first group:", JSON.stringify(data.labelGroups[0], null, 2));
            }
            setWorkspace(data);
            const firstTodoIdx = (data?.items || []).findIndex((i) => {
                const hasAnno = i.annotations && i.annotations.length > 0;
                return !hasAnno;
            });
            setCurrentImageIndex(firstTodoIdx >= 0 ? firstTodoIdx : 0);
        } catch (err) {
            console.error("[WORKSPACE] fetch error", err);
            const status = err?.status;
            if (status === 403) setError("Bạn không có quyền mở workspace này.");
            else if (status === 401) setError("Hết phiên đăng nhập — vui lòng đăng nhập lại.");
            else setError(err?.message || "Không thể tải workspace.");
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    React.useEffect(() => { fetchWorkspace(); }, [fetchWorkspace]);

    /* ── Load annotations when item changes ── */
    React.useEffect(() => {
        if (currentItem?.itemId) {
            anno.loadAnnotations(currentItem.itemId);
        }
    }, [currentItem?.itemId]);

    /* ── Navigation ── */
    const handleNavigate = async (direction) => {
        // Flush save for current item before switching
        await anno.saveNow();

        let newIndex = currentImageIndex;
        if (direction === "first") newIndex = 0;
        if (direction === "prev") newIndex = Math.max(0, currentImageIndex - 1);
        if (direction === "next") newIndex = Math.min(totalImages - 1, currentImageIndex + 1);
        if (direction === "last") newIndex = totalImages - 1;

        if (newIndex !== currentImageIndex) {
            setCurrentImageIndex(newIndex);
            setSelectedGroupKey(null);
            setActiveLabelFilterId(null);
        }
    };

    /* ── Save (flush) ── */
    const handleSave = async () => {
        await anno.saveNow();
        addToast({ type: "success", message: "Đã lưu annotations" });
    };

    /* ── Submit assignment ── */
    const handleSubmit = async () => {
        console.log("[WORKSPACE] handleSubmit clicked");
        try {
            console.log("[WORKSPACE] calling anno.saveNow");
            await anno.saveNow();
            console.log("[WORKSPACE] calling annotationApi.submitAssignment");
            await annotationApi.submitAssignment(assignmentId);
            console.log("[WORKSPACE] submit success");
            addToast({ type: "success", message: "Đã nộp bài thành công!" });
            navigate("/annotator/tasks");
        } catch (err) {
            console.error("[WORKSPACE] submit error", err);
            const errorMsg = typeof err?.message === 'string' ? err.message : (err?.message?.message || "Nộp bài thất bại");
            addToast({ type: "error", message: errorMsg });
        }
    };

    /* ── Mark as Done ── */
    const handleMarkDone = () => {
        if (!currentItem) return;
        if (anno.isDone(currentItem.itemId)) {
            anno.unmarkDone(currentItem.itemId);
            addToast({ type: "info", message: "Đã bỏ đánh dấu Done" });
        } else {
            const ok = anno.markDone(currentItem.itemId);
            if (ok) addToast({ type: "success", message: "Đã đánh dấu Done ✓" });
        }
        // force re-render for sidebar
        setWorkspace((w) => ({ ...w }));
    };

    /* ── Label select modal callbacks ── */
    const handleLabelSave = (labelIds) => {
        if (pendingShape) {
            anno.addAnnotation(pendingShape, labelIds, allLabels);
            setPendingShape(null);
            setActiveTool("select");
        }
    };
    const handleLabelCancel = () => {
        setPendingShape(null);
    };

    /* ── Progress ── */
    const doneCount = items.filter((i) => anno.isDone(i.itemId)).length;
    const progressPercent = totalImages > 0 ? Math.round((doneCount / totalImages) * 100) : 0;

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

    const imgWidth = currentItem?.width || 800;
    const imgHeight = currentItem?.height || 600;
    const currentIsDone = currentItem ? anno.isDone(currentItem.itemId) : false;

    // ───────────────────────────────
    // LEFT PANEL
    // ───────────────────────────────
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
                {/* Progress */}
                <div className="px-2 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Progress</span>
                        <span className="text-[10px] font-mono font-bold text-annotator-primary">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-annotator-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{doneCount} / {totalImages} items done</p>
                </div>

                <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Items ({totalImages})
                </p>

                {items.map((item, idx) => {
                    const itemDone = anno.isDone(item.itemId);
                    return (
                        <div
                            key={item.itemId}
                            onClick={() => { handleNavigate(null); setCurrentImageIndex(idx); setSelectedGroupKey(null); setActiveLabelFilterId(null); }}
                            className={cn(
                                "flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent",
                                idx === currentImageIndex
                                    ? "bg-annotator-primary/10 border-annotator-primary/20 shadow-sm"
                                    : "hover:bg-muted hover:border-border"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-md flex items-center justify-center mr-3 transition-colors overflow-hidden bg-muted",
                                idx === currentImageIndex ? "ring-2 ring-annotator-primary/30" : ""
                            )}>
                                <span className="material-symbols-outlined text-[16px] text-muted-foreground">image</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-xs font-medium truncate transition-colors",
                                    idx === currentImageIndex ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {item.fileName || `Item #${item.itemId}`}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                                        itemDone
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {itemDone ? "DONE" : "TODO"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom actions */}
            <div className="p-3 border-t border-border space-y-2">
                <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleSubmit}
                    leftIcon={workspace?.assignmentStatus === "SUBMITTED" || workspace?.assignmentStatus === "APPROVED" ? "check_circle" : "send"}
                    disabled={workspace?.assignmentStatus === "SUBMITTED" || workspace?.assignmentStatus === "APPROVED"}
                >
                    {workspace?.assignmentStatus === "SUBMITTED" ? "Already Submitted" : workspace?.assignmentStatus === "APPROVED" ? "Approved" : "Submit Assignment"}
                </Button>
            </div>
        </div>
    );

    // ───────────────────────────────
    // CENTER PANEL
    // ───────────────────────────────
    const CenterPanel = (
        <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm z-20">
                <div className="flex items-center gap-1">
                    {/* Navigation */}
                    <div className="flex items-center bg-muted rounded-lg p-0.5 mr-3">
                        {[
                            { icon: "first_page", dir: "first" },
                            { icon: "chevron_left", dir: "prev" },
                            { icon: "chevron_right", dir: "next" },
                            { icon: "last_page", dir: "last" },
                        ].map(({ icon, dir }) => (
                            <button key={dir} onClick={() => handleNavigate(dir)} className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors">
                                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                            </button>
                        ))}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground mr-3 select-none tabular-nums">
                        {currentImageIndex + 1} / {totalImages}
                    </span>
                </div>

                <div className="flex items-center">
                    {/* Drawing tools */}
                    {TOOLS.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => { setActiveTool(tool.id); setSelectedGroupKey(null); }}
                            title={tool.label}
                            className={cn(
                                "w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150",
                                activeTool === tool.id
                                    ? "bg-annotator-primary text-white shadow-md shadow-annotator-primary/30 scale-105"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
                        </button>
                    ))}
                    <div className="w-px h-4 bg-border mx-2" />
                    {/* Zoom */}
                    <div className="flex items-center gap-1 px-1">
                        <button onClick={() => setZoom((z) => Math.max(10, z - 10))} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="text-[10px] font-mono font-bold w-10 text-center text-muted-foreground tabular-nums select-none">{zoom}%</span>
                        <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>
                    <div className="w-px h-4 bg-border mx-2" />
                    {/* Save & Mark Done */}
                    <button onClick={handleSave} title="Lưu" className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <span className="material-symbols-outlined text-[18px]">save</span>
                    </button>
                    <button
                        onClick={handleMarkDone}
                        title={currentIsDone ? "Bỏ Done" : "Mark as Done"}
                        disabled={!currentIsDone && anno.annotations.length === 0}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                            currentIsDone
                                ? "text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                : anno.annotations.length === 0
                                    ? "text-muted-foreground/30 cursor-not-allowed"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {currentIsDone ? "check_circle" : "task_alt"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-transparent">
                <div
                    className="relative bg-black shadow-2xl transition-transform duration-200 ease-out border border-white/10 ring-1 ring-black/40"
                    style={{ width: imgWidth * (zoom / 100), height: imgHeight * (zoom / 100) }}
                >
                    {/* Image */}
                    {imageLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center select-none">
                            <span className="material-symbols-outlined text-3xl text-muted-foreground animate-spin">progress_activity</span>
                        </div>
                    ) : imageBlobUrl ? (
                        <img src={imageBlobUrl} alt={currentItem?.fileName || `Image ${currentImageIndex + 1}`}
                            className="absolute inset-0 w-full h-full object-contain" draggable={false}
                        />
                    ) : imageError ? (
                        <div className="absolute inset-0 flex items-center justify-center select-none bg-black/80">
                            <div className="text-center p-6 max-w-md">
                                <span className="material-symbols-outlined text-5xl text-red-400 mb-3">broken_image</span>
                                <p className="text-sm font-medium text-red-300 mb-2">Không tải được ảnh</p>
                                <p className="text-[10px] font-mono text-slate-400 break-all mb-2">{imageError.url}</p>
                                <p className="text-[10px] font-mono text-red-400 mb-4">{imageError.message}</p>
                                <button onClick={() => { setImageError(null); setImageBlobUrl(null); }}
                                    className="px-4 py-1.5 text-xs font-medium rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 select-none">
                            <div className="text-center opacity-30">
                                <span className="material-symbols-outlined text-6xl mb-4">image</span>
                                <p className="text-xs font-mono tracking-wide uppercase">Image {currentImageIndex + 1}</p>
                            </div>
                        </div>
                    )}

                    {/* Annotation Overlay */}
                    <AnnotationOverlay
                        annotations={anno.annotations}
                        draftShape={drawing.draftShape}
                        cursorPt={drawing.cursorPt}
                        activeTool={activeTool}
                        selectedGroupKey={selectedGroupKey}
                        activeLabelFilterId={activeLabelFilterId}
                        onSelect={setSelectedGroupKey}
                        onUpdateGeometry={anno.updateGeometry}
                        drawingHandlers={drawing}
                    />
                </div>
            </div>

            {/* Drawing hint */}
            {activeTool !== "select" && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-lg">
                    <p className="text-[10px] text-muted-foreground font-medium">
                        {activeTool === "bbox" && "Click & drag to draw rectangle • Shift = square"}
                        {activeTool === "polygon" && "Click to add vertices • Snap to first point to close • Hold P for quick draw • Enter to close • Esc to cancel"}
                        {activeTool === "polyline" && "Click to add points • Enter to finalize & close • Esc to cancel"}
                        {activeTool === "points" && "Click to place points (min 2) • Enter to finalize • Esc to cancel"}
                    </p>
                </div>
            )}
        </>
    );

    // ───────────────────────────────
    // RIGHT PANEL
    // ───────────────────────────────
    const RightPanel = (
        <div className="flex flex-col h-full bg-card">
            {/* Labels section */}
            <div className="p-4 border-b border-border">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Labels</h4>
                <div className="grid grid-cols-1 gap-2">
                    {allLabels.map((label) => {
                        const count = anno.annotations.filter((a) => a.labelIds.includes(label.id)).length;
                        const isActive = activeLabelFilterId === label.id;
                        return (
                            <button
                                key={label.id}
                                onClick={() => setActiveLabelFilterId(isActive ? null : label.id)}
                                className={cn(
                                    "flex items-center space-x-2 px-3 py-2 rounded-md border transition-all text-left group",
                                    isActive
                                        ? "bg-annotator-primary/10 border-annotator-primary/30 shadow-sm"
                                        : "border-border bg-muted/30 hover:bg-muted hover:border-muted-foreground/20"
                                )}
                            >
                                <span className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: label.color }} />
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground flex-1 truncate">{label.name}</span>
                                {count > 0 && (
                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 rounded">{count}</span>
                                )}
                            </button>
                        );
                    })}
                    {labelsLoading && allLabels.length === 0 && (
                        <div className="flex items-center justify-center py-4 gap-2">
                            <span className="material-symbols-outlined text-sm text-muted-foreground animate-spin">progress_activity</span>
                            <p className="text-xs text-muted-foreground">Đang tải labels...</p>
                        </div>
                    )}
                    {!labelsLoading && allLabels.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Project chưa có labels</p>
                    )}
                </div>
            </div>

            {/* Annotations list */}
            <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Annotations ({anno.annotations.length})
                </h4>
                <AnnotationList
                    annotations={anno.annotations}
                    allLabels={allLabels}
                    selectedGroupKey={selectedGroupKey}
                    activeLabelFilterId={activeLabelFilterId}
                    onSelect={(gk) => { setSelectedGroupKey(gk); setActiveTool("select"); }}
                    onDelete={anno.deleteAnnotation}
                    onToggleHidden={anno.toggleHidden}
                />
            </div>
        </div>
    );

    return (
        <>
            <Workspace3Column left={LeftPanel} center={CenterPanel} right={RightPanel} rightWidth="w-[420px]" />
            {/* Label select modal (shown after drawing a shape) */}
            {pendingShape && (
                <LabelSelectModal
                    labels={allLabels}
                    onSave={handleLabelSave}
                    onCancel={handleLabelCancel}
                />
            )}
        </>
    );
}
