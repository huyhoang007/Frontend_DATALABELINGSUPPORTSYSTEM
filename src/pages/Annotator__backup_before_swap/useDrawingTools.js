import { useState, useRef, useCallback, useEffect } from "react";
import {
    clientToNormalized,
    clamp,
    isNewSegmentSelfIntersecting,
    isClosingSelfIntersecting,
    distPx,
} from "./geometryUtils";

const SNAP_PX = 12; // snap-to-first-point threshold in pixels
const MIN_SIZE = 0.01; // minimum bbox size (normalized)

/**
 * Drawing tools hook.
 *
 * Manages draft shape state and mouse/keyboard event handlers
 * for bbox, polygon, polyline, and points tools.
 *
 * @param {Object} opts
 * @param {string} opts.activeTool - "select"|"bbox"|"polygon"|"polyline"|"points"
 * @param {Function} opts.onShapeComplete - callback(shape) when shape is finalized
 * @param {Function} opts.addToast - toast notification
 */
export function useDrawingTools({ activeTool, onShapeComplete, addToast }) {
    // Draft shape being drawn
    const [draftShape, setDraftShape] = useState(null);

    // Polygon hold-P mode
    const [polygonHoldActive, setPolygonHoldActive] = useState(false);

    // Bbox drag state
    const isDragging = useRef(false);
    const startPt = useRef(null);
    const shiftRef = useRef(false);

    // Cursor position for preview lines
    const [cursorPt, setCursorPt] = useState(null);

    // SVG rect ref (set externally via returned ref)
    const svgRectRef = useRef(null);

    // Reset draft on tool change
    useEffect(() => {
        setDraftShape(null);
        setCursorPt(null);
        isDragging.current = false;
        setPolygonHoldActive(false);
    }, [activeTool]);

    const getNorm = useCallback((e) => {
        const rect = svgRectRef.current;
        if (!rect) return null;
        return clientToNormalized(e.clientX, e.clientY, rect);
    }, []);

    // ── Snap detection for polygon ──
    const isNearFirstPoint = useCallback((pt, points) => {
        if (!points || points.length < 3) return false;
        const rect = svgRectRef.current;
        if (!rect) return false;
        return distPx(pt, points[0], rect) < SNAP_PX;
    }, []);

    // ──────────────────────────────
    // MOUSE HANDLERS
    // ──────────────────────────────

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return; // left click only
        const pt = getNorm(e);
        if (!pt) return;

        if (activeTool === "bbox") {
            isDragging.current = true;
            startPt.current = pt;
            shiftRef.current = e.shiftKey;
            setDraftShape({
                type: "bbox",
                x: pt.x, y: pt.y, w: 0, h: 0,
            });
        }
    }, [activeTool, getNorm]);

    const handleMouseMove = useCallback((e) => {
        const pt = getNorm(e);
        if (!pt) return;

        // Update cursor for preview lines
        if (activeTool === "polygon" || activeTool === "polyline" || activeTool === "points") {
            setCursorPt(pt);
        }

        if (activeTool === "bbox" && isDragging.current && startPt.current) {
            const s = startPt.current;
            let dx = pt.x - s.x;
            let dy = pt.y - s.y;

            // Shift = square constraint
            if (e.shiftKey) {
                const size = Math.max(Math.abs(dx), Math.abs(dy));
                dx = dx >= 0 ? size : -size;
                dy = dy >= 0 ? size : -size;
            }

            const x = dx >= 0 ? s.x : s.x + dx;
            const y = dy >= 0 ? s.y : s.y + dy;
            const w = Math.abs(dx);
            const h = Math.abs(dy);

            setDraftShape({
                type: "bbox",
                x: clamp(x, 0, 1),
                y: clamp(y, 0, 1),
                w: clamp(w, 0, 1 - clamp(x, 0, 1)),
                h: clamp(h, 0, 1 - clamp(y, 0, 1)),
            });
        }
    }, [activeTool, getNorm]);

    const handleMouseUp = useCallback((e) => {
        if (activeTool === "bbox" && isDragging.current) {
            isDragging.current = false;
            const draft = draftShape; // capture current
            if (draft && draft.w > MIN_SIZE && draft.h > MIN_SIZE) {
                onShapeComplete?.({ ...draft });
            }
            setDraftShape(null);
            startPt.current = null;
        }
    }, [activeTool, draftShape, onShapeComplete]);

    const handleClick = useCallback((e) => {
        if (e.button !== 0) return;
        const pt = getNorm(e);
        if (!pt) return;

        // ── Polygon tool ──
        if (activeTool === "polygon") {
            setDraftShape((prev) => {
                const points = prev?.points || [];

                // Snap to first point → close polygon
                if (points.length >= 3 && isNearFirstPoint(pt, points)) {
                    if (isClosingSelfIntersecting(points)) {
                        addToast?.({ type: "warning", message: "Polygon không được tự cắt nhau" });
                        return prev;
                    }
                    const shape = { type: "polygon", points: [...points], closed: true };
                    // Defer to avoid setState-in-setState
                    setTimeout(() => onShapeComplete?.(shape), 0);
                    return null;
                }

                // Check self-intersection
                if (points.length >= 2 && isNewSegmentSelfIntersecting(points, pt)) {
                    addToast?.({ type: "warning", message: "Polygon không được tự cắt nhau" });
                    return prev;
                }

                return { type: "polygon", points: [...points, pt] };
            });
        }

        // ── Polyline tool ──
        if (activeTool === "polyline") {
            setDraftShape((prev) => {
                const points = prev?.points || [];
                return { type: "polyline", points: [...points, pt] };
            });
        }

        // ── Points tool ──
        if (activeTool === "points") {
            setDraftShape((prev) => {
                const points = prev?.points || [];
                return { type: "points", points: [...points, pt] };
            });
        }
    }, [activeTool, getNorm, isNearFirstPoint, onShapeComplete, addToast]);

    // ──────────────────────────────
    // KEYBOARD HANDLERS
    // ──────────────────────────────

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Guard: skip in inputs
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === "input" || tag === "textarea" || tag === "select") return;
            if (document.querySelector("[data-label-modal]")) return;

            // Polygon hold-P mode: keyDown
            if (activeTool === "polygon" && e.key.toLowerCase() === "p" && !e.repeat) {
                setPolygonHoldActive(true);
            }

            // Enter to finalize polyline/points
            if (e.key === "Enter") {
                if (activeTool === "polyline" && draftShape?.points?.length >= 2) {
                    e.preventDefault();
                    const shape = {
                        type: "polyline",
                        points: [...draftShape.points],
                        closed: true,
                        strokeWidth: 3,
                    };
                    onShapeComplete?.(shape);
                    setDraftShape(null);
                }
                if (activeTool === "points" && draftShape?.points?.length >= 2) {
                    e.preventDefault();
                    const shape = {
                        type: "points",
                        points: [...draftShape.points],
                    };
                    onShapeComplete?.(shape);
                    setDraftShape(null);
                }
                // Polygon: Enter to close if >=3 points
                if (activeTool === "polygon" && draftShape?.points?.length >= 3) {
                    e.preventDefault();
                    if (isClosingSelfIntersecting(draftShape.points)) {
                        addToast?.({ type: "warning", message: "Polygon không được tự cắt nhau" });
                        return;
                    }
                    const shape = { type: "polygon", points: [...draftShape.points], closed: true };
                    onShapeComplete?.(shape);
                    setDraftShape(null);
                }
            }

            // Escape to cancel draft
            if (e.key === "Escape" && draftShape) {
                setDraftShape(null);
                setCursorPt(null);
            }
        };

        const handleKeyUp = (e) => {
            // Polygon hold-P mode: keyUp → auto-close
            if (e.key.toLowerCase() === "p" && polygonHoldActive) {
                setPolygonHoldActive(false);
                if (draftShape?.type === "polygon") {
                    if (draftShape.points.length >= 3) {
                        if (isClosingSelfIntersecting(draftShape.points)) {
                            addToast?.({ type: "warning", message: "Polygon không được tự cắt nhau" });
                            setDraftShape(null);
                            return;
                        }
                        const shape = { type: "polygon", points: [...draftShape.points], closed: true };
                        onShapeComplete?.(shape);
                    }
                    // <3 points → cancel
                    setDraftShape(null);
                    setCursorPt(null);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [activeTool, draftShape, polygonHoldActive, onShapeComplete, addToast]);

    return {
        draftShape,
        cursorPt,
        polygonHoldActive,
        svgRectRef,    // caller should set this: svgRectRef.current = svgEl.getBoundingClientRect()
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleClick,
    };
}
