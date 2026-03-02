/**
 * useReviewWorkspace — Custom hook for Reviewer Workspace.
 *
 * Key design decisions:
 * 1. Inline annotations from openReviewWorkspace are seeded into annoCache on mount.
 * 2. getReviewAnnotationsByItem is called only on cache miss or after a review action (refresh).
 * 3. Cache is a plain object { [itemId]: AnnotationResponse[] } with immutable updates.
 * 4. Assignment auto-status is client-computed from the NEXT cache state (not stale state).
 * 5. Redirect triggers only when cache is complete (has keys for ALL items, including []).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import reviewApi from "../../api/reviewApi";
import { policyApi } from "../../api/policyApi";
import apiClient from "../../api/apiClient";

/**
 * Resolve file URL to a path the Vite proxy can forward to the backend.
 * Ensures it starts with /uploads so the proxy rule kicks in.
 */
function resolveImagePath(fileUrl) {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http")) return fileUrl;
    let url = fileUrl;
    if (!url.startsWith("/uploads")) {
        url = `/uploads${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
}

export default function useReviewWorkspace(assignmentIdNum) {
    // ── Workspace state ──
    const [workspace, setWorkspace] = useState(null);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);
    const [workspaceError, setWorkspaceError] = useState(null);

    // ── Items navigation ──
    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    // ── Annotation cache: plain object for immutable React state ──
    // Shape: { [itemId: number]: AnnotationResponse[] }
    const [annoCache, setAnnoCache] = useState({});
    const [itemAnnoLoading, setItemAnnoLoading] = useState(false);

    // ── Policies ──
    const [policies, setPolicies] = useState([]);

    // ── Review submission state ──
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    // ── Derived data ──
    const items = useMemo(() => workspace?.items ?? [], [workspace]);

    const currentItem = useMemo(() => items[currentItemIndex] ?? null, [items, currentItemIndex]);
    const currentItemId = currentItem?.itemId;

    // ── Image blob fetch (authenticated) ──
    const [imageBlobUrl, setImageBlobUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let blobUrl = null;
        const fetchImage = async () => {
            const fileUrl = currentItem?.fileUrl;
            if (!fileUrl) { setImageBlobUrl(null); setImageLoading(false); setImageError(null); return; }
            const path = resolveImagePath(fileUrl);
            if (!path) return;
            setImageLoading(true); setImageError(null); setImageBlobUrl(null);
            try {
                const response = await apiClient.get(path, {
                    responseType: "blob",
                    transformResponse: [(data) => data],
                });
                if (cancelled) return;
                const blob = response instanceof Blob ? response : new Blob([response]);
                blobUrl = URL.createObjectURL(blob);
                setImageBlobUrl(blobUrl);
            } catch (err) {
                if (cancelled) return;
                const status = err?.status || err?.response?.status || "?";
                setImageError({ url: path, message: `Status ${status}: ${err?.message || "Failed"}` });
            } finally {
                if (!cancelled) setImageLoading(false);
            }
        };
        fetchImage();
        return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [currentItem?.itemId, currentItem?.fileUrl]);

    const currentAnnotations = useMemo(
        () => (currentItemId != null ? annoCache[currentItemId] ?? [] : []),
        [annoCache, currentItemId]
    );

    // ── Check if cache is complete (has key for every item) ──
    const isCacheComplete = useMemo(() => {
        if (items.length === 0) return false;
        return items.every(item => item.itemId in annoCache);
    }, [items, annoCache]);

    // ── Review progress stats ──
    const reviewStats = useMemo(() => {
        if (!isCacheComplete) return { total: 0, reviewed: 0, approved: 0, rejected: 0, pending: 0, allDone: false, anyRejected: false };
        const allAnnotations = Object.values(annoCache).flat();
        const total = allAnnotations.length;
        const approved = allAnnotations.filter(a => a.status === "APPROVED").length;
        const rejected = allAnnotations.filter(a => a.status === "REJECTED").length;
        const pending = total - approved - rejected;
        return {
            total,
            reviewed: approved + rejected,
            approved,
            rejected,
            pending,
            allDone: pending === 0 && total > 0,
            anyRejected: rejected > 0,
        };
    }, [annoCache, isCacheComplete]);

    // ── Per-item stats ──
    const getItemStats = useCallback((itemId) => {
        const annos = annoCache[itemId] ?? [];
        const total = annos.length;
        const approved = annos.filter(a => a.status === "APPROVED").length;
        const rejected = annos.filter(a => a.status === "REJECTED").length;
        return { total, approved, rejected, pending: total - approved - rejected };
    }, [annoCache]);

    // ── Fetch workspace + policies on mount ──
    useEffect(() => {
        let cancelled = false;

        async function fetchWorkspace() {
            setWorkspaceLoading(true);
            setWorkspaceError(null);
            try {
                const data = await reviewApi.openReviewWorkspace(assignmentIdNum);
                if (cancelled) return;
                setWorkspace(data);

                // Seed cache from inline annotations
                const initialCache = {};
                (data.items ?? []).forEach(item => {
                    // Always set a key, even if empty array, so cache is "complete" from start
                    initialCache[item.itemId] = item.annotations ?? [];
                });
                setAnnoCache(initialCache);
                console.log(`[REVIEW] seeded cache for ${Object.keys(initialCache).length} items`);
            } catch (err) {
                if (cancelled) return;
                const msg = err?.response?.data?.message || err?.message || "Failed to load workspace";
                setWorkspaceError(msg);
            } finally {
                if (!cancelled) setWorkspaceLoading(false);
            }
        }

        async function fetchPolicies() {
            try {
                const result = await policyApi.list({ page: 0, size: 100 });
                if (cancelled) return;
                // adaptPolicyListResponse returns { data: Policy[], meta }
                setPolicies(result.data ?? []);
            } catch (err) {
                console.warn("[REVIEW] Failed to fetch policies:", err);
                if (!cancelled) setPolicies([]);
            }
        }

        fetchWorkspace();
        fetchPolicies();

        return () => { cancelled = true; };
    }, [assignmentIdNum]);

    // ── Lazy-load annotations for current item (only if cache miss) ──
    const refreshItemAnnotations = useCallback(async (itemId) => {
        if (itemId == null) return;
        setItemAnnoLoading(true);
        try {
            const annotations = await reviewApi.getReviewAnnotationsByItem(assignmentIdNum, itemId);
            setAnnoCache(prev => ({ ...prev, [itemId]: annotations ?? [] }));
        } catch (err) {
            console.error("[REVIEW] Failed to fetch item annotations:", err);
        } finally {
            setItemAnnoLoading(false);
        }
    }, [assignmentIdNum]);

    useEffect(() => {
        if (currentItemId == null) return;
        // Only fetch if cache doesn't have this item
        if (!(currentItemId in annoCache)) {
            refreshItemAnnotations(currentItemId);
        }
    }, [currentItemId]); // Intentionally NOT including annoCache to avoid infinite loop

    // ── Review a single annotation ──
    const handleReviewAnnotation = useCallback(async (reviewingId, hasError, policyId, note) => {
        if (!currentItemId) return { success: false, error: "No current item" };
        setReviewSubmitting(true);
        try {
            await reviewApi.reviewAnnotation(reviewingId, { hasError, policyId: hasError ? policyId : undefined, note: hasError ? note : undefined });

            // Refetch current item's annotations to get fresh status
            const freshAnnotations = await reviewApi.getReviewAnnotationsByItem(assignmentIdNum, currentItemId);

            // Compute nextCache to determine final status from fresh data
            const nextCache = { ...annoCache, [currentItemId]: freshAnnotations ?? [] };
            setAnnoCache(nextCache);

            // Check if all items are in cache and all annotations reviewed
            const cacheComplete = items.every(item => item.itemId in nextCache);
            if (cacheComplete) {
                const allAnnotations = Object.values(nextCache).flat();
                const total = allAnnotations.length;
                const pending = allAnnotations.filter(a => a.status !== "APPROVED" && a.status !== "REJECTED").length;
                const anyRejected = allAnnotations.some(a => a.status === "REJECTED");

                if (pending === 0 && total > 0) {
                    return {
                        success: true,
                        allDone: true,
                        finalStatus: anyRejected ? "REJECTED" : "APPROVED",
                    };
                }
            }

            return { success: true, allDone: false };
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Failed to review annotation";
            return { success: false, error: msg };
        } finally {
            setReviewSubmitting(false);
        }
    }, [assignmentIdNum, currentItemId, annoCache, items]);

    return {
        // Workspace
        workspace,
        workspaceLoading,
        workspaceError,

        // Items
        items,
        currentItemIndex,
        setCurrentItemIndex,
        currentItem,
        currentItemId,

        // Image
        imageBlobUrl,
        imageLoading,
        imageError,

        // Annotations
        currentAnnotations,
        annoCache,
        itemAnnoLoading,
        refreshItemAnnotations,

        // Policies
        policies,

        // Review
        reviewSubmitting,
        handleReviewAnnotation,

        // Stats
        reviewStats,
        getItemStats,
        isCacheComplete,
    };
}
