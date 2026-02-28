import React, { useState, useEffect } from "react";
import { getMockData } from "../../utils/mockStorage";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ModalDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

// TODO_BACKEND: Replace with real API when available

const STORAGE_KEY = "mock_tasks";

function seedTasks() {
    return [
        { id: crypto.randomUUID(), taskName: "Label Batch Human_v1", project: "Human Detection", assignee: "Nguyễn Văn A", status: "IN_PROGRESS", progress: 65, createdAt: "2026-02-10T08:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Car_v2", project: "Vehicle Detection", assignee: "Trần Thị B", status: "COMPLETED", progress: 100, createdAt: "2026-02-08T10:30:00" },
        { id: crypto.randomUUID(), taskName: "Review Batch Dog_v1", project: "Animal Classification", assignee: "Lê Văn C", status: "PENDING", progress: 0, createdAt: "2026-02-15T14:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Sign_v1", project: "Traffic Sign", assignee: "Phạm Thị D", status: "RETURNED", progress: 30, createdAt: "2026-02-12T09:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Face_v3", project: "Face Recognition", assignee: "Nguyễn Văn A", status: "IN_PROGRESS", progress: 45, createdAt: "2026-02-14T11:00:00" },
    ];
}

const STATUS_STYLES = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    RETURNED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_OPTIONS = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "RETURNED"];

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [viewTask, setViewTask] = useState(null);

    useEffect(() => {
        setTasks(getMockData(STORAGE_KEY, seedTasks));
    }, []);

    const filtered = statusFilter === "ALL" ? tasks : tasks.filter((t) => t.status === statusFilter);

    return (
        <div className="p-8 space-y-6 max-w-5xl">
            <h1 className="text-2xl font-bold text-foreground">Quản lí nhiệm vụ</h1>

            <Card className="p-6 space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground">Trạng thái:</label>
                    <select
                        className="rounded-md border border-border bg-background text-foreground px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "ALL" ? "Tất cả" : s}</option>)}
                    </select>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">task_alt</span>
                        <p className="text-muted-foreground">Chưa có nhiệm vụ nào</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên nhiệm vụ</TableHead>
                                <TableHead>Dự án</TableHead>
                                <TableHead>Người thực hiện</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Tiến độ</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.taskName}</TableCell>
                                    <TableCell className="text-muted-foreground">{task.project}</TableCell>
                                    <TableCell>{task.assignee}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[task.status] || "bg-muted text-muted-foreground"}`}>
                                            {task.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-8">{task.progress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{new Date(task.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setViewTask(task)}>
                                            <span className="material-symbols-outlined text-base mr-1">visibility</span>
                                            Xem
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* View Task Modal (read-only) */}
            <ModalDialog
                isOpen={!!viewTask}
                onClose={() => setViewTask(null)}
                title="Chi tiết nhiệm vụ"
                actions={
                    <Button variant="secondary" onClick={() => setViewTask(null)}>Đóng</Button>
                }
            >
                {viewTask && (
                    <div className="space-y-3 text-sm">
                        <div><span className="font-medium text-foreground">Tên:</span> <span className="text-muted-foreground">{viewTask.taskName}</span></div>
                        <div><span className="font-medium text-foreground">Dự án:</span> <span className="text-muted-foreground">{viewTask.project}</span></div>
                        <div><span className="font-medium text-foreground">Người thực hiện:</span> <span className="text-muted-foreground">{viewTask.assignee}</span></div>
                        <div><span className="font-medium text-foreground">Trạng thái:</span>{" "}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[viewTask.status]}`}>{viewTask.status}</span>
                        </div>
                        <div><span className="font-medium text-foreground">Tiến độ:</span> <span className="text-muted-foreground">{viewTask.progress}%</span></div>
                        <div><span className="font-medium text-foreground">Ngày tạo:</span> <span className="text-muted-foreground">{new Date(viewTask.createdAt).toLocaleString("vi-VN")}</span></div>
                    </div>
                )}
            </ModalDialog>
        </div>
    );
}
