import * as React from "react";
import { activityLogApi } from "../../api/activityLogApi";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { useToast } from "../../context/ToastContext";

export default function ActivityLogs() {
    const { addToast } = useToast();

    // State
    const [logs, setLogs] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filters, setFilters] = React.useState({
        q: "",
        action: "ALL"
    });
    const [pagination, setPagination] = React.useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Load Data
    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const result = await activityLogApi.list({
                page: pagination.page,
                limit: pagination.limit,
                q: filters.q,
                action: filters.action
            });

            setLogs(result.data);
            setPagination(prev => ({
                ...prev,
                ...result.meta
            }));
        } catch (error) {
            console.error(error);
            addToast("Failed to load activity logs", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Effect: Reload on filter/page change
    React.useEffect(() => {
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, filters]); // Reload when page or filters change

    // Handlers
    const handleSearchChange = (e) => {
        setFilters(prev => ({ ...prev, q: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const handleActionChange = (e) => {
        setFilters(prev => ({ ...prev, action: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    // Helper: Role Badge
    const getRoleBadge = (role) => {
        const styles = {
            admin: "bg-red-500/10 text-red-500 border-red-500/20",
            manager: "bg-purple-500/10 text-purple-500 border-purple-500/20",
            annotator: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            reviewer: "bg-orange-500/10 text-orange-500 border-orange-500/20"
        };
        return (
            <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ml-2", styles[role] || "bg-muted text-muted-foreground")}>
                {role}
            </span>
        );
    };

    // Helper: Action Badge
    const getActionBadge = (action) => {
        let colorClass = "bg-muted text-muted-foreground border-border";
        if (action.includes("CREATE")) colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
        if (action.includes("REJECT")) colorClass = "bg-red-500/10 text-red-500 border-red-500/20";
        if (action.includes("APPROVE")) colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
        if (action.includes("SUBMIT")) colorClass = "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";

        return (
            <span className={cn("text-[10px] font-mono font-bold px-2 py-1 rounded border", colorClass)}>
                {action}
            </span>
        );
    };

    return (
        <div className="h-full flex flex-col p-6 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Theo dõi nhật ký</h1>
                <p className="text-sm text-muted-foreground mt-1">Lịch sử hoạt động của hệ thống</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted-foreground text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="Search actor, message, ID..."
                        value={filters.q}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-annotator-primary placeholder:text-muted-foreground/50 transition-all"
                    />
                </div>
                <select
                    value={filters.action}
                    onChange={handleActionChange}
                    className="w-full sm:w-48 px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-annotator-primary"
                >
                    <option value="ALL">All Actions</option>
                    <option value="CREATE_PROJECT">Create Project</option>
                    <option value="SUBMIT_TASK">Submit Task</option>
                    <option value="APPROVE_TASK">Approve Task</option>
                    <option value="REJECT_TASK">Reject Task</option>
                    <option value="CREATE_USER">Create User</option>
                    <option value="LOGIN">Login</option>
                </select>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 bg-card border border-border rounded-md overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                            <span className="text-xs">Loading logs...</span>
                        </div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-muted-foreground">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history_toggle_off</span>
                        <p>Không có hoạt động nào phù hợp</p>
                    </div>
                ) : (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 py-3 w-48">Time</th>
                                    <th className="px-4 py-3 w-64">Actor</th>
                                    <th className="px-4 py-3 w-48">Action</th>
                                    <th className="px-4 py-3">Message</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.map((log) => (
                                    <tr key={log.logId} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <span className="font-medium text-foreground">{log.actorName}</span>
                                                {log.actorRole && getRoleBadge(log.actorRole)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{log.actorId}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {log.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                {!isLoading && pagination.total > 0 && (
                    <div className="border-t border-border p-3 flex items-center justify-between bg-muted/20">
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> to <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> of <strong>{pagination.total}</strong> results
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-8"
                                disabled={pagination.page <= 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center px-2 text-sm font-medium">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-8"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
