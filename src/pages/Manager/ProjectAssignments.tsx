import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getMockData, deleteMockItem } from "../../utils/mockStorage";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ModalDialog, ConfirmDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

// TODO_BACKEND: Replace with real API when available

const TASKS_KEY = "mock_tasks";
const ERROR_TYPES_KEY = "mock_error_types";

function seedTasks() {
    return [
        { id: crypto.randomUUID(), taskName: "Label Batch Human_v1", project: "Human Detection", projectId: "1", assignee: "Nguyễn Văn A", status: "IN_PROGRESS", progress: 65, createdAt: "2026-02-10T08:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Car_v2", project: "Vehicle Detection", projectId: "2", assignee: "Trần Thị B", status: "COMPLETED", progress: 100, createdAt: "2026-02-08T10:30:00" },
        { id: crypto.randomUUID(), taskName: "Review Batch Dog_v1", project: "Animal Classification", projectId: "3", assignee: "Lê Văn C", status: "PENDING", progress: 0, createdAt: "2026-02-15T14:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Sign_v1", project: "Traffic Sign", projectId: "1", assignee: "Phạm Thị D", status: "RETURNED", progress: 30, createdAt: "2026-02-12T09:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Face_v3", project: "Face Recognition", projectId: "2", assignee: "Nguyễn Văn A", status: "IN_PROGRESS", progress: 45, createdAt: "2026-02-14T11:00:00" },
    ];
}

function seedErrorTypes() {
    return [
        { id: crypto.randomUUID(), name: "Missing Label", code: "MISSING_LABEL", severity: "HIGH", description: "Object exists but no label applied", isActive: true },
        { id: crypto.randomUUID(), name: "Wrong Bounding Box", code: "WRONG_BBOX", severity: "MEDIUM", description: "Bounding box does not match object", isActive: true },
        { id: crypto.randomUUID(), name: "Overlapping", code: "OVERLAP", severity: "LOW", description: "Labels overlap incorrectly", isActive: true },
        { id: crypto.randomUUID(), name: "Incomplete Annotation", code: "INCOMPLETE", severity: "HIGH", description: "Object partially annotated", isActive: false },
    ];
}

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    RETURNED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const SEVERITY_STYLES: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function ProjectAssignments() {
    const { projectId } = useParams();
    const [subTab, setSubTab] = useState<"tasks" | "errors">("tasks");
    const [tasks, setTasks] = useState<any[]>([]);
    const [errorTypes, setErrorTypes] = useState<any[]>([]);
    const [viewTask, setViewTask] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    useEffect(() => {
        const allTasks = getMockData(TASKS_KEY, seedTasks);
        // Filter tasks by projectId if available
        setTasks(projectId ? allTasks.filter((t: any) => t.projectId === projectId) : allTasks);
        setErrorTypes(getMockData(ERROR_TYPES_KEY, seedErrorTypes));
    }, [projectId]);

    const handleDeleteError = () => {
        if (!deleteTarget) return;
        deleteMockItem(ERROR_TYPES_KEY, deleteTarget.id);
        setErrorTypes(getMockData(ERROR_TYPES_KEY, seedErrorTypes));
        setDeleteTarget(null);
    };

    return (
        <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-2">
                <Button
                    variant={subTab === "tasks" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSubTab("tasks")}
                >
                    <span className="material-symbols-outlined text-base mr-1">task_alt</span>
                    Tasks ({tasks.length})
                </Button>
                <Button
                    variant={subTab === "errors" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSubTab("errors")}
                >
                    <span className="material-symbols-outlined text-base mr-1">bug_report</span>
                    Error Types ({errorTypes.length})
                </Button>
            </div>

            {/* Tasks sub-tab */}
            {subTab === "tasks" && (
                <Card className="p-6">
                    {tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">task_alt</span>
                            <p className="text-muted-foreground">Chưa có nhiệm vụ nào cho dự án này</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên nhiệm vụ</TableHead>
                                    <TableHead>Người thực hiện</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Tiến độ</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task: any) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">{task.taskName}</TableCell>
                                        <TableCell>{task.assignee}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[task.status] || "bg-muted text-muted-foreground"}`}>
                                                {task.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${task.progress}%` }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground w-8">{task.progress}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{new Date(task.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setViewTask(task)}>
                                                <span className="material-symbols-outlined text-base mr-1">visibility</span>Xem
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            )}

            {/* Error Types sub-tab */}
            {subTab === "errors" && (
                <Card className="p-6">
                    {errorTypes.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">bug_report</span>
                            <p className="text-muted-foreground">Chưa có loại lỗi nào</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Mã</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {errorTypes.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.code}</code></TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[item.severity] || "bg-muted text-muted-foreground"}`}>
                                                {item.severity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{item.description || "—"}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                                                {item.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)} title="Xóa">
                                                <span className="material-symbols-outlined text-base text-destructive">delete</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            )}

            {/* View Task Modal */}
            <ModalDialog isOpen={!!viewTask} onClose={() => setViewTask(null)} title="Chi tiết nhiệm vụ"
                actions={<Button variant="secondary" onClick={() => setViewTask(null)}>Đóng</Button>}>
                {viewTask && (
                    <div className="space-y-3 text-sm">
                        <div><span className="font-medium text-foreground">Tên:</span> <span className="text-muted-foreground">{viewTask.taskName}</span></div>
                        <div><span className="font-medium text-foreground">Người thực hiện:</span> <span className="text-muted-foreground">{viewTask.assignee}</span></div>
                        <div><span className="font-medium text-foreground">Trạng thái:</span>{" "}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[viewTask.status]}`}>{viewTask.status}</span>
                        </div>
                        <div><span className="font-medium text-foreground">Tiến độ:</span> <span className="text-muted-foreground">{viewTask.progress}%</span></div>
                        <div><span className="font-medium text-foreground">Ngày tạo:</span> <span className="text-muted-foreground">{new Date(viewTask.createdAt).toLocaleString("vi-VN")}</span></div>
                    </div>
                )}
            </ModalDialog>

            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteError}
                title="Xóa loại lỗi" message={`Bạn có chắc muốn xóa "${deleteTarget?.name}"?`} isDestructive />
        </div>
    );
}
