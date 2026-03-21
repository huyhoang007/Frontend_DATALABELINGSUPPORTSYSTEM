import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import apiClient from "../../api/apiClient";
import useReviewWorkspace from "./useReviewWorkspace";
import AnnotationOverlay from "../Annotator/AnnotationOverlay";
import { groupAnnotationsByKey } from "../Annotator/geometryUtils";

/* ── Resolve fileUrl → proxy path ── */
function resolveImagePath(fileUrl) {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http")) return fileUrl;
    let url = fileUrl;
    if (!url.startsWith("/uploads")) {
        url = `/uploads${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
}

/* ── Authenticated thumbnail component ── */
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

/* ── Route guard ── */
export default function ReviewWorkspace() {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const assignmentIdNum = Number(assignmentId);
    if (!assignmentId || isNaN(assignmentIdNum)) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4"
                style={{ background: "#131c2e", color: "#e2e8f0" }}>
                <span className="material-symbols-outlined text-5xl" style={{ color: "#f87171" }}>error</span>
                <h2 className="text-xl font-bold">Mã assignment không hợp lệ</h2>
                <p style={{ color: "#64748b" }}>ID "{assignmentId}" không hợp lệ.</p>
                <button onClick={() => navigate("/reviewer/queue")}
                    className="px-4 py-2 rounded text-sm font-medium hover:opacity-80 transition"
                    style={{ background: "#1e2f42", color: "#e2e8f0" }}>
                    ← Quay lại danh sách
                </button>
            </div>
        );
    }
    return <ReviewWorkspaceInner assignmentIdNum={assignmentIdNum} />;
}

/* ── Main workspace ── */
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
        handleSubmitReview,
        reviewStats,
        getItemStats,
        annoCache,
    } = useReviewWorkspace(assignmentIdNum);

    /* ── UI local state ── */
    const [selectedGroupKey, setSelectedGroupKey] = React.useState(null);
    const [rejectingAnnoId, setRejectingAnnoId] = React.useState(null);
    const [selectedPolicyId, setSelectedPolicyId] = React.useState(null);
    const [rejectNote, setRejectNote] = React.useState("");
    const [zoom, setZoom] = React.useState(100);
    const [rightTab, setRightTab] = React.useState("review"); // "review" | "summary"
    const [showGuidelinePopover, setShowGuidelinePopover] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /* ── Live clock ── */
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    /* ── Reset per-item state when switching items ── */
    React.useEffect(() => {
        setSelectedGroupKey(null);
        setRejectingAnnoId(null);
        setSelectedPolicyId(null);
        setRejectNote("");
    }, [currentItemIndex]);

    /* ── Annotation groups for read-only canvas overlay ── */
    const annotationGroups = React.useMemo(
        () => groupAnnotationsByKey(currentAnnotations),
        [currentAnnotations]
    );

    /* ── Navigation ── */
    const handleNavigate = (dir) => {
        const n = items.length;
        let newIdx = currentItemIndex;
        if (dir === "first") newIdx = 0;
        if (dir === "prev") newIdx = Math.max(0, currentItemIndex - 1);
        if (dir === "next") newIdx = Math.min(n - 1, currentItemIndex + 1);
        if (dir === "last") newIdx = n - 1;
        if (newIdx !== currentItemIndex) setCurrentItemIndex(newIdx);
    };

    /* ── Review handlers ── */
    const handleApprove = async (reviewingId) => {
        const result = await handleReviewAnnotation(reviewingId, false, null);
        if (result.success) {
            // Clear any inline reject UI tied to the annotation once it is approved.
            if (rejectingAnnoId === reviewingId) {
                setRejectingAnnoId(null);
                setSelectedPolicyId(null);
                setRejectNote("");
            }
            addToast({ type: "success", message: "Đã chấp nhận" });
        } else {
            addToast({ type: "error", message: result.error || "Không thể chấp nhận annotation" });
        }
    };

    const handleReject = async (reviewingId) => {
        if (!selectedPolicyId) {
            addToast({ type: "error", message: "Vui lòng chọn loại lỗi vi phạm" });
            return;
        }
        const result = await handleReviewAnnotation(reviewingId, true, selectedPolicyId, rejectNote.trim() || undefined);
        if (result.success) {
            addToast({ type: "warning", message: "Đã từ chối" });
            setRejectingAnnoId(null);
            setSelectedPolicyId(null);
            setRejectNote("");
        } else {
            addToast({ type: "error", message: result.error || "Không thể từ chối annotation" });
        }
    };

    const handleSubmit = async () => {
        if (isFinalizedAssignment) {
            addToast({ type: "warning", message: `Assignment đã ở trạng thái cuối ${assignmentStatus}, không thể nộp lại` });
            return;
        }
        if (imageError) {
            addToast({ type: "error", message: "Không thể nộp đánh giá khi ảnh hiện tại tải thất bại" });
            return;
        }
        const result = await handleSubmitReview();
        if (result.success) {
            addToast({ type: "success", message: "Đã nộp đánh giá thành công!" });
            setTimeout(() => navigate("/reviewer/queue"), 1200);
        } else {
            addToast({ type: "error", message: result.error || "Nộp đánh giá thất bại" });
        }
    };

    /* ── All labels (flat) from workspace.labelGroups ── */
    const allLabels = React.useMemo(() => {
        const groups = workspace?.labelGroups ?? [];
        const labels = [];
        const seen = new Set();
        groups.forEach((g) => {
            (g.labels || []).forEach((l) => {
                const id = l.labelId ?? l.id;
                if (id == null || seen.has(String(id))) return;
                seen.add(String(id));
                labels.push({
                    id: Number(id),
                    name: l.labelName ?? l.name ?? "",
                    color: l.colorCode ?? l.color ?? "#6b7280",
                    type: l.labelType ?? l.type ?? "BBOX",
                });
            });
        });
        return labels;
    }, [workspace]);

    /* ── Loading ── */
    if (workspaceLoading) {
        return (
            <div className="flex items-center justify-center h-screen"
                style={{ background: "#131c2e", color: "#e2e8f0" }}>
                <span className="material-symbols-outlined animate-spin mr-2"
                    style={{ fontSize: 28, color: "#3a5068" }}>progress_activity</span>
                <span style={{ color: "#64748b" }}>Đang tải workspace...</span>
            </div>
        );
    }

    /* ── Error ── */
    if (workspaceError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4"
                style={{ background: "#131c2e", color: "#e2e8f0" }}>
                <span className="material-symbols-outlined text-5xl" style={{ color: "#f87171" }}>error</span>
                <h2 className="text-xl font-bold">Không tải được workspace</h2>
                <p style={{ color: "#64748b" }}>{workspaceError}</p>
                <button onClick={() => navigate("/reviewer/queue")}
                    className="px-4 py-2 rounded text-sm font-medium hover:opacity-80 transition"
                    style={{ background: "#1e2f42", color: "#e2e8f0" }}>
                    ← Quay lại danh sách
                </button>
            </div>
        );
    }

    const imgWidth = currentItem?.width || 800;
    const imgHeight = currentItem?.height || 600;
    const totalImages = items.length;
    const currentItemStats = currentItemId != null
        ? getItemStats(currentItemId)
        : { total: 0, approved: 0, rejected: 0, pending: 0 };
    const assignmentStatus = (workspace?.assignmentStatus || "").toUpperCase();
    const isFinalizedAssignment = assignmentStatus === "APPROVED" || assignmentStatus === "REJECTED";
    const hasImageLoadError = Boolean(imageError);
    const canReviewCurrentImage = !isFinalizedAssignment && !imageLoading && !hasImageLoadError && Boolean(imageBlobUrl);
    const canSubmit = !isFinalizedAssignment && reviewStats.pending === 0 && reviewStats.total > 0 && !hasImageLoadError;

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    return (
        <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#131c2e", color: "#e2e8f0" }}>

            {/* ══ TOP BAR ══ */}
            <div className="flex items-center gap-2 px-3 shrink-0 border-b"
                style={{ minHeight: 48, background: "#182233", borderColor: "#253347", flexWrap: isMobile ? "wrap" : "nowrap", paddingTop: isMobile ? 8 : undefined, paddingBottom: isMobile ? 8 : undefined }}>

                {/* Logo / Back */}
                <button onClick={() => navigate("/reviewer/queue")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors hover:bg-white/5">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/20">
                        <span className="material-symbols-outlined text-white text-[14px]">category</span>
                    </div>
                    <span className="font-bold text-sm tracking-tight text-white hidden sm:block">
                        Data<span className="text-teal-400">Label</span>
                    </span>
                </button>

                {/* Review progress bar */}
                <div className="flex items-center gap-2 mx-3" style={{ order: isMobile ? 3 : 0 }}>
                    <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: "#253347" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: reviewStats.total > 0
                                    ? `${(reviewStats.reviewed / reviewStats.total) * 100}%`
                                    : "0%",
                                background: "#00bfa5",
                            }} />
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap" style={{ color: "#64748b" }}>
                        {currentItemIndex + 1}/{totalImages} ảnh
                    </span>
                </div>

                {/* Image navigation */}
                <div className="flex items-center rounded overflow-hidden" style={{ background: "#1e2f42", order: isMobile ? 4 : 0 }}>
                    {[{ icon: "first_page", dir: "first" }, { icon: "chevron_left", dir: "prev" }].map(({ icon, dir }) => (
                        <button key={dir} onClick={() => handleNavigate(dir)}
                            className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-white/10"
                            style={{ color: "#64748b" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                        </button>
                    ))}
                    <span className="px-2 text-xs font-bold tabular-nums" style={{ color: "#e2e8f0" }}>
                        {currentItemIndex + 1}
                    </span>
                    {[{ icon: "chevron_right", dir: "next" }, { icon: "last_page", dir: "last" }].map(({ icon, dir }) => (
                        <button key={dir} onClick={() => handleNavigate(dir)}
                            className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-white/10"
                            style={{ color: "#64748b" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1" />

                {/* Clock */}
                <div className="flex items-center gap-1 mr-3" style={{ order: isMobile ? 2 : 0 }}>
                    {[hh, mm, ss].map((unit, i) => (
                        <span key={i} className="text-xs font-mono font-bold tabular-nums px-1.5 py-0.5 rounded"
                            style={{ background: "#1e2f42", color: "#94a3b8", letterSpacing: "0.05em" }}>
                            {unit}
                        </span>
                    ))}
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-1 mr-2" style={{ order: isMobile ? 2 : 0 }}>
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

                {/* Guideline quick access */}
                <div className="relative mr-2" style={{ order: isMobile ? 2 : 0 }}>
                    <button
                        onClick={() => setShowGuidelinePopover((v) => !v)}
                        title="Hướng dẫn gán nhãn"
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                        style={{ color: "#7dd3fc" }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
                    </button>
                    {showGuidelinePopover && (
                        <div className="absolute right-0 top-9 z-50 w-80 rounded-lg border p-3 shadow-2xl"
                            style={{ background: "#111d2c", borderColor: "#253347" }}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold" style={{ color: "#cbd5e1" }}>Hướng dẫn gán nhãn</p>
                                <button
                                    onClick={() => setShowGuidelinePopover(false)}
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
                                    style={{ color: "#64748b" }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                                </button>
                            </div>
                            <div className="text-xs rounded border p-2 max-h-40 overflow-y-auto"
                                style={{ borderColor: "#253347", color: "#94a3b8", background: "#0f1823" }}>
                                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                                    {workspace?.projectGuidelineContent || "Chưa có hướng dẫn cho dự án này."}
                                </p>
                            </div>
                            {workspace?.projectGuidelineFileUrl && (
                                <a
                                    href={workspace.projectGuidelineFileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1.5 text-xs hover:text-white"
                                    style={{ color: "#7dd3fc", textDecoration: "underline" }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>download</span>
                                    Tải file hướng dẫn
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Hoàn tất đánh giá button */}
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || reviewSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-opacity shadow-md"
                    style={{
                        background: canSubmit ? "#00bfa5" : "#1e2f42",
                        color: canSubmit ? "#fff" : "#4a6788",
                        border: canSubmit ? "none" : "1px solid #253347",
                        cursor: canSubmit && !reviewSubmitting ? "pointer" : "not-allowed",
                        opacity: reviewSubmitting ? 0.6 : 1,
                        order: isMobile ? 5 : 0,
                        width: isMobile ? "100%" : undefined,
                        justifyContent: "center",
                    }}
                    title={
                        isFinalizedAssignment
                            ? `Assignment đã ở trạng thái cuối ${assignmentStatus}`
                            : hasImageLoadError
                                ? "Không thể nộp đánh giá khi ảnh hiện tại tải thất bại"
                            : !canSubmit
                                ? `Còn ${reviewStats.pending} annotation chưa được đánh giá`
                                : "Hoàn tất và nộp đánh giá"
                    }>
                    {reviewSubmitting
                        ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        : <span className="material-symbols-outlined text-[14px]">task_alt</span>}
                    <span>Hoàn tất đánh giá</span>
                    {!isFinalizedAssignment && !canSubmit && reviewStats.pending > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: "#253347", color: "#94a3b8" }}>
                            {reviewStats.pending}
                        </span>
                    )}
                </button>
            </div>

            {/* ══ BODY ══ */}
            <div className="flex flex-1 overflow-hidden" style={{ flexDirection: isMobile ? "column" : "row" }}>

                {/* ── LEFT: Thumbnails + Project info ── */}
                <div className="flex flex-col shrink-0 border-r"
                    style={{ width: isMobile ? "100%" : 148, background: "#182233", borderColor: "#253347", borderRightWidth: isMobile ? 0 : 1, borderBottomWidth: isMobile ? 1 : 0 }}>

                    {/* Project & submit */}
                    <div className="p-3 border-b shrink-0 flex flex-col gap-2" style={{ borderColor: "#253347" }}>
                        {/* Project name */}
                        <div className="px-2 py-1.5 rounded text-xs font-medium"
                            style={{ background: "#1e2f42", color: "#cbd5e1", border: "1px solid #2a3f55" }}>
                            <span className="block truncate" title={workspace?.projectName || `#${assignmentIdNum}`}>
                                {workspace?.projectName || `Assignment #${assignmentIdNum}`}
                            </span>
                        </div>

                        {/* Assignment status */}
                        <div className="flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold"
                            style={{
                                background: workspace?.assignmentStatus === "APPROVED" ? "rgba(0,191,165,0.1)"
                                    : workspace?.assignmentStatus === "REJECTED" ? "rgba(248,113,113,0.1)"
                                        : "rgba(250,204,21,0.1)",
                                color: workspace?.assignmentStatus === "APPROVED" ? "#00bfa5"
                                    : workspace?.assignmentStatus === "REJECTED" ? "#f87171"
                                        : "#facc15",
                            }}>
                            {workspace?.assignmentStatus || "SUBMITTED"}
                        </div>

                        {/* Nộp đánh giá */}
                        <button onClick={handleSubmit}
                            disabled={!canSubmit || reviewSubmitting}
                            className="w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-opacity"
                            title={hasImageLoadError ? "Không thể nộp đánh giá khi ảnh hiện tại tải thất bại" : undefined}
                            style={{
                                background: canSubmit ? "#00bfa5" : "#253347",
                                color: canSubmit ? "#fff" : "#4a6788",
                                cursor: canSubmit && !reviewSubmitting ? "pointer" : "not-allowed",
                                opacity: reviewSubmitting ? 0.6 : 1,
                            }}>
                            <span className="material-symbols-outlined text-[14px]">send</span>
                            <span>Nộp đánh giá</span>
                        </button>
                    </div>

                    {/* Image list */}
                    <div className="flex-1 p-2 overflow-y-auto" style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8, overflowX: isMobile ? "auto" : "hidden" }}>
                        {items.map((item, idx) => {
                            const stats = getItemStats(item.itemId);
                            const isActive = idx === currentItemIndex;
                            const allReviewed = stats.total > 0 && stats.pending === 0;
                            const hasRejected = stats.rejected > 0;
                            return (
                                <div key={item.itemId}
                                    onClick={() => { setCurrentItemIndex(idx); setSelectedGroupKey(null); }}
                                    className="relative cursor-pointer rounded overflow-hidden transition-all"
                                    style={{
                                        border: isActive ? "2px solid #00bfa5" : "2px solid transparent",
                                        background: "#1e2f42",
                                        minWidth: isMobile ? 96 : undefined,
                                    }}>
                                    {/* Number badge */}
                                    <div className="absolute top-1 left-1 z-10 w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                        style={{
                                            border: isActive ? "1px solid #00bfa5" : "1px solid rgba(255,255,255,0.1)",
                                            color: isActive ? "#00bfa5" : "#fff",
                                        }}>
                                        {idx + 1}
                                    </div>
                                    {/* Status icon */}
                                    {allReviewed && (
                                        <div className="absolute top-1 right-1 z-10">
                                            <span className="material-symbols-outlined text-[16px] drop-shadow-md"
                                                style={{ color: hasRejected ? "#f87171" : "#00bfa5" }}>
                                                {hasRejected ? "cancel" : "check_circle"}
                                            </span>
                                        </div>
                                    )}
                                    {!allReviewed && stats.total > 0 && (
                                        <div className="absolute top-1 right-1 z-10">
                                            <span className="material-symbols-outlined text-[16px] drop-shadow-md"
                                                style={{ color: "#facc15" }}>pending</span>
                                        </div>
                                    )}
                                    {/* Thumbnail */}
                                    <div className="w-full overflow-hidden" style={{ height: 80, width: isMobile ? 92 : undefined }}>
                                        <ThumbnailImg fileUrl={item.fileUrl} alt={item.fileName || `Ảnh ${idx + 1}`} />
                                    </div>
                                    {/* Active glow */}
                                    {isActive && (
                                        <div className="absolute inset-0 ring-inset ring-2 ring-[#00bfa5] rounded pointer-events-none" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress summary */}
                    <div className="p-3 border-t shrink-0" style={{ borderColor: "#253347", display: isMobile ? "none" : "block" }}>
                        <div className="flex items-center justify-between text-[10px] mb-1.5" style={{ color: "#4a6788" }}>
                            <span>Tiến độ</span>
                            <span className="font-mono">{reviewStats.reviewed}/{reviewStats.total}</span>
                        </div>
                        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "#253347" }}>
                            <div className="h-full rounded-full transition-all"
                            style={{
                                width: currentItemStats.total > 0
                                    ? `${((currentItemStats.approved + currentItemStats.rejected) / currentItemStats.total) * 100}%`
                                    : "0%",
                                background: "#00bfa5",
                            }} />
                        </div>
                        <div className="flex justify-between text-[10px] mt-1.5">
                            <span style={{ color: "#00bfa5" }}>A {currentItemStats.approved}</span>
                            <span style={{ color: "#f87171" }}>R {currentItemStats.rejected}</span>
                            <span style={{ color: "#facc15" }}>P {currentItemStats.pending}</span>
                        </div>
                    </div>
                </div>

                {/* ── CENTER: Read-only canvas ── */}
                <div className="flex-1 overflow-auto relative" style={{ background: "#0e1621", minHeight: isMobile ? 0 : undefined }}>
                    <div style={{
                        minHeight: "100%", minWidth: "100%", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        padding: isMobile ? 12 : 32, boxSizing: "border-box",
                    }}>
                        <div className="relative shadow-2xl shrink-0"
                            style={{
                                width: imgWidth * (zoom / 100),
                                height: imgHeight * (zoom / 100),
                                background: "#000",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}>
                            {imageLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined animate-spin"
                                        style={{ fontSize: 32, color: "#3a5068" }}>progress_activity</span>
                                </div>
                            ) : imageBlobUrl ? (
                                <img src={imageBlobUrl}
                                    alt={currentItem?.fileName || `Ảnh ${currentItemIndex + 1}`}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    draggable={false} />
                            ) : imageError ? (
                                <div className="absolute inset-0 flex items-center justify-center"
                                    style={{ background: "rgba(0,0,0,0.8)" }}>
                                    <div className="text-center p-6 max-w-sm">
                                        <span className="material-symbols-outlined mb-3 block"
                                            style={{ fontSize: 48, color: "#f87171" }}>broken_image</span>
                                        <p className="text-sm font-medium mb-1" style={{ color: "#f87171" }}>Không tải được ảnh</p>
                                        <p className="text-[10px] font-mono break-all"
                                            style={{ color: "#64748b" }}>{imageError.url}</p>
                                        <p className="text-xs mt-3" style={{ color: "#cbd5e1" }}>
                                            Đánh giá và nộp bài đã bị khóa cho đến khi ảnh tải được.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center select-none opacity-20">
                                    <span className="material-symbols-outlined"
                                        style={{ fontSize: 64, color: "#3a5068" }}>image</span>
                                </div>
                            )}

                            {/* Read-only overlay */}
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
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Review/Summary panel ── */}
                <div className="flex flex-col shrink-0 border-l overflow-hidden"
                    style={{ width: isMobile ? "100%" : 280, maxHeight: isMobile ? "42vh" : undefined, background: "#182233", borderColor: "#253347", borderLeftWidth: isMobile ? 0 : 1, borderTopWidth: isMobile ? 1 : 0 }}>

                    {/* Header line */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
                        style={{ borderColor: "#253347" }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: "#00bfa5" }}>rate_review</span>
                        <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
                            Ảnh {currentItemIndex + 1} / {totalImages}
                        </span>
                        <div className="flex-1" />
                        <span className="text-[10px] font-mono" style={{ color: "#4a6788" }}>
                            <span style={{ color: "#00bfa5" }}>{currentAnnotations.filter(a => a.status === "APPROVED").length}A</span>
                            {" "}
                            <span style={{ color: "#f87171" }}>{currentAnnotations.filter(a => a.status === "REJECTED").length}R</span>
                            {" "}
                            <span style={{ color: "#facc15" }}>{currentAnnotations.filter(a => !a.status || a.status === "PENDING").length}P</span>
                        </span>
                    </div>

                    {/* Tab bar */}
                    <div className="flex shrink-0 border-b" style={{ borderColor: "#253347" }}>
                        <button onClick={() => setRightTab("review")}
                            className="flex-1 py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            style={rightTab === "review"
                                ? { color: "#00bfa5", borderBottom: "2px solid #00bfa5" }
                                : { color: "#4a6788", borderBottom: "2px solid transparent" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>fact_check</span>
                            Đánh giá ({currentAnnotations.length})
                        </button>
                        <button onClick={() => setRightTab("summary")}
                            className="flex-1 py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            style={rightTab === "summary"
                                ? { color: "#00bfa5", borderBottom: "2px solid #00bfa5" }
                                : { color: "#4a6788", borderBottom: "2px solid transparent" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>analytics</span>
                            Tổng kết
                        </button>
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto">
                        {rightTab === "review" ? (
                            /* ─── Đánh giá tab ─── */
                            <div className="p-3 space-y-2">
                                {itemAnnoLoading && (
                                    <div className="flex items-center justify-center py-8 gap-2 opacity-50">
                                        <span className="material-symbols-outlined animate-spin"
                                            style={{ fontSize: 20, color: "#3a5068" }}>progress_activity</span>
                                        <span className="text-xs" style={{ color: "#3a5068" }}>Đang tải...</span>
                                    </div>
                                )}

                                {!itemAnnoLoading && currentAnnotations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-30">
                                        <span className="material-symbols-outlined"
                                            style={{ fontSize: 32, color: "#3a5068" }}>label_off</span>
                                        <p className="text-xs" style={{ color: "#3a5068" }}>Không có annotation</p>
                                    </div>
                                )}

                                {!itemAnnoLoading && currentAnnotations.map((anno) => {
                                    const isRejecting = rejectingAnnoId === anno.reviewingId;
                                    const group = annotationGroups.find(g => g.beReviewingIds?.includes(anno.reviewingId));
                                    const gKey = group?.groupKey || `solo_${anno.reviewingId}`;
                                    const isHighlighted = selectedGroupKey === gKey;
                                    const isPending = !anno.status || anno.status === "PENDING";
                                    const isApproved = anno.status === "APPROVED";

                                    return (
                                        <div key={anno.reviewingId}
                                            className="rounded-lg border transition-all cursor-pointer"
                                            style={{
                                                background: isHighlighted ? "#1e3a4a" : "#1e2f42",
                                                borderColor: isHighlighted ? "#00bfa5" : "#253347",
                                                padding: "10px 12px",
                                            }}
                                            onClick={() => setSelectedGroupKey(isHighlighted ? null : gKey)}>

                                            {/* Header: color dot + label name + status */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ background: anno.colorCode || "#6b7280" }} />
                                                    <span className="text-sm font-medium truncate"
                                                        style={{ color: "#e2e8f0" }}>
                                                        {anno.labelName || `Label #${anno.labelId}`}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1"
                                                    style={{
                                                        background: isApproved ? "rgba(0,191,165,0.1)"
                                                            : anno.status === "REJECTED" ? "rgba(248,113,113,0.1)"
                                                                : "rgba(250,204,21,0.1)",
                                                        color: isApproved ? "#00bfa5"
                                                            : anno.status === "REJECTED" ? "#f87171"
                                                                : "#facc15",
                                                    }}>
                                                    {anno.status || "PENDING"}
                                                </span>
                                            </div>

                                            {/* Meta info */}
                                            <div className="flex items-center gap-2 text-[10px] mb-2"
                                                style={{ color: "#4a6788" }}>
                                                <span className="uppercase">{anno.labelType || "BBOX"}</span>
                                                {anno.policyName && (
                                                    <span style={{ color: "#f87171" }} className="truncate">● {anno.policyName}</span>
                                                )}
                                                {anno.isImproved && anno.status !== "APPROVED" && (
                                                    <span style={{ color: "#60a5fa" }}>↺ Đã sửa</span>
                                                )}
                                            </div>

                                            {/* Action buttons (PENDING only) */}
                                            {isPending && (
                                                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => handleApprove(anno.reviewingId)}
                                                        disabled={reviewSubmitting || !canReviewCurrentImage}
                                                        title={isFinalizedAssignment
                                                            ? `Assignment đã ở trạng thái cuối ${assignmentStatus}`
                                                            : !canReviewCurrentImage
                                                                ? "Không thể đánh giá khi ảnh hiện tại tải thất bại"
                                                                : undefined}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition"
                                                        style={{
                                                            background: "rgba(0,191,165,0.1)",
                                                            color: "#00bfa5",
                                                            border: "1px solid rgba(0,191,165,0.2)",
                                                        }}>
                                                        {reviewSubmitting
                                                            ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                            : <span className="material-symbols-outlined text-sm">check</span>}
                                                        Chấp nhận
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setRejectingAnnoId(isRejecting ? null : anno.reviewingId);
                                                            setSelectedPolicyId(null);
                                                            setRejectNote("");
                                                        }}
                                                        disabled={reviewSubmitting || policies.length === 0 || !canReviewCurrentImage}
                                                        title={
                                                            isFinalizedAssignment
                                                                ? `Assignment đã ở trạng thái cuối ${assignmentStatus}`
                                                                : !canReviewCurrentImage
                                                                ? "Không thể đánh giá khi ảnh hiện tại tải thất bại"
                                                                : policies.length === 0
                                                                    ? "Chưa có policy được cấu hình"
                                                                    : "Từ chối annotation này"
                                                        }
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition disabled:opacity-40"
                                                        style={{
                                                            background: "rgba(248,113,113,0.1)",
                                                            color: "#f87171",
                                                            border: "1px solid rgba(248,113,113,0.2)",
                                                        }}>
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                        Từ chối
                                                    </button>
                                                </div>
                                            )}

                                            {/* Inline reject form */}
                                            {isRejecting && (
                                                <div className="mt-2 p-2 rounded-lg space-y-2"
                                                    style={{
                                                        background: "rgba(248,113,113,0.05)",
                                                        border: "1px solid rgba(248,113,113,0.2)",
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}>
                                                    <p className="text-[10px] font-bold uppercase"
                                                        style={{ color: "#f87171" }}>Chọn lỗi vi phạm</p>
                                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                                        {policies.map(p => (
                                                            <button key={p.policyId}
                                                                onClick={() => setSelectedPolicyId(p.policyId)}
                                                                className="w-full text-left px-2 py-1.5 rounded text-xs border transition"
                                                                style={{
                                                                    background: selectedPolicyId === p.policyId ? "rgba(248,113,113,0.1)" : "transparent",
                                                                    color: selectedPolicyId === p.policyId ? "#f87171" : "#64748b",
                                                                    borderColor: selectedPolicyId === p.policyId ? "#f87171" : "#253347",
                                                                }}>
                                                                <span className="font-medium">{p.errorName}</span>
                                                                {p.errorLevel && <span className="ml-2 opacity-50">({p.errorLevel})</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase mb-1"
                                                            style={{ color: "#f87171" }}>Lý do từ chối</p>
                                                        <textarea value={rejectNote}
                                                            onChange={(e) => setRejectNote(e.target.value)}
                                                            placeholder="Ghi chú lý do (không bắt buộc)..."
                                                            rows={2}
                                                            className="w-full px-2 py-1.5 rounded text-xs resize-none focus:outline-none"
                                                            style={{
                                                                background: "#131c2e",
                                                                border: "1px solid #253347",
                                                                color: "#e2e8f0",
                                                            }} />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setRejectingAnnoId(null); setRejectNote(""); }}
                                                            className="flex-1 px-2 py-1 rounded text-xs transition hover:bg-white/5"
                                                            style={{ color: "#64748b", border: "1px solid #253347" }}>
                                                            Hủy
                                                        </button>
                                                        <button onClick={() => handleReject(anno.reviewingId)}
                                                            disabled={!selectedPolicyId || reviewSubmitting || isFinalizedAssignment}
                                                            className="flex-1 px-2 py-1 rounded text-xs font-bold transition disabled:opacity-40"
                                                            style={{
                                                                background: selectedPolicyId ? "#f87171" : "#253347",
                                                                color: selectedPolicyId ? "#fff" : "#4a6788",
                                                                cursor: selectedPolicyId ? "pointer" : "not-allowed",
                                                            }}>
                                                            {reviewSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : rightTab === "summary" ? (
                            /* ─── Tổng kết tab ─── */
                            <ReviewSummaryPanel
                                items={items}
                                annoCache={annoCache}
                                allLabels={allLabels}
                                reviewStats={reviewStats}
                                currentItemIndex={currentItemIndex}
                                setCurrentItemIndex={setCurrentItemIndex}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Review Summary Panel (Tổng kết tab) ── */
function ReviewSummaryPanel({ items, annoCache, allLabels, reviewStats, currentItemIndex, setCurrentItemIndex }) {

    /* Build per-label stats across all cached annotations */
    const labelStats = React.useMemo(() => {
        const map = new Map();
        Object.values(annoCache).flat().forEach((ann) => {
            if (!ann.labelId) return;
            if (!map.has(ann.labelId)) {
                map.set(ann.labelId, {
                    labelId: ann.labelId,
                    labelName: ann.labelName || `Label #${ann.labelId}`,
                    colorCode: ann.colorCode || "#6b7280",
                    total: 0,
                    approved: 0,
                    rejected: 0,
                    pending: 0,
                });
            }
            const e = map.get(ann.labelId);
            e.total++;
            if (ann.status === "APPROVED") e.approved++;
            else if (ann.status === "REJECTED") e.rejected++;
            else e.pending++;
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [annoCache]);

    const statCard = (label, value, color) => (
        <div className="flex flex-col items-center justify-center rounded-lg p-3"
            style={{ background: "#1e2f42", border: "1px solid #253347" }}>
            <span className="text-xl font-bold tabular-nums" style={{ color }}>{value}</span>
            <span className="text-[10px] mt-0.5" style={{ color: "#4a6788" }}>{label}</span>
        </div>
    );

    return (
        <div className="p-3 space-y-4">
            {/* Overall stats */}
            <div>
                <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "#4a6788" }}>Tổng quan</p>
                <div className="grid grid-cols-3 gap-2">
                    {statCard("Chấp nhận", reviewStats.approved, "#00bfa5")}
                    {statCard("Từ chối", reviewStats.rejected, "#f87171")}
                    {statCard("Chờ duyệt", reviewStats.pending, "#facc15")}
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#253347" }}>
                        <div className="h-full rounded-full transition-all"
                            style={{
                                width: reviewStats.total > 0
                                    ? `${(reviewStats.reviewed / reviewStats.total) * 100}%`
                                    : "0%",
                                background: "#00bfa5",
                            }} />
                    </div>
                    <span className="text-[10px] font-mono shrink-0" style={{ color: "#64748b" }}>
                        {reviewStats.reviewed}/{reviewStats.total}
                    </span>
                </div>
            </div>

            {/* Per-item breakdown */}
            <div>
                <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "#4a6788" }}>
                    Theo ảnh ({items.length})
                </p>
                <div className="space-y-1">
                    {items.map((item, idx) => {
                        const annos = annoCache[item.itemId] ?? [];
                        const approved = annos.filter(a => a.status === "APPROVED").length;
                        const rejected = annos.filter(a => a.status === "REJECTED").length;
                        const pending = annos.filter(a => !a.status || a.status === "PENDING").length;
                        const isActive = idx === currentItemIndex;
                        return (
                            <button key={item.itemId}
                                onClick={() => setCurrentItemIndex(idx)}
                                className="w-full text-left px-2 py-1.5 rounded transition-colors"
                                style={{
                                    background: isActive ? "rgba(0,191,165,0.1)" : "transparent",
                                    border: `1px solid ${isActive ? "#00bfa5" : "#253347"}`,
                                }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium" style={{ color: isActive ? "#00bfa5" : "#94a3b8" }}>
                                        Ảnh {idx + 1}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] font-mono">
                                        {approved > 0 && <span style={{ color: "#00bfa5" }}>A{approved}</span>}
                                        {rejected > 0 && <span style={{ color: "#f87171" }}>R{rejected}</span>}
                                        {pending > 0 && <span style={{ color: "#facc15" }}>P{pending}</span>}
                                        {annos.length === 0 && <span style={{ color: "#3a5068" }}>—</span>}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Per-label breakdown */}
            {labelStats.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "#4a6788" }}>
                        Theo nhãn ({labelStats.length})
                    </p>
                    <div className="space-y-1.5">
                        {labelStats.map((ls) => (
                            <div key={ls.labelId} className="px-2 py-1.5 rounded"
                                style={{ background: "#1e2f42", border: "1px solid #253347" }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ background: ls.colorCode }} />
                                    <span className="text-xs font-medium truncate flex-1"
                                        style={{ color: "#e2e8f0" }}>{ls.labelName}</span>
                                    <span className="text-[10px] font-mono" style={{ color: "#64748b" }}>
                                        {ls.total}
                                    </span>
                                </div>
                                <div className="flex gap-2 text-[10px] pl-4">
                                    {ls.approved > 0 && <span style={{ color: "#00bfa5" }}>A{ls.approved}</span>}
                                    {ls.rejected > 0 && <span style={{ color: "#f87171" }}>R{ls.rejected}</span>}
                                    {ls.pending > 0 && <span style={{ color: "#facc15" }}>P{ls.pending}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


