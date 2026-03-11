import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { labelApi } from "../../api/labelApi";
import { labelRuleApi } from "../../api/labelRuleApi";
import apiClient from "../../api/apiClient";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ConfirmDialog, ModalDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";
import { cn } from "../../utils/cn";

/* ── localStorage keys (fallback for project mapping) ── */
const labelsKey = (pid: string) => `dlss_project_labels::${pid}`;
const rulesKey = (pid: string) => `dlss_project_label_rules::${pid}`;

/* ── helpers ── */
function loadIds(key: string): string[] {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch { return []; }
}
function saveIds(key: string, ids: string[]) {
    localStorage.setItem(key, JSON.stringify(ids));
}

/** Safely unwrap API response — handles array, { content: [] }, { data: [] } */
function unwrap(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (res?.content && Array.isArray(res.content)) return res.content;
    if (res?.data && Array.isArray(res.data)) return res.data;
    return [];
}

/* ── Seed data for label rules (fallback when API has no list-all) ── */
function seedRules() {
    return [
        { id: "r1", ruleId: 1, name: "Bounding Box Rule", ruleContent: "Each object must have exactly one bounding box" },
        { id: "r2", ruleId: 2, name: "Minimum Size Rule", ruleContent: "Bounding box must be at least 20x20 pixels" },
        { id: "r3", ruleId: 3, name: "Label Completeness", ruleContent: "All visible objects must be labeled" },
    ];
}

/* ── inner tab type ── */
type InnerTab = "labels" | "rules";

