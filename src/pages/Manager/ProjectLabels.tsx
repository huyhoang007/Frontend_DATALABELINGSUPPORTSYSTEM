import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { labelRuleApi } from "../../api/labelRuleApi";
import apiClient from "../../api/apiClient";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ModalDialog } from "../../components/ui/Modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/Table";
import { SOURCE_FILES } from "../../utils/sourceMeta";

const rulesKey = (pid: string) => `dlss_project_label_rules::${pid}`;

function loadIds(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids));
}

function unwrap(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res?.content && Array.isArray(res.content)) return res.content;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
}

function seedRules() {
  return [
    {
      id: "r1",
      ruleId: 1,
      name: "Bounding Box Rule",
      ruleContent: "Each object must have exactly one bounding box",
    },
    {
      id: "r2",
      ruleId: 2,
      name: "Minimum Size Rule",
      ruleContent: "Bounding box must be at least 20x20 pixels",
    },
    {
      id: "r3",
      ruleId: 3,
      name: "Label Completeness",
      ruleContent: "All visible objects must be labeled",
    },
  ];
}

export default function ProjectLabels() {
  const { t } = useTranslation(["manager", "common"]);
  const { projectId } = useParams();
  const pid = projectId || "";
  const { project: parentProject } = (useOutletContext() as any) || {};
  const isProjectCompleted =
    parentProject?.status?.toLowerCase() === "completed";

  const [globalRules, setGlobalRules] = useState<any[]>([]);
  const [projectRuleIds, setProjectRuleIds] = useState<string[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleSearch, setRuleSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const loadRules = async () => {
    setLoadingRules(true);
    try {
      const res = await labelRuleApi.getAllRules();
      const data = unwrap(res);
      if (data.length > 0) {
        setGlobalRules(data);
      } else {
        setGlobalRules(seedRules());
      }
    } catch (err: any) {
      console.warn(
        "[ProjectLabels] Label rules API failed, using fallback mock:",
        err?.message,
      );
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

  const getRuleId = (r: any) => String(r.ruleId ?? r.id);
  const isRuleAdded = (r: any) => projectRuleIds.includes(getRuleId(r));

  const syncRulesToBackend = async (ruleIds: string[]) => {
    if (!pid) return;
    try {
      await apiClient.put(`/api/projects/${pid}/label-rules`, {
        ruleIds: ruleIds.map((id) => Number(id)),
      });
    } catch (err: any) {
      console.error("[ProjectLabels] Failed to sync rules to backend:", err);
      showToast(t("manager:labelRules.syncedFailed"));
    }
  };

  const addRule = async (r: any) => {
    const id = getRuleId(r);
    if (projectRuleIds.includes(id)) return;
    const next = [...projectRuleIds, id];
    setProjectRuleIds(next);
    saveIds(rulesKey(pid), next);
    await syncRulesToBackend(next);
    showToast(
      t("manager:labelRules.addSuccess", {
        name: r.name ?? r.ruleName,
      }),
    );
  };

  const removeRule = async (r: any) => {
    if (projectRuleIds.length <= 1) {
      showToast(t("manager:labelRules.minOneRequired"));
      return;
    }
    const id = getRuleId(r);
    const next = projectRuleIds.filter((i) => i !== id);
    setProjectRuleIds(next);
    saveIds(rulesKey(pid), next);
    await syncRulesToBackend(next);
    showToast(
      t("manager:labelRules.removeSuccess", {
        name: r.name ?? r.ruleName,
      }),
    );
  };

  const projectRules = globalRules.filter((r) => isRuleAdded(r));
  const filteredModalRules = globalRules.filter((r) =>
    (r.name || r.ruleName || "").toLowerCase().includes(ruleSearch.toLowerCase()),
  );

  return (
    <div
      className="space-y-4"
      data-source-file={SOURCE_FILES.managerProjectLabels}
      data-source-label="section:manager-project-labels-tab"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold text-foreground">
          {t("manager:labelRules.title")}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setRuleModalOpen(true);
              setRuleSearch("");
            }}
            disabled={isProjectCompleted}
          >
            <span className="material-symbols-outlined text-base mr-1">
              playlist_add
            </span>
            {t("manager:labelRules.addRules")}
          </Button>
        </div>
      </div>

      {isProjectCompleted && (
        <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined text-orange-600 text-base mt-0.5">
            lock
          </span>
          <div>
            <p className="font-medium text-orange-900 text-sm">
              {t("manager:assignments.completedLockedTitle")}
            </p>
            <p className="text-xs text-orange-800 mt-1">
              {t("manager:assignments.completedLockedDescription")}
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toast}
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">rule</span>
            {t("manager:labelRules.projectRules")}
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setRuleModalOpen(true);
              setRuleSearch("");
            }}
            disabled={isProjectCompleted}
          >
            <span className="material-symbols-outlined text-base mr-1">
              add
            </span>
            {t("manager:labelRules.addRule")}
          </Button>
        </div>

        {loadingRules ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">
              progress_activity
            </span>
            <p className="text-sm text-muted-foreground">
              {t("manager:labelRules.loading")}
            </p>
          </div>
        ) : projectRules.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">
              rule
            </span>
            <p className="text-muted-foreground text-sm">
              {t("manager:labelRules.emptyProject")}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                setRuleModalOpen(true);
                setRuleSearch("");
              }}
              disabled={isProjectCompleted}
            >
              <span className="material-symbols-outlined text-base mr-1">
                add
              </span>
              {t("manager:labelRules.addRules")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("manager:labelRules.table.name")}</TableHead>
                <TableHead>{t("manager:labelRules.table.content")}</TableHead>
                <TableHead className="text-right">
                  {t("manager:labelRules.table.action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectRules.map((rule: any) => (
                <TableRow key={getRuleId(rule)}>
                  <TableCell className="font-medium">
                    {rule.name ?? rule.ruleName}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {rule.ruleContent ?? rule.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(rule)}
                      disabled={isProjectCompleted || projectRuleIds.length <= 1}
                      title={t("manager:labelRules.removeRuleTitle")}
                    >
                      <span className="material-symbols-outlined text-base text-destructive">
                        remove_circle
                      </span>
                      <span className="ml-1 text-sm text-destructive">
                        {t("manager:labelRules.removeRule")}
                      </span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ModalDialog
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title={t("manager:labelRules.modalTitle")}
        actions={
          <Button variant="secondary" onClick={() => setRuleModalOpen(false)}>
            {t("common:actions.close")}
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            placeholder={t("manager:labelRules.searchPlaceholder")}
            value={ruleSearch}
            onChange={(e: any) => setRuleSearch(e.target.value)}
            className="w-full"
          />
          {filteredModalRules.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              {ruleSearch
                ? t("manager:labelRules.emptySearch")
                : t("manager:labelRules.emptyGlobal")}
            </p>
          ) : (
            <div className="max-h-[320px] overflow-y-auto space-y-2">
              {filteredModalRules.map((rule: any) => {
                const added = isRuleAdded(rule);
                return (
                  <div
                    key={getRuleId(rule)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {rule.name ?? rule.ruleName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {rule.ruleContent ?? rule.description ?? ""}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-3 shrink-0"
                      disabled={added}
                      onClick={() => addRule(rule)}
                    >
                      <span className="material-symbols-outlined text-base mr-1">
                        add
                      </span>
                      {added
                        ? t("manager:labelRules.added")
                        : t("manager:labelRules.add")}
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
