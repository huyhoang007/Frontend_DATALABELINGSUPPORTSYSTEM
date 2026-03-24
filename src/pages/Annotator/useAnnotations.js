import { useState, useRef, useCallback, useEffect } from "react";
import { annotationApi } from "../../api/annotationApi";
import {
  groupAnnotationsByKey,
  flattenToBeRows,
  generateGroupKey,
} from "./geometryUtils";
import { useUndoRedo } from "./useUndoRedo";

const DEBOUNCE_MS = 400;
const DONE_KEY = (assignmentId, itemId) =>
  `anno_done_${assignmentId}_${itemId}`;

/**
 * Annotation state management hook.
 *
 * Manages:
 * - Current item's annotations (FE model — AnnotationGroup[])
 * - CRUD with debounced batch-save to BE
 * - In-flight guard (no overlapping saves)
 * - Undo/Redo via useUndoRedo
 * - localStorage doneFlag per item
 */
export function useAnnotations({ assignmentId, assignmentStatus, addToast }) {
  const [annotations, setAnnotations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentItemIdRef = useRef(null);

  // Save infrastructure
  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const pendingSnapshotRef = useRef(null);
  const latestAnnotationsRef = useRef(annotations);
  const saveWaitersRef = useRef([]);
  latestAnnotationsRef.current = annotations;

  const resolveSaveWaiters = useCallback(() => {
    if (isSavingRef.current || pendingSnapshotRef.current) return;
    const waiters = saveWaitersRef.current;
    saveWaitersRef.current = [];
    waiters.forEach((resolve) => resolve());
  }, []);

  const waitForAllSaves = useCallback(() => {
    if (!isSavingRef.current && !pendingSnapshotRef.current) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      saveWaitersRef.current.push(resolve);
    });
  }, []);

  // ── Undo/Redo ──
  const handleUndo = useCallback(() => {
    const prev = history.undo();
    if (prev) {
      history.pushRedo(latestAnnotationsRef.current);
      setAnnotations(prev);
      debouncedSave(prev);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const next = history.redo();
    if (next) {
      history.push(latestAnnotationsRef.current);
      setAnnotations(next);
      debouncedSave(next);
    }
  }, []);

  const history = useUndoRedo({ onUndo: handleUndo, onRedo: handleRedo });

  // ── Execute Save ──
  const executeSave = useCallback(
    async (snapshot) => {
      const itemId = currentItemIdRef.current;
      if (!assignmentId || !itemId) return;

      if (isSavingRef.current) {
        // Queue latest snapshot
        pendingSnapshotRef.current = snapshot || latestAnnotationsRef.current;
        return;
      }

      isSavingRef.current = true;
      const data = snapshot || latestAnnotationsRef.current;

      try {
        const rows = flattenToBeRows(data);
        if (rows.length === 0) {
          if (import.meta.env.DEV) {
            console.log("[ANNO] skip save — no annotations for item", itemId);
          }
          return;
        }
        const isRejected = assignmentStatus?.toUpperCase() === "REJECTED";
        if (!isRejected) {
          await annotationApi.saveAnnotations(assignmentId, {
            itemId: Number(itemId),
            annotations: rows,
          });
        } else {
          // REJECTED → use fix endpoint
          await annotationApi.fixRejectedAnnotations(assignmentId, {
            itemId: Number(itemId),
            annotations: rows,
          });
        }
        if (import.meta.env.DEV) {
          console.log("[ANNO] saved", rows.length, "rows for item", itemId);
        }
      } catch (err) {
        console.error("[ANNO] save error", err);
        addToast?.({ type: "error", message: "Lưu annotation thất bại" });
      } finally {
        isSavingRef.current = false;
        // If there's a pending save, execute it
        if (pendingSnapshotRef.current) {
          const pending = pendingSnapshotRef.current;
          pendingSnapshotRef.current = null;
          executeSave(pending);
        } else {
          resolveSaveWaiters();
        }
      }
    },
    [assignmentId, assignmentStatus, addToast, resolveSaveWaiters],
  );

  // ── Debounced Save ──
  const debouncedSave = useCallback(
    (snapshot) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        executeSave(snapshot);
      }, DEBOUNCE_MS);
    },
    [executeSave],
  );

  // ── Save Now (flush) ──
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await executeSave(latestAnnotationsRef.current);
    await waitForAllSaves();
  }, [executeSave, waitForAllSaves]);

  // ── Load annotations for an item ──
  const loadAnnotations = useCallback(
    async (itemId, preloadedData) => {
      currentItemIdRef.current = itemId;
      if (!assignmentId || !itemId) {
        setAnnotations([]);
        return;
      }
      setIsLoading(true);
      try {
        // Use pre-loaded data from openWorkspace if available
        let beData = preloadedData;
        if (!beData || beData.length === 0) {
          // Fallback to API call if no pre-loaded data
          beData = await annotationApi.getAnnotationsByItem(
            assignmentId,
            itemId,
          );
        }
        const groups = groupAnnotationsByKey(beData || []);
        setAnnotations(groups);
        if (import.meta.env.DEV) {
          console.log(
            "[ANNO] loaded",
            groups.length,
            "groups for item",
            itemId,
            "from",
            preloadedData ? "workspace" : "api"
          );
        }
      } catch (err) {
        console.error("[ANNO] load error", err);
        setAnnotations([]);
      } finally {
        setIsLoading(false);
      }
    },
    [assignmentId],
  );

  // ── Add annotation ──
  const addAnnotation = useCallback(
    (shape, labelIds, allLabels) => {
      const normalizedLabelIds = Array.isArray(labelIds) && labelIds.length > 0 ? [labelIds[0]] : [];
      const groupKey = generateGroupKey();
      const labelNames = normalizedLabelIds.map((id) => {
        const l = allLabels.find((l) => l.id === id);
        return l?.name || "Unknown";
      });
      const colorCodes = normalizedLabelIds.map((id) => {
        const l = allLabels.find((l) => l.id === id);
        return l?.color || "#6b7280";
      });

      const newGroup = {
        groupKey,
        shapeType: shape.type,
        geometry: { ...shape },
        labelIds: [...normalizedLabelIds],
        labelNames,
        colorCodes,
        beReviewingIds: [],
        isHidden: false,
      };
      // Remove 'type' from geometry (it's in shapeType)
      delete newGroup.geometry.type;

      setAnnotations((prev) => {
        history.push(prev);
        const next = [...prev, newGroup];
        debouncedSave(next);
        return next;
      });
    },
    [history, debouncedSave],
  );

  // ── Delete annotation ──
  const deleteAnnotation = useCallback(
    (groupKey) => {
      const target = latestAnnotationsRef.current.find(
        (g) => g.groupKey === groupKey,
      );
      if (target?.reviewStatus === "APPROVED") {
        addToast?.({
          type: "warning",
          message: "Annotation đã được duyệt, không thể xóa",
        });
        return;
      }
      setAnnotations((prev) => {
        history.push(prev);
        const next = prev.filter((g) => g.groupKey !== groupKey);
        debouncedSave(next);
        // Auto-clear doneFlag if 0 annotations left
        if (next.length === 0 && currentItemIdRef.current) {
          localStorage.removeItem(
            DONE_KEY(assignmentId, currentItemIdRef.current),
          );
        }
        return next;
      });
    },
    [assignmentId, history, debouncedSave],
  );

  // ── Update geometry ──
  const updateGeometry = useCallback(
    (groupKey, newGeom) => {
      const target = latestAnnotationsRef.current.find(
        (g) => g.groupKey === groupKey,
      );
      if (target?.reviewStatus === "APPROVED") return;
      setAnnotations((prev) => {
        history.push(prev);
        const next = prev.map((g) =>
          g.groupKey === groupKey ? { ...g, geometry: newGeom } : g,
        );
        debouncedSave(next);
        return next;
      });
    },
    [history, debouncedSave],
  );

  // ── Update labels (relabel) ──
  const updateLabels = useCallback(
    (groupKey, labelIds, allLabels) => {
      const normalizedLabelIds = Array.isArray(labelIds) && labelIds.length > 0 ? [labelIds[0]] : [];
      const target = latestAnnotationsRef.current.find(
        (g) => g.groupKey === groupKey,
      );
      if (target?.reviewStatus === "APPROVED") return;
      const sameLabels =
        target &&
        target.labelIds.length === normalizedLabelIds.length &&
        target.labelIds.every((id, index) => id === normalizedLabelIds[index]);
      if (sameLabels) return;
      const labelNames = normalizedLabelIds.map((id) => {
        const l = allLabels.find((lb) => lb.id === id);
        return l?.name || "Unknown";
      });
      const colorCodes = normalizedLabelIds.map((id) => {
        const l = allLabels.find((lb) => lb.id === id);
        return l?.color || "#6b7280";
      });
      setAnnotations((prev) => {
        history.push(prev);
        const next = prev.map((g) =>
          g.groupKey === groupKey
            ? {
                ...g,
                labelIds: [...normalizedLabelIds],
                labelNames,
                colorCodes,
                // Only the edited annotation should leave rejected state after a real relabel.
                reviewStatus: null,
                policyName: null,
              }
            : g,
        );
        debouncedSave(next);
        return next;
      });
    },
    [history, debouncedSave],
  );

  // ── Toggle hidden ──
  const toggleHidden = useCallback((groupKey) => {
    setAnnotations((prev) =>
      prev.map((g) =>
        g.groupKey === groupKey ? { ...g, isHidden: !g.isHidden } : g,
      ),
    );
  }, []);

  // ── Mark as Done ──
  const isDone = useCallback(
    (itemId) => {
      return localStorage.getItem(DONE_KEY(assignmentId, itemId)) === "1";
    },
    [assignmentId],
  );

  const markDone = useCallback(
    (itemId) => {
      if (latestAnnotationsRef.current.length === 0) {
        addToast?.({
          type: "warning",
          message: "Cần ít nhất 1 annotation để đánh dấu Done",
        });
        return false;
      }
      const hasRejectedFeedback = latestAnnotationsRef.current.some(
        (annotation) => annotation.reviewStatus === "REJECTED",
      );
      if (hasRejectedFeedback) {
        addToast?.({
          type: "warning",
          message: "Cần xử lý annotation bị reviewer trả về trước khi đánh dấu hoàn thành",
        });
        return false;
      }
      localStorage.setItem(DONE_KEY(assignmentId, itemId), "1");
      return true;
    },
    [assignmentId, addToast],
  );

  const unmarkDone = useCallback(
    (itemId) => {
      localStorage.removeItem(DONE_KEY(assignmentId, itemId));
    },
    [assignmentId],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return {
    annotations,
    isLoading,
    loadAnnotations,
    addAnnotation,
    deleteAnnotation,
    updateGeometry,
    updateLabels,
    toggleHidden,
    saveNow,
    isDone,
    markDone,
    unmarkDone,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
