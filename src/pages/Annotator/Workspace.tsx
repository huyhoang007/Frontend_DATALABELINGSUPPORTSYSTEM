﻿import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Workspace3Column } from "../../components/layout/WorkspaceLayout";
import { Button } from "../../components/ui/Button";
import { annotationApi } from "../../api/annotationApi";
import apiClient from "../../api/apiClient";
import { isFeatureEnabled } from "../../config/featureFlags";
import { labelRuleApi } from "../../api/labelRuleApi";
import { useToast } from "../../context/ToastContext";
import { getCachedBlobUrl, preloadBlobUrl } from "../../utils/blobAssetCache";
import { translate } from "../../i18n/helpers";
import { SOURCE_FILES } from "../../utils/sourceMeta";

/* â”€â”€ New modules â”€â”€ */
import { useAnnotations } from "./useAnnotations";
import { useDrawingTools } from "./useDrawingTools";
import AnnotationOverlay from "./AnnotationOverlay";
import LabelSelectModal from "./LabelSelectModal";
import AnnotationList from "./AnnotationList";
import LabelSummaryPanel from "../../components/LabelSummaryPanel";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import ShortcutHelpModal from "./ShortcutHelpModal";

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

function doneStorageKey(assignmentId, itemId) {
  return `anno_done_${assignmentId}_${itemId}`;
}

function itemHasAnnotations(item) {
  return Array.isArray(item?.annotations) && item.annotations.length > 0;
}

function itemHasRejectedFeedback(item) {
  return (
    Array.isArray(item?.annotations) &&
    item.annotations.some(
      (annotation) =>
         String(annotation?.status || annotation?.reviewStatus || "").toUpperCase() === "REJECTED",
    )
  );
}

