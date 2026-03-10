import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Workspace3Column } from "../../components/layout/WorkspaceLayout";
import { Button } from "../../components/ui/Button";
import { annotationApi } from "../../api/annotationApi";
import apiClient from "../../api/apiClient";
import { useToast } from "../../context/ToastContext";

/* â”€â”€ New modules â”€â”€ */
import { useAnnotations } from "./useAnnotations";
import { useDrawingTools } from "./useDrawingTools";
import AnnotationOverlay from "./AnnotationOverlay";
import LabelSelectModal from "./LabelSelectModal";
import AnnotationList from "./AnnotationList";
import LabelSummaryPanel from "../../components/LabelSummaryPanel";

/* â”€â”€ Helpers â”€â”€ */
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

/* ── Thumbnail image component ── */
function ThumbnailImg({ fileUrl, alt }) {
    const [src, setSrc] = React.useState(null);
    React.useEffect(() => {
        let cancelled = false;
        let blobUrl = null;
        if (!fileUrl) return;
        const path = resolveImagePath(fileUrl);
        if (!path) return;
        (async () => {
            try {
                const res = await apiClient.get(path, { responseType: "blob", transformResponse: [(d) => d] });
                if (cancelled) return;
                const blob = res instanceof Blob ? res : new Blob([res]);
                blobUrl = URL.createObjectURL(blob);
                setSrc(blobUrl);
            } catch { /* silent */ }
        })();
        return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [fileUrl]);
    if (!src) return (
        <div className="w-full h-full flex items-center justify-center" style={{ background: "#0e1621" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#3a5068" }}>image</span>
        </div>
    );
    return <img src={src} alt={alt} className="w-full h-full object-cover" draggable={false} />;
}

/* ── Tool definitions ── */
const TOOLS = [
    { id: "polygon", icon: "pentagon", label: "Polygon" },
    { id: "bbox", icon: "crop_free", label: "Rectangle" },
    { id: "points", icon: "scatter_plot", label: "Points" },
    { id: "polyline", icon: "polyline", label: "Polyline" },
    { id: "select", icon: "pan_tool_alt", label: "Select" },
];

export default function Workspace() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const assignmentId = taskId;

    /* â”€â”€ Workspace data from API â”€â”€ */
    const [workspace, setWorkspace] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    /* â”€â”€ Items & navigation â”€â”€ */
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const items = workspace?.items || [];
    const currentItem = items[currentImageIndex] || null;
    const totalImages = items.length;

    /* ── Fetch workspace ── */
    const fetchWorkspace = React.useCallback(async () => {
        if (!assignmentId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await annotationApi.openWorkspace(assignmentId);
            setWorkspace(data);
        } catch (err) {
            setError(err?.message || "Failed to load workspace");
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    /* ── Annotations hook ── */
    const anno = useAnnotations({ assignmentId, addToast });

    /* ── Tool & UI state ── */
    const [activeTool, setActiveTool] = React.useState("polygon");
    const [selectedGroupKey, setSelectedGroupKey] = React.useState(null);
    const [activeLabelFilterId, setActiveLabelFilterId] = React.useState(null);
    const [pendingShape, setPendingShape] = React.useState(null);
    const [zoom, setZoom] = React.useState(100);
    const [rightTab, setRightTab] = React.useState("annotations"); // "annotations" | "summary"

    /* ── Drawing tools hook ── */
    const drawing = useDrawingTools({
        activeTool,
        onShapeComplete: (shape) => setPendingShape(shape),
        addToast,
    });

    /* ── Live clock ── */
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    /* â”€â”€ Image blob fetch â”€â”€ */
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

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       LABELS â€” robust mapping + fallback API by projectId
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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

        // Safe ID â€” handle both numeric and UUID string IDs
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

    // Fallback: if workspace labelGroups empty -> try localStorage (project-scoped rules),
    // then fall through to ALL active labels only if localStorage has nothing.
    React.useEffect(() => {
        if (labelsFromGroups.length > 0) {
            setFallbackLabels([]);
            return;
        }
        if (!workspace) return;

        // Step 1: try localStorage bridge written by ProjectLabels.tsx
        const projectName = workspace?.projectName;
        if (projectName) {
            try {
                const nameMap = JSON.parse(localStorage.getItem("dlss_project_name_pid_map") || "{}");
                const storedPid = nameMap[projectName];
                if (storedPid) {
                    const savedRules = JSON.parse(
                        localStorage.getItem(`dlss_project_rules_full::${storedPid}`) || "[]"
                    );
                    if (savedRules.length > 0) {
                        const labels = [];
                        const seen = new Set();
                        savedRules.forEach((rule) => {
                            const gName = rule.name || "";
                            (rule.labels || []).forEach((raw) => {
                                const label = normalizeLabel(raw, gName);
                                if (!label) return;
                                const key = String(label.id);
                                if (seen.has(key)) return;
                                seen.add(key);
                                labels.push(label);
                            });
                        });
                        if (labels.length > 0) {
                            if (import.meta.env.DEV)
                                console.log("[LABELS] from localStorage rules:", labels.length, labels);
                            setFallbackLabels(labels);
                            setLabelsLoading(false);
                            return;
                        }
                    }
                }
            } catch (e) {
                console.warn("[LABELS] localStorage lookup failed:", e);
            }
        }

        // Step 2: last resort - fetch ALL active labels
        if (import.meta.env.DEV)
            console.log("[LABELS] no localStorage data - fallback via GET /api/labels/active");

        let cancelled = false;
        setLabelsLoading(true);

        (async () => {
            try {
                const rawLabels = await apiClient.get("/api/labels/active");
                if (cancelled) return;
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
                if (import.meta.env.DEV)
                    console.log("[LABELS] all-active fallback:", labels.length, labels);
                setFallbackLabels(labels);
            } catch (err) {
                console.error("[LABELS] fallback fetch error:", err);
                addToast?.({ type: "error", message: "Khong tai duoc labels" });
            } finally {
                if (!cancelled) setLabelsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [workspace, labelsFromGroups.length, addToast]);

    /* ── All labels: workspace groups first, fallback second ── */
    const allLabels = labelsFromGroups.length > 0 ? labelsFromGroups : fallbackLabels;

    /* ── Label groups for modal (preserves rule/group structure) ── */
    const labelGroupsForModal = React.useMemo(() => {
        const rawGroups = (
            workspace?.labelGroups ||
            workspace?.data?.labelGroups ||
            workspace?.data?.data?.labelGroups ||
            workspace?.payload?.labelGroups ||
            []
        );
        if (rawGroups.length > 0) {
            return rawGroups
                .map((g) => ({
                    ruleId: g.ruleId,
                    ruleName: g.ruleName || "(no name)",
                    labels: (g.labels || []).map((l) => ({
                        id: l.labelId ?? l.id,
                        name: l.labelName ?? l.name,
                        color: l.colorCode ?? l.color ?? "#6b7280",
                        type: l.labelType ?? l.type ?? "BBOX",
                    })).filter((l) => l.id != null && l.name),
                }))
                .filter((g) => g.labels.length > 0);
        }
        // fallback: wrap flat labels in a single group
        if (fallbackLabels.length > 0) {
            return [{ ruleId: null, ruleName: "Labels", labels: fallbackLabels }];
        }
        return [];
    }, [workspace, fallbackLabels]);

    React.useEffect(() => { fetchWorkspace(); }, [fetchWorkspace]);

    /* ── Load annotations when item changes ── */
    React.useEffect(() => {
        if (currentItem?.itemId) {
            anno.loadAnnotations(currentItem.itemId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentItem?.itemId]);

    /* â”€â”€ Navigation â”€â”€ */
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

    /* â”€â”€ Save (flush) â”€â”€ */
    const handleSave = async () => {
        await anno.saveNow();
        addToast({ type: "success", message: "ÄÃ£ lÆ°u annotations" });
    };

    /* â”€â”€ Submit assignment â”€â”€ */
    const handleSubmit = async () => {
        try {
            await anno.saveNow();
            await annotationApi.submitAssignment(assignmentId);
            addToast({ type: "success", message: "ÄÃ£ ná»™p bÃ i thÃ nh cÃ´ng!" });
            navigate("/annotator/tasks");
        } catch (err) {
            addToast({ type: "error", message: err?.message || "Ná»™p bÃ i tháº¥t báº¡i" });
        }
    };

    /* â”€â”€ Mark as Done â”€â”€ */
    const handleMarkDone = () => {
        if (!currentItem) return;
        if (anno.isDone(currentItem.itemId)) {
            anno.unmarkDone(currentItem.itemId);
            addToast({ type: "info", message: "ÄÃ£ bá» Ä‘Ã¡nh dáº¥u Done" });
        } else {
            const ok = anno.markDone(currentItem.itemId);
            if (ok) addToast({ type: "success", message: "ÄÃ£ Ä‘Ã¡nh dáº¥u Done âœ“" });
        }
        // force re-render for sidebar
        setWorkspace((w) => ({ ...w }));
    };

    /* â”€â”€ Label select modal callbacks â”€â”€ */
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

    /* â”€â”€ Progress â”€â”€ */
    const doneCount = items.filter((i) => anno.isDone(i.itemId)).length;
    const progressPercent = totalImages > 0 ? Math.round((doneCount / totalImages) * 100) : 0;

    /* â”€â”€ Loading / Error states â”€â”€ */
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

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    // â”€â”€ FULL REDESIGN â”€â”€
    return (
        <>
            <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#131c2e", color: "#e2e8f0" }}>

                {/* â•â•â•â•â•â•â•â•â•â• TOP BAR â•â•â•â•â•â•â•â•â•â• */}
                <div className="flex items-center gap-2 px-3 shrink-0 border-b"
                    style={{ height: 48, background: "#182233", borderColor: "#253347" }}>

                    {/* Dashboard Logo Link */}
                    <button
                        onClick={() => navigate("/annotator/dashboard")}
                        className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors hover:bg-white/5"
                    >
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/20">
                            <span className="material-symbols-outlined text-white text-[14px]">category</span>
                        </div>
                        <span className="font-bold text-sm tracking-tight text-white hidden sm:block">
                            DataLabel<span className="text-teal-400">Core</span>
                        </span>
                    </button>

                    {/* Progress bar + count */}
                    <div className="flex items-center gap-2 mx-3">
                        <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: "#253347" }}>
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%`, background: "#00bfa5" }} />
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap" style={{ color: "#64748b" }}>
                            {currentImageIndex + 1}/{totalImages} ảnh
                        </span>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center rounded overflow-hidden" style={{ background: "#1e2f42" }}>
                        {[
                            { icon: "first_page", dir: "first" },
                            { icon: "chevron_left", dir: "prev" },
                        ].map(({ icon, dir }) => (
                            <button key={dir} onClick={() => handleNavigate(dir)}
                                className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-white/10"
                                style={{ color: "#64748b" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                            </button>
                        ))}
                        <span className="px-2 text-xs font-bold tabular-nums" style={{ color: "#e2e8f0" }}>
                            {currentImageIndex + 1}
                        </span>
                        {[
                            { icon: "chevron_right", dir: "next" },
                            { icon: "last_page", dir: "last" },
                        ].map(({ icon, dir }) => (
                            <button key={dir} onClick={() => handleNavigate(dir)}
                                className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-white/10"
                                style={{ color: "#64748b" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                            </button>
                        ))}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Clock */}
                    <div className="flex items-center gap-1 mr-3">
                        {[hh, mm, ss].map((unit, i) => (
                            <span key={i} className="text-xs font-mono font-bold tabular-nums px-1.5 py-0.5 rounded"
                                style={{ background: "#1e2f42", color: "#94a3b8", letterSpacing: "0.05em" }}>
                                {unit}
                            </span>
                        ))}
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center gap-1 mr-2">
                        <button onClick={() => setZoom((z) => Math.max(10, z - 10))}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                            style={{ color: "#64748b" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>remove</span>
                        </button>
                        <span className="text-[11px] font-mono font-bold w-10 text-center tabular-nums"
                            style={{ color: "#94a3b8" }}>{zoom}%</span>
                        <button onClick={() => setZoom((z) => Math.min(400, z + 10))}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                            style={{ color: "#64748b" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                        </button>
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-1">
                        <button onClick={handleSave} title="LÆ°u"
                            className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                            style={{ color: "#64748b" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                        </button>
                        <button onClick={handleMarkDone}
                            title={currentIsDone ? "Bỏ Done" : "Mark Done"}
                            disabled={!currentIsDone && anno.annotations.length === 0}
                            className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                            style={{ color: currentIsDone ? "#00bfa5" : "#64748b" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                {currentIsDone ? "check_circle" : "task_alt"}
                            </span>
                        </button>
                        <button onClick={() => navigate("/annotator/tasks")} title="Cài đặt"
                            className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                            style={{ color: "#64748b" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
                        </button>
                    </div>
                </div>

                {/* â•â•â•â•â•â•â•â•â•â• BODY â•â•â•â•â•â•â•â•â•â• */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT: Image thumbnails ── */}
                    <div className="flex flex-col shrink-0 overflow-y-auto border-r"
                        style={{ width: 148, background: "#182233", borderColor: "#253347" }}>

                        {/* Project Info & Submit Action */}
                        <div className="p-3 border-b shrink-0 flex flex-col gap-2" style={{ borderColor: "#253347" }}>
                            {/* Task name badge */}
                            <div className="flex items-center justify-between px-2 py-1.5 rounded text-xs font-medium bg-[#1e2f42] text-[#cbd5e1] border border-[#2a3f55]">
                                <span className="truncate flex-1" title={workspace.projectName || `Assignment #${assignmentId}`}>
                                    {workspace.projectName || `Assignment #${assignmentId}`}
                                </span>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                className="w-full py-2 rounded text-xs font-bold transition-opacity hover:opacity-80 shadow-md flex items-center justify-center gap-1.5"
                                style={{ background: "#00bfa5", color: "#fff" }}>
                                <span>Nộp đánh giá</span>
                                <span className="material-symbols-outlined text-[14px]">send</span>
                            </button>
                        </div>

                        {/* Image List */}
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                            {items.map((item, idx) => {
                                const isActive = idx === currentImageIndex;
                                const isDone = anno.isDone(item.itemId);
                                return (
                                    <div key={item.itemId}
                                        onClick={() => { setCurrentImageIndex(idx); setSelectedGroupKey(null); setActiveLabelFilterId(null); }}
                                        className="relative cursor-pointer rounded overflow-hidden transition-all"
                                        style={{
                                            border: isActive ? "2px solid #00bfa5" : "2px solid transparent",
                                            background: "#1e2f42",
                                        }}>
                                        {/* Number badge */}
                                        <div className="absolute top-1 left-1 z-10 w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shadow-md bg-black/40 backdrop-blur-sm"
                                            style={{ border: isActive ? "1px solid #00bfa5" : "1px solid rgba(255,255,255,0.1)", color: isActive ? "#00bfa5" : "#fff" }}>
                                            {idx + 1}
                                        </div>
                                        {/* Done badge */}
                                        {isDone && (
                                            <div className="absolute top-1 right-1 z-10 drop-shadow-md">
                                                <span className="material-symbols-outlined text-[16px]" style={{ color: "#00bfa5" }}>check_circle</span>
                                            </div>
                                        )}
                                        {/* Thumbnail */}
                                        <div className="w-full overflow-hidden" style={{ height: 80 }}>
                                            <ThumbnailImg fileUrl={item.fileUrl} alt={item.fileName || `Item ${idx + 1}`} />
                                        </div>
                                        {/* Selection Glow */}
                                        {isActive && (
                                            <div className="absolute inset-0 ring-inset ring-2 ring-[#00bfa5] rounded pointer-events-none" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Save button at bottom */}
                        <div className="p-3 border-t shrink-0" style={{ borderColor: "#253347" }}>
                            <button onClick={handleSave}
                                className="w-full py-1.5 rounded text-xs font-semibold transition-colors hover:bg-white/10 flex items-center justify-center gap-1.5"
                                style={{ background: "transparent", border: "1px solid #3a5068", color: "#94a3b8" }}>
                                <span className="material-symbols-outlined text-[14px]">save</span>
                                <span>Lưu nháp</span>
                            </button>
                        </div>
                    </div>

                    {/* ── CENTER: Canvas ── */}
                    <div className="flex-1 overflow-auto relative" style={{ background: "#0e1621" }}>
                        {/* centering wrapper — expands to at least full viewport so canvas stays centered at small zoom */}
                        <div style={{ minHeight: "100%", minWidth: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, boxSizing: "border-box" }}>
                            <div className="relative shadow-2xl shrink-0"
                                style={{
                                    width: imgWidth * (zoom / 100),
                                    height: imgHeight * (zoom / 100),
                                    background: "#000",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}>
                                {imageLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: "#3a5068" }}>progress_activity</span>
                                    </div>
                                ) : imageBlobUrl ? (
                                    <img src={imageBlobUrl} alt={currentItem?.fileName || `Image ${currentImageIndex + 1}`}
                                        className="absolute inset-0 w-full h-full object-contain" draggable={false} />
                                ) : imageError ? (
                                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
                                        <div className="text-center p-6 max-w-sm">
                                            <span className="material-symbols-outlined mb-3 block" style={{ fontSize: 48, color: "#f87171" }}>broken_image</span>
                                            <p className="text-sm font-medium mb-1" style={{ color: "#f87171" }}>Không tải được ảnh</p>
                                            <p className="text-[10px] font-mono break-all mb-4" style={{ color: "#64748b" }}>{imageError.url}</p>
                                            <button onClick={() => { setImageError(null); setImageBlobUrl(null); }}
                                                className="px-4 py-1.5 text-xs font-medium rounded"
                                                style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                                                Thử lại
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center select-none opacity-20">
                                        <span className="material-symbols-outlined" style={{ fontSize: 64, color: "#3a5068" }}>image</span>
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

                                {/* Label select popup — absolute inside canvas so it scrolls with it */}
                                {pendingShape && (
                                    <LabelSelectModal
                                        labelGroups={labelGroupsForModal}
                                        pendingShape={pendingShape}
                                        canvasWidth={imgWidth * (zoom / 100)}
                                        canvasHeight={imgHeight * (zoom / 100)}
                                        onSave={handleLabelSave}
                                        onCancel={handleLabelCancel}
                                    />
                                )}
                            </div>{/* end canvas */}
                        </div>{/* end centering wrapper */}

                    </div>

                    {/* â”€â”€ RIGHT: Tools + Annotations â”€â”€ */}
                    <div className="flex flex-col shrink-0 border-l overflow-hidden"
                        style={{ width: 260, background: "#182233", borderColor: "#253347" }}>

                        {/* Tool icons */}
                        <div className="flex items-center justify-center gap-1 px-3 py-2 border-b shrink-0"
                            style={{ borderColor: "#253347" }}>
                            {TOOLS.map((tool) => (
                                <button key={tool.id}
                                    onClick={() => { setActiveTool(tool.id); setSelectedGroupKey(null); }}
                                    title={tool.label}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                                    style={activeTool === tool.id
                                        ? { background: "#00bfa5", color: "#fff" }
                                        : { background: "transparent", color: "#4a6788" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{tool.icon}</span>
                                </button>
                            ))}
                        </div>

                        {/* ── Tab bar ── */}
                        <div className="flex shrink-0 border-b" style={{ borderColor: "#253347" }}>
                            <button
                                onClick={() => setRightTab("annotations")}
                                className="flex-1 py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                style={rightTab === "annotations"
                                    ? { color: "#00bfa5", borderBottom: "2px solid #00bfa5" }
                                    : { color: "#4a6788", borderBottom: "2px solid transparent" }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>layers</span>
                                Kết quả ({anno.annotations.length})
                            </button>
                            <button
                                onClick={() => setRightTab("summary")}
                                className="flex-1 py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                style={rightTab === "summary"
                                    ? { color: "#00bfa5", borderBottom: "2px solid #00bfa5" }
                                    : { color: "#4a6788", borderBottom: "2px solid transparent" }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>analytics</span>
                                Tổng hợp
                            </button>
                        </div>

                        {/* ── Tab content ── */}
                        <div className="flex-1 overflow-y-auto">
                            {rightTab === "annotations" ? (
                                labelsLoading && allLabels.length === 0 ? (
                                    <div className="flex items-center justify-center h-24 gap-2 opacity-50">
                                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18, color: "#3a5068" }}>progress_activity</span>
                                        <p className="text-xs" style={{ color: "#3a5068" }}>Đang tải...</p>
                                    </div>
                                ) : anno.annotations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-30">
                                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#3a5068" }}>layers</span>
                                        <p className="text-xs" style={{ color: "#3a5068" }}>Chưa có annotation</p>
                                    </div>
                                ) : (
                                    <AnnotationList
                                        annotations={anno.annotations}
                                        allLabels={allLabels}
                                        selectedGroupKey={selectedGroupKey}
                                        activeLabelFilterId={activeLabelFilterId}
                                        onSelect={(gk) => { setSelectedGroupKey(gk); setActiveTool("select"); }}
                                        onDelete={anno.deleteAnnotation}
                                        onToggleHidden={anno.toggleHidden}
                                    />
                                )
                            ) : (
                                <LabelSummaryPanel
                                    workspace={workspace}
                                    currentItem={currentItem}
                                    liveAnnotations={anno.annotations}
                                    allLabels={allLabels}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}
