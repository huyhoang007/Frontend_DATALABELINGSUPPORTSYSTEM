import { useEffect } from "react";

/**
 * Global keyboard shortcuts for the annotation workspace.
 *
 * Shortcuts:
 *  Tool switching:
 *    B → bbox
 *    G → polygon
 *    L → polyline
 *    K → points
 *    S / V → select
 *
 *  Annotation actions:
 *    Delete / Backspace → delete selected annotation
 *    H                  → toggle hide selected annotation
 *
 *  Navigation:
 *    ArrowRight / D     → next image
 *    ArrowLeft  / A     → prev image
 *
 *  Zoom:
 *    + / =              → zoom in
 *    - / _              → zoom out
 *    0                  → reset zoom to 100%
 *
 *  Workspace:
 *    Ctrl+Enter         → submit assignment
 *
 * Note: Ctrl+Z / Ctrl+Y (undo/redo) are handled by useUndoRedo.
 *       Escape / Enter / P are handled by useDrawingTools.
 */
export function useKeyboardShortcuts({
    isReadOnly,
    activeTool,
    setActiveTool,
    selectedGroupKey,
    setSelectedGroupKey,
    deleteAnnotation,
    toggleHidden,
    goToNext,
    goToPrev,
    setZoom,
    onSubmit,
    modalOpen, // true when any modal is open (label modal, confirm dialog...)
}) {
    useEffect(() => {
        const handler = (e) => {
            // Skip when typing in inputs or modal is open
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === "input" || tag === "textarea" || tag === "select") return;
            if (modalOpen) return;

            const key = e.key;

            // ── Tool switching (no modifier) ──
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                switch (key.toLowerCase()) {
                    case "b":
                        if (!isReadOnly) { setActiveTool("bbox"); setSelectedGroupKey(null); }
                        return;
                    case "g":
                        if (!isReadOnly) { setActiveTool("polygon"); setSelectedGroupKey(null); }
                        return;
                    case "l":
                        if (!isReadOnly) { setActiveTool("polyline"); setSelectedGroupKey(null); }
                        return;
                    case "k":
                        if (!isReadOnly) { setActiveTool("points"); setSelectedGroupKey(null); }
                        return;
                    case "s":
                    case "v":
                        setActiveTool("select");
                        return;

                    // ── Delete selected annotation ──
                    case "delete":
                    case "backspace":
                        if (!isReadOnly && selectedGroupKey) {
                            deleteAnnotation?.(selectedGroupKey);
                            setSelectedGroupKey(null);
                        }
                        return;

                    // ── Toggle hide selected annotation ──
                    case "h":
                        if (selectedGroupKey) {
                            toggleHidden?.(selectedGroupKey);
                        }
                        return;

                    // ── Navigate images ──
                    case "arrowright":
                    case "d":
                        e.preventDefault();
                        goToNext?.();
                        return;
                    case "arrowleft":
                    case "a":
                        e.preventDefault();
                        goToPrev?.();
                        return;

                    // ── Zoom ──
                    case "+":
                    case "=":
                        setZoom?.((z) => Math.min(400, z + 10));
                        return;
                    case "-":
                    case "_":
                        setZoom?.((z) => Math.max(10, z - 10));
                        return;
                    case "0":
                        setZoom?.(100);
                        return;
                }
            }

            // ── Ctrl+Enter → Submit ──
            if ((e.ctrlKey || e.metaKey) && key === "Enter") {
                if (!isReadOnly) {
                    e.preventDefault();
                    onSubmit?.();
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [
        isReadOnly, activeTool, selectedGroupKey, modalOpen,
        setActiveTool, setSelectedGroupKey,
        deleteAnnotation, toggleHidden,
        goToNext, goToPrev, setZoom, onSubmit,
    ]);
}
