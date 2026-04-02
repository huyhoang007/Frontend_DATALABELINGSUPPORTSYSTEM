import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { annotationApi } from "../../api/annotationApi";

const TABS = [
  "ALL",
  "PENDING",
  "IN_PROGRESS",
  "SUBMITTED",
  "RE_SUBMITTED",
  "APPROVED",
  "REJECTED",
];

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  PENDING: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  IN_PROGRESS: { badge: "bg-blue-100 text-blue-700", dot: "bg-blue-600" },
  SUBMITTED: { badge: "bg-violet-100 text-violet-700", dot: "bg-violet-600" },
  RE_SUBMITTED: { badge: "bg-orange-100 text-orange-700", dot: "bg-orange-600" },
  APPROVED: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-600" },
  REJECTED: { badge: "bg-red-100 text-red-700", dot: "bg-red-600" },
};

interface AnnotatorDashboardProps {
  user: any;
}

const AnnotatorDashboard: React.FC<AnnotatorDashboardProps> = () => {
  const { t } = useTranslation(["annotator", "common"]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data: any = await annotationApi.getMyAssignments();
      const apiList = Array.isArray(data) ? data : data?.content || data?.data || [];
      setAssignments(apiList);
    } catch (err: any) {
      const status = err?.status;
      if (status === 401) {
        setError(t("annotator:tasks.errors.expiredSession"));
      } else if (status === 403) {
        setError(t("annotator:tasks.errors.forbidden"));
      } else {
        setError(err?.message || t("annotator:tasks.errors.loadFailed"));
      }
    }

    setLoading(false);
  }, [t]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if ((a.projectStatus || "").toUpperCase() === "PAUSED") {
        return false;
      }
      const matchesTab =
        activeTab === "ALL" || (a.status || "").toUpperCase() === activeTab;
      const q = search.toLowerCase();
      const matchesSearch =
        String(a.assignmentId || "").includes(q) ||
        (a.projectName || "").toLowerCase().includes(q) ||
        (a.datasetName || "").toLowerCase().includes(q) ||
        (a.reviewerName || "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, assignments]);

  const visibleAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          (assignment.projectStatus || "").toUpperCase() !== "PAUSED",
      ),
    [assignments],
  );

  const handleOpen = (assignment: any) => {
    navigate(`/annotator/task/${assignment.assignmentId}`);
  };

  const activeStatuses = ["PENDING", "IN_PROGRESS", "REJECTED"];
  const activeCount = visibleAssignments.filter((a) =>
    activeStatuses.includes((a.status || "").toUpperCase()),
  ).length;

  const getStatusLabel = (status: string) =>
    t(`annotator:tasks.statuses.${status}`, { defaultValue: status });

  const kpis = [
    {
      label: t("annotator:dashboard.completed"),
      value: visibleAssignments.filter((task) =>
        ["APPROVED", "COMPLETED"].includes((task.status || "").toUpperCase()),
      ).length,
      icon: "check_circle",
      border: "border-t-emerald-600",
      iconColor: "text-emerald-600",
    },
    {
      label: t("annotator:dashboard.inProgress"),
      value: visibleAssignments.filter((task) =>
        ["IN_PROGRESS", "REJECTED"].includes((task.status || "").toUpperCase()),
      ).length,
      icon: "pending",
      border: "border-t-blue-600",
      iconColor: "text-blue-600",
    },
    {
      label: t("annotator:dashboard.pending"),
      value: visibleAssignments.filter(
        (task) => (task.status || "").toUpperCase() === "PENDING",
      ).length,
      icon: "schedule",
      border: "border-t-amber-500",
      iconColor: "text-amber-600",
    },
    {
      label: t("annotator:dashboard.resubmitted"),
      value: visibleAssignments.filter((task) =>
        ["SUBMITTED", "RE_SUBMITTED"].includes((task.status || "").toUpperCase()),
      ).length,
      icon: "restart_alt",
      border: "border-t-orange-600",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-['IBM_Plex_Sans','Segoe_UI',system-ui,sans-serif] text-slate-900">
      <div className="w-full px-6 py-8 md:px-10">
        <div className="mb-8">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
            {t("annotator:dashboard.title")}
          </p>
          <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900">
            {t("annotator:dashboard.title")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("annotator:dashboard.subtitle")}
            {!loading && ` ${t("annotator:tasks.activeTasks", { count: activeCount })}`}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <div
              key={kpi.label}
              onMouseEnter={() => setHoveredKpi(idx)}
              onMouseLeave={() => setHoveredKpi(null)}
              className={`rounded-lg border border-slate-200 border-t-[3px] bg-white p-5 transition ${
                hoveredKpi === idx ? "shadow-lg shadow-slate-200/80" : "shadow-sm"
              } ${kpi.border}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {kpi.label}
                </p>
                <span className={`material-symbols-outlined text-xl ${kpi.iconColor}`}>
                  {kpi.icon}
                </span>
              </div>
              <p className="text-[32px] font-extrabold leading-none text-slate-900">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            {TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] transition ${
                    active
                      ? "border border-blue-100 bg-white text-blue-700 shadow-sm"
                      : "border border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-900"
                  }`}
                >
                  {getStatusLabel(tab)}
                </button>
              );
            })}
          </div>

          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-500">
              search
            </span>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder={t("annotator:tasks.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <span className="material-symbols-outlined animate-spin text-3xl">
              progress_activity
            </span>
            <span className="ml-2 text-sm">{t("common:states.loading")}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <span className="material-symbols-outlined text-lg text-red-600">
              error
            </span>
            <p className="flex-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchAssignments}
              className="text-sm font-semibold text-red-700 transition hover:text-red-800"
            >
              {t("annotator:tasks.retryLoad")}
            </button>
          </div>
        )}

        {!loading && filteredAssignments.length === 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex h-[600px] w-full flex-col items-center justify-center px-4 text-center">
              <span className="material-symbols-outlined mb-4 text-6xl text-slate-300">
                assignment
              </span>
              <h4 className="mb-2 text-2xl font-bold text-slate-900">
                {t("annotator:tasks.noAssignmentsTitle")}
              </h4>
              <p className="max-w-xl text-sm text-slate-500">
                {t("annotator:tasks.noAssignmentsHint")}
              </p>
            </div>
          </div>
        )}

        {!loading && filteredAssignments.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[60px_2fr_1.5fr_1.2fr_1.5fr_1fr_100px] items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                ID
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {t("annotator:tasks.table.project")}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {t("annotator:tasks.table.dataset")}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {t("annotator:tasks.table.reviewer")}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {t("annotator:tasks.table.progress")}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {t("annotator:tasks.table.status")}
              </p>
              <p className="text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {t("annotator:tasks.table.action")}
              </p>
            </div>

            <div>
              {filteredAssignments.map((a, idx) => {
                const status = (a.status || "PENDING").toUpperCase();
                const statusStyle = STATUS_STYLES[status] || {
                  badge: "bg-slate-100 text-slate-500",
                  dot: "bg-slate-500",
                };

                return (
                  <div
                    key={a.assignmentId}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleOpen(a)}
                    className={`grid cursor-pointer grid-cols-[60px_2fr_1.5fr_1.2fr_1.5fr_1fr_100px] items-center gap-4 border-b border-slate-200 px-6 py-4 transition ${
                      hoveredRow === idx
                        ? "bg-blue-50"
                        : idx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/60"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs transition ${
                        hoveredRow === idx ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      #{a.assignmentId}
                    </span>

                    <span
                      className={`truncate text-sm font-bold transition ${
                        hoveredRow === idx ? "text-blue-700" : "text-slate-900"
                      }`}
                    >
                      {a.projectName || "—"}
                    </span>

                    <span className="truncate text-sm text-slate-500">
                      {a.datasetName || "—"}
                    </span>

                    <span className="truncate text-sm text-slate-500">
                      {a.reviewerName || "—"}
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="min-w-[100px] flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-500"
                          style={{ width: `${a.progress || 0}%` }}
                        />
                      </div>
                      <span className="min-w-[45px] text-right text-xs font-extrabold text-slate-900">
                        {a.progress || 0}%
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${statusStyle.badge}`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                      {getStatusLabel(status)}
                    </span>

                    <div className="flex justify-end gap-2">
                      {["PENDING", "REJECTED"].includes(status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(a);
                          }}
                          className="h-8 rounded-md bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          {t("annotator:tasks.actions.start")}
                        </button>
                      )}
                      {status === "IN_PROGRESS" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(a);
                          }}
                          className="h-8 rounded-md border border-amber-200 bg-amber-100 px-4 text-xs font-bold text-amber-700 transition hover:bg-amber-200"
                        >
                          {t("annotator:tasks.actions.continue")}
                        </button>
                      )}
                      {["SUBMITTED", "APPROVED", "COMPLETED"].includes(status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(a);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                        >
                          <span className="material-symbols-outlined text-base">
                            visibility
                          </span>
                          {t("annotator:tasks.actions.view")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && assignments.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            {t("annotator:tasks.showingCount", {
              shown: filteredAssignments.length,
              total: assignments.length,
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default AnnotatorDashboard;
