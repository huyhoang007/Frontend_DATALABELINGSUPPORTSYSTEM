import { useRef, useCallback, useEffect } from "react";

const MAX_HISTORY = 50;

/**
 * Undo/Redo hook for annotation snapshots.
 * Works with any JSON-serializable state (deep-cloned via structuredClone).
 *
 * Usage:
 *   const history = useUndoRedo();
 *   // Before mutation:
 *   history.push(currentAnnotations);
 *   // Undo:
 *   const prev = history.undo();
 *   if (prev) setAnnotations(prev);
 */
export function useUndoRedo({ onUndo, onRedo, enabled = true } = {}) {
    const undoStack = useRef([]);
    const redoStack = useRef([]);
    // Force re-render counter for canUndo/canRedo
    const forceRef = useRef(0);
    const rerender = useCallback(() => { forceRef.current++; }, []);

    /** Push a snapshot before mutation */
    const push = useCallback((snapshot) => {
        undoStack.current.push(structuredClone(snapshot));
        if (undoStack.current.length > MAX_HISTORY) {
            undoStack.current.shift();
        }
        redoStack.current = []; // clear redo on new action
    }, []);

    /** Undo → returns previous snapshot or null */
    const undo = useCallback(() => {
        if (undoStack.current.length === 0) return null;
        const snapshot = undoStack.current.pop();
        // The caller should push current state to redo before applying
        return snapshot;
    }, []);

    /** Redo → returns next snapshot or null */
    const redo = useCallback(() => {
        if (redoStack.current.length === 0) return null;
        const snapshot = redoStack.current.pop();
        return snapshot;
    }, []);

    /** Push current state to redo stack (called by consumer before undo apply) */
    const pushRedo = useCallback((snapshot) => {
        redoStack.current.push(structuredClone(snapshot));
        if (redoStack.current.length > MAX_HISTORY) {
            redoStack.current.shift();
        }
    }, []);

    const canUndo = undoStack.current.length > 0;
    const canRedo = redoStack.current.length > 0;

    /** Keyboard listener: Ctrl+Z / Ctrl+Y */
    useEffect(() => {
        if (!enabled) return;

        const handler = (e) => {
            // Guard: don't trigger in inputs/textareas/contenteditable
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === "input" || tag === "textarea" || tag === "select") return;
            if (document.activeElement?.contentEditable === "true") return;
            // Guard: don't trigger if modal is open
            if (document.querySelector("[data-label-modal]")) return;

            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                onUndo?.();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                e.preventDefault();
                onRedo?.();
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [enabled, onUndo, onRedo]);

    return { push, undo, redo, pushRedo, canUndo, canRedo };
}
