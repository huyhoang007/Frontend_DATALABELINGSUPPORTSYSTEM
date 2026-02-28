import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getMockData } from "../../utils/mockStorage";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

/**
 * ProjectErrors — Error Types tab inside Project Detail.
 *
 * Data sources:
 *  - Global error types: mockStorage (no backend /api/error-types endpoint exists)
 *  - Project mapping: localStorage dlss_project_error_types::${projectId}
 *
 * When a backend error-types API is added, replace getMockData() with API call.
 */

const GLOBAL_KEY = "mock_error_types";
const projectKey = (pid: string) => `dlss_project_error_types::${pid}`;

function seedErrorTypes() {
    return [
        { id: crypto.randomUUID(), name: "Missing Label", code: "MISSING_LABEL", severity: "HIGH", description: "Object exists but no label applied", isActive: true },
        { id: crypto.randomUUID(), name: "Wrong Bounding Box", code: "WRONG_BBOX", severity: "MEDIUM", description: "Bounding box does not match object", isActive: true },
        { id: crypto.randomUUID(), name: "Overlapping", code: "OVERLAP", severity: "LOW", description: "Labels overlap incorrectly", isActive: true },
        { id: crypto.randomUUID(), name: "Incomplete Annotation", code: "INCOMPLETE", severity: "HIGH", description: "Object partially annotated", isActive: false },
    ];
}

const SEVERITY_STYLES: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function ProjectErrors() {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = projectId || "";
    const [globalErrors, setGlobalErrors] = useState<any[]>([]);
    const [projectIds, setProjectIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState("");

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    }, []);

    useEffect(() => {
        // Global error types — from mockStorage (no backend yet)
        setLoading(true);
        try {
            setGlobalErrors(getMockData(GLOBAL_KEY, seedErrorTypes));
        } catch {
            setGlobalErrors(seedErrorTypes());
        }
        setLoading(false);

        // Project mapping from localStorage
        if (pid) {
            try {
                const raw = localStorage.getItem(projectKey(pid));
                setProjectIds(raw ? JSON.parse(raw) : []);
            } catch { setProjectIds([]); }
        }
    }, [pid]);

    const saveProjectIds = (ids: string[]) => {
        setProjectIds(ids);
        if (pid) localStorage.setItem(projectKey(pid), JSON.stringify(ids));
    };

    const addToProject = (id: string) => {
        const sid = String(id);
        if (projectIds.includes(sid)) { showToast("Error type đã có trong project"); return; }
        saveProjectIds([...projectIds, sid]);
        showToast("Đã thêm vào project");
    };

    const removeFromProject = (id: string) => {
        saveProjectIds(projectIds.filter((i) => i !== String(id)));
        showToast("Đã gỡ khỏi project");
    };

    const isAdded = (id: string) => projectIds.includes(String(id));

    const projectErrors = globalErrors.filter((e) => isAdded(e.id));
    const filteredGlobal = globalErrors.filter((e) =>
        (e.name || "").toLowerCase().includes(search.toLowerCase())
    );

    const renderTable = (items: any[], mode: "global" | "project") => (
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
                            {mode === "global" ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={isAdded(item.id)}
                                    onClick={() => addToProject(item.id)}
                                >
                                    <span className="material-symbols-outlined text-base mr-1">add</span>
                                    {isAdded(item.id) ? "Đã thêm" : "Thêm vào project"}
                                </Button>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={() => removeFromProject(item.id)} title="Gỡ khỏi project">
                                    <span className="material-symbols-outlined text-base text-destructive">remove_circle</span>
                                    <span className="ml-1 text-destructive">Gỡ</span>
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {toast}
                </div>
            )}

            <div>
                <h2 className="text-base font-bold text-foreground">Errors</h2>
                <p className="text-sm text-muted-foreground mt-1">Danh sách lỗi/loại lỗi dùng trong project</p>
            </div>

            {/* Project Error Types */}
            <Card className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">bug_report</span>
                    Error Types của project
                </h3>
                {projectErrors.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">bug_report</span>
                        <p className="text-muted-foreground text-sm">Chưa có error type nào được thêm vào project</p>
                    </div>
                ) : renderTable(projectErrors, "project")}
            </Card>

            {/* Global Error Types */}
            <Card className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">list</span>
                    Error Types chung (Global) — <span className="text-xs font-normal text-muted-foreground">localStorage mock (chờ API)</span>
                </h3>
                <Input
                    placeholder="Tìm kiếm error type..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                {loading ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">progress_activity</span>
                        <p className="text-sm text-muted-foreground">Đang tải...</p>
                    </div>
                ) : filteredGlobal.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">search_off</span>
                        <p className="text-muted-foreground text-sm">{search ? "Không tìm thấy" : "Chưa có error type nào"}</p>
                    </div>
                ) : renderTable(filteredGlobal, "global")}
            </Card>
        </div>
    );
}
