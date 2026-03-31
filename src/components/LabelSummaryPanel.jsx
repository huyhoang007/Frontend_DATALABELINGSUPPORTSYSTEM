import * as React from "react";
import { useTranslation } from "react-i18next";

/**
 * LabelSummaryPanel — assignment-level summary using current live annotations for
 * the active item and backend annotations for the remaining items.
 */
export default function LabelSummaryPanel({
  workspace,
  currentItem,
  liveAnnotations,
  allLabels,
}) {
  const { t } = useTranslation(["annotator"]);

  const { summary, totalAnnotations, annotatedImageCount, totalImages } =
    React.useMemo(() => {
      if (!workspace) {
        return {
          summary: [],
          totalAnnotations: 0,
          annotatedImageCount: 0,
          totalImages: 0,
        };
      }

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
        const entry = map.get(labelId);
        entry.shapeCount++;
        entry.imageIds.add(itemId);
      };

      let annotatedCount = 0;

      (workspace.items || []).forEach((item) => {
        const isCurrentItem = item.itemId === currentItem?.itemId;

        if (isCurrentItem) {
          const annotationsToUse =
            liveAnnotations && liveAnnotations.length > 0
              ? liveAnnotations
              : item.annotations || [];

          if (annotationsToUse.length > 0) {
            annotatedCount++;

            if (liveAnnotations && liveAnnotations.length > 0) {
              liveAnnotations.forEach((group) => {
                group.labelIds?.forEach((labelId, index) => {
                  const labelName = group.labelNames?.[index] || "";
                  const labelColor = group.colorCodes?.[index] || "#6b7280";
                  const labelMeta = allLabels?.find(
                    (label) => String(label.id) === String(labelId),
                  );
                  addEntry(
                    labelId,
                    labelName,
                    labelColor,
                    labelMeta?.type || "",
                    item.itemId,
                  );
                });
              });
            } else {
              (item.annotations || []).forEach((annotation) => {
                addEntry(
                  annotation.labelId,
                  annotation.labelName,
                  annotation.colorCode,
                  annotation.labelType,
                  item.itemId,
                );
              });
            }
          }
        } else {
          const backendAnnotations = item.annotations || [];
          if (backendAnnotations.length > 0) {
            annotatedCount++;
            backendAnnotations.forEach((annotation) => {
              addEntry(
                annotation.labelId,
                annotation.labelName,
                annotation.colorCode,
                annotation.labelType,
                item.itemId,
              );
            });
          }
        }
      });

      const entries = Array.from(map.values())
        .map((entry) => ({ ...entry, imageCount: entry.imageIds.size }))
        .sort((a, b) => b.shapeCount - a.shapeCount);

      return {
        summary: entries,
        totalAnnotations: entries.reduce(
          (sum, entry) => sum + entry.shapeCount,
          0,
        ),
        annotatedImageCount: annotatedCount,
        totalImages: workspace.items?.length || 0,
      };
    }, [workspace, currentItem?.itemId, liveAnnotations, allLabels]);

  const unannotatedCount = totalImages - annotatedImageCount;
  const coveragePct =
    totalImages > 0
      ? Math.round((annotatedImageCount / totalImages) * 100)
      : 0;

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-lg p-2.5 text-center"
          style={{ background: "#0e1621", border: "1px solid #1e2f42" }}
        >
          <div
            className="text-xl font-bold tabular-nums"
            style={{ color: "#00bfa5" }}
          >
            {totalAnnotations}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "#4a6788" }}>
            {t("workspace.summary.totalRegions")}
          </div>
        </div>
        <div
          className="rounded-lg p-2.5 text-center"
          style={{ background: "#0e1621", border: "1px solid #1e2f42" }}
        >
          <div
            className="text-xl font-bold tabular-nums"
            style={{ color: "#7dd3fc" }}
          >
            {summary.length}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "#4a6788" }}>
            {t("workspace.summary.labelTypes")}
          </div>
        </div>
      </div>

      <div
        className="rounded-lg p-2.5"
        style={{ background: "#0e1621", border: "1px solid #1e2f42" }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "#4a6788" }}
          >
            {t("workspace.summary.imageCoverage")}
          </span>
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: "#00bfa5" }}
          >
            {annotatedImageCount}/{totalImages}
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: "#1e2f42" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${coveragePct}%`, background: "#00bfa5" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px]" style={{ color: "#00bfa5" }}>
            {t("workspace.summary.annotated", { count: annotatedImageCount })}
          </span>
          <span className="text-[9px]" style={{ color: "#4a6788" }}>
            {t("workspace.summary.unannotated", { count: unannotatedCount })}
          </span>
        </div>
      </div>

      <div>
        <div
          className="flex items-center px-2 py-1.5 rounded-t"
          style={{ background: "#0e1621", borderBottom: "1px solid #1e2f42" }}
        >
          <span
            className="flex-1 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "#4a6788" }}
          >
            {t("workspace.summary.label")}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wide w-14 text-center"
            style={{ color: "#4a6788" }}
          >
            {t("workspace.summary.shapes")}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wide w-14 text-center"
            style={{ color: "#4a6788" }}
          >
            {t("workspace.summary.images")}
          </span>
        </div>

        <div
          className="rounded-b overflow-hidden"
          style={{ border: "1px solid #1e2f42", borderTop: "none" }}
        >
          {summary.length > 0 ? (
            summary.map((entry, idx) => (
              <div
                key={entry.labelId}
                className="flex items-center px-2 py-2 gap-2 transition-colors hover:bg-white/5"
                style={{
                  borderBottom:
                    idx < summary.length - 1 ? "1px solid #1a2637" : "none",
                  background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.15)",
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: entry.colorCode }}
                />
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
                <span
                  className="text-xs font-bold tabular-nums w-14 text-center"
                  style={{ color: "#00bfa5" }}
                >
                  {entry.shapeCount}
                </span>
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
                {t("workspace.summary.empty")}
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-[9px] text-center pt-1" style={{ color: "#2a3f55" }}>
        {t("workspace.summary.unsavedHint")}
      </p>
    </div>
  );
}
