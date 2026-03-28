import * as React from "react";

/**
 * LabelSummaryPanel — Tổng hợp tất cả nhãn đã gán trên toàn bộ assignment.
 *
 * Props:
 *   workspace        — full workspace object từ API (workspace.items[i].annotations là BE data)
 *   currentItem      — item đang xem (itemId)
 *   liveAnnotations  — anno.annotations (AnnotationGroup[]) — live state cho item hiện tại
 *   allLabels        — flat label list [{ id, name, color, type }]
 */
export default function LabelSummaryPanel({ workspace, currentItem, liveAnnotations, allLabels }) {

    /* ─── Tính tổng hợp ─────────────────────────────────────────────────── */
    const { summary, totalAnnotations, annotatedImageCount, totalImages } = React.useMemo(() => {
        if (!workspace) return { summary: [], totalAnnotations: 0, annotatedImageCount: 0, totalImages: 0 };

        // map: labelId → { labelId, labelName, colorCode, labelType, shapeCount, imageIds: Set }
        const map = new Map();

        const addEntry = (labelId, labelName, colorCode, labelType, itemId) => {
            if (!labelId) return;
            if (!map.has(labelId)) {
                map.set(labelId, {
                    labelId,
                    labelName: labelName || "Unknown",
                    colorCode: colorCode || "#6b7280",
                    labelType: labelType || "",
                    shapeCount: 0,
                    imageIds: new Set(),
                });
            }
            const e = map.get(labelId);
            e.shapeCount++;
            e.imageIds.add(itemId);
        };

        let annotatedCount = 0;

        (workspace.items || []).forEach((item) => {
            const isCurrentItem = item.itemId === currentItem?.itemId;

            if (isCurrentItem) {
                // For current item: prioritize liveAnnotations, fallback to BE annotations
                const annotationsToUse = (liveAnnotations && liveAnnotations.length > 0) ? liveAnnotations : (item.annotations || []);
                
                if (annotationsToUse.length > 0) {
                    annotatedCount++;
                    
                    if (liveAnnotations && liveAnnotations.length > 0) {
                        // Use live annotations (AnnotationGroup format)
                        liveAnnotations.forEach((group) => {
                            group.labelIds?.forEach((lid, idx) => {
                                const lname = group.labelNames?.[idx] || "";
                                const lcolor = group.colorCodes?.[idx] || "#6b7280";
                                const labelMeta = allLabels?.find((l) => String(l.id) === String(lid));
                                const ltype = labelMeta?.type || "";
                                addEntry(lid, lname, lcolor, ltype, item.itemId);
                            });
                        });
                    } else {
                        // Use BE annotations
                        (item.annotations || []).forEach((ann) => {
                            addEntry(ann.labelId, ann.labelName, ann.colorCode, ann.labelType, item.itemId);
                        });
                    }
                }
            } else {
                // For other items: use BE annotations only
                const beAnnotations = item.annotations || [];
                if (beAnnotations.length > 0) {
                    annotatedCount++;
                    beAnnotations.forEach((ann) => {
                        addEntry(ann.labelId, ann.labelName, ann.colorCode, ann.labelType, item.itemId);
                    });
                }
            }
        });

        const entries = Array.from(map.values())
            .map((e) => ({ ...e, imageCount: e.imageIds.size }))
            .sort((a, b) => b.shapeCount - a.shapeCount);

        const total = entries.reduce((s, e) => s + e.shapeCount, 0);

        return {
            summary: entries,
            totalAnnotations: total,
            annotatedImageCount: annotatedCount,
            totalImages: workspace.items?.length || 0,
        };
    }, [workspace, currentItem?.itemId, liveAnnotations, allLabels]);

    const unannotatedCount = totalImages - annotatedImageCount;
    const coveragePct = totalImages > 0 ? Math.round((annotatedImageCount / totalImages) * 100) : 0;

    return (
        <div className="p-3 space-y-3 overflow-y-auto">

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2.5 text-center" style={{ background: "#0e1621", border: "1px solid #1e2f42" }}>
                    <div className="text-xl font-bold tabular-nums" style={{ color: "#00bfa5" }}>
                        {totalAnnotations}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#4a6788" }}>Tổng số vùng gán</div>
                </div>
                <div className="rounded-lg p-2.5 text-center" style={{ background: "#0e1621", border: "1px solid #1e2f42" }}>
                    <div className="text-xl font-bold tabular-nums" style={{ color: "#7dd3fc" }}>
                        {summary.length}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#4a6788" }}>Loại nhãn</div>
                </div>
            </div>

            {/* ── Image coverage bar ── */}
            <div className="rounded-lg p-2.5" style={{ background: "#0e1621", border: "1px solid #1e2f42" }}>
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#4a6788" }}>
                        Phủ ảnh
                    </span>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: "#00bfa5" }}>
                        {annotatedImageCount}/{totalImages}
                    </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#1e2f42" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${coveragePct}%`, background: "#00bfa5" }}
                    />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px]" style={{ color: "#00bfa5" }}>
                        {annotatedImageCount} đã gán
                    </span>
                    <span className="text-[9px]" style={{ color: "#4a6788" }}>
                        {unannotatedCount} chưa gán
                    </span>
                </div>
            </div>

            {/* ── Per-label table ── */}
            <div>
                {/* Table header */}
                <div
                    className="flex items-center px-2 py-1.5 rounded-t"
                    style={{ background: "#0e1621", borderBottom: "1px solid #1e2f42" }}
                >
                    <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#4a6788" }}>
                        Nhãn
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide w-14 text-center" style={{ color: "#4a6788" }}>
                        Shapes
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide w-14 text-center" style={{ color: "#4a6788" }}>
                        Ảnh
                    </span>
                </div>

                {/* Table rows */}
                <div className="rounded-b overflow-hidden" style={{ border: "1px solid #1e2f42", borderTop: "none" }}>
                    {summary.length > 0 ? (
                        summary.map((entry, idx) => (
                            <div
                                key={entry.labelId}
                                className="flex items-center px-2 py-2 gap-2 transition-colors hover:bg-white/5"
                                style={{
                                    borderBottom: idx < summary.length - 1 ? "1px solid #1a2637" : "none",
                                    background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.15)",
                                }}
                            >
                                {/* Color dot */}
                                <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ background: entry.colorCode }}
                                />

                                {/* Label name + type */}
                                <div className="flex-1 min-w-0">
                                    <div
                                        className="text-xs font-medium truncate"
                                        style={{ color: "#cbd5e1" }}
                                        title={entry.labelName}
                                    >
                                        {entry.labelName}
                                    </div>
                                    {entry.labelType && (
                                        <div className="text-[9px] uppercase" style={{ color: "#4a6788" }}>
                                            {entry.labelType}
                                        </div>
                                    )}
                                </div>

                                {/* Shape count */}
                                <span
                                    className="text-xs font-bold tabular-nums w-14 text-center"
                                    style={{ color: "#00bfa5" }}
                                >
                                    {entry.shapeCount}
                                </span>

                                {/* Image count */}
                                <span
                                    className="text-xs tabular-nums w-14 text-center"
                                    style={{ color: "#94a3b8" }}
                                >
                                    {entry.imageCount}/{totalImages}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center py-4">
                            <p className="text-[10px] text-center" style={{ color: "#4a6788" }}>
                                Chưa có nhãn trên ảnh này
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Legend note ── */}
            <p className="text-[9px] text-center pt-1" style={{ color: "#2a3f55" }}>
                * Bao gồm thay đổi hiện tại chưa lưu
            </p>
        </div>
    );
}


