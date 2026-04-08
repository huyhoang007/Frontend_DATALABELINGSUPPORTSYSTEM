import * as React from "react";
import { cn } from "../../utils/cn";
import { SOURCE_FILES } from "../../utils/sourceMeta";

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
  onRelabel,
  readOnly,
}) {
  // Filter by label if active
  const visibleAnnotations = React.useMemo(() => {
    if (!activeLabelFilterId) return annotations;
    return annotations.filter((a) => a.labelIds.includes(activeLabelFilterId));
  }, [annotations, activeLabelFilterId]);

  return (
    <div
      className="space-y-2"
      data-source-file={SOURCE_FILES.annotatorList}
      data-source-label="Annotator annotation list"
    >
      {visibleAnnotations.map((group, i) => {
        const isSelected = group.groupKey === selectedGroupKey;
        const icon = SHAPE_ICONS[group.shapeType] || "shape_line";
        const isApproved = group.reviewStatus === "APPROVED";
        const isRejected = group.reviewStatus === "REJECTED";

        return (
          <div
            key={group.groupKey}
            onClick={() => onSelect?.(group.groupKey)}
            className={cn(
              "p-3 rounded-lg border flex items-center group transition-all cursor-pointer",
              isApproved
                ? "bg-emerald-500/15 border-emerald-500/40"
                : isRejected
                  ? "bg-red-500/15 border-red-500/40"
                  : group.isHidden
                    ? "bg-slate-700/20 border-transparent opacity-60"
                    : isSelected
                      ? "bg-cyan-500/20 border-cyan-400/50 shadow-md"
                      : "bg-slate-700/30 border-slate-600 hover:border-cyan-400/50 hover:bg-slate-700/50",
            )}
          >
            {/* Status icon */}
            {isApproved && (
              <span
                className="material-symbols-outlined text-[14px] text-emerald-500 mr-1"
                title="Approved"
              >
                lock
              </span>
            )}
            {isRejected && (
              <span
                className="material-symbols-outlined text-[14px] text-red-500 mr-1"
                title="Rejected"
              >
                warning
              </span>
            )}

            {/* Index */}
            <span className="text-[10px] font-mono text-slate-400 w-6 opacity-70">
              #{i + 1}
            </span>

            {/* Shape icon */}
            <span className="material-symbols-outlined text-[16px] text-slate-300 mr-2">
              {icon}
            </span>

            {/* Labels */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1 flex-wrap mb-0.5">
                {group.labelIds.map((lid, j) => (
                  <span
                    key={lid}
                    className="inline-flex items-center gap-1.5 rounded border border-white/25 bg-white/10 px-2.5 py-1.5 text-[12px] font-bold text-white shadow-sm"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: group.colorCodes?.[j] || "#6b7280" }}
                    />
                    {group.labelNames?.[j] || "Unknown"}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 capitalize pl-0.5">
                {group.shapeType}
              </p>
              {isRejected && group.policyName && (
                <div className="mt-0.5">
                  <p className="text-[10px] text-red-300 pl-0.5">
                    ⚠ {group.policyName}
                  </p>
                  {group.note && (
                    <p className="text-[10px] text-amber-300 mt-1 pl-0.5">
                      💬 {group.note}
                    </p>
                  )}
                </div>
              )}
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
              {!readOnly && !isApproved && onRelabel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRelabel(group.groupKey);
                  }}
                  className="p-1 hover:bg-blue-500/10 rounded text-muted-foreground hover:text-blue-500 transition-colors"
                  title="Đổi label"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    label
                  </span>
                </button>
              )}
              {!readOnly && !isApproved && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(group.groupKey);
                  }}
                  className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-colors"
                  title="Xóa"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    delete
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      })}
      {visibleAnnotations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground/60">
          <span className="material-symbols-outlined text-3xl mb-2">draw</span>
          <p className="text-xs">No annotations on this item</p>
          <p className="text-[10px] mt-1">
            Use the tools above to start labeling
          </p>
        </div>
      )}
    </div>
  );
}
