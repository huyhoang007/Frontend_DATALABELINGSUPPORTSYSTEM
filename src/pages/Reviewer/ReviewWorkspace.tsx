import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../../context/ToastContext";
import apiClient from "../../api/apiClient";
import { isFeatureEnabled } from "../../config/featureFlags";
import { getCachedBlobUrl } from "../../utils/blobAssetCache";
import useReviewWorkspace from "./useReviewWorkspace";
import AnnotationOverlay from "../Annotator/AnnotationOverlay";
import { groupAnnotationsByKey } from "../Annotator/geometryUtils";
import { translateAssignmentStatus } from "../../i18n/helpers";
import { SOURCE_FILES } from "../../utils/sourceMeta";

/* ── Domain interfaces ── */
interface LabelInfo {
  labelId?: number | string;
  id?: number | string;
  labelName?: string;
  name?: string;
  colorCode?: string;
  color?: string;
  labelType?: string;
  type?: string;
}

interface LabelGroup {
  labels?: LabelInfo[];
}

interface WorkspaceItem {
  itemId: number;
  fileUrl?: string;
  fileName?: string;
  width?: number;
  height?: number;
  status?: string;
  annotations?: Annotation[];
}

interface WorkspaceData {
  items?: WorkspaceItem[];
  labelGroups?: LabelGroup[];
  assignmentStatus?: string;
  projectName?: string;
  projectGuidelineContent?: string;
  projectGuidelineFileUrl?: string;
  projectId?: number;
}

interface Annotation {
  reviewingId: number;
  status?: string;
  policyId?: number | null;
  policyName?: string;
  errorName?: string;
  errorLevel?: string;
  geometry?: unknown;
  labels?: unknown[];
  labelId?: number;
  labelName?: string;
  colorCode?: string;
  labelType?: string;
  note?: string;
  isImproved?: boolean;
}

interface Policy {
  policyId: number;
  errorName: string;
  errorLevel?: string;
}

interface ReviewStats {
  total: number;
  reviewed: number;
  approved: number;
  rejected: number;
  pending: number;
  allDone: boolean;
  anyRejected: boolean;
}

interface ItemStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

interface FlatLabel {
  id: number;
  name: string;
  color: string;
  type: string;
}

