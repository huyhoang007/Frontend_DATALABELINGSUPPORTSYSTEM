import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { BadgeStatus } from "../../components/ui/BadgeStatus";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../api/userApi";

/* ── Status tabs ── */
const TABS = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"];

/* ── Load ALL tasks from Manager Assignments localStorage ── */
const TASKS_PREFIX = "dlss_project_tasks::";

function loadAllAssignmentTasks() {
    const all = [];
    const seen = new Set();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TASKS_PREFIX)) {
            try {
                const tasks = JSON.parse(localStorage.getItem(key) || "[]");
                tasks.forEach((t) => {
                    if (!seen.has(t.id)) {
                        seen.add(t.id);
                        all.push(t);
                    }
                });
            } catch { /* skip bad JSON */ }
        }
    }
    return all;
}

/* ── Status badge mapping ── */
const STATUS_STYLES = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function TaskList() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = React.useState("ALL");
    const [search, setSearch] = React.useState("");

    const [tasks, setTasks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [currentUserId, setCurrentUserId] = React.useState(null);
    const [error, setError] = React.useState(null);

    /* ── Fetch current user ID + load tasks ── */
    React.useEffect(() => {
        let cancelled = false;

        async function init() {
            setLoading(true);
            setError(null);

            // 1. Get current user ID from API
            let userId = null;
            try {
                const me = await userApi.getCurrentUser();
                userId = String(me?.userId ?? me?.id ?? "");
                if (!cancelled) setCurrentUserId(userId);
                console.log("[ANNOTATOR_TASKS] currentUser", { userId, username: me?.username });
            } catch (err) {
                console.warn("[ANNOTATOR_TASKS] failed to get current user", err);
                // Fallback: use username from auth context
                userId = user?.username || "";
                if (!cancelled) setCurrentUserId(userId);
            }

            // 2. Load all tasks from localStorage (Manager Assignments)
            const allTasks = loadAllAssignmentTasks();
            console.log("[ANNOTATOR_TASKS] all tasks from localStorage:", allTasks.length);

            // 3. Filter tasks for this annotator
            const myTasks = allTasks.filter((t) => {
                const taskAnnotatorId = String(t.annotatorId || "");
                const taskAnnotatorName = String(t.annotatorName || "").toLowerCase();
                const userUsername = (user?.username || "").toLowerCase();
                // Match by ID or by name/username
                return taskAnnotatorId === userId
                    || taskAnnotatorName === userUsername;
            });

            console.log("[ANNOTATOR_TASKS] my tasks:", myTasks.length, "userId:", userId);

            if (!cancelled) {
                setTasks(myTasks);
                setLoading(false);
            }
        }

        init();
        return () => { cancelled = true; };
    }, [user]);

    /* ── Listen for storage changes (when Manager creates tasks in another tab) ── */
    React.useEffect(() => {
        function onStorageChange(e) {
            if (e.key && e.key.startsWith(TASKS_PREFIX)) {
                // Reload tasks
                const allTasks = loadAllAssignmentTasks();
                const myTasks = allTasks.filter((t) => {
                    const taskAnnotatorId = String(t.annotatorId || "");
                    return taskAnnotatorId === currentUserId
                        || String(t.annotatorName || "").toLowerCase() === (user?.username || "").toLowerCase();
                });
                setTasks(myTasks);
            }
        }
        window.addEventListener("storage", onStorageChange);
        return () => window.removeEventListener("storage", onStorageChange);
    }, [currentUserId, user]);

    /* ── Filtering ── */
    const filteredTasks = React.useMemo(() => {
        return tasks.filter((task) => {
            const matchesTab = activeTab === "ALL" || task.status === activeTab;
            const matchesSearch =
                (task.id || "").toLowerCase().includes(search.toLowerCase()) ||
                (task.datasetName || "").toLowerCase().includes(search.toLowerCase()) ||
                (task.reviewerName || "").toLowerCase().includes(search.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [activeTab, search, tasks]);

    const handleAction = (task) => {
        navigate(`/annotator/task/${task.id}`);
    };

    /* ── Active task count ── */
    const activeCount = tasks.filter((t) =>
        ["PENDING", "IN_PROGRESS"].includes(t.status)
    ).length;

    return (
        <div className="min-h-screen bg-background text-foreground p-6 sm:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-border gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">My Tasks</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Welcome back, <span className="text-primary font-semibold">{user?.displayName || user?.username || user?.name || "User"}</span>.
                        {!loading && (
                            <> You have <span className="font-mono text-foreground">{activeCount}</span> active tasks.</>
                        )}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => logout()} leftIcon="logout">
                    Logout
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                {/* Status Tabs */}
                <div className="inline-flex p-1 bg-muted rounded-lg border border-border">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-3 py-1.5 rounded-[6px] text-[11px] font-bold uppercase tracking-wide transition-all
                                ${activeTab === tab
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
                            `}
                        >
                            {tab.replace("_", " ")}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="w-full md:w-72 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-muted-foreground text-[18px] group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        placeholder="Search by task ID, dataset, or reviewer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <span className="material-symbols-outlined text-3xl text-muted-foreground animate-spin">progress_activity</span>
                    <span className="ml-2 text-muted-foreground text-sm">Loading tasks...</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                    <span className="material-symbols-outlined text-[16px] text-destructive">error</span>
                    <p className="text-sm text-destructive flex-1">{error}</p>
                </div>
            )}

            {/* Task List Table */}
            {!loading && (
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[100px]">TASK ID</TableHead>
                                <TableHead>DATA SOURCE</TableHead>
                                <TableHead>REVIEWER</TableHead>
                                <TableHead>STATUS</TableHead>
                                <TableHead className="text-right">CREATED</TableHead>
                                <TableHead className="text-right">ACTION</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTasks.map((task) => (
                                <TableRow key={task.id} onClick={() => handleAction(task)} className="group cursor-pointer hover:bg-muted/50">
                                    <TableCell>
                                        <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                            {task.id}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium text-sm text-foreground">{task.datasetName || "—"}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">{task.reviewerName || "—"}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[task.status] || "bg-muted text-muted-foreground"}`}>
                                            {(task.status || "PENDING").replace("_", " ")}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-muted-foreground text-xs font-mono">
                                            {task.createdAt ? new Date(task.createdAt).toLocaleDateString("vi-VN") : "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                            {task.status === "PENDING" && (
                                                <Button size="sm" variant="primary" className="h-7 text-xs px-3" onClick={(e) => { e.stopPropagation(); handleAction(task); }}>Start</Button>
                                            )}
                                            {task.status === "IN_PROGRESS" && (
                                                <Button size="sm" variant="secondary" className="h-7 text-xs px-3 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" onClick={(e) => { e.stopPropagation(); handleAction(task); }}>Continue</Button>
                                            )}
                                            {task.status === "COMPLETED" && (
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleAction(task); }}>
                                                    <span className="material-symbols-outlined text-muted-foreground hover:text-foreground text-[20px]">visibility</span>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTasks.length === 0 && (
                                <TableRow>
                                    <TableCell className="text-center py-16 text-muted-foreground" colSpan={6}>
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="material-symbols-outlined text-5xl text-muted-foreground/40 mb-3">assignment</span>
                                            <h4 className="text-base font-semibold text-foreground mb-1">Chưa có nhiệm vụ nào</h4>
                                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                                Manager sẽ tạo task ở trang Assignments, khi có bạn sẽ thấy tại đây.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Task count */}
            {!loading && tasks.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                    Showing {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
