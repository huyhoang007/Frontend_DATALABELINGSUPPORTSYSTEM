import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { BadgeStatus } from "../../components/ui/BadgeStatus";
import { TASKS } from "../../services/mockData";
import { useAuth } from "../../context/AuthContext";

export default function ReviewQueue() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Only SUBMITTED tasks are in review queue (conceptually)
    const reviewTasks = TASKS.filter(t => t.status === "SUBMITTED");

    const handleReview = (task) => {
        navigate(`/reviewer/review/${task.id}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b border-border">
                <div>
                    <h1 className="text-h1 font-extrabold tracking-tight text-foreground">Review Queue</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        <span className="text-annotator-primary font-bold">{reviewTasks.length}</span> tasks pending review.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => { logout(); navigate("/login"); }} leftIcon="logout">Logout</Button>
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Pending", value: reviewTasks.length, color: "text-blue-400" },
                    { label: "Approved Today", value: 12, color: "text-green-400" },
                    { label: "Rejected Today", value: 3, color: "text-red-400" },
                    { label: "Total Reviewed", value: 156, color: "text-foreground" },
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
                    <Input placeholder="Search tasks..." leftIcon="search" />
                </div>
            </div>

            {/* Review Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Submitter</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reviewTasks.map((task) => (
                        <TableRow key={task.id} onClick={() => handleReview(task)}>
                            <TableCell><span className="font-mono text-xs text-muted-foreground">{task.id}</span></TableCell>
                            <TableCell><span className="font-medium text-foreground">{task.projectName}</span></TableCell>
                            <TableCell><span className="text-xs text-foreground">{task.assignee}</span></TableCell>
                            <TableCell>
                                <span className="text-muted-foreground text-xs">
                                    {new Date(task.lastUpdated).toLocaleString()}
                                </span>
                            </TableCell>
                            <TableCell>
                                <BadgeStatus status={task.status} />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); handleReview(task); }}>Review</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {reviewTasks.length === 0 && (
                        <TableRow>
                            <TableCell className="text-center py-12 text-muted-foreground" colSpan={6}>
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-20 block">check_circle</span>
                                No tasks pending review. Good job!
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
