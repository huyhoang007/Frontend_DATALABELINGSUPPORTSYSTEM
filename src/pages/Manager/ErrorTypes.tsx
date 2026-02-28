import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMockData, deleteMockItem } from "../../utils/mockStorage";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

// TODO_BACKEND: Replace with real API when available

const STORAGE_KEY = "mock_error_types";

function seedErrorTypes() {
    return [
        { id: crypto.randomUUID(), name: "Missing Label", code: "MISSING_LABEL", severity: "HIGH", description: "Object exists but no label applied", isActive: true },
        { id: crypto.randomUUID(), name: "Wrong Bounding Box", code: "WRONG_BBOX", severity: "MEDIUM", description: "Bounding box does not match object", isActive: true },
        { id: crypto.randomUUID(), name: "Overlapping", code: "OVERLAP", severity: "LOW", description: "Labels overlap incorrectly", isActive: true },
        { id: crypto.randomUUID(), name: "Incomplete Annotation", code: "INCOMPLETE", severity: "HIGH", description: "Object partially annotated", isActive: false },
    ];
}

const SEVERITY_STYLES = {
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function ErrorTypes() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        setItems(getMockData(STORAGE_KEY, seedErrorTypes));
    }, []);

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteMockItem(STORAGE_KEY, deleteTarget.id);
        setItems(getMockData(STORAGE_KEY, seedErrorTypes));
        setDeleteTarget(null);
    };

    return (
        <div className="p-8 space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Error Types</h1>
                <Button variant="secondary" onClick={() => navigate("/manager/error-types/new")}>
                    <span className="material-symbols-outlined text-base mr-1">add</span>
                    Thêm loại lỗi
                </Button>
            </div>

            <Card className="p-6">
                {items.length === 0 ? (
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
                            {items.map((item) => (
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

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Xóa loại lỗi"
                message={`Bạn có chắc muốn xóa "${deleteTarget?.name}"?`}
                isDestructive
            />
        </div>
    );
}
