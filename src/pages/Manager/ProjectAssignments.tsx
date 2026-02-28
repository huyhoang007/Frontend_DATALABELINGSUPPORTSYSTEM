import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { datasetApi } from "../../api/datasetApi";
import { userApi } from "../../api/userApi";
import { assignmentApi } from "../../api/assignmentApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ModalDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";
import { cn } from "../../utils/cn";

/* ═══════════ Types ═══════════ */
interface Assignment {
    assignmentId: number;
    projectId: number;
    projectName: string;
    datasetId: number;
    datasetName: string;
    annotatorId: number;
    annotatorName: string;
    reviewerId: number;
    reviewerName: string;
    status: string;
    progress: number;
    createdAt: string;
}

/* ═══════════ Status badge styles ═══════════ */
const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    SUBMITTED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

/* ═══════════ Component ═══════════ */
export default function ProjectAssignments() {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = projectId || "";

    /* ── Data lists ── */
    const [datasets, setDatasets] = useState<any[]>([]);
    const [annotators, setAnnotators] = useState<any[]>([]);
    const [reviewers, setReviewers] = useState<any[]>([]);

    /* ── Form state ── */
    const [selDataset, setSelDataset] = useState("");
    const [selAnnotator, setSelAnnotator] = useState("");
    const [selReviewer, setSelReviewer] = useState("");
    const [validation, setValidation] = useState("");
    const [creating, setCreating] = useState(false);

    /* ── Loading states ── */
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);

    /* ── Assignments from BE ── */
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [assignmentsError, setAssignmentsError] = useState<string | null>(null);

    /* ── View modal ── */
    const [viewTask, setViewTask] = useState<Assignment | null>(null);

    /* ── Toast ── */
    const [toast, setToast] = useState("");
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    }, []);

    /* ── Normalize role: handles "ANNOTATOR", "ROLE_ANNOTATOR", "3" ── */
    const isAnnotator = (role: string) => {
        const r = role.toUpperCase().replace("ROLE_", "");
        return r === "ANNOTATOR" || r === "3";
    };
    const isReviewer = (role: string) => {
        const r = role.toUpperCase().replace("ROLE_", "");
        return r === "REVIEWER" || r === "4";
    };

    /* ── User cache helpers (for 403 fallback) ── */
    const USERS_CACHE_KEY = "dlss_users_cache";
    const cacheUsers = (users: any[]) => {
        try { localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users)); } catch { /* quota */ }
    };
    const loadCachedUsers = (): any[] => {
        try { return JSON.parse(localStorage.getItem(USERS_CACHE_KEY) || "[]"); } catch { return []; }
    };

    const applyUsers = (mapped: any[]) => {
        const ann = mapped.filter((u: any) => isAnnotator(u.role));
        const rev = mapped.filter((u: any) => isReviewer(u.role));
        console.log("[ASSIGNMENTS_USERS]", { total: mapped.length, annotators: ann.length, reviewers: rev.length });
        setAnnotators(ann);
        setReviewers(rev);
    };

    /* ── Fetch users from API ── */
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        setUsersError(null);
        try {
            const data: any = await userApi.getAllUsers({ page: 0, size: 200 });
            const arr = Array.isArray(data) ? data : (data?.content || data?.data || []);
            console.log("[ASSIGNMENTS_USERS] raw", arr.length, "users from API");

            const mapped = arr.map((u: any) => ({
                id: String(u.userId ?? u.id),
                name: u.fullName ?? u.username ?? `User ${u.userId ?? u.id}`,
                role: String(u.roleName ?? u.role ?? ""),
            }));

            applyUsers(mapped);
            cacheUsers(mapped);
        } catch (err: any) {
            console.error("[ASSIGNMENTS_USERS] fetch error", err);
            const httpStatus = err?.status;

            const cached = loadCachedUsers();
            if (cached.length > 0) {
                console.log("[ASSIGNMENTS_USERS] using cached users:", cached.length);
                applyUsers(cached);
                if (httpStatus === 403) {
                    setUsersError("API yêu cầu quyền ADMIN — đang dùng dữ liệu đã cache. Đăng nhập ADMIN để cập nhật.");
                }
            } else {
                if (httpStatus === 403) {
                    setUsersError("GET /api/users yêu cầu quyền ADMIN. Đăng nhập ADMIN 1 lần để tải danh sách user, sau đó MANAGER có thể dùng cache.");
                } else if (httpStatus === 401) {
                    setUsersError("Hết phiên đăng nhập — vui lòng đăng nhập lại.");
                } else {
                    setUsersError(err?.message || "Không thể tải danh sách user.");
                }
                setAnnotators([]);
                setReviewers([]);
            }
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    /* ── Fetch assignments from BE API ── */
    const fetchAssignments = useCallback(async () => {
        if (!pid) return;
        setLoadingAssignments(true);
        setAssignmentsError(null);
        try {
            const data: any = await assignmentApi.getAssignmentsByProject(Number(pid));
            const arr = Array.isArray(data) ? data : (data?.content || data?.data || []);
            console.log("[ASSIGNMENTS] loaded", arr.length, "assignments from API");
            setAssignments(arr);
        } catch (err: any) {
            console.error("[ASSIGNMENTS] fetch error", err);
            setAssignmentsError(err?.message || "Không thể tải danh sách assignment.");
        } finally {
            setLoadingAssignments(false);
        }
    }, [pid]);

    /* ── Load data on mount ── */
    useEffect(() => {
        // Datasets from API
        if (pid) {
            datasetApi.getDatasetsByProject(Number(pid))
                .then((data: any) => {
                    const arr = Array.isArray(data) ? data : (data?.content || []);
                    setDatasets(arr.map((d: any) => ({
                        id: String(d.datasetId ?? d.id),
                        name: d.batchName ?? d.name ?? `Dataset ${d.datasetId ?? d.id}`,
                    })));
                })
                .catch((err: any) => {
                    console.error("[ASSIGNMENTS] datasets fetch error", err);
                    setDatasets([]);
                });
        }

        fetchUsers();
        fetchAssignments();
    }, [pid, fetchUsers, fetchAssignments]);

    /* ── Create Assignment via BE API ── */
    const handleCreate = async () => {
        setValidation("");
        if (!selDataset) { setValidation("Please select a dataset"); return; }
        if (!selAnnotator) { setValidation("Please select an annotator"); return; }
        if (!selReviewer) { setValidation("Please select a reviewer"); return; }

        setCreating(true);
        try {
            const response: any = await assignmentApi.createAssignment(Number(pid), {
                datasetId: Number(selDataset),
                annotatorId: Number(selAnnotator),
                reviewerId: Number(selReviewer),
            });
            console.log("[ASSIGNMENTS] created", response);
            showToast(`Created Assignment #${response.assignmentId}`);

            // Refresh assignments list
            await fetchAssignments();

            // Reset selects
            setSelDataset("");
            setSelAnnotator("");
            setSelReviewer("");
        } catch (err: any) {
            console.error("[ASSIGNMENTS] create error", err);
            setValidation(err?.message || "Không thể tạo assignment. Kiểm tra lại dữ liệu.");
        } finally {
            setCreating(false);
        }
    };

    /* ── Delete Assignment ── */
    const handleDelete = async (assignmentId: number) => {
        if (!confirm("Xóa assignment này?")) return;
        try {
            await assignmentApi.deleteAssignment(assignmentId);
            showToast(`Deleted Assignment #${assignmentId}`);
            await fetchAssignments();
        } catch (err: any) {
            showToast(err?.message || "Không thể xóa assignment.");
        }
    };

    /* ── Status counts ── */
    const pending = assignments.filter((t) => String(t.status).toUpperCase() === "PENDING").length;
    const inProgress = assignments.filter((t) => String(t.status).toUpperCase() === "IN_PROGRESS").length;
    const completed = assignments.filter((t) => ["APPROVED", "COMPLETED"].includes(String(t.status).toUpperCase())).length;

    /* ── Select style ── */
    const selectCls = "w-full rounded-lg border border-border bg-card text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors appearance-none cursor-pointer";

    /* ═══════════ RENDER ═══════════ */
    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {toast}
                </div>
            )}

            {/* ── Assignment Form ── */}
            <Card className="p-6 space-y-5">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">assignment</span>
                    Create Assignment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Select Data */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select Data</label>
                        <div className="relative">
                            <select className={selectCls} value={selDataset} onChange={(e) => setSelDataset(e.target.value)}>
                                <option value="">{datasets.length === 0 ? "No datasets found" : "— Choose dataset —"}</option>
                                {datasets.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    {/* Select Annotator */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select Annotator</label>
                        <div className="relative">
                            <select className={selectCls} value={selAnnotator} onChange={(e) => setSelAnnotator(e.target.value)} disabled={loadingUsers}>
                                <option value="">{loadingUsers ? "Loading annotators..." : annotators.length === 0 ? "No annotators found" : "— Choose annotator —"}</option>
                                {annotators.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {loadingUsers ? (
                                <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                            )}
                        </div>
                    </div>

                    {/* Select Reviewer */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select Reviewer</label>
                        <div className="relative">
                            <select className={selectCls} value={selReviewer} onChange={(e) => setSelReviewer(e.target.value)} disabled={loadingUsers}>
                                <option value="">{loadingUsers ? "Loading reviewers..." : reviewers.length === 0 ? "No reviewers found" : "— Choose reviewer —"}</option>
                                {reviewers.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                            {loadingUsers ? (
                                <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-[16px] text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Users error */}
                {usersError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                        <span className="material-symbols-outlined text-[16px] text-destructive">error</span>
                        <p className="text-sm text-destructive flex-1">{usersError}</p>
                        <Button type="button" variant="ghost" size="sm" onClick={fetchUsers}>
                            <span className="material-symbols-outlined text-base mr-1">refresh</span>Retry
                        </Button>
                    </div>
                )}

                {/* Validation message */}
                {validation && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {validation}
                    </p>
                )}

                {/* Create Task button */}
                <div>
                    <Button type="button" variant="primary" onClick={handleCreate} disabled={creating}>
                        {creating ? (
                            <span className="material-symbols-outlined text-base mr-1 animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-base mr-1">add</span>
                        )}
                        {creating ? "Creating..." : "Create Task"}
                    </Button>
                </div>
            </Card>

            {/* ── Assignments Table ── */}
            <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">task_alt</span>
                        Assignment Tasks
                    </h3>
                    <div className="flex items-center gap-3">
                        {assignments.length > 0 && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-yellow-400" />Pending: {pending}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400" />In Progress: {inProgress}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400" />Completed: {completed}
                                </span>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={fetchAssignments} disabled={loadingAssignments}>
                            <span className={cn("material-symbols-outlined text-base mr-1", loadingAssignments && "animate-spin")}>
                                {loadingAssignments ? "progress_activity" : "refresh"}
                            </span>
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Loading */}
                {loadingAssignments && assignments.length === 0 && (
                    <div className="flex items-center justify-center py-16">
                        <span className="material-symbols-outlined text-3xl text-muted-foreground animate-spin mr-2">progress_activity</span>
                        <span className="text-muted-foreground text-sm">Loading assignments...</span>
                    </div>
                )}

                {/* Error */}
                {assignmentsError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                        <span className="material-symbols-outlined text-[16px] text-destructive">error</span>
                        <p className="text-sm text-destructive flex-1">{assignmentsError}</p>
                        <Button variant="ghost" size="sm" onClick={fetchAssignments}>Retry</Button>
                    </div>
                )}

                {!loadingAssignments && assignments.length === 0 && !assignmentsError ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground/40 mb-3 block">assignment</span>
                        <h4 className="text-base font-semibold text-foreground mb-1">No assignments yet</h4>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Select a dataset, annotator, and reviewer above, then click "Create Task" to assign work.
                        </p>
                    </div>
                ) : assignments.length > 0 && (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>DATA SOURCE</TableHead>
                                    <TableHead>ANNOTATOR</TableHead>
                                    <TableHead>REVIEWER</TableHead>
                                    <TableHead>PROGRESS</TableHead>
                                    <TableHead>STATUS</TableHead>
                                    <TableHead className="text-right">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.map((task) => {
                                    const status = String(task.status || "PENDING").toUpperCase();
                                    return (
                                        <TableRow key={task.assignmentId}>
                                            <TableCell className="font-mono font-medium text-sm">#{task.assignmentId}</TableCell>
                                            <TableCell>{task.datasetName || "—"}</TableCell>
                                            <TableCell>{task.annotatorName || "—"}</TableCell>
                                            <TableCell>{task.reviewerName || "—"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all"
                                                            style={{ width: `${task.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{task.progress || 0}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                    STATUS_STYLES[status] || "bg-muted text-muted-foreground"
                                                )}>
                                                    {status.replace("_", " ")}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => setViewTask(task)}>
                                                        <span className="material-symbols-outlined text-base">visibility</span>
                                                    </Button>
                                                    {status === "PENDING" && (
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(task.assignmentId)} className="text-destructive hover:text-destructive">
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <p className="text-xs text-muted-foreground pt-2">Showing {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</p>
                    </>
                )}
            </Card>

            {/* ── View Task Modal ── */}
            <ModalDialog
                isOpen={!!viewTask}
                onClose={() => setViewTask(null)}
                title="Assignment Details"
                actions={<Button variant="secondary" onClick={() => setViewTask(null)}>Close</Button>}
            >
                {viewTask && (
                    <div className="space-y-3 text-sm">
                        <div><span className="font-medium text-foreground">Assignment ID:</span> <span className="text-muted-foreground font-mono">#{viewTask.assignmentId}</span></div>
                        <div><span className="font-medium text-foreground">Project:</span> <span className="text-muted-foreground">{viewTask.projectName || "—"}</span></div>
                        <div><span className="font-medium text-foreground">Data Source:</span> <span className="text-muted-foreground">{viewTask.datasetName || "—"}</span></div>
                        <div><span className="font-medium text-foreground">Annotator:</span> <span className="text-muted-foreground">{viewTask.annotatorName || "—"}</span></div>
                        <div><span className="font-medium text-foreground">Reviewer:</span> <span className="text-muted-foreground">{viewTask.reviewerName || "—"}</span></div>
                        <div><span className="font-medium text-foreground">Progress:</span> <span className="text-muted-foreground">{viewTask.progress || 0}%</span></div>
                        <div><span className="font-medium text-foreground">Status:</span>{" "}
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", STATUS_STYLES[String(viewTask.status).toUpperCase()])}>
                                {String(viewTask.status || "").replace("_", " ")}
                            </span>
                        </div>
                        {viewTask.createdAt && (
                            <div><span className="font-medium text-foreground">Created:</span> <span className="text-muted-foreground">{new Date(viewTask.createdAt).toLocaleString("vi-VN")}</span></div>
                        )}
                    </div>
                )}
            </ModalDialog>
        </div>
    );
}
