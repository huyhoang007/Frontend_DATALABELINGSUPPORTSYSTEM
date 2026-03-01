import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { BadgeStatus } from "../../components/ui/BadgeStatus";
import { useAuth } from "../../context/AuthContext";
import reviewApi from "../../api/reviewApi";

export default function ReviewQueue() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [assignments, setAssignments] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
        let cancelled = false;
        async function fetchAssignments() {
            setIsLoading(true);
            setError(null);
            try {
                const data = await reviewApi.getMyReviewAssignments();
                if (!cancelled) setAssignments(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!cancelled) setError(err?.response?.data?.message || err?.message || "Failed to load assignments");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        fetchAssignments();
        return () => { cancelled = true; };
    }, []);

    // Filter: show only SUBMITTED by default (reviewable), also search
    const reviewableAssignments = React.useMemo(() => {
        let list = assignments.filter(a => a.status === "SUBMITTED" || a.status === "REJECTED");
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(a =>
                (a.projectName || "").toLowerCase().includes(q) ||
                (a.annotatorName || "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [assignments, searchQuery]);

    const handleReview = (assignment) => {
        navigate(`/reviewer/review/${assignment.assignmentId}`);
    };

    // Stats
    const pendingCount = assignments.filter(a => a.status === "SUBMITTED").length;
    const approvedCount = assignments.filter(a => a.status === "APPROVED").length;
    const rejectedCount = assignments.filter(a => a.status === "REJECTED").length;

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b border-border">
                <div>
                    <h1 className="text-h1 font-extrabold tracking-tight text-foreground">Review Queue</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        <span className="text-annotator-primary font-bold">{pendingCount}</span> tasks pending review.
                    </p>
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Pending", value: pendingCount, color: "text-blue-400" },
                    { label: "Approved", value: approvedCount, color: "text-green-400" },
                    { label: "Rejected", value: rejectedCount, color: "text-red-400" },
                    { label: "Total", value: assignments.length, color: "text-foreground" },
                ].map((kpi) => (
                    <div key={kpi.label} className="p-4 rounded-lg bg-card border border-border">
                        <p className="text-micro font-bold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                        <p className={`text-h2 mt-1 ${kpi.color}`}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter & Search */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" leftIcon="filter_list" size="sm">Filter</Button>
                    <Button variant="secondary" leftIcon="sort" size="sm">Sort</Button>
                </div>
                <div className="w-64">
                    <Input
                        placeholder="Search tasks..."
                        leftIcon="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Loading / Error */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <span className="material-symbols-outlined animate-spin text-3xl text-muted-foreground">progress_activity</span>
                    <span className="ml-3 text-muted-foreground">Loading assignments...</span>
                </div>
            )}

            {error && (
                <div className="text-center py-12 text-red-400">
                    <span className="material-symbols-outlined text-4xl mb-2 block">error</span>
                    <p>{error}</p>
                </div>
            )}

            {/* Review Table */}
            {!isLoading && !error && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Annotator</TableHead>
                            <TableHead>Dataset</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reviewableAssignments.map((a) => (
                            <TableRow key={a.assignmentId} onClick={() => handleReview(a)}>
                                <TableCell><span className="font-mono text-xs text-muted-foreground">{a.assignmentId}</span></TableCell>
                                <TableCell><span className="font-medium text-foreground">{a.projectName}</span></TableCell>
                                <TableCell><span className="text-xs text-foreground">{a.annotatorName || "—"}</span></TableCell>
                                <TableCell><span className="text-xs text-muted-foreground">{a.datasetName || "—"}</span></TableCell>
                                <TableCell>
                                    <BadgeStatus status={a.status} />
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">{a.progress ?? 0}%</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); handleReview(a); }}>Review</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {reviewableAssignments.length === 0 && (
                            <TableRow>
                                <TableCell className="text-center py-12 text-muted-foreground" colSpan={7}>
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20 block">check_circle</span>
                                    No tasks pending review. Good job!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
