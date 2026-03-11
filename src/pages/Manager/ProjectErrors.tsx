import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { policiesAPI } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

/**
 * ProjectErrors — Error Types tab inside Project Detail.
 *
 * Data sources (real API):
 *  - Global error types: GET /api/policies
 *  - Project error types: GET /api/policies/project/{projectId}
 *  - Assign to project: POST /api/policies/assign?projectId=X&policyId=Y
 *  - Remove from project: DELETE /api/policies/remove?projectId=X&policyId=Y
 */

interface PolicyItem {
    policyId: number;
    errorName: string;
    description: string;
    errorLevel: string;
    createdAt: string;
    updatedAt: string;
}

const SEVERITY_STYLES: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function ProjectErrors() {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId) || 0;
    const [globalPolicies, setGlobalPolicies] = useState<PolicyItem[]>([]);
    const [projectPolicies, setProjectPolicies] = useState<PolicyItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    }, []);

    const fetchData = useCallback(async () => {
        if (!pid) return;
        setLoading(true);
        try {
            const [globalRes, projectRes] = await Promise.all([
                policiesAPI.getAll(0, 200),
                policiesAPI.getByProject(pid),
            ]);
            // globalRes is a Page object with .content
            const allPolicies: PolicyItem[] = globalRes.content || globalRes;
            const projPolicies: PolicyItem[] = Array.isArray(projectRes) ? projectRes : projectRes.content || [];
            setGlobalPolicies(allPolicies);
            setProjectPolicies(projPolicies);
        } catch (err) {
            console.error("Failed to load policies:", err);
            showToast("Lỗi tải dữ liệu policies");
        } finally {
            setLoading(false);
        }
    }, [pid, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const projectPolicyIds = new Set(projectPolicies.map((p) => p.policyId));

    const addToProject = async (policyId: number) => {
        if (projectPolicyIds.has(policyId)) {
            showToast("Error type đã có trong project");
            return;
        }
        setActionLoading(policyId);
        try {
            await policiesAPI.assignToProject(pid, policyId);
            showToast("Đã thêm vào project");
            await fetchData();
        } catch (err) {
            console.error("Failed to assign policy:", err);
            showToast("Lỗi khi thêm error type vào project");
        } finally {
            setActionLoading(null);
        }
    };

    const removeFromProject = async (policyId: number) => {
        setActionLoading(policyId);
        try {
            await policiesAPI.removeFromProject(pid, policyId);
            showToast("Đã gỡ khỏi project");
            await fetchData();
        } catch (err) {
            console.error("Failed to remove policy:", err);
            showToast("Lỗi khi gỡ error type khỏi project");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredGlobal = globalPolicies.filter((p) =>
        (p.errorName || "").toLowerCase().includes(search.toLowerCase())
    );

    const renderTable = (items: PolicyItem[], mode: "global" | "project") => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.policyId}>
                        <TableCell className="font-medium">{item.errorName}</TableCell>
                        <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[item.errorLevel] || "bg-muted text-muted-foreground"}`}>
                                {item.errorLevel}
                            </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{item.description || "—"}</TableCell>
                        <TableCell className="text-right">
                            {mode === "global" ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={projectPolicyIds.has(item.policyId) || actionLoading === item.policyId}
                                    onClick={() => addToProject(item.policyId)}
                                >
                                    <span className="material-symbols-outlined text-base mr-1">add</span>
                                    {actionLoading === item.policyId ? "Đang thêm..." : projectPolicyIds.has(item.policyId) ? "Đã thêm" : "Thêm vào project"}
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === item.policyId}
                                    onClick={() => removeFromProject(item.policyId)}
                                    title="Gỡ khỏi project"
                                >
                                    <span className="material-symbols-outlined text-base text-destructive">remove_circle</span>
                                    <span className="ml-1 text-destructive">{actionLoading === item.policyId ? "Đang gỡ..." : "Gỡ"}</span>
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
                {loading ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">progress_activity</span>
                        <p className="text-sm text-muted-foreground">Đang tải...</p>
                    </div>
                ) : projectPolicies.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">bug_report</span>
                        <p className="text-muted-foreground text-sm">Chưa có error type nào được thêm vào project</p>
                    </div>
                ) : renderTable(projectPolicies, "project")}
            </Card>

            {/* Global Error Types */}
            <Card className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">list</span>
                    Tất cả Error Types
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
