import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { policiesAPI } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";
import { SOURCE_FILES } from "../../utils/sourceMeta";

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

export default function ErrorTypes() {
    const { t } = useTranslation(["manager", "common"]);
    const navigate = useNavigate();
    const [items, setItems] = useState<PolicyItem[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<PolicyItem | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const res = await policiesAPI.getAll(0, 200);
            const policies: PolicyItem[] = res.content || res;
            setItems(policies);
        } catch (err) {
            console.error("Failed to load policies:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await policiesAPI.delete(deleteTarget.policyId);
            setDeleteTarget(null);
            await fetchPolicies();
        } catch (err) {
            console.error("Failed to delete policy:", err);
        }
    };

    return (
        <div
            className="p-8 space-y-6 max-w-5xl"
            data-source-file={SOURCE_FILES.managerErrorTypes}
      data-source-label="section:manager-error-types-page"
        >
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">{t("manager:errorTypes.title")}</h1>
                <Button variant="secondary" onClick={() => navigate("/manager/error-types/new")}>
                    <span className="material-symbols-outlined text-base mr-1">add</span>
                    {t("manager:errorTypes.create")}
                </Button>
            </div>

            <Card className="p-6">
                {loading ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">progress_activity</span>
                        <p className="text-sm text-muted-foreground">{t("manager:errorTypes.loading")}</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">bug_report</span>
                        <p className="text-muted-foreground">{t("manager:errorTypes.empty")}</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("manager:errorTypes.table.name")}</TableHead>
                                <TableHead>{t("manager:errorTypes.table.severity")}</TableHead>
                                <TableHead>{t("manager:errorTypes.table.description")}</TableHead>
                                <TableHead className="text-right">{t("manager:errorTypes.table.action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.policyId}>
                                    <TableCell className="font-medium">{item.errorName}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[item.errorLevel] || "bg-muted text-muted-foreground"}`}>
                                            {t(`manager:errorTypes.severity.${item.errorLevel}`, { defaultValue: item.errorLevel })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{item.description || "—"}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)} title={t("common:actions.delete")}>
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
                title={t("manager:errorTypes.deleteTitle")}
                message={t("manager:errorTypes.deleteMessage", {
                    name: deleteTarget?.errorName ?? "",
                })}
                isDestructive
            />
        </div>
    );
}
