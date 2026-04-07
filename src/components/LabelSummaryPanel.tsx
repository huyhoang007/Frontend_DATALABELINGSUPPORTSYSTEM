import * as React from "react";
import { useTranslation } from "react-i18next";

interface Annotation {
  labelId: string | number;
  labelName?: string;
  colorCode?: string;
  labelType?: string;
}

interface AnnotationGroup {
  labelIds?: (string | number)[];
  labelNames?: string[];
  colorCodes?: string[];
}

interface WorkspaceItem {
  itemId: string | number;
  annotations?: Annotation[];
}

interface Workspace {
  items?: WorkspaceItem[];
}

interface LabelMeta {
  id: string | number;
  type?: string;
}

interface LabelSummaryPanelProps {
  workspace: Workspace | null;
  currentItem?: WorkspaceItem | null;
  liveAnnotations?: AnnotationGroup[];
  allLabels?: LabelMeta[];
}

export default function LabelSummaryPanel({
  workspace,
  currentItem,
  liveAnnotations,
  allLabels,
}: LabelSummaryPanelProps) {
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

      const addEntry = (labelId: string | number, labelName: string, colorCode: string, labelType: string, itemId: string | number) => {
        if (!labelId) return;
        if (!map.has(labelId)) {
          map.set(labelId, {
            labelId,
            labelName: labelName || "Không rõ",
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

      (workspace.items || []).forEach((item: WorkspaceItem) => {
        const isCurrentItem = item.itemId === currentItem?.itemId;

        if (isCurrentItem) {
          const annotationsToUse =
            liveAnnotations && liveAnnotations.length > 0
              ? liveAnnotations
              : item.annotations || [];

          if (annotationsToUse.length > 0) {
            annotatedCount++;

            if (liveAnnotations && liveAnnotations.length > 0) {
              liveAnnotations.forEach((group: AnnotationGroup) => {
                group.labelIds?.forEach((labelId: string | number, index: number) => {
                  const labelName = group.labelNames?.[index] || "";
                  const labelColor = group.colorCodes?.[index] || "#6b7280";
                  const labelMeta = allLabels?.find(
                    (label: LabelMeta) => String(label.id) === String(labelId),
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
              (item.annotations || []).forEach((annotation: Annotation) => {
                addEntry(
                  annotation.labelId,
                  annotation.labelName || "",
                  annotation.colorCode || "#6b7280",
                  annotation.labelType || "",
                  item.itemId,
                );
              });
            }
          }
        } else {
          const backendAnnotations = item.annotations || [];
          if (backendAnnotations.length > 0) {
            annotatedCount++;
            backendAnnotations.forEach((annotation: Annotation) => {
              addEntry(
                annotation.labelId,
                annotation.labelName || "",
                annotation.colorCode || "#6b7280",
                annotation.labelType || "",
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
    <div className="space-y-3 overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center">
          <div className="text-xl font-bold tabular-nums text-emerald-400">
            {totalAnnotations}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {t("workspace.summary.totalRegions")}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center">
          <div className="text-xl font-bold tabular-nums text-sky-300">
            {summary.length}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {t("workspace.summary.labelTypes")}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {t("workspace.summary.imageCoverage")}
          </span>
          <span className="text-[10px] font-bold tabular-nums text-emerald-400">
            {annotatedImageCount}/{totalImages}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${coveragePct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[9px] text-emerald-400">
            {t("workspace.summary.annotated", { count: annotatedImageCount })}
          </span>
          <span className="text-[9px] text-slate-500">
            {t("workspace.summary.unannotated", { count: unannotatedCount })}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center rounded-t bg-slate-950 px-2 py-1.5 border-b border-slate-800">
          <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {t("workspace.summary.label")}
          </span>
          <span className="w-14 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {t("workspace.summary.shapes")}
          </span>
          <span className="w-14 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {t("workspace.summary.images")}
          </span>
        </div>

        <div className="overflow-hidden rounded-b border border-slate-800 border-t-0">
          {summary.length > 0 ? (
            summary.map((entry, idx) => (
              <div
                key={entry.labelId}
                className={`flex items-center gap-2 px-2 py-2 transition-colors hover:bg-white/5 ${
                  idx % 2 === 0 ? "bg-transparent" : "bg-black/15"
                } ${idx < summary.length - 1 ? "border-b border-slate-900" : ""}`}
              >
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: entry.colorCode }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-xs font-medium text-slate-300"
                    title={entry.labelName}
                  >
                    {entry.labelName}
                  </div>
                  {entry.labelType && (
                    <div className="text-[9px] uppercase text-slate-500">
                      {entry.labelType}
                    </div>
                  )}
                </div>
                <span className="w-14 text-center text-xs font-bold tabular-nums text-emerald-400">
                  {entry.shapeCount}
                </span>
                <span className="w-14 text-center text-xs tabular-nums text-slate-400">
                  {entry.imageCount}/{totalImages}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-4">
              <p className="text-center text-[10px] text-slate-500">
                {t("workspace.summary.empty")}
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="pt-1 text-center text-[9px] text-slate-700">
        {t("workspace.summary.unsavedHint")}
      </p>
    </div>
  );
}
