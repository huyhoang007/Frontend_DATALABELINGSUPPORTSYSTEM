import * as React from "react";
import { cn } from "../../utils/cn";

const SHAPE_ICONS = {
    bbox: "crop_free",
    polygon: "pentagon",
    polyline: "polyline",
    points: "scatter_plot",
};

/**
 * Right-panel annotation list.
 * Shows annotation groups with multi-label display, hide/show, delete.
 */
export default function AnnotationList({
    annotations,
    allLabels,
    selectedGroupKey,
    activeLabelFilterId,
    onSelect,
    onDelete,
    onToggleHidden,
}) {
    // Filter by label if active
    const visibleAnnotations = React.useMemo(() => {
        if (!activeLabelFilterId) return annotations;
        return annotations.filter((a) => a.labelIds.includes(activeLabelFilterId));
    }, [annotations, activeLabelFilterId]);

    return (
        <div className="space-y-2">
            {visibleAnnotations.map((group, i) => {
                const isSelected = group.groupKey === selectedGroupKey;
                const icon = SHAPE_ICONS[group.shapeType] || "shape_line";

                return (
                    <div
                        key={group.groupKey}
                        onClick={() => onSelect?.(group.groupKey)}
                        className={cn(
                            "p-3 rounded-lg border flex items-center group transition-all cursor-pointer",
                            group.isHidden
                                ? "bg-muted/10 border-transparent opacity-60"
                                : isSelected
                                    ? "bg-annotator-primary/10 border-annotator-primary/30 shadow-sm"
                                    : "bg-muted/30 border-border hover:border-annotator-primary/30 hover:bg-muted/60"
                        )}
                    >
                        {/* Index */}
                        <span className="text-[10px] font-mono text-muted-foreground w-6 opacity-50">
                            #{i + 1}
                        </span>

                        {/* Shape icon */}
                        <span className="material-symbols-outlined text-[16px] text-muted-foreground mr-2">
                            {icon}
                        </span>

                        {/* Labels */}
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1 flex-wrap mb-0.5">
                                {group.labelIds.map((lid, j) => (
                                    <span
                                        key={lid}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                        style={{
                                            backgroundColor: `${group.colorCodes?.[j] || "#6b7280"}20`,
                                            color: group.colorCodes?.[j] || "#6b7280",
                                        }}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: group.colorCodes?.[j] || "#6b7280" }}
                                        />
                                        {group.labelNames?.[j] || "Unknown"}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground capitalize pl-0.5">
                                {group.shapeType}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleHidden?.(group.groupKey);
                                }}
                                className="p-1 hover:bg-background rounded hover:text-foreground text-muted-foreground transition-colors"
                                title={group.isHidden ? "Show" : "Hide"}
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    {group.isHidden ? "visibility_off" : "visibility"}
                                </span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(group.groupKey);
                                }}
                                className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-colors"
                                title="Xóa"
                            >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                        </div>
                    </div>
                );
            })}
            {visibleAnnotations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground/60">
                    <span className="material-symbols-outlined text-3xl mb-2">draw</span>
                    <p className="text-xs">No annotations on this item</p>
                    <p className="text-[10px] mt-1">Use the tools above to start labeling</p>
                </div>
            )}
        </div>
    );
}
