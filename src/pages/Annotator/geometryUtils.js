/**
 * Geometry utilities for annotation tools.
 * All coordinates are normalized 0..1 relative to image bounds.
 */

/* ── Coordinate conversion ── */

/** Convert client (mouse) coords to normalized 0..1 relative to an element rect */
export function clientToNormalized(clientX, clientY, rect) {
    return {
        x: clamp((clientX - rect.left) / rect.width, 0, 1),
        y: clamp((clientY - rect.top) / rect.height, 0, 1),
    };
}

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

/* ── Group key ── */

let _counter = 0;
export function generateGroupKey() {
    _counter++;
    const rand = Math.random().toString(36).slice(2, 8);
    return `g_${Date.now().toString(36)}_${rand}_${_counter}`;
}

/* ── Segment intersection (for polygon self-intersection check) ── */

function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function onSegment(p, q, r) {
    return (
        q.x <= Math.max(p.x, r.x) + 1e-10 &&
        q.x >= Math.min(p.x, r.x) - 1e-10 &&
        q.y <= Math.max(p.y, r.y) + 1e-10 &&
        q.y >= Math.min(p.y, r.y) - 1e-10
    );
}

/** Check if segments (a1-a2) and (b1-b2) intersect (proper or touching) */
export function segmentsIntersect(a1, a2, b1, b2) {
    const d1 = cross(b1, b2, a1);
    const d2 = cross(b1, b2, a2);
    const d3 = cross(a1, a2, b1);
    const d4 = cross(a1, a2, b2);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }

    if (Math.abs(d1) < 1e-10 && onSegment(b1, a1, b2)) return true;
    if (Math.abs(d2) < 1e-10 && onSegment(b1, a2, b2)) return true;
    if (Math.abs(d3) < 1e-10 && onSegment(a1, b1, a2)) return true;
    if (Math.abs(d4) < 1e-10 && onSegment(a1, b2, a2)) return true;

    return false;
}

/**
 * Check if adding newPt to the end of `points` creates a self-intersecting segment.
 * Skips the segment immediately adjacent (last segment shares the endpoint).
 */
export function isNewSegmentSelfIntersecting(points, newPt) {
    if (points.length < 2) return false;
    const last = points[points.length - 1];
    // Check new segment (last -> newPt) against all previous segments except the last one (adjacent)
    for (let i = 0; i < points.length - 2; i++) {
        if (segmentsIntersect(last, newPt, points[i], points[i + 1])) {
            return true;
        }
    }
    return false;
}

/**
 * Check if closing a polygon (last→first) creates self-intersection.
 * Skips the two adjacent segments (first segment and last segment).
 */
export function isClosingSelfIntersecting(points) {
    if (points.length < 3) return false;
    const first = points[0];
    const last = points[points.length - 1];
    // Check closing segment (last -> first) against all segments except first (idx 0-1) and last (idx n-2 to n-1)
    for (let i = 1; i < points.length - 2; i++) {
        if (segmentsIntersect(last, first, points[i], points[i + 1])) {
            return true;
        }
    }
    return false;
}

/* ── BE ↔ FE conversion ── */

/**
 * Parse geometry JSON string safely.
 * Handles single-encoded strings (normal case) and double-encoded strings
 * left over from a previous bug where geometry was stringified before sending.
 * Returns a plain object or null.
 */
export function parseGeometry(geomStr) {
    if (!geomStr) return null;
    if (typeof geomStr === "object") return geomStr; // already parsed
    try {
        const first = JSON.parse(geomStr);
        // If the result is still a string it was double-encoded — parse once more
        if (typeof first === "string") {
            try {
                return JSON.parse(first);
            } catch {
                return null;
            }
        }
        return first;
    } catch {
        return null;
    }
}

/**
 * Group BE annotation responses by groupKey in their geometry.
 * Returns: AnnotationGroup[] (FE model)
 */
export function groupAnnotationsByKey(beAnnotations) {
    if (!beAnnotations || beAnnotations.length === 0) return [];

    const groups = new Map(); // groupKey → { ...group }

    beAnnotations.forEach((ann) => {
        const geom = parseGeometry(ann.geometry);
        // Determine groupKey — fallback to reviewingId if missing
        const groupKey = geom?.groupKey || `solo_${ann.reviewingId}`;
        const shapeType = geom?.type || "bbox";

        if (groups.has(groupKey)) {
            const g = groups.get(groupKey);
            if (ann.labelId && !g.labelIds.includes(ann.labelId)) {
                g.labelIds.push(ann.labelId);
                g.colorCodes.push(ann.colorCode || "#6b7280");
                g.labelNames.push(ann.labelName || "Unknown");
            }
            g.beReviewingIds.push(ann.reviewingId);
            // Worst status wins: REJECTED > PENDING > APPROVED
            const s = ann.status || null;
            if (s === "REJECTED") g.reviewStatus = "REJECTED";
            else if (g.reviewStatus !== "REJECTED" && s === "PENDING") g.reviewStatus = s;
            if (!g.policyName && ann.policyName) g.policyName = ann.policyName;
        } else {
            // Build clean geometry (strip meta fields)
            const cleanGeom = { ...geom };
            delete cleanGeom.groupKey;
            delete cleanGeom.type;

            groups.set(groupKey, {
                groupKey,
                shapeType,
                geometry: cleanGeom,
                labelIds: ann.labelId ? [ann.labelId] : [],
                colorCodes: [ann.colorCode || "#6b7280"],
                labelNames: [ann.labelName || "Unknown"],
                beReviewingIds: [ann.reviewingId],
                isHidden: false,
                reviewStatus: ann.status || null,
                policyName: ann.policyName || null,
            });
        }
    });

    return Array.from(groups.values());
}

/**
 * Convert FE annotation groups → flat BE rows for BatchSaveAnnotationRequest.
 * Each label in a group creates one row with geometry as a JSON object (not a string)
 * so the backend's JsonNode field receives an ObjectNode, not a TextNode.
 */
export function flattenToBeRows(feAnnotations) {
    const rows = [];
    feAnnotations.forEach((group) => {
        const geomObj = {
            type: group.shapeType,
            groupKey: group.groupKey,
            ...group.geometry,
        };
        group.labelIds.forEach((labelId) => {
            rows.push({ labelId, geometry: geomObj });
        });
    });
    return rows;
}

/** Distance between two normalized points (for snap detection) */
export function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Distance in pixels given a rect size */
export function distPx(a, b, rect) {
    const dx = (a.x - b.x) * rect.width;
    const dy = (a.y - b.y) * rect.height;
    return Math.sqrt(dx * dx + dy * dy);
}
