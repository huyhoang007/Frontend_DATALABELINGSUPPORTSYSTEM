import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { labelRuleApi } from "../../api/labelRuleApi";
import apiClient from "../../api/apiClient";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ConfirmDialog, ModalDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

/* ── localStorage keys (fallback for project mapping) ── */
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

export default function ProjectLabels() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const pid = projectId || "";

    /* ── Label Rules state ── */
    const [globalRules, setGlobalRules] = useState<any[]>([]);
    const [projectRuleIds, setProjectRuleIds] = useState<string[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [ruleModalOpen, setRuleModalOpen] = useState(false);
    const [ruleSearch, setRuleSearch] = useState("");
    const [toast, setToast] = useState("");

    /* ── toast helper ── */
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    }, []);

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
        loadRules();
        if (pid) {
            setProjectRuleIds(loadIds(rulesKey(pid)));
        }
    }, [pid]);

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
    const projectRules = globalRules.filter((r) => isRuleAdded(r));
    const filteredModalRules = globalRules.filter((r) =>
        (r.name || r.ruleName || "").toLowerCase().includes(ruleSearch.toLowerCase())
    );

    /* ═══════════ RENDER ═══════════ */
    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base font-bold text-foreground">Quy tắc nhãn</h2>
                <div className="flex gap-2">
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

            {/* ═══════════ Label Rules Content ═══════════ */}
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