export default function ProjectLabels() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const pid = projectId || "";

    /* ── shared state ── */
    const [activeTab, setActiveTab] = useState<InnerTab>("labels");

    /* ── Labels state ── */
    const [globalLabels, setGlobalLabels] = useState<any[]>([]);
    const [projectLabelIds, setProjectLabelIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loadingLabels, setLoadingLabels] = useState(true);
    const [errorLabels, setErrorLabels] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState("");

    /* ── Label Rules state ── */
    const [globalRules, setGlobalRules] = useState<any[]>([]);
    const [projectRuleIds, setProjectRuleIds] = useState<string[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [ruleModalOpen, setRuleModalOpen] = useState(false);
    const [ruleSearch, setRuleSearch] = useState("");

    /* ── toast helper ── */
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    }, []);

    /* ── Load global labels from REAL API ── */
    const loadLabels = async () => {
        setLoadingLabels(true);
        setErrorLabels("");
        try {
            const res = await labelApi.getAllLabels();
            const data = unwrap(res);
            setGlobalLabels(data);
        } catch (err: any) {
            console.error("[ProjectLabels] Failed to load labels from API:", err);
            setErrorLabels(err?.message || "Không thể tải danh sách nhãn từ API");
            setGlobalLabels([]);
        } finally {
            setLoadingLabels(false);
        }
    };

    /* ── Load global rules: API-first, fallback mock ── */
    const loadRules = async () => {
        setLoadingRules(true);
        try {
            const res = await labelRuleApi.getAllRules();
            const data = unwrap(res);
            if (data.length > 0) {
                setGlobalRules(data);
            } else {
                // API returned empty — use seed data for demo
                setGlobalRules(seedRules());
            }
        } catch (err: any) {
            console.warn("[ProjectLabels] Label rules API failed, using fallback mock:", err?.message);
            setGlobalRules(seedRules());
        } finally {
            setLoadingRules(false);
        }
    };

    useEffect(() => {
        loadLabels();
        loadRules();
        if (pid) {
            setProjectLabelIds(loadIds(labelsKey(pid)));
            setProjectRuleIds(loadIds(rulesKey(pid)));
        }
    }, [pid]);

    /* ── Label helpers ── */
    const getLabelId = (l: any) => String(l.labelId ?? l.id);

    const isLabelAdded = (l: any) => projectLabelIds.includes(getLabelId(l));

    const addLabel = (l: any) => {
        const id = getLabelId(l);
        if (projectLabelIds.includes(id)) { showToast("Nhãn đã có trong project"); return; }
        const next = [...projectLabelIds, id];
        setProjectLabelIds(next);
        saveIds(labelsKey(pid), next);
        showToast(`Đã thêm "${l.labelName ?? l.name}"`);
    };

    const removeLabel = (l: any) => {
        const id = getLabelId(l);
        const next = projectLabelIds.filter((i) => i !== id);
        setProjectLabelIds(next);
        saveIds(labelsKey(pid), next);
        showToast(`Đã gỡ "${l.labelName ?? l.name}"`);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await labelApi.deleteLabel(deleteTarget.labelId ?? deleteTarget.id);
            setDeleteTarget(null);
            loadLabels(); // refresh from API
        } catch (err: any) {
            setErrorLabels(err?.message || "Xóa thất bại");
        } finally {
            setDeleting(false);
        }
    };

    /* ── Rule helpers ── */
    const getRuleId = (r: any) => String(r.ruleId ?? r.id);

    const isRuleAdded = (r: any) => projectRuleIds.includes(getRuleId(r));

    /** Sync the full list of ruleIds to backend */
    const syncRulesToBackend = async (ruleIds: string[]) => {
        if (!pid) return;
        try {
            await apiClient.put(`/api/projects/${pid}/label-rules`, {
                ruleIds: ruleIds.map((id) => Number(id)),
            });
        } catch (err: any) {
            console.error("[ProjectLabels] Failed to sync rules to backend:", err);
            showToast("Lỗi đồng bộ label rules lên server");
        }
    };

    const addRule = async (r: any) => {
        const id = getRuleId(r);
        if (projectRuleIds.includes(id)) return;
        const next = [...projectRuleIds, id];
        setProjectRuleIds(next);
        saveIds(rulesKey(pid), next);
        await syncRulesToBackend(next);
        showToast(`Đã thêm rule "${r.name ?? r.ruleName}"`);
    };

    const removeRule = async (r: any) => {
        const id = getRuleId(r);
        const next = projectRuleIds.filter((i) => i !== id);
        setProjectRuleIds(next);
        saveIds(rulesKey(pid), next);
        await syncRulesToBackend(next);
        showToast(`Đã gỡ rule "${r.name ?? r.ruleName}"`);
    };

    /* ── Derived data ── */
    const filteredGlobal = globalLabels.filter((l: any) =>
        (l.labelName || l.name || "").toLowerCase().includes(search.toLowerCase())
    );
    const projectLabels = globalLabels.filter((l) => isLabelAdded(l));
    const projectRules = globalRules.filter((r) => isRuleAdded(r));
    const filteredModalRules = globalRules.filter((r) =>
        (r.name || r.ruleName || "").toLowerCase().includes(ruleSearch.toLowerCase())
    );

    /* ═══════════ RENDER ═══════════ */
    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base font-bold text-foreground">Labels & Label Rules</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/manager/projects/${projectId}/labels/new`)}>
                        <span className="material-symbols-outlined text-base mr-1">add</span>Thêm nhãn
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setRuleModalOpen(true); setRuleSearch(""); }}>
                        <span className="material-symbols-outlined text-base mr-1">playlist_add</span>Thêm label rules
                    </Button>
                </div>
            </div>

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {toast}
                </div>
            )}

            {/* ── Inner Tabs ── */}
            <div className="flex gap-1 border-b border-border/50">
                {([
                    { key: "labels" as InnerTab, label: "Labels", icon: "label" },
                    { key: "rules" as InnerTab, label: "Label Rules", icon: "rule" },
                ]).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                            activeTab === tab.key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════════ TAB: Labels ═══════════ */}
            {activeTab === "labels" && (
                <div className="space-y-6">
                    {/* ── Project Labels ── */}
                    <Card className="p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">folder_special</span>
                            Labels của project
                        </h3>
                        {projectLabels.length === 0 ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">label_off</span>
                                <p className="text-muted-foreground text-sm">Chưa có nhãn nào được thêm vào project</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Color</TableHead>
                                        <TableHead>Tên nhãn</TableHead>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead>Phím tắt</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectLabels.map((label: any) => (
                                        <TableRow key={getLabelId(label)}>
                                            <TableCell>
                                                <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: label.colorCode || "#888" }} />
                                            </TableCell>
                                            <TableCell className="font-medium">{label.labelName ?? label.name}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                                    {label.labelType ?? label.type ?? "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-[200px] truncate">{label.description || "—"}</TableCell>
                                            <TableCell>
                                                {label.shortcutKey ? (
                                                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono border border-border">{label.shortcutKey}</kbd>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => removeLabel(label)} title="Gỡ khỏi project">
                                                    <span className="material-symbols-outlined text-base text-destructive">remove_circle</span>
                                                    <span className="ml-1 text-sm text-destructive">Gỡ</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>

                    {/* ── Global Labels (from API) ── */}
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">list</span>
                                Labels chung (Global) — <span className="text-xs font-normal text-muted-foreground">từ API</span>
                            </h3>
                            {errorLabels && (
                                <Button variant="ghost" size="sm" onClick={loadLabels}>
                                    <span className="material-symbols-outlined text-base mr-1">refresh</span>Thử lại
                                </Button>
                            )}
                        </div>

                        {errorLabels && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">error</span>
                                {errorLabels}
                            </p>
                        )}

                        <Input placeholder="Tìm kiếm nhãn..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="max-w-sm" />

                        {loadingLabels ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">progress_activity</span>
                                <p className="text-sm text-muted-foreground">Đang tải từ API...</p>
                            </div>
                        ) : filteredGlobal.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">label_off</span>
                                <p className="text-muted-foreground">{search ? "Không tìm thấy nhãn phù hợp" : "Chưa có nhãn nào"}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Color</TableHead>
                                        <TableHead>Tên nhãn</TableHead>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead>Phím tắt</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredGlobal.map((label: any) => (
                                        <TableRow key={getLabelId(label)}>
                                            <TableCell>
                                                <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: label.colorCode || "#888" }} />
                                            </TableCell>
                                            <TableCell className="font-medium">{label.labelName ?? label.name}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                                    {label.labelType ?? label.type ?? "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-[200px] truncate">{label.description || "—"}</TableCell>
                                            <TableCell>
                                                {label.shortcutKey ? (
                                                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono border border-border">{label.shortcutKey}</kbd>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-1">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={isLabelAdded(label)}
                                                    onClick={() => addLabel(label)}
                                                >
                                                    <span className="material-symbols-outlined text-base mr-1">add</span>
                                                    {isLabelAdded(label) ? "Đã thêm" : "Thêm vào project"}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(label)} title="Xóa nhãn">
                                                    <span className="material-symbols-outlined text-base text-destructive">delete</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </div>
            )}

            {/* ═══════════ TAB: Label Rules ═══════════ */}
            {activeTab === "rules" && (
                <div className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">rule</span>
                                Label Rules của project
                            </h3>
                            <Button variant="secondary" size="sm" onClick={() => { setRuleModalOpen(true); setRuleSearch(""); }}>
                                <span className="material-symbols-outlined text-base mr-1">add</span>Thêm rule
                            </Button>
                        </div>

                        {loadingRules ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">progress_activity</span>
                                <p className="text-sm text-muted-foreground">Đang tải...</p>
                            </div>
                        ) : projectRules.length === 0 ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">rule</span>
                                <p className="text-muted-foreground text-sm">Chưa có label rule nào trong project</p>
                                <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setRuleModalOpen(true); setRuleSearch(""); }}>
                                    <span className="material-symbols-outlined text-base mr-1">add</span>Thêm label rules
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tên Rule</TableHead>
                                        <TableHead>Nội dung / Mô tả</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectRules.map((rule: any) => (
                                        <TableRow key={getRuleId(rule)}>
                                            <TableCell className="font-medium">{rule.name ?? rule.ruleName}</TableCell>
                                            <TableCell className="text-muted-foreground max-w-[300px] truncate">{rule.ruleContent ?? rule.description ?? "—"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => removeRule(rule)} title="Gỡ khỏi project">
                                                    <span className="material-symbols-outlined text-base text-destructive">remove_circle</span>
                                                    <span className="ml-1 text-sm text-destructive">Gỡ</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </div>
            )}

            {/* ── Delete Label Confirm Dialog ── */}
            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xóa nhãn" message={`Bạn có chắc muốn xóa nhãn "${deleteTarget?.labelName ?? deleteTarget?.name}"?`}
                confirmText={deleting ? "Đang xóa..." : "Xóa"} isDestructive />

            {/* ── Add Label Rules Modal ── */}
            <ModalDialog
                isOpen={ruleModalOpen}
                onClose={() => setRuleModalOpen(false)}
                title="Chọn Label Rules"
                actions={
                    <Button variant="secondary" onClick={() => setRuleModalOpen(false)}>Đóng</Button>
                }
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Tìm kiếm rule..."
                        value={ruleSearch}
                        onChange={(e: any) => setRuleSearch(e.target.value)}
                        className="w-full"
                    />
                    {filteredModalRules.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-4">
                            {ruleSearch ? "Không tìm thấy rule phù hợp" : "Chưa có label rule nào"}
                        </p>
                    ) : (
                        <div className="max-h-[320px] overflow-y-auto space-y-2">
                            {filteredModalRules.map((rule: any) => {
                                const added = isRuleAdded(rule);
                                return (
                                    <div key={getRuleId(rule)} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">{rule.name ?? rule.ruleName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{rule.ruleContent ?? rule.description ?? ""}</p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="ml-3 shrink-0"
                                            disabled={added}
                                            onClick={() => addRule(rule)}
                                        >
                                            <span className="material-symbols-outlined text-base mr-1">add</span>
                                            {added ? "Đã thêm" : "Thêm"}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </ModalDialog>
        </div>
    );
}
