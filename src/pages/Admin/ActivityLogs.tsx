import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { activityLogApi } from "../../api/activityLogApi";
import { useToast } from "../../context/ToastContext";
import {
  translateAdminLogAction,
  translateAdminLogDetails,
  translateAdminLogTarget,
} from "../../i18n/helpers";
import { SOURCE_FILES } from "../../utils/sourceMeta";

interface AdminLog {
  logId?: number;
  id?: number;
  timestamp?: string;
  createdAt?: string;
  username?: string;
  userId?: string | number;
  action?: string;
  target?: string;
  targetType?: string;
  [key: string]: unknown;
}

interface LogResponse {
  content?: AdminLog[];
  [key: string]: unknown;
}

export default function AdminActivityLogs() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;
  const [filters, setFilters] = useState({
    action: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await activityLogApi.getAllLogs({ page: 0, size: 50 }) as LogResponse;
      setLogs((data.content || data || []) as AdminLog[]);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      addToast(t("admin:logs.loadFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      let data: AdminLog[];
      if (filters.dateFrom && filters.dateTo) {
        data = await activityLogApi.getLogsByDateRange(
          filters.dateFrom + "T00:00:00",
          filters.dateTo + "T23:59:59",
        ) as AdminLog[];
      } else if (filters.action) {
        const result = await activityLogApi.getLogsByAction(filters.action) as LogResponse;
        data = (result.content || result || []) as AdminLog[];
      } else {
        const result = await activityLogApi.getAllLogs({ page: 0, size: 50 }) as LogResponse;
        data = (result.content || result || []) as AdminLog[];
      }
      setLogs(Array.isArray(data) ? data : ((data as unknown as LogResponse).content || []));
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to search logs:", error);
      addToast(t("admin:logs.searchFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionClass = (action: string): string => {
    const a = action?.toLowerCase() || "";
    if (a.includes("login") || a.includes("auth"))
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (a.includes("create") || a.includes("add"))
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (a.includes("update") || a.includes("edit"))
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    if (a.includes("delete") || a.includes("remove"))
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    return "bg-muted text-muted-foreground";
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === "en" ? "en-US" : "vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div
      className="flex h-screen bg-background"
      data-source-file={SOURCE_FILES.adminLogs}
      data-source-label="Admin activity logs page"
    >
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("admin:logs.title")}
            </h1>
            <p className="text-muted-foreground">{t("admin:logs.subtitle")}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {t("admin:logs.filtersTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t("admin:logs.action")}
                </label>
                <select
                  value={filters.action}
                  onChange={(e) =>
                    setFilters({ ...filters, action: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  <option value="">{t("admin:logs.allActions")}</option>
                  <option value="LOGIN">{t("admin:logs.login")}</option>
                  <option value="CREATE">{t("admin:logs.create")}</option>
                  <option value="UPDATE">{t("admin:logs.update")}</option>
                  <option value="DELETE">{t("admin:logs.delete")}</option>
                  <option value="VIEW">{t("admin:logs.view")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t("admin:logs.fromDate")}
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t("admin:logs.toDate")}
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? t("common:states.loading") : t("admin:logs.search")}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-12">
                <p>{t("admin:logs.loading")}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg font-medium mb-2">
                  {t("admin:logs.emptyTitle")}
                </p>
                <p className="text-sm">{t("admin:logs.emptyHint")}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-background/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("admin:logs.table.time")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("admin:logs.table.user")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("admin:logs.table.action")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("admin:logs.table.target")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("admin:logs.table.details")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentLogs.map((log, index) => (
                    <tr
                      key={log.logId || log.id || index}
                      className="hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">
                        {formatDateTime(log.timestamp || log.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {log.username?.[0]?.toUpperCase() ||
                              String(log.userId ?? "?")?.[0] ||
                              "?"}
                          </div>
                          <span className="text-sm text-foreground">
                            {log.username ||
                              t("admin:logs.userFallback", { id: log.userId ?? "" })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActionClass(log.action ?? "")}`}
                        >
                          {translateAdminLogAction(log.action ?? "")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {translateAdminLogTarget(log.target || log.targetType)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {translateAdminLogDetails(log)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isLoading && logs.length > logsPerPage && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {t("admin:logs.showing", {
                    start: indexOfFirstLog + 1,
                    end: Math.min(indexOfLastLog, logs.length),
                    total: logs.length,
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("admin:logs.pagination.prev")}
                  </button>
                  <div className="px-3 py-1.5 text-sm border border-border rounded-lg bg-blue-600/10 text-blue-600 font-medium">
                    {t("admin:logs.pagination.page", {
                      current: currentPage,
                      total: totalPages,
                    })}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("admin:logs.pagination.next")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {logs.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {t("admin:logs.total", { count: logs.length })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
