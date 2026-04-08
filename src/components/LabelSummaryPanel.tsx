import * as React from "react";
import { useTranslation } from "react-i18next";
import { SOURCE_FILES } from "../utils/sourceMeta";

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
  const { t, i18n } = useTranslation(["annotator"]);
  const [altPressed, setAltPressed] = React.useState(false);
  const [hoveredExplainKey, setHoveredExplainKey] = React.useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

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
  const isEnglish = i18n.language === "en";

  const explainers = React.useMemo(
    () => ({
      totalRegions: {
        title: isEnglish ? "Total annotated regions" : "Tổng số vùng gán",
        api: [
          "GET /api/assignments/:assignmentId/workspace",
          "GET /api/assignments/:assignmentId/items/:itemId/annotations",
        ],
        fields: [
          "workspace.items[].annotations",
          "current item liveAnnotations",
          "summary[].shapeCount",
        ],
        formula: isEnglish
          ? `FE groups labels by labelId, then sums summary[].shapeCount. Displayed value = ${totalAnnotations}.`
          : `FE gom theo labelId, rồi cộng toàn bộ summary[].shapeCount. Giá trị hiển thị = ${totalAnnotations}.`,
      },
      labelTypes: {
        title: isEnglish ? "Distinct label types in task" : "Số loại nhãn xuất hiện",
        api: [
          "GET /api/assignments/:assignmentId/workspace",
          "GET /api/assignments/:assignmentId/items/:itemId/annotations",
        ],
        fields: ["summary[]", "summary[].labelId"],
        formula: isEnglish
          ? `FE builds one summary row per labelId. Displayed value = summary.length = ${summary.length}.`
          : `FE tạo 1 dòng summary cho mỗi labelId. Giá trị hiển thị = summary.length = ${summary.length}.`,
      },
      imageCoverage: {
        title: isEnglish ? "Image coverage" : "Độ phủ ảnh",
        api: [
          "GET /api/assignments/:assignmentId/workspace",
          "GET /api/assignments/:assignmentId/items/:itemId/annotations",
        ],
        fields: [
          "workspace.items.length",
          "item.annotations",
          "current item liveAnnotations",
        ],
        formula: isEnglish
          ? `Annotated images = images with at least 1 annotation = ${annotatedImageCount}. Total images = ${totalImages}. Coverage percent = round(annotatedImageCount / totalImages * 100) = ${coveragePct}%.`
          : `Ảnh đã gán nhãn = số ảnh có ít nhất 1 annotation = ${annotatedImageCount}. Tổng ảnh = ${totalImages}. Phần trăm phủ = round(annotatedImageCount / totalImages * 100) = ${coveragePct}%.`,
      },
      labelTable: {
        title: isEnglish ? "Per-label summary table" : "Bảng thống kê theo nhãn",
        api: [
          "GET /api/assignments/:assignmentId/workspace",
          "GET /api/assignments/:assignmentId/items/:itemId/annotations",
        ],
        fields: [
          "annotation.labelId",
          "annotation.labelName",
          "summary[].shapeCount",
          "summary[].imageIds.size",
        ],
        formula: isEnglish
          ? "For each labelId, FE counts shapeCount = number of annotation occurrences, and imageCount = number of distinct itemIds containing that label."
          : "Với mỗi labelId, FE đếm shapeCount = số lần annotation xuất hiện, và imageCount = số itemId khác nhau có chứa nhãn đó.",
      },
    }),
    [annotatedImageCount, coveragePct, isEnglish, summary.length, totalAnnotations, totalImages],
  );

  const currentExplainer =
    hoveredExplainKey && explainers[hoveredExplainKey as keyof typeof explainers];
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Alt") return;
      setAltPressed(true);
      if (event.repeat || !currentExplainer) return;
      navigator.clipboard?.writeText([
        currentExplainer.title,
        currentExplainer.api.join(", "),
        currentExplainer.formula,
      ].join("\n")).catch(() => {});
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") setAltPressed(false);
    };
    const handleBlur = () => {
      setAltPressed(false);
      setHoveredExplainKey(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [currentExplainer]);
  const attachExplainProps = (key: keyof typeof explainers) => ({
    onMouseEnter: (event: React.MouseEvent) => {
      setHoveredExplainKey(key);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    },
    onMouseMove: (event: React.MouseEvent) => {
      setHoveredExplainKey(key);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    },
    onMouseLeave: () =>
      setHoveredExplainKey((current) => (current === key ? null : current)),
  });

  return (
    <div
      className="space-y-3 overflow-y-auto p-3"
      data-source-file={SOURCE_FILES.labelSummaryPanel}
      data-source-label="Annotation summary panel"
    >
      {altPressed && currentExplainer && (
        <div
          className="pointer-events-none fixed z-[120] max-w-md rounded-lg border border-sky-400/40 bg-slate-950/95 px-4 py-3 text-white shadow-2xl"
          style={{
            left: Math.min(tooltipPosition.x + 16, window.innerWidth - 380),
            top: Math.min(tooltipPosition.y + 16, window.innerHeight - 260),
          }}
        >
          <div className="space-y-1 text-xs leading-5 text-slate-200 whitespace-pre-line">
            <div className="font-semibold">{currentExplainer.title}</div>
            <div>{currentExplainer.api.join(", ")}</div>
            <div>{currentExplainer.formula}</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div
          {...attachExplainProps("totalRegions")}
          className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center"
        >
          <div className="text-xl font-bold tabular-nums text-emerald-400">
            {totalAnnotations}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {t("workspace.summary.totalRegions")}
          </div>
        </div>
        <div
          {...attachExplainProps("labelTypes")}
          className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center"
        >
          <div className="text-xl font-bold tabular-nums text-sky-300">
            {summary.length}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {t("workspace.summary.labelTypes")}
          </div>
        </div>
      </div>

      <div
        {...attachExplainProps("imageCoverage")}
        className="rounded-lg border border-slate-800 bg-slate-950 p-2.5"
      >
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

      <div {...attachExplainProps("labelTable")}>
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
                  style={{ backgroundColor: entry.colorCode }}
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
