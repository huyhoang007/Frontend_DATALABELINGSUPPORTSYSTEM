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
}) {
    const svgRef = React.useRef(null);
    const [dragState, setDragState] = React.useState(null);
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
        if (activeTool !== "select") return;
        if (group.groupKey !== selectedGroupKey) return;
        e.stopPropagation();
        e.preventDefault();
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const pt = clientToNormalized(e.clientX, e.clientY, rect);
        setDragState({
            groupKey: group.groupKey,
            vertexIdx: null, // whole shape
            startPt: pt,
            startGeom: structuredClone(group.geometry),
        });
    }, [activeTool, selectedGroupKey]);

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
            } else if (dragState.vertexIdx === null) {
                // Drag whole shape
                if (geom.points) {
                    const newPoints = geom.points.map((p) => ({
                        x: clamp(p.x + dx, 0, 1),
                        y: clamp(p.y + dy, 0, 1),
                    }));
                    newGeom = { ...geom, points: newPoints };
                } else if (geom.x !== undefined) {
                    // bbox
                    newGeom = {
                        ...geom,
                        x: clamp(geom.x + dx, 0, 1 - geom.w),
                        y: clamp(geom.y + dy, 0, 1 - geom.h),
                    };
                }
            }

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
        if (activeTool === "select") {
            // Click on empty space → deselect
            onSelect?.(null);
        }
        drawingHandlers?.handleMouseDown?.(e);
    };
    const onMouseMove = (e) => {
        // update svgRect for drawing tools
        if (svgRef.current && drawingHandlers?.svgRectRef) {
            drawingHandlers.svgRectRef.current = svgRef.current.getBoundingClientRect();
        }
        drawingHandlers?.handleMouseMove?.(e);
    };
    const onMouseUp = (e) => drawingHandlers?.handleMouseUp?.(e);
    const onClick = (e) => drawingHandlers?.handleClick?.(e);

    // ── Render helpers ──
    const pct = (v) => `${v * 100}%`;

    const renderShape = (group, isSelected, isDraft = false) => {
        const geom = group.geometry;
        const color = group.colorCodes?.[0] || "#6b7280";
        const strokeW = isSelected ? 3 : 2;
        const fillOpacity = isDraft ? 0.1 : 0.08;
        const dashArray = isDraft ? "6 4" : "none";

        const sharedProps = {
            stroke: color,
            strokeWidth: strokeW,
            fill: `${color}${Math.round(fillOpacity * 255).toString(16).padStart(2, "0")}`,
            vectorEffect: "non-scaling-stroke",
            strokeDasharray: dashArray,
            style: { cursor: activeTool === "select" ? "pointer" : "crosshair" },
        };

        // ── BBOX ──
        if (group.shapeType === "bbox" && geom.x !== undefined) {
            return (
                <g key={group.groupKey || "draft"}>
                    <rect
                        x={pct(geom.x)} y={pct(geom.y)}
                        width={pct(geom.w)} height={pct(geom.h)}
                        {...sharedProps}
                        pointerEvents={activeTool === "select" ? "all" : "none"}
                        onMouseDown={(e) => {
                            handleShapeMouseDown(e, group);
                            if (isSelected) handleWholeDragStart(e, group);
                        }}
                    />
                    {/* Corner handles for selected bbox */}
                    {isSelected && activeTool === "select" && (
                        <>
                            {[[geom.x, geom.y], [geom.x + geom.w, geom.y], [geom.x, geom.y + geom.h], [geom.x + geom.w, geom.y + geom.h]].map(([cx, cy], i) => (
                                <circle key={i} cx={pct(cx)} cy={pct(cy)} r="5"
                                    fill="white" stroke={color} strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
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
            const pts = geom.points.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(" ");
            return (
                <g key={group.groupKey || "draft"}>
                    <polygon points={pts} {...sharedProps}
                        pointerEvents={activeTool === "select" ? "all" : "none"}
                        onMouseDown={(e) => {
                            handleShapeMouseDown(e, group);
                            if (isSelected) handleWholeDragStart(e, group);
                        }}
                    />
                    {isSelected && activeTool === "select" && geom.points.map((p, i) => (
                        <circle key={i} cx={pct(p.x)} cy={pct(p.y)} r="5"
                            fill="white" stroke={color} strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
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
            const sw = geom.strokeWidth || 3;
            const pts = geom.points.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(" ");
            const El = geom.closed ? "polygon" : "polyline";
            return (
                <g key={group.groupKey || "draft"}>
                    <El points={pts}
                        {...sharedProps}
                        strokeWidth={sw}
                        fill={geom.closed ? `${color}10` : "none"}
                        pointerEvents={activeTool === "select" ? "all" : "none"}
                        onMouseDown={(e) => {
                            handleShapeMouseDown(e, group);
                            if (isSelected) handleWholeDragStart(e, group);
                        }}
                    />
                    {isSelected && activeTool === "select" && geom.points.map((p, i) => (
                        <circle key={i} cx={pct(p.x)} cy={pct(p.y)} r="5"
                            fill="white" stroke={color} strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                            style={{ cursor: "move" }}
                            pointerEvents="all"
                            onMouseDown={(e) => handleVertexMouseDown(e, group, i)}
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
                            points={geom.points.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(" ")}
                            stroke={color} strokeWidth="1" fill="none" strokeDasharray="4 3"
                            vectorEffect="non-scaling-stroke"
                            opacity={0.5}
                            pointerEvents="none"
                        />
                    )}
                    {geom.points.map((p, i) => (
                        <circle key={i} cx={pct(p.x)} cy={pct(p.y)}
                            r={isSelected ? 6 : 4}
                            fill={color} stroke="white" strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                            style={{ cursor: activeTool === "select" ? "move" : "crosshair" }}
                            pointerEvents={activeTool === "select" ? "all" : "none"}
                            onMouseDown={(e) => {
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
            return (
                <g key="_draft">
                    {/* Existing segments */}
                    {pts.length > 1 && (
                        <polyline
                            points={pts.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(" ")}
                            stroke={color} strokeWidth="2" fill="none"
                            strokeDasharray="6 4"
                            vectorEffect="non-scaling-stroke"
                            pointerEvents="none"
                        />
                    )}
                    {/* Preview line to cursor */}
                    {cursorPt && pts.length > 0 && (
                        <line
                            x1={pct(pts[pts.length - 1].x)} y1={pct(pts[pts.length - 1].y)}
                            x2={pct(cursorPt.x)} y2={pct(cursorPt.y)}
                            stroke={color} strokeWidth="1.5" strokeDasharray="4 3"
                            vectorEffect="non-scaling-stroke"
                            pointerEvents="none" opacity={0.6}
                        />
                    )}
                    {/* Vertex dots */}
                    {pts.map((p, i) => (
                        <circle key={i} cx={pct(p.x)} cy={pct(p.y)}
                            r={i === 0 && draftShape.type === "polygon" && pts.length >= 3 ? 7 : 4}
                            fill={i === 0 && draftShape.type === "polygon" && pts.length >= 3 ? "#22c55e" : color}
                            stroke="white" strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                            pointerEvents="none"
                        />
                    ))}
                </g>
            );
        }

        return null;
    };

    const cursorStyle = activeTool === "select" ? "default"
        : activeTool === "bbox" ? "crosshair"
            : "crosshair";

    return (
        <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            style={{ cursor: cursorStyle, zIndex: 10 }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
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
