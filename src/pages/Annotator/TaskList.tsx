import * as React from "react";
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { annotationApi } from "../../api/annotationApi";
import { translateAssignmentStatus } from "../../i18n/helpers";

const TABS = ["ALL", "PENDING", "IN_PROGRESS", "SUBMITTED", "RE_SUBMITTED", "APPROVED", "REJECTED"];

const STATUS_STYLES = {
  PENDING:      { badge: "bg-amber-50 text-amber-700",    dot: "bg-amber-500" },
  IN_PROGRESS:  { badge: "bg-blue-50 text-blue-600",      dot: "bg-blue-600" },
  SUBMITTED:    { badge: "bg-purple-50 text-purple-700",  dot: "bg-purple-600" },
  RE_SUBMITTED: { badge: "bg-orange-50 text-orange-700",  dot: "bg-orange-600" },
  APPROVED:     { badge: "bg-green-50 text-green-700",    dot: "bg-green-600" },
  REJECTED:     { badge: "bg-red-50 text-red-600",        dot: "bg-red-500" },
};

const DEFAULT_STATUS = { badge: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };

export default function TaskList() {
  const { t } = useTranslation(["annotator", "common"]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await annotationApi.getMyAssignments();
      const apiList = Array.isArray(data) ? data : data?.content || data?.data || [];
      setAssignments(apiList);
    } catch (err) {
      const status = err?.status;
      if (status === 401) setError(t("annotator:tasks.errors.expiredSession"));
      else if (status === 403) setError(t("annotator:tasks.errors.forbidden"));
      else setError(err?.message || t("annotator:tasks.errors.loadFailed"));
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if ((a.projectStatus || "").toUpperCase() === "PAUSED") return false;
      const matchesTab = activeTab === "ALL" || (a.status || "").toUpperCase() === activeTab;
      const q = search.toLowerCase();
      const matchesSearch =
        String(a.assignmentId || "").includes(q) ||
        (a.projectName || "").toLowerCase().includes(q) ||
        (a.datasetName || "").toLowerCase().includes(q) ||
        (a.reviewerName || "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, assignments]);

  const handleOpen = (assignment) => navigate(`/annotator/task/${assignment.assignmentId}`);

  const activeCount = assignments.filter((a) =>
    ["PENDING", "IN_PROGRESS", "REJECTED"].includes((a.status || "").toUpperCase()) &&
    (a.projectStatus || "").toUpperCase() !== "PAUSED"
  ).length;

  const getStatusText = (status) => {
    if (status === "ALL") return t("common:labels.overview").toUpperCase();
    return translateAssignmentStatus(status).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F7F8F9] text-[#172B4D] font-sans">
      <div className="px-10 py-8 w-full">

        {/* Header */}
        <div className="flex flex-row items-end justify-between mb-8 pb-6 border-b-2 border-[#DCDFE4] gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold text-[#626F86] uppercase tracking-[0.1em] mb-1">
              {t("annotator:tasks.heading")}
            </p>
            <h1 className="text-[28px] font-extrabold text-[#172B4D] tracking-tight mb-2">
              {t("annotator:tasks.title")}
            </h1>
            <p className="text-sm text-[#626F86]">
              {t("annotator:tasks.welcomeBack", {
                name: user?.displayName || user?.username || user?.name || "User",
              })}
              {!loading && (
                <> {t("annotator:tasks.activeTasks", { count: activeCount })}</>
              )}
            </p>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-2 h-10 px-5 text-sm font-semibold text-red-600 bg-transparent border border-[#DCDFE4] rounded cursor-pointer transition-all hover:bg-red-50 hover:border-red-300"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {t("common:actions.logout")}
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-row items-center justify-between gap-4 mb-6 flex-wrap">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-[#F1F2F4] rounded-md border border-[#DCDFE4] flex-wrap gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-[0.06em] transition-all cursor-pointer font-sans
                  ${activeTab === tab
                    ? "bg-white text-blue-600 border border-blue-200/50 shadow-sm"
                    : "bg-transparent text-[#626F86] border border-transparent hover:bg-white/80 hover:text-[#172B4D]"
                  }`}
              >
                {getStatusText(tab)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full max-w-xs relative">
            <div className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none">
              <span className="material-symbols-outlined text-[18px] text-[#626F86]">search</span>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 bg-white border border-[#DCDFE4] rounded-md text-[13px] text-[#172B4D] outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-sans"
              placeholder={t("annotator:tasks.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined text-[32px] text-[#626F86] animate-spin">
              progress_activity
            </span>
            <span className="ml-2 text-[#626F86] text-[13px]">{t("common:states.loading")}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-red-50 border border-red-200 mb-4">
            <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
            <p className="text-[13px] text-red-600 flex-1">{error}</p>
            <button
              onClick={fetchAssignments}
              className="text-[12px] font-semibold text-red-600 bg-transparent border-none cursor-pointer"
            >
              {t("annotator:tasks.retryLoad")}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAssignments.length === 0 && (
          <div className="rounded-md border border-[#DCDFE4] bg-white overflow-hidden shadow-sm">
            <div className="flex flex-col items-center justify-center h-[600px] w-full">
              <span className="material-symbols-outlined text-[64px] text-[#626F86]/40 mb-4">assignment</span>
              <h4 className="text-xl font-bold text-[#172B4D] mb-2">{t("annotator:tasks.noAssignmentsTitle")}</h4>
              <p className="text-sm text-[#626F86] text-center max-w-[480px] mx-auto px-4">
                {t("annotator:tasks.noAssignmentsHint")}
              </p>
            </div>
          </div>
        )}

        {/* Task Table */}
        {!loading && filteredAssignments.length > 0 && (
          <div className="rounded-md border border-[#DCDFE4] bg-white overflow-hidden shadow-sm">

            {/* Table Header - desktop only */}
            {!isMobile && (
              <div className="grid gap-4 px-6 py-3 border-b border-[#DCDFE4] bg-[#FAFBFC]"
                style={{ gridTemplateColumns: "60px 2fr 1.5fr 1.2fr 1.5fr 1fr 100px" }}>
                {["ID", t("annotator:tasks.table.project"), t("annotator:tasks.table.dataset"),
                  t("annotator:tasks.table.reviewer"), t("annotator:tasks.table.progress"),
                  t("annotator:tasks.table.status"), t("annotator:tasks.table.action")].map((h, i) => (
                  <p key={i} className={`text-[10px] font-bold text-[#626F86] uppercase tracking-[0.08em] ${i === 6 ? "text-right" : ""}`}>
                    {h}
                  </p>
                ))}
              </div>
            )}

            {/* Rows */}
            <div>
              {filteredAssignments.map((a, idx) => {
                const status = (a.status || "PENDING").toUpperCase();
                const ss = STATUS_STYLES[status] || DEFAULT_STATUS;

                if (isMobile) {
                  return (
                    <div
                      key={a.assignmentId}
                      onClick={() => handleOpen(a)}
                      className={`p-4 border-b border-[#DCDFE4] flex flex-col gap-3 cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}`}
                    >
                      <div className="flex justify-between gap-3 items-start">
                        <div className="min-w-0 flex flex-col gap-1">
                          <span className="font-mono text-[12px] text-[#626F86]">#{a.assignmentId}</span>
                          <span className="text-sm font-bold text-[#172B4D]">{a.projectName || "—"}</span>
                          <span className="text-[12px] text-[#626F86]">{a.datasetName || "—"}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] shrink-0 ${ss.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${ss.dot}`} />
                          {translateAssignmentStatus(status).toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-[#626F86] uppercase tracking-[0.08em] mb-1">
                            {t("annotator:tasks.table.reviewer")}
                          </p>
                          <p className="text-[12px] text-[#44546F]">{a.reviewerName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#626F86] uppercase tracking-[0.08em] mb-1">
                            {t("annotator:tasks.table.progress")}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#DCDFE4] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
                                style={{ width: `${a.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-[12px] font-extrabold text-[#172B4D]">{a.progress || 0}%</span>
                          </div>
                        </div>
                      </div>

                      <MobileActionButton status={status} a={a} handleOpen={handleOpen} t={t} />
                    </div>
                  );
                }

                return (
                  <div
                    key={a.assignmentId}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleOpen(a)}
                    className={`grid gap-4 items-center px-6 py-4 border-b border-[#DCDFE4] cursor-pointer transition-all
                      ${hoveredRow === idx ? "bg-blue-50" : idx % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}`}
                    style={{ gridTemplateColumns: "60px 2fr 1.5fr 1.2fr 1.5fr 1fr 100px" }}
                  >
                    <span className={`font-mono text-[12px] transition-colors ${hoveredRow === idx ? "text-[#172B4D]" : "text-[#626F86]"}`}>
                      #{a.assignmentId}
                    </span>

                    <span className={`text-[13px] font-bold truncate transition-colors ${hoveredRow === idx ? "text-blue-600" : "text-[#172B4D]"}`}>
                      {a.projectName || "—"}
                    </span>

                    <span className="text-[13px] text-[#626F86] truncate">{a.datasetName || "—"}</span>

                    <span className="text-[13px] text-[#626F86] truncate">{a.reviewerName || "—"}</span>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-[#DCDFE4] rounded-full overflow-hidden min-w-[100px]">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-500"
                          style={{ width: `${a.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-[12px] font-extrabold text-[#172B4D] min-w-[45px] text-right">
                        {a.progress || 0}%
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.06em] ${ss.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${ss.dot}`} />
                      {translateAssignmentStatus(status).toUpperCase()}
                    </span>

                    <div className="flex justify-end gap-2">
                      <DesktopActionButton status={status} a={a} handleOpen={handleOpen} t={t} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Count */}
        {!loading && assignments.length > 0 && (
          <p className="text-[13px] text-[#626F86] mt-4 font-medium">
            {t("annotator:tasks.showingCount", {
              shown: filteredAssignments.length,
              total: assignments.length,
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function DesktopActionButton({ status, a, handleOpen, t }) {
  if (["PENDING", "REJECTED"].includes(status)) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleOpen(a); }}
        className="h-8 px-4 text-[12px] font-bold text-white bg-blue-600 border-none rounded cursor-pointer transition-colors hover:bg-blue-700 font-sans"
      >
        {t("annotator:tasks.actions.start")}
      </button>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleOpen(a); }}
        className="h-8 px-4 text-[12px] font-bold text-amber-700 bg-amber-50 border border-amber-300/40 rounded cursor-pointer transition-colors hover:bg-amber-100 font-sans"
      >
        {t("annotator:tasks.actions.continue")}
      </button>
    );
  }
  if (["RE_SUBMITTED", "SUBMITTED", "APPROVED", "COMPLETED"].includes(status)) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleOpen(a); }}
        className="h-8 px-4 text-[12px] font-bold text-[#44546F] bg-[#F1F2F4] border border-[#DCDFE4] rounded cursor-pointer transition-colors hover:bg-[#DCDFE4] inline-flex items-center gap-1.5 font-sans"
      >
        <span className="material-symbols-outlined text-[16px]">visibility</span>
        {t("annotator:tasks.actions.view")}
      </button>
    );
  }
  return null;
}

function MobileActionButton({ status, a, handleOpen, t }) {
  const base = "h-9 w-full px-4 text-[12px] font-bold rounded-md cursor-pointer flex items-center justify-center gap-1.5 font-sans transition-colors";
  if (["PENDING", "REJECTED"].includes(status)) {
    return (
      <button onClick={(e) => { e.stopPropagation(); handleOpen(a); }} className={`${base} text-white bg-blue-600 border-none hover:bg-blue-700`}>
        {t("annotator:tasks.actions.start")}
      </button>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <button onClick={(e) => { e.stopPropagation(); handleOpen(a); }} className={`${base} text-amber-700 bg-amber-50 border border-amber-300/40 hover:bg-amber-100`}>
        {t("annotator:tasks.actions.continue")}
      </button>
    );
  }
  if (["RE_SUBMITTED", "SUBMITTED", "APPROVED", "COMPLETED"].includes(status)) {
    return (
      <button onClick={(e) => { e.stopPropagation(); handleOpen(a); }} className={`${base} text-[#44546F] bg-[#F1F2F4] border border-[#DCDFE4] hover:bg-[#DCDFE4]`}>
        <span className="material-symbols-outlined text-[16px]">visibility</span>
        {t("annotator:tasks.actions.view")}
      </button>
    );
  }
  return null;
}
