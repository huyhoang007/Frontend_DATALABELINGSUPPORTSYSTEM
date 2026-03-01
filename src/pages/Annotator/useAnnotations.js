import { useState, useRef, useCallback, useEffect } from "react";
import { annotationApi } from "../../api/annotationApi";
import {
    groupAnnotationsByKey,
    flattenToBeRows,
    generateGroupKey,
} from "./geometryUtils";
import { useUndoRedo } from "./useUndoRedo";

/** Safely extract an array from any BE response shape */
function unwrapArray(data) {
    if (Array.isArray(data)) return data;
    if (data == null || typeof data !== "object") return [];
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.content)) return data.content;
    if (data.data && typeof data.data === "object") {
        if (Array.isArray(data.data.data)) return data.data.data;
        if (Array.isArray(data.data.content)) return data.data.content;
    }
    return [];
}

const DEBOUNCE_MS = 400;
const DONE_KEY = (assignmentId, itemId) => `anno_done_${assignmentId}_${itemId}`;

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
export function useAnnotations({ assignmentId, addToast }) {
    const [annotations, setAnnotations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const currentItemIdRef = useRef(null);
    const requestIdRef = useRef(0);

    // Save infrastructure
    const saveTimeoutRef = useRef(null);
    const isSavingRef = useRef(false);
    const pendingSnapshotRef = useRef(null);
    const latestAnnotationsRef = useRef(annotations);
    latestAnnotationsRef.current = annotations;

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
    const executeSave = useCallback(async (snapshot) => {
        const itemId = currentItemIdRef.current;
        if (!assignmentId || !itemId) return;

        if (isSavingRef.current) {
            // Queue latest snapshot
            pendingSnapshotRef.current = snapshot || latestAnnotationsRef.current;
            return;
        }

        isSavingRef.current = true;
        const data = snapshot || latestAnnotationsRef.current;
        if (!Array.isArray(data)) { isSavingRef.current = false; return; }

        try {
            const rows = flattenToBeRows(data);
            await annotationApi.saveAnnotations(assignmentId, {
                itemId: Number(itemId),
                annotations: rows,
            });
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
            }
        }
    }, [assignmentId, addToast]);

    // ── Debounced Save ──
    const debouncedSave = useCallback((snapshot) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            executeSave(snapshot);
        }, DEBOUNCE_MS);
    }, [executeSave]);

    // ── Save Now (flush) ──
    const saveNow = useCallback(async () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        await executeSave(latestAnnotationsRef.current);
    }, [executeSave]);

    // ── Load annotations for an item ──
    const loadAnnotations = useCallback(async (itemId) => {
        currentItemIdRef.current = itemId;
        if (!assignmentId || !itemId) {
            setAnnotations([]);
            setLoadError(null);
            return;
        }

        // Race guard: only apply result for latest request
        const myId = ++requestIdRef.current;

        setIsLoading(true);
        setLoadError(null);
        try {
            const beData = await annotationApi.getAnnotationsByItem(assignmentId, itemId);

            // Stale response guard
            if (myId !== requestIdRef.current) return;

            const rawArr = unwrapArray(beData);
            let groups;
            try {
                groups = groupAnnotationsByKey(rawArr);
            } catch (parseErr) {
                console.error("[ANNOT_WORKSPACE] groupAnnotationsByKey failed", parseErr);
                groups = [];
                setLoadError(parseErr);
            }
            setAnnotations(groups);
            if (import.meta.env.DEV) {
                console.log("[ANNO] loaded", groups.length, "groups for item", itemId);
            }
        } catch (err) {
            if (myId !== requestIdRef.current) return;
            console.error("[ANNOT_WORKSPACE] loadAnnotations failed", err);
            setAnnotations([]);
            setLoadError(err);
        } finally {
            if (myId === requestIdRef.current) {
                setIsLoading(false);
            }
        }
    }, [assignmentId]);

    // ── Add annotation ──
    const addAnnotation = useCallback((shape, labelIds, allLabels) => {
        const groupKey = generateGroupKey();
        const labelNames = labelIds.map((id) => {
            const l = allLabels.find((l) => l.id === id);
            return l?.name || "Unknown";
        });
        const colorCodes = labelIds.map((id) => {
            const l = allLabels.find((l) => l.id === id);
            return l?.color || "#6b7280";
        });

        const newGroup = {
            groupKey,
            shapeType: shape.type,
            geometry: { ...shape },
            labelIds: [...labelIds],
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
    }, [history, debouncedSave]);

    // ── Delete annotation ──
    const deleteAnnotation = useCallback((groupKey) => {
        setAnnotations((prev) => {
            history.push(prev);
            const next = prev.filter((g) => g.groupKey !== groupKey);
            debouncedSave(next);
            // Auto-clear doneFlag if 0 annotations left
            if (next.length === 0 && currentItemIdRef.current) {
                localStorage.removeItem(DONE_KEY(assignmentId, currentItemIdRef.current));
            }
            return next;
        });
    }, [assignmentId, history, debouncedSave]);

    // ── Update geometry ──
    const updateGeometry = useCallback((groupKey, newGeom) => {
        setAnnotations((prev) => {
            history.push(prev);
            const next = prev.map((g) =>
                g.groupKey === groupKey ? { ...g, geometry: newGeom } : g
            );
            debouncedSave(next);
            return next;
        });
    }, [history, debouncedSave]);

    // ── Toggle hidden ──
    const toggleHidden = useCallback((groupKey) => {
        setAnnotations((prev) =>
            prev.map((g) =>
                g.groupKey === groupKey ? { ...g, isHidden: !g.isHidden } : g
            )
        );
    }, []);

    // ── Mark as Done ──
    const isDone = useCallback((itemId) => {
        return localStorage.getItem(DONE_KEY(assignmentId, itemId)) === "1";
    }, [assignmentId]);

    const markDone = useCallback((itemId) => {
        if (latestAnnotationsRef.current.length === 0) {
            addToast?.({ type: "warning", message: "Cần ít nhất 1 annotation để đánh dấu Done" });
            return false;
        }
        localStorage.setItem(DONE_KEY(assignmentId, itemId), "1");
        return true;
    }, [assignmentId, addToast]);

    const unmarkDone = useCallback((itemId) => {
        localStorage.removeItem(DONE_KEY(assignmentId, itemId));
    }, [assignmentId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    return {
        annotations,
        isLoading,
        loadError,
        loadAnnotations,
        addAnnotation,
        deleteAnnotation,
        updateGeometry,
        toggleHidden,
        saveNow,
        isDone,
        markDone,
        unmarkDone,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
    };
}