/* ── Thumbnail image component ── */
function ThumbnailImg({ fileUrl, alt }) {
  const [src, setSrc] = React.useState(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef(null);
  const workspaceCacheEnabled = isFeatureEnabled("perf_workspace_safe_cache");

  React.useEffect(() => {
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
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let blobUrl = null;
    if (!fileUrl || !isVisible) return;
    const path = resolveImagePath(fileUrl);
    if (!path) return;
    (async () => {
      try {
        const nextSrc = workspaceCacheEnabled
          ? await getCachedBlobUrl(path)
          : await apiClient.get(path, {
              responseType: "blob",
              transformResponse: [(d) => d],
            }).then((res) => {
              const blob = res instanceof Blob ? res : new Blob([res]);
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

/* ── Tool definitions ── */
const TOOLS = [
  { id: "polygon", icon: "pentagon", labelKey: "annotator:workspace.tools.polygon" },
  { id: "bbox", icon: "crop_free", labelKey: "annotator:workspace.tools.bbox" },
  { id: "points", icon: "scatter_plot", labelKey: "annotator:workspace.tools.points" },
  { id: "polyline", icon: "polyline", labelKey: "annotator:workspace.tools.polyline" },
  { id: "select", icon: "pan_tool_alt", labelKey: "annotator:workspace.tools.select" },
];

export default function Workspace() {
  const { t } = useTranslation(["annotator", "common"]);
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const assignmentId = taskId;

  /* â”€â”€ Workspace data from API â”€â”€ */
  const [workspace, setWorkspace] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  /* ── Items & navigation ── */
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const items = workspace?.items || [];
  const currentItem = items[currentImageIndex] || null;
  const totalImages = items.length;

  // Is the assignment read-only (submitted, re-submitted, or approved)?
  const isReadOnly = ["SUBMITTED", "RE_SUBMITTED", "APPROVED"].includes(
    workspace?.assignmentStatus?.toUpperCase(),
  );

  /* ── Fetch workspace ── */
  const fetchWorkspace = React.useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await annotationApi.openWorkspace(assignmentId);
      setWorkspace(data);
    } catch (err) {
      setError(err?.message || t("annotator:workspace.messages.loadingWorkspace"));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  /* ── Annotations hook ── */
  const anno = useAnnotations({
    assignmentId,
    assignmentStatus: workspace?.assignmentStatus,
    addToast,
  });

  /* ── Tool & UI state ── */
  const [activeTool, setActiveTool] = React.useState("polygon");
  const [selectedGroupKey, setSelectedGroupKey] = React.useState(null);
  const [activeLabelFilterId, setActiveLabelFilterId] = React.useState(null);
  const [pendingShape, setPendingShape] = React.useState(null);
  const [relabelGroupKey, setRelabelGroupKey] = React.useState(null);
  const [zoom, setZoom] = React.useState(100);
  const [rightTab, setRightTab] = React.useState("annotations"); // "annotations" | "summary"
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showGuidelinePopover, setShowGuidelinePopover] = React.useState(false);
  const hydratedDoneAssignmentRef = React.useRef(null);
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  const tools = React.useMemo(
    () =>
      TOOLS.map((tool) => ({
        ...tool,
        label: t(tool.labelKey),
      })),
    [t],
  );

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (isReadOnly && activeTool !== "select") {
      setActiveTool("select");
    }
  }, [isReadOnly, activeTool]);

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
  const workspaceCacheEnabled = isFeatureEnabled("perf_workspace_safe_cache");
  const imageLazyLoadEnabled = isFeatureEnabled("perf_image_lazyload");

  React.useEffect(() => {
    let cancelled = false;
    let blobUrl = null;
    const fetchImage = async () => {
      const fileUrl = currentItem?.fileUrl;
      if (!fileUrl) {
        setImageBlobUrl(null);
        setImageLoading(false);
        setImageError(null);
        return;
      }
      const path = resolveImagePath(fileUrl);
      if (!path) return;
      setImageLoading(true);
      setImageError(null);
      setImageBlobUrl(null);
      try {
        const nextSrc = workspaceCacheEnabled
          ? await getCachedBlobUrl(path)
          : await apiClient.get(path, {
              responseType: "blob",
              transformResponse: [(data) => data],
            }).then((response) => {
              const blob = response instanceof Blob ? response : new Blob([response]);
              blobUrl = URL.createObjectURL(blob);
              return blobUrl;
            });
        if (cancelled) return;
        setImageBlobUrl(nextSrc);
      } catch (err) {
        if (cancelled) return;
        const status = err?.status || err?.response?.status || "?";
        setImageError({
          url: path,
          message: `Status ${status}: ${err?.message || "Failed"}`,
        });
      } finally {
        if (!cancelled) setImageLoading(false);
      }
    };
    fetchImage();
    return () => {
      cancelled = true;
      if (!workspaceCacheEnabled && blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [currentItem?.itemId, currentItem?.fileUrl, workspaceCacheEnabled]);

  React.useEffect(() => {
    if (!workspaceCacheEnabled || !imageLazyLoadEnabled) return;
    const nextItem = items[currentImageIndex + 1];
    const nextPath = resolveImagePath(nextItem?.fileUrl);
    if (nextPath) {
      preloadBlobUrl(nextPath);
    }
  }, [workspaceCacheEnabled, imageLazyLoadEnabled, currentImageIndex, items]);

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       LABELS â€” robust mapping + fallback API by projectId
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  // Fallback labels state (when workspace labelGroups is empty)
  const [fallbackLabels, setFallbackLabels] = React.useState([]);
  const [labelsLoading, setLabelsLoading] = React.useState(false);
  // Fallback label rules (fetched separately when workspace labelGroups is empty)
  const [fallbackRuleGroups, setFallbackRuleGroups] = React.useState([]);

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
      console.log(
        "[LABELS] workspace keys:",
        workspace ? Object.keys(workspace) : "null",
      );
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
        const nameMap = JSON.parse(
          localStorage.getItem("dlss_project_name_pid_map") || "{}",
        );
        const storedPid = nameMap[projectName];
        if (storedPid) {
          const savedRules = JSON.parse(
            localStorage.getItem(`dlss_project_rules_full::${storedPid}`) ||
              "[]",
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
                console.log(
                  "[LABELS] from localStorage rules:",
                  labels.length,
                  labels,
                );
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

    // Step 2: last resort - fetch ALL active labels + project-specific label rules
    const projectId = workspace?.projectId;
    if (import.meta.env.DEV)
      console.log(
        "[LABELS] no localStorage data - fallback via GET /api/labels/active + project label-rules, projectId:",
        projectId,
      );

    let cancelled = false;
    setLabelsLoading(true);

    (async () => {
      try {
        // Fetch both labels and project-specific label rules in parallel
        const labelRulesPromise = projectId
          ? apiClient
              .get(`/api/projects/${projectId}/label-rules`)
              .catch((err) => {
                console.warn("[LABELS] project label rules fetch failed:", err);
                return [];
              })
          : labelRuleApi.getAllRules().catch((err) => {
              console.warn("[LABELS] label rules fetch failed:", err);
              return [];
            });

        const [rawLabels, rawRules] = await Promise.all([
          apiClient.get("/api/labels/active"),
          labelRulesPromise,
        ]);
        if (cancelled) return;

        // Parse flat labels
        const arr = Array.isArray(rawLabels)
          ? rawLabels
          : (rawLabels?.data ?? rawLabels?.content ?? []);
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

        // Parse label rules into groups for the modal
        const rulesArr = Array.isArray(rawRules)
          ? rawRules
          : (rawRules?.data ?? rawRules?.content ?? []);
        if (rulesArr.length > 0) {
          const ruleGroups = rulesArr
            .map((rule) => ({
              ruleId: rule.ruleId ?? rule.id,
              ruleName: rule.name ?? rule.ruleName ?? "(no name)",
              labels: (Array.isArray(rule.labels) ? [...rule.labels] : [])
                .map((l) => ({
                  id: l.labelId ?? l.id,
                  name: l.labelName ?? l.name,
                  color: l.colorCode ?? l.color ?? "#6b7280",
                  type: l.labelType ?? l.type ?? "BBOX",
                }))
                .filter((l) => l.id != null && l.name),
            }))
            .filter((g) => g.ruleId != null);
          if (import.meta.env.DEV)
            console.log(
              "[LABELS] fallback ruleGroups:",
              ruleGroups.length,
              ruleGroups,
            );
          setFallbackRuleGroups(ruleGroups);
        }
      } catch (err) {
        console.error("[LABELS] fallback fetch error:", err);
        addToast?.({
          type: "error",
          message: t("annotator:workspace.messages.labelsFailed"),
        });
      } finally {
        if (!cancelled) setLabelsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspace, labelsFromGroups.length, addToast]);

  /* ── All labels: workspace groups first, fallback second ── */
  const allLabels =
    labelsFromGroups.length > 0 ? labelsFromGroups : fallbackLabels;

  /* ── Label groups for modal (preserves rule/group structure) ── */
  const labelGroupsForModal = React.useMemo(() => {
    // 1. Try workspace labelGroups (from openWorkspace API)
    const rawGroups =
      workspace?.labelGroups ||
      workspace?.data?.labelGroups ||
      workspace?.data?.data?.labelGroups ||
      workspace?.payload?.labelGroups ||
      [];
    if (rawGroups.length > 0) {
      return rawGroups.map((g) => ({
        ruleId: g.ruleId,
        ruleName: g.ruleName || "(no name)",
        labels: (g.labels || [])
          .map((l) => ({
            id: l.labelId ?? l.id,
            name: l.labelName ?? l.name,
            color: l.colorCode ?? l.color ?? "#6b7280",
            type: l.labelType ?? l.type ?? "BBOX",
          }))
          .filter((l) => l.id != null && l.name),
      }));
    }
    // 2. Fallback: use separately fetched label rules
    if (fallbackRuleGroups.length > 0) {
      return fallbackRuleGroups;
    }
    // 3. Last resort: wrap flat labels in a single group
    if (fallbackLabels.length > 0) {
      return [{
        ruleId: null,
        ruleName: translate("common:labels.label"),
        labels: fallbackLabels,
      }];
    }
    return [];
  }, [workspace, fallbackLabels, fallbackRuleGroups]);

  React.useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  React.useEffect(() => {
    if (!assignmentId || items.length === 0) return;
    if (hydratedDoneAssignmentRef.current === assignmentId) return;

    const hasExistingDoneFlags = items.some(
      (item) =>
        localStorage.getItem(doneStorageKey(assignmentId, item.itemId)) === "1",
    );

    if (!hasExistingDoneFlags) {
      items.forEach((item) => {
        if (itemHasAnnotations(item)) {
          localStorage.setItem(doneStorageKey(assignmentId, item.itemId), "1");
        } else {
          localStorage.removeItem(doneStorageKey(assignmentId, item.itemId));
        }
      });
    }

    const firstUndoneIndex = items.findIndex(
      (item) =>
        localStorage.getItem(doneStorageKey(assignmentId, item.itemId)) !== "1",
    );

    setCurrentImageIndex(firstUndoneIndex >= 0 ? firstUndoneIndex : 0);
    hydratedDoneAssignmentRef.current = assignmentId;
  }, [assignmentId, items]);

  /* ── Load annotations when item changes ── */
  React.useEffect(() => {
    if (currentItem?.itemId) {
      anno.loadAnnotations(currentItem.itemId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.itemId]);

  React.useEffect(() => {
    if (!currentItem?.itemId) return;
    setWorkspace((prev) => {
      if (!prev?.items) return prev;
      let changed = false;
      const nextItems = prev.items.map((item) => {
        if (item.itemId !== currentItem.itemId) return item;
        const nextAnnotations = anno.annotations.map((group) => ({
          reviewingId: group.beReviewingIds?.[0] ?? null,
          status: group.reviewStatus ?? null,
          reviewStatus: group.reviewStatus ?? null,
          policyName: group.policyName ?? null,
          note: group.note ?? null,
          labelIds: group.labelIds ?? [],
          labelNames: group.labelNames ?? [],
        }));
        const sameLength =
          Array.isArray(item.annotations) &&
          item.annotations.length === nextAnnotations.length;
        const sameStatuses =
          sameLength &&
          item.annotations.every((annotation, index) => {
            const nextAnnotation = nextAnnotations[index];
            return (
              String(annotation?.status || annotation?.reviewStatus || "") ===
                String(nextAnnotation?.status || nextAnnotation?.reviewStatus || "") &&
              String(annotation?.policyName || "") === String(nextAnnotation?.policyName || "") &&
              String(annotation?.note || "") === String(nextAnnotation?.note || "")
            );
          });
        if (sameStatuses) return item;
        changed = true;
        return {
          ...item,
          annotations: nextAnnotations,
        };
      });
      return changed ? { ...prev, items: nextItems } : prev;
    });
  }, [currentItem?.itemId, anno.annotations]);

  /* â”€â”€ Navigation â”€â”€ */
  const handleNavigate = async (direction) => {
    // Flush save for current item before switching
    await anno.saveNow();

    let newIndex = currentImageIndex;
    if (direction === "first") newIndex = 0;
    if (direction === "prev") newIndex = Math.max(0, currentImageIndex - 1);
    if (direction === "next")
      newIndex = Math.min(totalImages - 1, currentImageIndex + 1);
    if (direction === "last") newIndex = totalImages - 1;

    if (newIndex !== currentImageIndex) {
      setCurrentImageIndex(newIndex);
      setSelectedGroupKey(null);
      setActiveLabelFilterId(null);
    }
  };

  /* â”€â”€ Save (flush) â”€â”€ */
  const handleSave = async () => {
    if (isReadOnly) return;
    await anno.saveNow();
    addToast({
      type: "success",
      message: t("annotator:workspace.messages.saveSuccess"),
    });
  };

  /* â”€â”€ Submit assignment â”€â”€ */
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const submitTimeoutRef = React.useRef(null);
  const doneCount = items.filter((i) => anno.isDone(i.itemId)).length;
  const progressPercent =
    totalImages > 0 ? Math.round((doneCount / totalImages) * 100) : 0;
  const hasIncompleteItems = totalImages === 0 || doneCount !== totalImages;
  const currentItemHasRejectedFeedback = anno.annotations.some(
    (group) => group.reviewStatus === "REJECTED",
  );
  const assignmentHasRejectedFeedback =
    (workspace?.assignmentStatus || "").toUpperCase() === "REJECTED" &&
    (currentItemHasRejectedFeedback ||
      items.some((item) => itemHasRejectedFeedback(item)));
  const isSubmitBlocked =
    isReadOnly ||
    imageLoading ||
    !!imageError ||
    hasIncompleteItems ||
    assignmentHasRejectedFeedback;

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) {
      console.warn("[SUBMIT] Already submitting, ignoring double-click");
      return; // Prevent double-click
    }
    if (isSubmitBlocked) {
      console.warn("[SUBMIT] Submit blocked. Conditions:", {
        imageError: !!imageError,
        hasIncompleteItems,
        assignmentHasRejectedFeedback,
        imageLoading,
        isReadOnly,
      });
      if (imageError) {
        addToast({
          type: "warning",
          message: t("annotator:workspace.messages.submitBlockedImage"),
        });
      } else if (hasIncompleteItems) {
        addToast({
          type: "warning",
          message: t("annotator:workspace.messages.submitAllDone", {
            done: doneCount,
            total: totalImages,
          }),
        });
      } else if (assignmentHasRejectedFeedback) {
        addToast({
          type: "warning",
          message: t("annotator:workspace.messages.doneNeedFixRejected"),
        });
      }
      return;
    }
    setIsSubmitting(true);
    console.log("[SUBMIT] Starting submit process...");

    // Safety timeout - reset isSubmitting after 10 seconds if something goes wrong
    submitTimeoutRef.current = setTimeout(() => {
      console.warn(
        "[SUBMIT] Timeout reached - forcefully resetting isSubmitting state",
      );
      setIsSubmitting(false);
      addToast({
        type: "error",
        message: t("annotator:workspace.messages.submitFailed"),
      });
    }, 10000);

    try {
      console.log("[SUBMIT] Saving annotations...");
      await anno.saveNow();
      console.log("[SUBMIT] Annotations saved successfully");

      console.log("[SUBMIT] Submitting assignment to backend...");
      await annotationApi.submitAssignment(assignmentId);
      console.log("[SUBMIT] Assignment submitted successfully by backend");

      // Clear timeout if success
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }

      addToast({
        type: "success",
        message: t("annotator:workspace.messages.submitSuccess"),
      });
      // Small delay to ensure backend processed
      setTimeout(() => {
        navigate("/annotator/tasks");
      }, 500);
    } catch (err) {
      console.error("[SUBMIT] Error details:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
        fullError: err,
      });

      // Clear timeout on error
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }

      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        t("annotator:workspace.messages.submitFailed");
      addToast({ type: "error", message: errorMsg });
    } finally {
      setIsSubmitting(false);
      console.log(
        "[SUBMIT] Submit process finished, isSubmitting reset to false",
      );
    }
  };

  /* â”€â”€ Mark as Done â”€â”€ */
  /* ── Keyboard shortcuts ── */
  useKeyboardShortcuts({
    isReadOnly,
    activeTool,
    setActiveTool,
    selectedGroupKey,
    setSelectedGroupKey,
    deleteAnnotation: anno.deleteAnnotation,
    toggleHidden: anno.toggleHidden,
    goToNext: () => handleNavigate("next"),
    goToPrev: () => handleNavigate("prev"),
    setZoom,
    onSubmit: handleSubmit,
    modalOpen: !!pendingShape || !!relabelGroupKey || showShortcuts,
  });

  const handleMarkDone = () => {
    if (!currentItem || isReadOnly) return;
    if (anno.isDone(currentItem.itemId)) {
      anno.unmarkDone(currentItem.itemId);
      addToast({
        type: "info",
        message: t("annotator:workspace.actions.unmarkDone"),
      });
    } else {
      const ok = anno.markDone(currentItem.itemId);
      if (ok) {
        addToast({
          type: "success",
          message: t("annotator:workspace.actions.markDone"),
        });
      }
    }
    // force re-render for sidebar
    setWorkspace((w) => ({ ...w }));
  };

  /* â”€â”€ Label select modal callbacks â”€â”€ */
  const handleLabelSave = (labelIds) => {
    if (relabelGroupKey) {
      anno.updateLabels(relabelGroupKey, labelIds, allLabels);
      setRelabelGroupKey(null);
    } else if (pendingShape) {
      anno.addAnnotation(pendingShape, labelIds, allLabels);
      setPendingShape(null);
      setActiveTool("select");
    }
  };
  const handleLabelCancel = () => {
    setPendingShape(null);
    setRelabelGroupKey(null);
  };

  /* â”€â”€ Loading / Error states â”€â”€ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <span className="material-symbols-outlined text-3xl text-muted-foreground animate-spin mr-2">
          progress_activity
        </span>
        <span className="text-muted-foreground">
          {t("annotator:workspace.messages.loadingWorkspace")}
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4">
        <span className="material-symbols-outlined text-5xl text-destructive">
          error
        </span>
        <p className="text-sm text-destructive">{error}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate("/annotator/tasks")}
            leftIcon="arrow_back"
          >
            {t("common:actions.back")}
          </Button>
          <Button variant="primary" onClick={fetchWorkspace}>
            {t("common:actions.retry")}
          </Button>
        </div>
      </div>
    );
  }
  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4">
        <span className="material-symbols-outlined text-5xl text-muted-foreground/40">
          assignment
        </span>
        <p className="text-muted-foreground">
          {t("annotator:tasks.noAssignmentsTitle")}
        </p>
        <Button
          variant="secondary"
          onClick={() => navigate("/annotator/tasks")}
          leftIcon="arrow_back"
        >
          {t("common:actions.back")}
        </Button>
      </div>
    );
  }

  // Note: View submissions in read-only mode. The isReadOnly flag below will handle disabling edits.
  // No blocking here - allow users to view their submitted/approved work.

  const imgWidth = currentItem?.width || 800;
  const imgHeight = currentItem?.height || 600;
  const currentIsDone = currentItem ? anno.isDone(currentItem.itemId) : false;

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  // â”€â”€ FULL REDESIGN â”€â”€
  return (
    <>
      <div
        className="flex h-screen flex-col overflow-hidden bg-[#131c2e] text-slate-200"
        data-source-file={SOURCE_FILES.annotatorWorkspace}
        data-source-label="Annotator workspace page"
      >
        {/* â•â•â•â•â•â•â•â•â•â• TOP BAR â•â•â•â•â•â•â•â•â•â• */}
        <div
          className={`flex min-h-12 shrink-0 items-center gap-2 border-b border-[#253347] bg-[#182233] px-3 ${
            isMobile ? "flex-wrap py-2" : "flex-nowrap"
          }`}
          data-source-file={SOURCE_FILES.annotatorWorkspace}
          data-source-label="Annotator workspace top bar"
        >
          {/* Dashboard Logo Link */}
          <button
            onClick={() => navigate("/annotator/dashboard")}
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

          {/* Progress bar + count */}
          <div
            className={`mx-3 flex items-center gap-2 ${isMobile ? "order-3" : ""}`}
          >
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#253347]">
              <div
                className="h-full rounded-full bg-[#00bfa5] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-xs font-medium text-slate-500">
              {t("annotator:workspace.header.currentImage", {
                current: currentImageIndex + 1,
                total: totalImages,
              })}
            </span>
          </div>

          {/* Navigation */}
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
              {currentImageIndex + 1}
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

          {/* Spacer */}
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
          <div className={`relative mr-1 ${isMobile ? "order-2" : ""}`}>
            <button
              onClick={() => setShowGuidelinePopover((v) => !v)}
              title={t("annotator:workspace.header.guideline")}
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
                    {t("annotator:workspace.header.guideline")}
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
                    {workspace?.projectGuidelineContent ||
                      t("annotator:workspace.messages.noGuideline")}
                  </p>
                </div>
                {workspace?.projectGuidelineFileUrl && (
                  <a
                    href={workspace.projectGuidelineFileUrl}
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

          {/* Shortcut help button */}
          <button
            onClick={() => setShowShortcuts(true)}
            title={t("annotator:workspace.actions.shortcuts")}
            className="mr-1 flex h-6 w-6 items-center justify-center rounded text-[13px] font-bold text-slate-500 transition-colors hover:bg-white/10"
          >
            ?
          </button>

          {/* Action buttons */}
          <div
            className={`flex items-center gap-2 ${
              isMobile ? "order-5 w-full justify-end" : ""
            }`}
          >
            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isReadOnly}
              title={t("annotator:workspace.actions.saveDraft")}
              className={`flex items-center gap-1.5 rounded-lg border border-[#2563eb44] bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-sky-300 transition-all ${
                isReadOnly ? "cursor-not-allowed opacity-40" : "active:scale-95 hover:brightness-110"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                save
              </span>
              <span>{t("common:actions.save")}</span>
            </button>

            {/* Mark Done button */}
            <button
              onClick={handleMarkDone}
              title={
                currentIsDone
                  ? t("annotator:workspace.actions.unmarkDoneTitle")
                  : t("annotator:workspace.actions.markDoneTitle")
              }
              disabled={
                (!currentIsDone &&
                  (anno.annotations.length === 0 ||
                    currentItemHasRejectedFeedback)) ||
                isReadOnly
              }
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                (!currentIsDone &&
                  (anno.annotations.length === 0 || currentItemHasRejectedFeedback)) ||
                isReadOnly
                  ? "cursor-not-allowed opacity-40"
                  : "active:scale-95 hover:brightness-110"
              } ${
                currentIsDone
                  ? "border-[#10b98144] bg-emerald-950 text-emerald-400"
                  : "border-[#3a506844] bg-[#1e2f42] text-slate-400"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {currentIsDone ? "check_circle" : "task_alt"}
              </span>
              <span>
                {currentIsDone
                  ? t("annotator:workspace.actions.unmarkDoneButton")
                  : t("annotator:workspace.actions.markDoneButton")}
              </span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-[#253347]" />

            {/* Back to tasks */}
            <button
              onClick={() => navigate("/annotator/tasks")}
              title={t("common:actions.backToList")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-white/10 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
            </button>
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â• BODY â•â•â•â•â•â•â•â•â•â• */}
        <div
          className={`flex flex-1 overflow-hidden ${isMobile ? "flex-col" : "flex-row"}`}
          data-source-file={SOURCE_FILES.workspaceLayout}
          data-source-label="Annotator workspace 3-column layout"
        >
          {/* ── LEFT: Image thumbnails ── */}
          <div
            className={`flex shrink-0 flex-col overflow-y-auto bg-[#182233] ${
              isMobile
                ? "w-full border-b border-[#253347]"
                : "w-[148px] border-r border-[#253347]"
            }`}
            data-source-file={SOURCE_FILES.annotatorWorkspace}
            data-source-label="Annotator left panel"
          >
            {/* Project Info & Submit Action */}
            <div className="flex shrink-0 flex-col gap-2 border-b border-[#253347] p-3">
              {/* Task name badge */}
              <div className="flex items-center justify-between px-2 py-1.5 rounded text-xs font-medium bg-[#1e2f42] text-[#cbd5e1] border border-[#2a3f55]">
                <span
                  className="truncate flex-1"
                  title={workspace.projectName || `Assignment #${assignmentId}`}
                >
                  {workspace.projectName ||
                    t("annotator:workspace.messages.projectFallback", {
                      id: assignmentId,
                    })}
                </span>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitBlocked || isSubmitting}
                title={
                  imageError
                    ? t("annotator:workspace.messages.submitBlockedImage")
                    : undefined
                }
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all shadow-lg ${
                  isSubmitBlocked || isSubmitting
                    ? "cursor-not-allowed border border-[#2563eb55] bg-[#1e3a5f] text-sky-300 opacity-60"
                    : "bg-gradient-to-br from-[#00bfa5] to-[#0097a7] text-white shadow-[0_4px_12px_rgba(0,191,165,0.35)] hover:brightness-110 active:scale-95"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[15px] ${
                    isSubmitting ? "animate-spin" : ""
                  }`}
                >
                  {isSubmitting
                    ? "progress_activity"
                    : isReadOnly
                      ? workspace?.assignmentStatus?.toUpperCase() ===
                        "APPROVED"
                        ? "visibility"
                        : "check_circle"
                      : "send"}
                </span>
                <span>
                  {isSubmitting
                    ? t("annotator:workspace.messages.submitPending")
                    : isReadOnly
                      ? workspace?.assignmentStatus?.toUpperCase() ===
                        "APPROVED"
                        ? t("annotator:workspace.actions.viewOnly")
                        : t("annotator:workspace.actions.submitted")
                      : t("annotator:workspace.actions.submit")}
                </span>
              </button>
            </div>

            {/* Image List */}
            <div
              className={`flex-1 gap-2 overflow-y-auto p-2 ${
                isMobile ? "flex overflow-x-auto" : "flex flex-col overflow-x-hidden"
              }`}
            >
              {items.map((item, idx) => {
                const isActive = idx === currentImageIndex;
                const isDone = anno.isDone(item.itemId);
                return (
                  <div
                    key={item.itemId}
                    onClick={() => {
                      setCurrentImageIndex(idx);
                      setSelectedGroupKey(null);
                      setActiveLabelFilterId(null);
                    }}
                    className={`relative cursor-pointer overflow-hidden rounded bg-[#1e2f42] transition-all ${
                      isActive ? "border-2 border-[#00bfa5]" : "border-2 border-transparent"
                    } ${isMobile ? "min-w-24" : ""}`}
                  >
                    {/* Number badge */}
                    <div
                      className={`absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold shadow-md backdrop-blur-sm ${
                        isActive
                          ? "border-[#00bfa5] bg-black/40 text-[#00bfa5]"
                          : "border-white/10 bg-black/40 text-white"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {/* Done badge */}
                    {isDone && (
                      <div className="absolute top-1 right-1 z-10 drop-shadow-md">
                        <span className="material-symbols-outlined text-[16px] text-[#00bfa5]">
                          check_circle
                        </span>
                      </div>
                    )}
                    {/* Thumbnail */}
                    <div className={`h-20 overflow-hidden ${isMobile ? "w-[92px]" : "w-full"}`}>
                      <ThumbnailImg
                        fileUrl={item.fileUrl}
                        alt={
                          item.fileName ||
                          t("annotator:workspace.header.imageAlt", {
                            index: idx + 1,
                          })
                        }
                      />
                    </div>
                    {/* Selection Glow */}
                    {isActive && (
                      <div className="absolute inset-0 ring-inset ring-2 ring-[#00bfa5] rounded pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 border-t border-[#253347] p-3">
              <button
                onClick={handleSave}
                disabled={isReadOnly}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#2a4060] bg-[#1a2a3a] py-2 text-xs font-semibold text-sky-300 transition-all ${
                  isReadOnly ? "cursor-not-allowed opacity-40" : "active:scale-95 hover:bg-[#1e3a5f]"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  save
                </span>
                <span>{t("common:actions.saveDraft")}</span>
              </button>
            </div>
          </div>

          {/* ── CENTER: Canvas ── */}
          <div
            className={`relative flex-1 overflow-auto bg-[#0e1621] ${
              isMobile ? "min-h-0" : ""
            }`}
            data-source-file={SOURCE_FILES.annotatorWorkspace}
            data-source-label="Annotator center canvas area"
          >
            {/* centering wrapper — expands to at least full viewport so canvas stays centered at small zoom */}
            <div
              className={`box-border flex min-h-full min-w-full items-center justify-center ${
                isMobile ? "p-3" : "p-8"
              }`}
            >
              <div
                className="relative shadow-2xl shrink-0"
                style={{
                  width: imgWidth * (zoom / 100),
                  height: imgHeight * (zoom / 100),
                  background: "#000",
                  border: "1px solid rgba(255,255,255,0.08)",
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
                    currentItem?.fileName ||
                    t("annotator:workspace.header.imageAlt", {
                      index: currentImageIndex + 1,
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
                        {t("annotator:workspace.messages.imageLoadFailed")}
                      </p>
                      <p className="mb-3 break-all font-mono text-[10px] text-slate-500">
                        {imageError.url}
                      </p>
                      <p className="mb-4 text-xs text-rose-300">
                        {t("annotator:workspace.messages.submitBlockedImageRetry")}
                      </p>
                      <button
                        onClick={() => {
                          setImageError(null);
                          setImageBlobUrl(null);
                        }}
                        className="rounded bg-white/10 px-4 py-1.5 text-xs font-medium text-white"
                      >
                        {t("annotator:workspace.actions.retry")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center select-none opacity-20">
                    <span className="material-symbols-outlined text-[64px] text-[#3a5068]">
                      image
                    </span>
                  </div>
                )}

                {/* Annotation Overlay */}
                <AnnotationOverlay
                  annotations={anno.annotations}
                  draftShape={drawing.draftShape}
                  cursorPt={drawing.cursorPt}
                  activeTool={isReadOnly ? "select" : activeTool}
                  selectedGroupKey={selectedGroupKey}
                  activeLabelFilterId={activeLabelFilterId}
                  onSelect={setSelectedGroupKey}
                  onUpdateGeometry={
                    isReadOnly ? undefined : anno.updateGeometry
                  }
                  drawingHandlers={isReadOnly ? {} : drawing}
                  readOnly={isReadOnly}
                />

                {/* Label select popup — absolute inside canvas so it scrolls with it */}
                {(pendingShape || relabelGroupKey) && (
                  <LabelSelectModal
                    labelGroups={labelGroupsForModal}
                    initialSelectedIds={
                      relabelGroupKey
                        ? anno.annotations.find(
                            (group) => group.groupKey === relabelGroupKey,
                          )?.labelIds || []
                        : []
                    }
                    pendingShape={pendingShape}
                    canvasWidth={imgWidth * (zoom / 100)}
                    canvasHeight={imgHeight * (zoom / 100)}
                    onSave={handleLabelSave}
                    onCancel={handleLabelCancel}
                  />
                )}
              </div>
              {/* end canvas */}
            </div>
            {/* end centering wrapper */}
          </div>

          {/* RIGHT: Tools + Annotations */}
          <div
            className={`flex shrink-0 flex-col overflow-hidden bg-[#182233] ${
              isMobile
                ? "max-h-[42vh] w-full border-t border-[#253347]"
                : "w-[260px] border-l border-[#253347]"
            }`}
            data-source-file={SOURCE_FILES.annotatorWorkspace}
            data-source-label="Annotator right panel"
          >
            {/* Tool icons */}
            <div className="flex shrink-0 items-center justify-center gap-1.5 border-b border-[#253347] bg-[#111d2c] px-3 py-2.5">
              {(isReadOnly
                ? tools.filter((tool) => tool.id === "select")
                : tools
              ).map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (!isReadOnly || tool.id === "select") {
                      setActiveTool(tool.id);
                      setSelectedGroupKey(null);
                    }
                  }}
                  title={tool.label}
                  disabled={isReadOnly && tool.id !== "select"}
                  className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-[2px] py-1 transition-all ${
                    isReadOnly && tool.id !== "select"
                      ? "hidden cursor-not-allowed opacity-30"
                      : "active:scale-95 hover:brightness-110"
                  } ${
                    activeTool === tool.id
                      ? "bg-[#00bfa5] text-white shadow-[0_2px_8px_rgba(0,191,165,0.4)]"
                      : "border border-[#2a3f55] bg-[#1e2f42] text-[#7a9ab8]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tool.icon}
                  </span>
                  <span className="text-[8px] font-semibold leading-none tracking-[0.02em]">
                    {tool.label?.split(" ")[0]?.substring(0, 5)}
                  </span>
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 border-b border-[#253347]">
              <button
                onClick={() => setRightTab("annotations")}
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-[11px] font-semibold transition-colors ${
                  rightTab === "annotations"
                    ? "border-[#00bfa5] text-[#00bfa5]"
                    : "border-transparent text-[#4a6788]"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  layers
                </span>
                {t("annotator:workspace.tabs.annotations")} ({anno.annotations.length})
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
                {t("annotator:workspace.tabs.summary")}
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {rightTab === "annotations" ? (
                labelsLoading && allLabels.length === 0 ? (
                  <div className="flex items-center justify-center h-24 gap-2 opacity-50">
                    <span className="material-symbols-outlined animate-spin text-[18px] text-[#3a5068]">
                      progress_activity
                    </span>
                    <p className="text-xs text-[#3a5068]">
                      {t("annotator:workspace.messages.labelsLoading")}
                    </p>
                  </div>
                ) : anno.annotations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-30">
                    <span className="material-symbols-outlined text-[32px] text-[#3a5068]">
                      layers
                    </span>
                    <p className="text-xs text-[#3a5068]">
                      {t("annotator:workspace.messages.annotationsEmpty")}
                    </p>
                  </div>
                ) : (
                  <AnnotationList
                    annotations={anno.annotations}
                    allLabels={allLabels}
                    selectedGroupKey={selectedGroupKey}
                    activeLabelFilterId={activeLabelFilterId}
                    onSelect={(gk) => {
                      setSelectedGroupKey(gk);
                      setActiveTool("select");
                    }}
                    onDelete={isReadOnly ? undefined : anno.deleteAnnotation}
                    onToggleHidden={anno.toggleHidden}
                    onRelabel={isReadOnly ? undefined : setRelabelGroupKey}
                    readOnly={isReadOnly}
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

      {/* Shortcut help modal */}
      {showShortcuts && (
        <ShortcutHelpModal onClose={() => setShowShortcuts(false)} />
      )}
    </>
  );
}
