import * as React from "react";
import { clientToNormalized, clamp } from "./geometryUtils";

/**
 * SVG annotation overlay.
 * Renders finalized annotations + draft shape + select-mode handles.
 * All coordinates are normalized (0..1) rendered as SVG percentages.
 */
export default function AnnotationOverlay({
    annotations,         // AnnotationGroup[]
    draftShape,          // from useDrawingTools
    cursorPt,            // cursor position for preview lines
    activeTool,
    selectedGroupKey,
    activeLabelFilterId,
    onSelect,            // (groupKey) => void
    onUpdateGeometry,    // (groupKey, newGeom) => void
    drawingHandlers,     // { handleMouseDown, handleMouseMove, handleMouseUp, handleClick, svgRectRef }
    readOnly,            // boolean
}) {
    const svgRef = React.useRef(null);
    const [dragState, setDragState] = React.useState(null);
    const [svgSize, setSvgSize] = React.useState({ w: 1, h: 1 });

    // Track actual SVG pixel dimensions so circles stay circular
    React.useEffect(() => {
        if (!svgRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) setSvgSize({ w: width, h: height });
            }
        });
        ro.observe(svgRef.current);
        // initial size
        const rect = svgRef.current.getBoundingClientRect();
        if (rect.width > 0) setSvgSize({ w: rect.width, h: rect.height });
        return () => ro.disconnect();
    }, []);
    // dragState: { groupKey, vertexIdx: number|null (null=whole shape), startPt, startGeom }

    // Keep svgRectRef updated for drawing tools
    React.useEffect(() => {
        const update = () => {
            if (svgRef.current && drawingHandlers?.svgRectRef) {
                drawingHandlers.svgRectRef.current = svgRef.current.getBoundingClientRect();
            }
        };
        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
        };
    }, [drawingHandlers]);

    // ── Filter annotations by label ──
    const visibleAnnotations = React.useMemo(() => {
        let list = annotations.filter((a) => !a.isHidden);
        if (activeLabelFilterId) {
            list = list.filter((a) => a.labelIds.includes(activeLabelFilterId));
        }
        return list;
    }, [annotations, activeLabelFilterId]);

    // ── Select tool handlers ──
    const handleShapeMouseDown = React.useCallback((e, group) => {
        if (activeTool !== "select") return;
        e.stopPropagation();
        onSelect?.(group.groupKey);
    }, [activeTool, onSelect]);

    const handleVertexMouseDown = React.useCallback((e, group, vertexIdx) => {
        if (activeTool !== "select") return;
        if (group.reviewStatus === "APPROVED") return;
        e.stopPropagation();
        e.preventDefault();
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const pt = clientToNormalized(e.clientX, e.clientY, rect);
        setDragState({
            groupKey: group.groupKey,
            vertexIdx,
            startPt: pt,
            startGeom: structuredClone(group.geometry),
        });
    }, [activeTool]);

    const handleWholeDragStart = React.useCallback((e, group) => {
        // Disabled: shapes cannot be moved after drawing
        return;
    }, []);

    // Global mouse move/up for drag
    React.useEffect(() => {
        if (!dragState) return;

        const handleMove = (e) => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;
            const pt = clientToNormalized(e.clientX, e.clientY, rect);
            const dx = pt.x - dragState.startPt.x;
            const dy = pt.y - dragState.startPt.y;
            const geom = dragState.startGeom;

            const group = annotations.find((g) => g.groupKey === dragState.groupKey);
            if (!group) return;

            let newGeom;
            if (dragState.vertexIdx !== null && geom.points) {
                // Drag single vertex
                const newPoints = geom.points.map((p, i) =>
                    i === dragState.vertexIdx
                        ? { x: clamp(p.x + dx, 0, 1), y: clamp(p.y + dy, 0, 1) }
                        : { ...p }
                );
                newGeom = { ...geom, points: newPoints };
            }
            // Note: whole-shape drag is disabled

            if (newGeom) {
                onUpdateGeometry?.(dragState.groupKey, newGeom);
            }
        };

        const handleUp = () => setDragState(null);

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [dragState, annotations, onUpdateGeometry]);

    // ── Combined mouse handlers ──
    const onMouseDown = (e) => {
        if (readOnly) return;
        if (activeTool === "select") {
            // Click on empty space → deselect
            onSelect?.(null);
        }
        drawingHandlers?.handleMouseDown?.(e);
    };
    const onMouseMove = (e) => {
        if (readOnly) return;
        // update svgRect for drawing tools
        if (svgRef.current && drawingHandlers?.svgRectRef) {
            drawingHandlers.svgRectRef.current = svgRef.current.getBoundingClientRect();
        }
        drawingHandlers?.handleMouseMove?.(e);
    };
    const onMouseUp = (e) => {
        if (readOnly) return;
        drawingHandlers?.handleMouseUp?.(e);
    };
    const onClick = (e) => {
        if (readOnly) return;
        drawingHandlers?.handleClick?.(e);
    };

    // ── Render helpers ──
    // Convert normalized (0‥1) coord to actual SVG pixel value
    const px = (v, axis) => v * (axis === "y" ? svgSize.h : svgSize.w);
    const pxPts = (points) => points.map((p) => `${px(p.x, "x")},${px(p.y, "y")}`).join(" ");

    const renderShape = (group, isSelected, isDraft = false) => {
        const geom = group.geometry;
        const color = group.colorCodes?.[0] || "#6b7280";
        const isLocked = group.reviewStatus === "APPROVED";
        const isRejected = group.reviewStatus === "REJECTED";
        const displayColor = isLocked ? "#22c55e" : isRejected ? "#ef4444" : color;
        const strokeW = isSelected ? 3 : 2;
        const fillOpacity = isDraft ? 0.15 : isLocked ? 0.25 : 0.22;
        const dashArray = isDraft ? "6 4" : "none";

        const sharedProps = {
            stroke: displayColor,
            strokeWidth: strokeW,
            fill: `${displayColor}${Math.round(fillOpacity * 255).toString(16).padStart(2, "0")}`,
            strokeDasharray: dashArray,
            style: { cursor: isLocked ? "not-allowed" : activeTool === "select" ? "pointer" : "crosshair" },
        };

        // ── BBOX ──
        if (group.shapeType === "bbox" && geom.x !== undefined) {
            return (
                <g key={group.groupKey || "draft"}>
                    <rect
                        x={px(geom.x, "x")} y={px(geom.y, "y")}
                        width={px(geom.w, "x")} height={px(geom.h, "y")}
                        {...sharedProps}
                        pointerEvents={(activeTool === "select" && !readOnly) ? "all" : "none"}
                        onMouseDown={(e) => {
                            if (readOnly) return;
                            handleShapeMouseDown(e, group);
                            if (isSelected) handleWholeDragStart(e, group);
                        }}
                    />
                    {/* Corner handles for selected bbox */}
                    {isSelected && activeTool === "select" && !readOnly && !isLocked && (
                        <>
                            {[[geom.x, geom.y], [geom.x + geom.w, geom.y], [geom.x, geom.y + geom.h], [geom.x + geom.w, geom.y + geom.h]].map(([cx, cy], i) => (
                                <circle key={i} cx={px(cx, "x")} cy={px(cy, "y")} r={5}
                                    fill="white" stroke={color} strokeWidth={2}
                                    style={{ cursor: "move" }}
                                    pointerEvents="all"
                                />
                            ))}
                        </>
                    )}
                </g>
            );
        }

        // ── POLYGON ──
        if ((group.shapeType === "polygon") && geom.points) {
            return (
                <g key={group.groupKey || "draft"}>
                    <polygon points={pxPts(geom.points)} {...sharedProps}
                        pointerEvents={(activeTool === "select" && !readOnly) ? "all" : "none"}
                        onMouseDown={(e) => {
                            if (readOnly) return;
                            handleShapeMouseDown(e, group);
                            if (isSelected) handleWholeDragStart(e, group);
                        }}
                    />
                    {isSelected && activeTool === "select" && !readOnly && !isLocked && geom.points.map((p, i) => (
                        <circle key={i} cx={px(p.x, "x")} cy={px(p.y, "y")} r={5}
                            fill="white" stroke={color} strokeWidth={2}
                            style={{ cursor: "move" }}
                            pointerEvents="all"
                            onMouseDown={(e) => handleVertexMouseDown(e, group, i)}
                        />
                    ))}
                </g>
            );
        }

        // ── POLYLINE ──
        if (group.shapeType === "polyline" && geom.points) {
            const sw = geom.strokeWidth || 2;
            const El = geom.closed ? "polygon" : "polyline";
            return (
                <g key={group.groupKey || "draft"}>
                    <El points={pxPts(geom.points)}
                        {...sharedProps}
                        strokeWidth={sw}
                        fill={geom.closed ? `${color}10` : "none"}
                        pointerEvents={(activeTool === "select" && !readOnly) ? "all" : "none"}
                        onMouseDown={(e) => {
                            if (readOnly) return;
                            handleShapeMouseDown(e, group);
                            if (isSelected) handleWholeDragStart(e, group);
                        }}
                    />
                    {/* Always show vertex dots for polylines */}
                    {!readOnly && !isLocked && geom.points.map((p, i) => (
                        <circle key={i} cx={px(p.x, "x")} cy={px(p.y, "y")} r={isSelected ? 6 : 4}
                            fill={color} stroke="white" strokeWidth={1.5}
                            style={{ cursor: activeTool === "select" ? "move" : "crosshair" }}
                            pointerEvents={activeTool === "select" ? "all" : "none"}
                            onMouseDown={(e) => {
                                if (activeTool === "select") handleVertexMouseDown(e, group, i);
                            }}
                        />
                    ))}
                </g>
            );
        }

        // ── POINTS ──
        if (group.shapeType === "points" && geom.points) {
            return (
                <g key={group.groupKey || "draft"}>
                    {/* Connecting lines */}
                    {geom.points.length > 1 && (
                        <polyline
                            points={pxPts(geom.points)}
                            stroke={color} strokeWidth={1} fill="none" strokeDasharray="4 3"
                            opacity={0.5}
                            pointerEvents="none"
                        />
                    )}
                    {geom.points.map((p, i) => (
                        <circle key={i} cx={px(p.x, "x")} cy={px(p.y, "y")}
                            r={isSelected ? 6 : 4}
                            fill={color} stroke="white" strokeWidth={1.5}
                            style={{ cursor: (activeTool === "select" && !readOnly) ? "move" : "crosshair" }}
                            pointerEvents={(activeTool === "select" && !readOnly) ? "all" : "none"}
                            onMouseDown={(e) => {
                                if (readOnly) return;
                                handleShapeMouseDown(e, group);
                                if (isSelected) handleVertexMouseDown(e, group, i);
                            }}
                        />
                    ))}
                </g>
            );
        }

        return null;
    };

    // ── Render draft shape ──
    const renderDraft = () => {
        if (!draftShape) return null;

        if (draftShape.type === "bbox") {
            return renderShape({ groupKey: "_draft", shapeType: "bbox", geometry: draftShape, colorCodes: ["#3b82f6"] }, false, true);
        }

        if (draftShape.type === "polygon" || draftShape.type === "polyline" || draftShape.type === "points") {
            const pts = draftShape.points || [];
            if (pts.length === 0) return null;

            const color = "#3b82f6";
            const isFreehandPolygon = draftShape.type === "polygon" && pts.length >= 3;

            return (
                <g key="_draft">
                    {/* Polygon: filled shape (looks like a real annotation while drawing) */}
                    {isFreehandPolygon && (
                        <polygon
                            points={pxPts(pts)}
                            fill={`${color}30`}
                            stroke={color}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            pointerEvents="none"
                        />
                    )}

                    {/* Polyline / polygon with < 3 pts: dashed segments */}
                    {!isFreehandPolygon && pts.length > 1 && (
                        <polyline
                            points={pxPts(pts)}
                            stroke={color} strokeWidth={2} fill="none"
                            strokeDasharray="6 4"
                            pointerEvents="none"
                        />
                    )}

                    {/* Preview line to cursor (click mode) */}
                    {cursorPt && pts.length > 0 && !isFreehandPolygon && (
                        <line
                            x1={px(pts[pts.length - 1].x, "x")} y1={px(pts[pts.length - 1].y, "y")}
                            x2={px(cursorPt.x, "x")} y2={px(cursorPt.y, "y")}
                            stroke={color} strokeWidth={1.5} strokeDasharray="4 3"
                            pointerEvents="none" opacity={0.6}
                        />
                    )}

                    {/* Vertex dots */}
                    {pts.map((p, i) => {
                        const isFirst = i === 0 && draftShape.type === "polygon" && pts.length >= 3;
                        return (
                            <circle key={i} cx={px(p.x, "x")} cy={px(p.y, "y")}
                                r={isFirst ? 7 : isFreehandPolygon ? 3 : 4}
                                fill={isFirst ? "#22c55e" : color}
                                stroke="white" strokeWidth={1.5}
                                pointerEvents="none"
                            />
                        );
                    })}
                </g>
            );
        }

        return null;
    };

    const cursorStyle = readOnly ? "default" : activeTool === "select" ? "default"
        : activeTool === "bbox" ? "crosshair"
            : "crosshair";

    return (
        <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            style={{ cursor: cursorStyle, zIndex: 10, overflow: "visible" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onClick={onClick}
        >
            {/* Finalized annotations */}
            {visibleAnnotations.map((group) =>
                renderShape(group, group.groupKey === selectedGroupKey, false)
            )}
            {/* Draft shape */}
            {renderDraft()}
        </svg>
    );
}
