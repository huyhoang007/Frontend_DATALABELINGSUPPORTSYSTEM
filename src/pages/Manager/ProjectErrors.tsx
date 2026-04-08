import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { policiesAPI } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/Table";
import { SOURCE_FILES } from "../../utils/sourceMeta";

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
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function ProjectErrors() {
  const { t } = useTranslation(["manager", "common"]);
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId) || 0;
  const { project: parentProject } = (useOutletContext() as any) || {};
  const isProjectCompleted =
    parentProject?.status?.toLowerCase() === "completed";

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
      const projPolicies: PolicyItem[] = Array.isArray(projectRes)
        ? projectRes
        : projectRes.content || [];
      setGlobalPolicies(allPolicies);
      setProjectPolicies(projPolicies);
    } catch (err) {
      console.error("Failed to load policies:", err);
      showToast(t("manager:projectErrors.loadFailed"));
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
      showToast(t("manager:projectErrors.alreadyAdded"));
      return;
    }
    setActionLoading(policyId);
    try {
      await policiesAPI.assignToProject(pid, policyId);
      const added = globalPolicies.find((p) => p.policyId === policyId);
      if (added) setProjectPolicies((prev) => [...prev, added]);
      showToast(t("manager:projectErrors.addSuccess"));
    } catch (err) {
      console.error("Failed to assign policy:", err);
      showToast(t("manager:projectErrors.addFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const removeFromProject = async (policyId: number) => {
    setActionLoading(policyId);
    try {
      await policiesAPI.removeFromProject(pid, policyId);
      setProjectPolicies((prev) => prev.filter((p) => p.policyId !== policyId));
      showToast(t("manager:projectErrors.removeSuccess"));
    } catch (err) {
      console.error("Failed to remove policy:", err);
      showToast(t("manager:projectErrors.removeFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredGlobal = globalPolicies.filter((p) =>
    (p.errorName || "").toLowerCase().includes(search.toLowerCase()),
  );

  const renderTable = (items: PolicyItem[], mode: "global" | "project") => (
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
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[item.errorLevel] || "bg-muted text-muted-foreground"}`}
              >
                {t(`manager:errorTypes.severity.${item.errorLevel}`, {
                  defaultValue: item.errorLevel,
                })}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground max-w-[200px] truncate">
              {item.description || "—"}
            </TableCell>
            <TableCell className="text-right">
              {mode === "global" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={
                    projectPolicyIds.has(item.policyId) ||
                    actionLoading === item.policyId ||
                    isProjectCompleted
                  }
                  onClick={() => addToProject(item.policyId)}
                >
                  <span className="material-symbols-outlined text-base mr-1">
                    add
                  </span>
                  {actionLoading === item.policyId
                    ? t("manager:projectErrors.addLoading")
                    : projectPolicyIds.has(item.policyId)
                      ? t("manager:projectErrors.addDone")
                      : t("manager:projectErrors.addAction")}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    actionLoading === item.policyId || isProjectCompleted
                  }
                  onClick={() => removeFromProject(item.policyId)}
                  title={t("manager:projectErrors.removeTitle")}
                >
                  <span className="material-symbols-outlined text-base text-destructive">
                    remove_circle
                  </span>
                  <span className="ml-1 text-destructive">
                    {actionLoading === item.policyId
                      ? t("manager:projectErrors.removeLoading")
                      : t("manager:projectErrors.removeAction")}
                  </span>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div
      className="space-y-6"
      data-source-file={SOURCE_FILES.managerProjectErrors}
      data-source-label="section:manager-project-errors-tab"
    >
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toast}
        </div>
      )}

      <div>
        <h2 className="text-base font-bold text-foreground">{t("manager:projectErrors.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("manager:projectErrors.subtitle")}
        </p>
      </div>

      {isProjectCompleted && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 dark:bg-orange-900/20 dark:border-orange-800/50">
          <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5">
            lock
          </span>
          <div className="text-sm text-orange-900 dark:text-orange-200">
            <p className="font-semibold">
              {t("manager:assignments.completedLockedTitle")}
            </p>
            <p className="mt-1 text-orange-800 dark:text-orange-300">
              {t("manager:assignments.completedLockedDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Project Error Types */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">
            bug_report
          </span>
          {t("manager:projectErrors.projectList")}
        </h3>
        {loading ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">
              progress_activity
            </span>
            <p className="text-sm text-muted-foreground">{t("manager:projectErrors.loading")}</p>
          </div>
        ) : projectPolicies.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">
              bug_report
            </span>
            <p className="text-muted-foreground text-sm">
              {t("manager:projectErrors.emptyProject")}
            </p>
          </div>
        ) : (
          renderTable(projectPolicies, "project")
        )}
      </Card>

      {/* Global Error Types */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">list</span>
          {t("manager:projectErrors.globalList")}
        </h3>
        <Input
          placeholder={t("manager:projectErrors.searchPlaceholder")}
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          className="max-w-sm"
        />
        {loading ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">
              progress_activity
            </span>
            <p className="text-sm text-muted-foreground">{t("manager:projectErrors.loading")}</p>
          </div>
        ) : filteredGlobal.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">
              search_off
            </span>
            <p className="text-muted-foreground text-sm">
              {search ? t("manager:projectErrors.emptySearch") : t("manager:projectErrors.emptyGlobal")}
            </p>
          </div>
        ) : (
          renderTable(filteredGlobal, "global")
        )}
      </Card>
    </div>
  );
}