/* ── Resolve fileUrl → proxy path ── */
function resolveImagePath(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;
  let url = fileUrl;
  if (!url.startsWith("/uploads")) {
    url = `/uploads${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
}

function isAwaitingRereview(annotation: Annotation | null | undefined): boolean {
  return annotation?.status === "REJECTED" && annotation?.isImproved === true;
}

function getPendingReviewCount(annotations: Annotation[] = []): number {
  return annotations.filter(
    (annotation) =>
      !annotation?.status ||
      annotation.status === "PENDING" ||
      isAwaitingRereview(annotation),
  ).length;
}

function getRejectedReviewCount(annotations: Annotation[] = []): number {
  return annotations.filter(
    (annotation) =>
      annotation?.status === "REJECTED" && !isAwaitingRereview(annotation),
  ).length;
}

/* ── Authenticated thumbnail component ── */
function ThumbnailImg({ fileUrl, alt }: { fileUrl?: string; alt: string }) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement & HTMLImageElement>(null);
  const workspaceCacheEnabled = isFeatureEnabled("perf_workspace_safe_cache");
  const imageLazyLoadEnabled = isFeatureEnabled("perf_image_lazyload");

  React.useEffect(() => {
    if (!imageLazyLoadEnabled) {
      setIsVisible(true);
      return;
    }
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [imageLazyLoadEnabled]);

  React.useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;
    if (!fileUrl || !isVisible) return;
    const path = resolveImagePath(fileUrl);
    if (!path) return;
    (async () => {
      try {
        const nextSrc = workspaceCacheEnabled
          ? await getCachedBlobUrl(path)
          : await apiClient.get(path, {
              responseType: "blob",
              transformResponse: [(d: unknown) => d],
            }).then((res: { data: unknown }) => {
              const data = res.data ?? res;
              const blob = data instanceof Blob ? data : new Blob([data as BlobPart]);
              blobUrl = URL.createObjectURL(blob);
              return blobUrl;
            });
        if (cancelled) return;
        setSrc(nextSrc);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
      if (!workspaceCacheEnabled && blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [fileUrl, isVisible, workspaceCacheEnabled]);

  if (!src)
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center bg-[#0e1621]"
      >
        <span className="material-symbols-outlined text-[24px] text-[#3a5068]">
          image
        </span>
      </div>
    );
  return (
    <img
      ref={containerRef}
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      draggable={false}
    />
  );
}

/* ── Route guard ── */
export default function ReviewWorkspace() {
  const { t } = useTranslation(["reviewer", "common"]);
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const assignmentIdNum = Number(assignmentId);
  if (!assignmentId || isNaN(assignmentIdNum)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#131c2e] text-slate-200">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <h2 className="text-xl font-bold">
          {t("reviewer:workspace.invalidAssignment")}
        </h2>
        <p className="text-slate-500">
          {t("reviewer:workspace.invalidAssignmentDescription", {
            id: assignmentId,
          })}
        </p>
        <button
          onClick={() => navigate("/reviewer/queue")}
          className="rounded bg-[#1e2f42] px-4 py-2 text-sm font-medium text-slate-200 transition hover:opacity-80"
        >
          {t("common:actions.backToList")}
        </button>
      </div>
    );
  }
  return <ReviewWorkspaceInner assignmentIdNum={assignmentIdNum} />;
}

/* ── Main workspace ── */
function ReviewWorkspaceInner({ assignmentIdNum }: { assignmentIdNum: number }) {
  const navigate = useNavigate();
  const { t } = useTranslation(["reviewer", "common"]);
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

  /* Cast JS hook return values to typed interfaces */
  const ws = workspace as WorkspaceData | null;
  const typedItems = items as WorkspaceItem[];
  const typedCurrentItem = currentItem as WorkspaceItem | null;
  const typedCurrentAnnotations = currentAnnotations as Annotation[];
  const typedPolicies = policies as Policy[];
  const typedReviewStats = reviewStats as ReviewStats;
  const typedAnnoCache = annoCache as Record<number, Annotation[]>;
  const typedGetItemStats = getItemStats as (itemId: number) => ItemStats;

  /* ── UI local state ── */
  const [selectedGroupKey, setSelectedGroupKey] = React.useState<string | null>(null);
  const [rejectingAnnoId, setRejectingAnnoId] = React.useState<number | null>(null);
  const [confirmingApproveId, setConfirmingApproveId] = React.useState<number | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = React.useState<number | null>(null);
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
    setConfirmingApproveId(null);
    setSelectedPolicyId(null);
    setRejectNote("");
  }, [currentItemIndex]);

  /* ── Annotation groups for read-only canvas overlay ── */
  const annotationGroups = React.useMemo(
    () => groupAnnotationsByKey(typedCurrentAnnotations),
    [typedCurrentAnnotations],
  );

  /* ── Navigation ── */
  const handleNavigate = (dir: string) => {
    const n = typedItems.length;
    let newIdx = currentItemIndex;
    if (dir === "first") newIdx = 0;
    if (dir === "prev") newIdx = Math.max(0, currentItemIndex - 1);
    if (dir === "next") newIdx = Math.min(n - 1, currentItemIndex + 1);
    if (dir === "last") newIdx = n - 1;
    if (newIdx !== currentItemIndex) setCurrentItemIndex(newIdx);
  };

  /* ── Review handlers ── */
  const handleApprove = async (reviewingId: number) => {
    const result = await handleReviewAnnotation(reviewingId, false, null);
    if (result.success) {
      // Clear any inline reject UI tied to the annotation once it is approved.
      if (rejectingAnnoId === reviewingId) {
        setRejectingAnnoId(null);
        setSelectedPolicyId(null);
        setRejectNote("");
      }
      addToast({ type: "success", message: t("reviewer:workspace.messages.approved") });
    } else {
      addToast({
        type: "error",
        message: result.error || t("reviewer:workspace.messages.approveFailed"),
      });
    }
  };

  const handleReject = async (reviewingId: number) => {
    if (!selectedPolicyId) {
      addToast({ type: "error", message: t("reviewer:workspace.reject.choosePolicy") });
      return;
    }
    const result = await handleReviewAnnotation(
      reviewingId,
      true,
      selectedPolicyId,
      rejectNote.trim() || undefined,
    );
    if (result.success) {
      addToast({ type: "warning", message: t("reviewer:workspace.messages.rejected") });
      setRejectingAnnoId(null);
      setSelectedPolicyId(null);
      setRejectNote("");
    } else {
      addToast({
        type: "error",
        message: result.error || t("reviewer:workspace.messages.rejectFailed"),
      });
    }
  };

  const handleSubmit = async () => {
    if (isFinalizedAssignment) {
      addToast({
        type: "warning",
        message: t("reviewer:workspace.messages.finalized", {
          status: assignmentStatus,
        }),
      });
      return;
    }
    if (imageError) {
      addToast({
        type: "error",
        message: t("reviewer:workspace.messages.imageBlocked"),
      });
      return;
    }
    const result = await handleSubmitReview();
    if (result.success) {
      addToast({ type: "success", message: t("reviewer:workspace.messages.submitSuccess") });
      setTimeout(() => navigate("/reviewer/queue"), 1200);
    } else {
      addToast({
        type: "error",
        message: result.error || t("reviewer:workspace.messages.submitFailed"),
      });
    }
  };

  /* ── All labels (flat) from workspace.labelGroups ── */
  const allLabels = React.useMemo((): FlatLabel[] => {
    const ws = workspace as WorkspaceData | null;
    const groups = ws?.labelGroups ?? [];
    const labels: FlatLabel[] = [];
    const seen = new Set<string>();
    groups.forEach((g: LabelGroup) => {
      (g.labels || []).forEach((l: LabelInfo) => {
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
      <div className="flex h-screen items-center justify-center bg-[#131c2e] text-slate-200">
        <span className="material-symbols-outlined mr-2 animate-spin text-[28px] text-[#3a5068]">
          progress_activity
        </span>
        <span className="text-slate-500">
          {t("reviewer:workspace.loadingWorkspace")}
        </span>
      </div>
    );
  }

  /* ── Error ── */
  if (workspaceError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#131c2e] text-slate-200">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <h2 className="text-xl font-bold">{t("reviewer:workspace.loadFailed")}</h2>
        <p className="text-slate-500">{workspaceError}</p>
        <button
          onClick={() => navigate("/reviewer/queue")}
          className="rounded bg-[#1e2f42] px-4 py-2 text-sm font-medium text-slate-200 transition hover:opacity-80"
        >
          {t("common:actions.backToList")}
        </button>
      </div>
    );
  }

  const imgWidth = typedCurrentItem?.width || 800;
  const imgHeight = typedCurrentItem?.height || 600;
  const totalImages = typedItems.length;
  const currentItemStats =
    currentItemId != null
      ? typedGetItemStats(currentItemId)
      : { total: 0, approved: 0, rejected: 0, pending: 0 };
  const assignmentStatus = (ws?.assignmentStatus || "").toUpperCase();
  const isFinalizedAssignment =
    assignmentStatus === "APPROVED" || assignmentStatus === "REJECTED";
  const hasImageLoadError = Boolean(imageError);
  const canReviewCurrentImage =
    !isFinalizedAssignment &&
    !imageLoading &&
    !hasImageLoadError &&
    Boolean(imageBlobUrl);
  const canSubmit =
    !isFinalizedAssignment &&
    typedReviewStats.pending === 0 &&
    typedReviewStats.total > 0 &&
    !hasImageLoadError;

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#131c2e] text-slate-200"
      data-source-file={SOURCE_FILES.reviewerWorkspace}
      data-source-label="Reviewer workspace page"
    >
      {/* ══ TOP BAR ══ */}
      <div
        className={`flex min-h-12 shrink-0 items-center gap-2 border-b border-[#253347] bg-[#182233] px-3 ${
          isMobile ? "flex-wrap py-2" : "flex-nowrap"
        }`}
        data-source-file={SOURCE_FILES.reviewerWorkspace}
        data-source-label="Reviewer workspace top bar"
      >
        {/* Logo / Back */}
        <button
          onClick={() => navigate("/reviewer/queue")}
          className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors hover:bg-white/5"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/20">
            <span className="material-symbols-outlined text-white text-[14px]">
              category
            </span>
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:block">
            Data<span className="text-teal-400">Label</span>
          </span>
        </button>

        {/* Review progress bar */}
        <div className={`mx-3 flex items-center gap-2 ${isMobile ? "order-3" : ""}`}>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#253347]">
            <div
              className="h-full rounded-full bg-[#00bfa5] transition-all duration-500"
              style={{
                width:
                  typedReviewStats.total > 0
                    ? `${(typedReviewStats.reviewed / typedReviewStats.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
          <span className="whitespace-nowrap text-xs font-medium text-slate-500">
            {t("reviewer:workspace.currentImageProgress", {
              current: currentItemIndex + 1,
              total: totalImages,
            })}
          </span>
        </div>

        {/* Image navigation */}
        <div
          className={`flex items-center overflow-hidden rounded bg-[#1e2f42] ${
            isMobile ? "order-4" : ""
          }`}
        >
          {[
            { icon: "first_page", dir: "first" },
            { icon: "chevron_left", dir: "prev" },
          ].map(({ icon, dir }) => (
            <button
              key={dir}
              onClick={() => handleNavigate(dir)}
              className="flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">
                {icon}
              </span>
            </button>
          ))}
          <span className="px-2 text-xs font-bold tabular-nums text-slate-200">
            {currentItemIndex + 1}
          </span>
          {[
            { icon: "chevron_right", dir: "next" },
            { icon: "last_page", dir: "last" },
          ].map(({ icon, dir }) => (
            <button
              key={dir}
              onClick={() => handleNavigate(dir)}
              className="flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">
                {icon}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Clock */}
        <div className={`mr-3 flex items-center gap-1 ${isMobile ? "order-2" : ""}`}>
          {[hh, mm, ss].map((unit, i) => (
            <span
              key={i}
              className="rounded bg-[#1e2f42] px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums tracking-[0.05em] text-slate-400"
            >
              {unit}
            </span>
          ))}
        </div>

        {/* Zoom */}
        <div className={`mr-2 flex items-center gap-1 ${isMobile ? "order-2" : ""}`}>
          <button
            onClick={() => setZoom((z) => Math.max(10, z - 10))}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[14px]">
              remove
            </span>
          </button>
          <span className="w-10 text-center font-mono text-[11px] font-bold tabular-nums text-slate-400">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(400, z + 10))}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[14px]">
              add
            </span>
          </button>
        </div>

        {/* Guideline quick access */}
        <div className={`relative mr-2 ${isMobile ? "order-2" : ""}`}>
          <button
            onClick={() => setShowGuidelinePopover((v) => !v)}
            title={t("reviewer:workspace.guideline")}
            className="flex h-7 w-7 items-center justify-center rounded text-sky-300 transition-colors hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">
              menu_book
            </span>
          </button>
          {showGuidelinePopover && (
            <div
              className="absolute right-0 top-9 z-50 w-80 rounded-lg border border-[#253347] bg-[#111d2c] p-3 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-300">
                    {t("reviewer:workspace.guideline")}
                  </p>
                <button
                  onClick={() => setShowGuidelinePopover(false)}
                  className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:bg-white/10"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    close
                  </span>
                </button>
              </div>
              <div
                className="max-h-40 overflow-y-auto rounded border border-[#253347] bg-[#0f1823] p-2 text-xs text-slate-400"
              >
                <p className="whitespace-pre-wrap leading-[1.5]">
                  {ws?.projectGuidelineContent ||
                    t("annotator:workspace.messages.noGuideline")}
                </p>
              </div>
              {ws?.projectGuidelineFileUrl && (
                <a
                  href={ws.projectGuidelineFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-sky-300 underline hover:text-white"
                >
                  <span className="material-symbols-outlined text-[12px]">
                    download
                  </span>
                  {t("annotator:workspace.actions.downloadGuideline")}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hoàn tất đánh giá button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || reviewSubmitting}
          className={`flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-opacity shadow-md ${
            canSubmit
              ? "bg-[#00bfa5] text-white"
              : "cursor-not-allowed border border-[#253347] bg-[#1e2f42] text-[#4a6788]"
          } ${reviewSubmitting ? "opacity-60" : ""} ${isMobile ? "order-5 w-full" : ""}`}
          title={
            isFinalizedAssignment
              ? t("reviewer:workspace.messages.finalized", {
                  status: assignmentStatus,
                })
              : hasImageLoadError
                ? t("reviewer:workspace.messages.imageBlocked")
                : !canSubmit
                  ? t("reviewer:workspace.messages.pendingRemaining", {
                      count: typedReviewStats.pending,
                    })
                  : t("reviewer:workspace.actions.submitReview")
          }
        >
          {reviewSubmitting ? (
            <span className="material-symbols-outlined text-[14px] animate-spin">
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-[14px]">
              task_alt
            </span>
          )}
          <span>{t("reviewer:workspace.actions.submitReview")}</span>
          {!isFinalizedAssignment && !canSubmit && typedReviewStats.pending > 0 && (
            <span className="ml-1 rounded-full bg-[#253347] px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
              {typedReviewStats.pending}
            </span>
          )}
        </button>
      </div>

      {/* ══ BODY ══ */}
      <div
        className={`flex flex-1 overflow-hidden ${isMobile ? "flex-col" : "flex-row"}`}
        data-source-file={SOURCE_FILES.reviewerWorkspace}
        data-source-label="Reviewer workspace main layout"
      >
        {/* ── LEFT: Thumbnails + Project info ── */}
        <div
          className={`flex shrink-0 flex-col bg-[#182233] ${
            isMobile
              ? "w-full border-b border-[#253347]"
              : "w-[148px] border-r border-[#253347]"
          }`}
          data-source-file={SOURCE_FILES.reviewerWorkspace}
          data-source-label="Reviewer left panel"
        >
          {/* Project & submit */}
          <div className="flex shrink-0 flex-col gap-2 border-b border-[#253347] p-3">
            {/* Project name */}
            <div className="rounded border border-[#2a3f55] bg-[#1e2f42] px-2 py-1.5 text-xs font-medium text-slate-300">
              <span
                className="block truncate"
                title={ws?.projectName || `#${assignmentIdNum}`}
              >
                {ws?.projectName || `Assignment #${assignmentIdNum}`}
              </span>
            </div>

            {/* Assignment status */}
            <div
              className={`flex items-center justify-center px-2 py-1 text-[10px] font-bold ${
                ws?.assignmentStatus === "APPROVED"
                  ? "bg-[rgba(0,191,165,0.1)] text-[#00bfa5]"
                  : ws?.assignmentStatus === "REJECTED"
                    ? "bg-[rgba(248,113,113,0.1)] text-[#f87171]"
                    : "bg-[rgba(250,204,21,0.1)] text-[#facc15]"
              }`}
            >
              {translateAssignmentStatus(ws?.assignmentStatus || "SUBMITTED")}
            </div>

            {/* Nộp đánh giá */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || reviewSubmitting}
              className={`flex w-full items-center justify-center gap-1.5 rounded py-2 text-xs font-bold transition-opacity ${
                canSubmit ? "bg-[#00bfa5] text-white" : "cursor-not-allowed bg-[#253347] text-[#4a6788]"
              } ${reviewSubmitting ? "opacity-60" : ""}`}
              title={
                hasImageLoadError
                  ? t("reviewer:workspace.messages.imageBlocked")
                  : undefined
              }
            >
              <span className="material-symbols-outlined text-[14px]">
                send
              </span>
              <span>{t("reviewer:workspace.actions.submitReview")}</span>
            </button>
          </div>

          {/* Image list */}
          <div
            className={`flex-1 gap-2 overflow-y-auto p-2 ${
              isMobile ? "flex overflow-x-auto" : "flex flex-col overflow-x-hidden"
            }`}
          >
            {typedItems.map((item: WorkspaceItem, idx: number) => {
              const stats = typedGetItemStats(item.itemId);
              const isActive = idx === currentItemIndex;
              const allReviewed = stats.total > 0 && stats.pending === 0;
              const hasRejected = stats.rejected > 0;
              return (
                <div
                  key={item.itemId}
                  onClick={() => {
                    setCurrentItemIndex(idx);
                    setSelectedGroupKey(null);
                  }}
                  className={`relative cursor-pointer overflow-hidden rounded bg-[#1e2f42] transition-all ${
                    isActive ? "border-2 border-[#00bfa5]" : "border-2 border-transparent"
                  } ${isMobile ? "min-w-24" : ""}`}
                >
                  {/* Number badge */}
                  <div
                    className={`absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded border bg-black/40 text-[10px] font-bold backdrop-blur-sm ${
                      isActive ? "border-[#00bfa5] text-[#00bfa5]" : "border-white/10 text-white"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {/* Status icon */}
                  {allReviewed && (
                    <div className="absolute top-1 right-1 z-10">
                      <span className={`material-symbols-outlined text-[16px] drop-shadow-md ${hasRejected ? "text-red-400" : "text-[#00bfa5]"}`}>
                        {hasRejected ? "cancel" : "check_circle"}
                      </span>
                    </div>
                  )}
                  {!allReviewed && stats.total > 0 && (
                    <div className="absolute top-1 right-1 z-10">
                      <span className="material-symbols-outlined text-[16px] text-yellow-400 drop-shadow-md">
                        pending
                      </span>
                    </div>
                  )}
                  {/* Thumbnail */}
                  <div className={`h-20 overflow-hidden ${isMobile ? "w-[92px]" : "w-full"}`}>
                    <ThumbnailImg
                      fileUrl={item.fileUrl}
                      alt={
                        item.fileName ||
                        t("reviewer:workspace.imageLabel", { index: idx + 1 })
                      }
                    />
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
          <div className={`shrink-0 border-t border-[#253347] p-3 ${isMobile ? "hidden" : "block"}`}>
            <div className="mb-1.5 flex items-center justify-between text-[10px] text-[#4a6788]">
              <span>{t("reviewer:workspace.stats.progress")}</span>
              <span className="font-mono">
                {currentItemStats.total > 0
                  ? `${currentItemStats.approved + currentItemStats.rejected}/${currentItemStats.total}`
                  : "0/0"}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#253347]">
              <div
                className="h-full rounded-full bg-[#00bfa5] transition-all"
                style={{
                  width:
                    currentItemStats.total > 0
                      ? `${((currentItemStats.approved + currentItemStats.rejected) / currentItemStats.total) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5">
              <span className="text-[#00bfa5]">
                A {currentItemStats.approved}
              </span>
              <span className="text-red-400">
                R {currentItemStats.rejected}
              </span>
              <span className="text-yellow-400">
                P {currentItemStats.pending}
              </span>
            </div>
          </div>
        </div>

        {/* ── CENTER: Read-only canvas ── */}
        <div
          className={`relative flex-1 overflow-auto bg-[#0e1621] ${
            isMobile ? "min-h-0" : ""
          }`}
          data-source-file={SOURCE_FILES.reviewerWorkspace}
          data-source-label="Reviewer center canvas area"
        >
          <div
            className={`box-border flex min-h-full min-w-full items-center justify-center ${
              isMobile ? "p-3" : "p-8"
            }`}
          >
            <div
              className="relative shrink-0 border border-white/10 bg-black shadow-2xl"
              style={{
                width: imgWidth * (zoom / 100),
                height: imgHeight * (zoom / 100),
              }}
            >
              {imageLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-[32px] text-[#3a5068]">
                    progress_activity
                  </span>
                </div>
              ) : imageBlobUrl ? (
                <img
                  src={imageBlobUrl}
                  alt={
                    typedCurrentItem?.fileName ||
                    t("reviewer:workspace.imageLabel", {
                      index: currentItemIndex + 1,
                    })
                  }
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
              ) : imageError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center p-6 max-w-sm">
                    <span className="material-symbols-outlined mb-3 block text-[48px] text-red-400">
                      broken_image
                    </span>
                    <p className="mb-1 text-sm font-medium text-red-400">
                      {t("reviewer:workspace.brokenImage")}
                    </p>
                    <p className="break-all font-mono text-[10px] text-slate-500">
                      {(imageError as { url?: string })?.url}
                    </p>
                    <p className="mt-3 text-xs text-slate-300">
                      {t("reviewer:workspace.messages.imageRetryLocked")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center select-none opacity-20">
                  <span className="material-symbols-outlined text-[64px] text-[#3a5068]">
                    image
                  </span>
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
                readOnly={true}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Review/Summary panel ── */}
        <div
          className={`flex shrink-0 flex-col overflow-hidden bg-[#182233] ${
            isMobile
              ? "max-h-[42vh] w-full border-t border-[#253347]"
              : "w-[280px] border-l border-[#253347]"
          }`}
          data-source-file={SOURCE_FILES.reviewerWorkspace}
          data-source-label="Reviewer right review panel"
        >
          {/* Header line */}
          <div className="flex shrink-0 items-center gap-2 border-b border-[#253347] px-3 py-2">
            <span className="material-symbols-outlined text-[16px] text-[#00bfa5]">
              rate_review
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Ảnh {currentItemIndex + 1} / {totalImages}
            </span>
            <div className="flex-1" />
            <span className="text-[10px] font-mono text-[#4a6788]">
              <span className="text-[#00bfa5]">
                {
                  typedCurrentAnnotations.filter((a) => a.status === "APPROVED")
                    .length
                }
                A
              </span>{" "}
              <span className="text-red-400">
                {
                  typedCurrentAnnotations.filter((a) => a.status === "REJECTED")
                    .length
                }
                R
              </span>{" "}
              <span className="text-yellow-400">
                {
                  typedCurrentAnnotations.filter(
                    (a) => !a.status || a.status === "PENDING",
                  ).length
                }
                P
              </span>
            </span>
          </div>

          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-[#253347]">
            <button
              onClick={() => setRightTab("review")}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-[11px] font-semibold transition-colors ${
                rightTab === "review"
                  ? "border-[#00bfa5] text-[#00bfa5]"
                  : "border-transparent text-[#4a6788]"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                fact_check
              </span>
              {t("reviewer:workspace.tabs.review")} ({typedCurrentAnnotations.length})
            </button>
            <button
              onClick={() => setRightTab("summary")}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-[11px] font-semibold transition-colors ${
                rightTab === "summary"
                  ? "border-[#00bfa5] text-[#00bfa5]"
                  : "border-transparent text-[#4a6788]"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                analytics
              </span>
              {t("reviewer:workspace.tabs.summary")}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === "review" ? (
              /* ─── Đánh giá tab ─── */
              <div className="p-3 space-y-2">
                {itemAnnoLoading && (
                  <div className="flex items-center justify-center py-8 gap-2 opacity-50">
                    <span className="material-symbols-outlined animate-spin text-[20px] text-[#3a5068]">
                      progress_activity
                    </span>
                    <span className="text-xs text-[#3a5068]">
                      {t("common:states.loading")}
                    </span>
                  </div>
                )}

                {!itemAnnoLoading && currentAnnotations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-30">
                    <span className="material-symbols-outlined text-[32px] text-[#3a5068]">
                      label_off
                    </span>
                    <p className="text-xs text-[#3a5068]">
                      {t("annotator:workspace.messages.annotationsEmpty")}
                    </p>
                  </div>
                )}

                {!itemAnnoLoading &&
                  typedCurrentAnnotations.map((anno: Annotation) => {
                    const isRejecting = rejectingAnnoId === anno.reviewingId;
                    const group = annotationGroups.find((g) =>
                      g.beReviewingIds?.includes(anno.reviewingId),
                    );
                    const gKey = group?.groupKey || `solo_${anno.reviewingId}`;
                    const isHighlighted = selectedGroupKey === gKey;
                    const isPending =
                      !anno.status ||
                      anno.status === "PENDING" ||
                      isAwaitingRereview(anno);
                    const isApproved = anno.status === "APPROVED";
                    const statusLabel = isAwaitingRereview(anno)
                      ? t("status:review.pending")
                      : translateAssignmentStatus(anno.status || "PENDING");

                    return (
                      <div
                        key={anno.reviewingId}
                        className={`cursor-pointer rounded-lg border px-3 py-2.5 transition-all ${
                          isHighlighted
                            ? "border-[#00bfa5] bg-[linear-gradient(135deg,rgba(0,191,165,0.15)_0%,rgba(59,130,246,0.1)_100%)]"
                            : "border-[#374151] bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)]"
                        }`}
                        onClick={() =>
                          setSelectedGroupKey(isHighlighted ? null : gKey)
                        }
                      >
                        {/* Header: color dot + label name + status */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: anno.colorCode || "#6b7280" }}
                            />
                            <span className="truncate text-base font-bold text-white">
                              {anno.labelName || `Label #${anno.labelId}`}
                            </span>
                          </div>
                          <span
                            className={`ml-1 shrink-0 text-[10px] font-medium ${
                              isApproved
                                ? "text-[#00bfa5]"
                                : statusLabel === "REJECTED"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {/* Meta info */}
                        <div className="mb-2 flex items-center gap-2 text-[10px] text-[#4a6788]">
                          <span className="uppercase">
                            {anno.labelType || "BBOX"}
                          </span>
                          {anno.policyName && (
                            <span className="truncate text-red-400">
                              ● {anno.policyName}
                            </span>
                          )}
                          {anno.isImproved && anno.status !== "APPROVED" && (
                            <span className="text-blue-400">
                              {t("reviewer:workspace.improved")}
                            </span>
                          )}
                        </div>

                        {/* Action buttons (PENDING only, not if assignment is already APPROVED) */}
                        {isPending &&
                          !anno.policyName &&
                          assignmentStatus !== "APPROVED" && (
                            <div
                              className="flex gap-1.5 flex-col"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Confirm approve inline */}
                              {confirmingApproveId === anno.reviewingId ? (
                                <div className="flex flex-col gap-1.5 rounded border border-[rgba(0,191,165,0.25)] bg-[rgba(0,191,165,0.08)] p-2">
                                  <span className="text-[11px] font-semibold text-[#00bfa5]">
                                    Xác nhận chấp nhận nhãn này?
                                  </span>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => { setConfirmingApproveId(null); handleApprove(anno.reviewingId); }}
                                      disabled={reviewSubmitting}
                                      className="flex flex-1 items-center justify-center gap-1 rounded border border-[rgba(0,191,165,0.4)] bg-[rgba(0,191,165,0.2)] py-1.5 text-xs font-bold text-[#00bfa5] transition"
                                    >
                                      <span className="material-symbols-outlined text-sm">check_circle</span>
                                      Xác nhận
                                    </button>
                                    <button
                                      onClick={() => setConfirmingApproveId(null)}
                                      className="flex flex-1 items-center justify-center gap-1 rounded border border-[rgba(148,163,184,0.2)] bg-white/5 py-1.5 text-xs font-bold text-slate-400 transition"
                                    >
                                      <span className="material-symbols-outlined text-sm">close</span>
                                      Huỷ
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => setConfirmingApproveId(anno.reviewingId)}
                                    disabled={
                                      reviewSubmitting ||
                                      !canReviewCurrentImage ||
                                      isRejecting
                                    }
                                    title={
                                      isFinalizedAssignment
                                        ? t("reviewer:workspace.messages.finalized", { status: assignmentStatus })
                                        : !canReviewCurrentImage
                                          ? t("reviewer:workspace.reviewBlockedImage")
                                          : undefined
                                    }
                                    className="flex flex-1 items-center justify-center gap-1 rounded border border-[rgba(0,191,165,0.2)] bg-[rgba(0,191,165,0.1)] py-1.5 text-xs font-bold text-[#00bfa5] transition"
                                  >
                                    {reviewSubmitting ? (
                                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                    ) : (
                                      <span className="material-symbols-outlined text-sm">check</span>
                                    )}
                                    {t("reviewer:workspace.actions.approve")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingAnnoId(isRejecting ? null : anno.reviewingId);
                                      setSelectedPolicyId(null);
                                      setRejectNote("");
                                    }}
                                    disabled={
                                      reviewSubmitting ||
                                      typedPolicies.length === 0 ||
                                      !canReviewCurrentImage
                                    }
                                    title={
                                      isFinalizedAssignment
                                        ? t("reviewer:workspace.messages.finalized", { status: assignmentStatus })
                                        : !canReviewCurrentImage
                                          ? t("reviewer:workspace.reviewBlockedImage")
                                          : typedPolicies.length === 0
                                            ? t("reviewer:workspace.noPolicies")
                                            : t("reviewer:workspace.rejectCurrent")
                                    }
                                    className="flex flex-1 items-center justify-center gap-1 rounded border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] py-1.5 text-xs font-bold text-red-400 transition disabled:opacity-40"
                                  >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                    {t("reviewer:workspace.actions.reject")}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Show reject message if already rejected */}
                        {anno.policyName && (
                          <div className="space-y-1 rounded-lg border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] p-2 text-xs font-medium text-red-400">
                            <div>
                              ✓{" "}
                              {t("reviewer:workspace.rejectedBy", {
                                policy: anno.policyName,
                              })}
                            </div>
                            {anno.note && (
                              <div className="mt-1 rounded bg-[rgba(248,113,113,0.2)] p-1.5 text-xs italic text-rose-300">
                                💬 {anno.note}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Inline reject form */}
                        {isRejecting && !anno.policyName && (
                          <div
                            className="mt-2 space-y-2 rounded-lg border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.05)] p-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[10px] font-bold uppercase text-red-400">
                              {t("reviewer:workspace.reject.selectViolation")}
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {typedPolicies.map((p: Policy) => (
                                <button
                                  key={p.policyId}
                                  onClick={() =>
                                    setSelectedPolicyId(p.policyId)
                                  }
                                  className={`w-full rounded border px-2 py-1.5 text-left text-xs transition ${
                                    selectedPolicyId === p.policyId
                                      ? "border-red-400 bg-[rgba(248,113,113,0.1)] text-red-400"
                                      : "border-[#253347] bg-transparent text-slate-500"
                                  }`}
                                >
                                  <span className="font-medium">
                                    {p.errorName}
                                  </span>
                                  {p.errorLevel && (
                                    <span className="ml-2 opacity-50">
                                      ({p.errorLevel})
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                            <div>
                              <p className="mb-1 text-[10px] font-bold uppercase text-red-400">
                                {t("reviewer:workspace.reject.reason")}
                              </p>
                              <textarea
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder={t("reviewer:workspace.reject.optionalNote")}
                                rows={2}
                                className="w-full resize-none rounded border border-[#253347] bg-[#131c2e] px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setRejectingAnnoId(null);
                                  setRejectNote("");
                                }}
                                className="flex-1 rounded border border-[#253347] px-2 py-1 text-xs text-slate-500 transition hover:bg-white/5"
                              >
                                {t("common:actions.cancel")}
                              </button>
                              <button
                                onClick={() => handleReject(anno.reviewingId)}
                                disabled={
                                  !selectedPolicyId ||
                                  reviewSubmitting ||
                                  isFinalizedAssignment
                                }
                                className={`flex-1 rounded px-2 py-1 text-xs font-bold transition disabled:opacity-40 ${
                                  selectedPolicyId
                                    ? "bg-red-400 text-white"
                                    : "cursor-not-allowed bg-[#253347] text-[#4a6788]"
                                }`}
                              >
                                {reviewSubmitting
                                  ? t("common:states.processing")
                                  : t("reviewer:workspace.actions.confirmReject")}
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
                items={typedItems}
                annoCache={typedAnnoCache}
                allLabels={allLabels}
                reviewStats={typedReviewStats}
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
interface ReviewSummaryPanelProps {
  items: WorkspaceItem[];
  annoCache: Record<number, Annotation[]>;
  allLabels: FlatLabel[];
  reviewStats: ReviewStats;
  currentItemIndex: number;
  setCurrentItemIndex: (idx: number) => void;
}

function ReviewSummaryPanel({
  items,
  annoCache,
  reviewStats,
  currentItemIndex,
  setCurrentItemIndex,
}: ReviewSummaryPanelProps) {
  const { t, i18n } = useTranslation(["reviewer"]);
  const [altPressed, setAltPressed] = React.useState(false);
  const [hoveredExplainKey, setHoveredExplainKey] = React.useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
  /* Build per-label stats across all cached annotations */
  const labelStats = React.useMemo(() => {
    const map = new Map<number, { labelId: number; labelName: string; colorCode: string; total: number; approved: number; rejected: number; pending: number }>();
    Object.values(annoCache)
      .flat()
      .forEach((ann: Annotation) => {
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
        const e = map.get(ann.labelId)!;
        e.total++;
        if (ann.status === "APPROVED") e.approved++;
        else if (ann.status === "REJECTED" && !isAwaitingRereview(ann))
          e.rejected++;
        else e.pending++;
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [annoCache]);
  const isEnglish = i18n.language === "en";

  const explainers = React.useMemo(
    () => ({
      reviewOverview: {
        title: isEnglish ? "Review overview stats" : "Tổng quan trạng thái review",
        api: [
          "GET /api/assignments/:assignmentId/workspace",
          "GET /api/assignments/:assignmentId/items/:itemId/annotations",
        ],
        fields: [
          "annoCache[itemId][]",
          "annotation.status",
          "annotation.isImproved",
          "reviewStats.approved/rejected/pending",
        ],
        formula: isEnglish
          ? `Approved = annotations with status APPROVED = ${reviewStats.approved}. Rejected = status REJECTED and not isImproved = ${reviewStats.rejected}. Pending = empty status, PENDING, or REJECTED with isImproved = ${reviewStats.pending}.`
          : `Approved = số annotation có status APPROVED = ${reviewStats.approved}. Rejected = status REJECTED và không phải isImproved = ${reviewStats.rejected}. Pending = status rỗng, PENDING, hoặc REJECTED nhưng isImproved = ${reviewStats.pending}.`,
      },
      reviewProgress: {
        title: isEnglish ? "Review completion progress" : "Tiến độ hoàn tất review",
        api: [
          "GET /api/assignments/:assignmentId/workspace",
          "GET /api/assignments/:assignmentId/items/:itemId/annotations",
        ],
        fields: ["reviewStats.reviewed", "reviewStats.total"],
        formula: isEnglish
          ? `Progress bar width = reviewed / total * 100 = ${reviewStats.reviewed}/${reviewStats.total}.`
          : `Độ rộng progress bar = reviewed / total * 100 = ${reviewStats.reviewed}/${reviewStats.total}.`,
      },
      byImage: {
        title: isEnglish ? "Per-image review breakdown" : "Thống kê theo từng ảnh",
        api: [
          "GET /api/assignments/:assignmentId/workspace",
          "GET /api/assignments/:assignmentId/items/:itemId/annotations",
        ],
        fields: ["items[]", "annoCache[itemId][]", "annotation.status", "annotation.isImproved"],
        formula: isEnglish
          ? "For each image, FE reads annoCache[itemId], then counts approved, rejected, and pending using the same status rules as the overall review stats."
          : "Với mỗi ảnh, FE đọc annoCache[itemId], rồi đếm approved, rejected, pending theo đúng cùng rule trạng thái như phần tổng quan review.",
      },
      byLabel: {
        title: isEnglish ? "Per-label review breakdown" : "Thống kê review theo nhãn",
        api: [
          "GET /api/assignments/:assignmentId/workspace",
          "GET /api/assignments/:assignmentId/items/:itemId/annotations",
        ],
        fields: ["annotation.labelId", "annotation.labelName", "annotation.status", "annotation.isImproved"],
        formula: isEnglish
          ? "FE flattens all cached annotations, groups by labelId, then counts total, approved, rejected, and pending per label."
          : "FE trải phẳng toàn bộ annotation đã cache, gom theo labelId, rồi đếm total, approved, rejected và pending cho từng nhãn.",
      },
    }),
    [i18n.language, isEnglish, reviewStats.approved, reviewStats.pending, reviewStats.rejected, reviewStats.reviewed, reviewStats.total],
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

  const statCard = (label: string, value: number, color: string) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[#253347] bg-[#1e2f42] p-3">
      <span className="text-xl font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
      <span className="mt-0.5 text-[10px] text-[#4a6788]">
        {label}
      </span>
    </div>
  );

  return (
    <div className="p-3 space-y-4">
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
      {/* Overall stats */}
      <div {...attachExplainProps("reviewOverview")}>
        <p className="mb-2 text-[10px] font-bold uppercase text-[#4a6788]">
          {t("workspace.stats.overview")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {statCard(t("workspace.stats.accepted"), reviewStats.approved, "#00bfa5")}
          {statCard(t("workspace.stats.rejected"), reviewStats.rejected, "#f87171")}
          {statCard(t("workspace.stats.pending"), reviewStats.pending, "#facc15")}
        </div>
        <div {...attachExplainProps("reviewProgress")} className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-[#253347]">
            <div
              className="h-full rounded-full bg-[#00bfa5] transition-all"
              style={{
                width:
                  reviewStats.total > 0
                    ? `${(reviewStats.reviewed / reviewStats.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
          <span className="shrink-0 font-mono text-[10px] text-slate-500">
            {reviewStats.reviewed}/{reviewStats.total}
          </span>
        </div>
      </div>

      {/* Per-item breakdown */}
      <div {...attachExplainProps("byImage")}>
        <p className="mb-2 text-[10px] font-bold uppercase text-[#4a6788]">
          {t("workspace.stats.byImage")} ({items.length})
        </p>
        <div className="space-y-1">
          {items.map((item: WorkspaceItem, idx: number) => {
            const annos: Annotation[] = annoCache[item.itemId] ?? [];
            const approved = annos.filter(
              (a: Annotation) => a.status === "APPROVED",
            ).length;
            const rejected = getRejectedReviewCount(annos);
            const pending = getPendingReviewCount(annos);
            const isActive = idx === currentItemIndex;
            return (
              <button
                key={item.itemId}
                onClick={() => setCurrentItemIndex(idx)}
                className={`w-full rounded px-2 py-1.5 text-left transition-colors ${
                  isActive
                    ? "border border-[#00bfa5] bg-[rgba(0,191,165,0.1)]"
                    : "border border-[#253347] bg-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-[#00bfa5]" : "text-slate-400"
                    }`}
                  >
                    {t("workspace.imageLabel", { index: idx + 1 })}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    {approved > 0 && (
                      <span className="text-[#00bfa5]">
                        {t("workspace.stats.approvedShort", { count: approved })}
                      </span>
                    )}
                    {rejected > 0 && (
                      <span className="text-red-400">
                        {t("workspace.stats.rejectedShort", { count: rejected })}
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="text-yellow-400">
                        {t("workspace.stats.pendingShort", { count: pending })}
                      </span>
                    )}
                    {annos.length === 0 && (
                      <span className="text-[#3a5068]">—</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-label breakdown */}
      {labelStats.length > 0 && (
        <div {...attachExplainProps("byLabel")}>
          <p className="mb-2 text-[10px] font-bold uppercase text-[#4a6788]">
            {t("workspace.stats.byLabel")} ({labelStats.length})
          </p>
          <div className="space-y-1.5">
            {labelStats.map((ls) => (
              <div
                key={ls.labelId}
                className="rounded border border-[#253347] bg-[#1e2f42] px-2 py-1.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex-1 text-sm font-bold text-slate-200">
                    {ls.labelName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {ls.total}
                  </span>
                </div>
                <div className="flex gap-2 text-[10px] pl-0">
                  {ls.approved > 0 && (
                    <span className="text-[#00bfa5]">
                      ✓ {t("workspace.stats.approvedShort", { count: ls.approved })}
                    </span>
                  )}
                  {ls.rejected > 0 && (
                    <span className="text-red-400">
                      {t("workspace.stats.rejectedShort", { count: ls.rejected })}
                    </span>
                  )}
                  {ls.pending > 0 && (
                    <span className="text-yellow-400">
                      ⏳ {t("workspace.stats.pendingShort", { count: ls.pending })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
