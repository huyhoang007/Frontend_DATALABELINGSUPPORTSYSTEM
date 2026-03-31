import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { labelApi } from "../../api/labelApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ConfirmDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

interface Label {
    labelId?: number;
    id?: number;
    labelName?: string;
    name?: string;
    colorCode?: string;
    labelType?: string;
    type?: string;
    isActive?: boolean;
    description?: string;
    shortcutKey?: string;
}

export default function Labels() {
    const { t } = useTranslation(["manager", "common"]);
    const navigate = useNavigate();
    const [labels, setLabels] = useState<Label[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Label | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [activatingId, setActivatingId] = useState<number | null>(null);

    const loadLabels = async () => {
        setLoading(true);
        try {
            const data = await labelApi.getAllLabels();
            setLabels(Array.isArray(data) ? data : []);
        } catch (err) {
            setError((err as Error)?.message || t("manager:labels.loadFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLabels(); }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await labelApi.deleteLabel((deleteTarget.labelId ?? deleteTarget.id) as number);
            setDeleteTarget(null);
            loadLabels();
        } catch (err) {
            setError((err as Error)?.message || t("manager:labels.deleteFailed"));
        } finally {
            setDeleting(false);
        }
    };

    const handleActivate = async (labelId: number) => {
        setActivatingId(labelId);
        try {
            await labelApi.activateLabel(labelId);
            loadLabels();
        } catch (err) {
            setError((err as Error)?.message || t("manager:labels.activateFailed"));
        } finally {
            setActivatingId(null);
        }
    };

    const filtered = labels.filter((l) =>
        (l.labelName || l.name || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">{t("manager:labels.title")}</h1>
                <Button variant="secondary" onClick={() => navigate("/manager/labels/new")}>
                    <span className="material-symbols-outlined text-base mr-1">add</span>
                    {t("manager:labels.create")}
                </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Card className="p-6 space-y-4">
                <Input
                    placeholder={t("manager:labels.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />

                {loading ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">{t("manager:labels.loading")}</p>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">label_off</span>
                        <p className="text-muted-foreground">
                            {search ? t("manager:labels.emptySearch") : t("manager:labels.emptyList")}
                        </p>
                        {!search && (
                            <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate("/manager/labels/new")}>
                                {t("manager:labels.createFirst")}
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">{t("manager:labels.table.color")}</TableHead>
                                <TableHead>{t("manager:labels.table.name")}</TableHead>
                                <TableHead>{t("manager:labels.table.type")}</TableHead>
                                <TableHead>{t("manager:labels.table.status")}</TableHead>
                                <TableHead>{t("manager:labels.table.description")}</TableHead>
                                <TableHead>{t("manager:labels.table.shortcut")}</TableHead>
                                <TableHead className="text-right">{t("manager:labels.table.action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((label) => (
                                <TableRow key={label.labelId ?? label.id}>
                                    <TableCell>
                                        <div
                                            className="w-5 h-5 rounded-full border border-border"
                                            style={{ backgroundColor: label.colorCode || "#888" }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{label.labelName ?? label.name}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                            {label.labelType || label.type
                                                ? t(`manager:labels.types.${label.labelType ?? label.type}`, {
                                                    defaultValue: label.labelType ?? label.type,
                                                })
                                                : "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${label.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {label.isActive !== false ? t("manager:labels.active") : t("manager:labels.inactive")}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{label.description || "—"}</TableCell>
                                    <TableCell>
                                        {label.shortcutKey ? (
                                            <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono border border-border">{label.shortcutKey}</kbd>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {label.isActive !== false ? (
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(label)} title={t("manager:labels.deactivateTitle")}>
                                                <span className="material-symbols-outlined text-base text-amber-600">block</span>
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleActivate((label.labelId ?? label.id) as number)}
                                                title={t("manager:labels.reactivateTitle")}
                                                disabled={activatingId === (label.labelId ?? label.id)}
                                            >
                                                <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                                            </Button>
                                        )}
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
                title={t("manager:labels.deleteDialogTitle")}
                message={t("manager:labels.deleteDialogMessage", {
                    name: deleteTarget?.labelName ?? deleteTarget?.name ?? "",
                })}
                confirmText={deleting ? t("common:states.processing") : t("manager:labels.deleteDialogConfirm")}
                isDestructive
            />
        </div>
    );
}
