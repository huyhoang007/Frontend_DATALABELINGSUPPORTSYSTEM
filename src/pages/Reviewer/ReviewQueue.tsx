import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import reviewApi from "../../api/reviewApi";
import { useAuth } from "../../context/AuthContext";
import { translateAssignmentStatus } from "../../i18n/helpers";
import { SOURCE_FILES } from "../../utils/sourceMeta";

interface ReviewAssignment {
  assignmentId: number;
  status: string;
  projectStatus?: string;
  projectName?: string;
  annotatorName?: string;
  datasetName?: string;
  progress?: number;
  [key: string]: unknown;
}

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-violet-100 text-violet-700",
  RE_SUBMITTED: "bg-orange-100 text-orange-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
};

const STATUS_DOT_STYLES: Record<string, string> = {
  SUBMITTED: "bg-violet-600",
  RE_SUBMITTED: "bg-orange-500",
  APPROVED: "bg-emerald-600",
  REJECTED: "bg-red-600",
  PENDING: "bg-amber-500",
};

const KPI_STYLES: Record<string, { active: string; idle: string; value: string }> = {
  SUBMITTED: {
    active: "border-violet-600 bg-violet-100",
    idle: "border-slate-200 bg-white",
    value: "text-violet-700",
  },
  RE_SUBMITTED: {
    active: "border-orange-600 bg-orange-100",
    idle: "border-slate-200 bg-white",
    value: "text-orange-700",
  },
  APPROVED: {
    active: "border-emerald-600 bg-emerald-100",
    idle: "border-slate-200 bg-white",
    value: "text-emerald-700",
  },
  REJECTED: {
    active: "border-red-600 bg-red-100",
    idle: "border-slate-200 bg-white",
    value: "text-red-700",
  },
};

export default function ReviewQueue() {
  const { t } = useTranslation(["reviewer", "common"]);
  const navigate = useNavigate();
  useAuth();

  const [assignments, setAssignments] = React.useState<ReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  const [filterByStatus, setFilterByStatus] = React.useState<string | null>("SUBMITTED");

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchAssignments() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await reviewApi.getMyReviewAssignments();
        if (!cancelled) setAssignments(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        const apiError = err as {
          message?: string;
          response?: { data?: { message?: string } };
        };
        if (!cancelled) {
          setError(
            apiError?.response?.data?.message ||
              apiError?.message ||
              t("reviewer:queue.loadFailed"),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchAssignments();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const reviewableAssignments = React.useMemo(() => {
    let list = assignments.filter(
      (assignment) => (assignment.projectStatus || "").toUpperCase() !== "PAUSED",
    );

    if (filterByStatus === "SUBMITTED" || filterByStatus === "RE_SUBMITTED") {
      list = list.filter((assignment) => assignment.status === filterByStatus);
    } else if (filterByStatus === "APPROVED") {
      list = list.filter((assignment) => assignment.status === "APPROVED");
    } else if (filterByStatus === "REJECTED") {
      list = list.filter((assignment) => assignment.status === "REJECTED");
    } else if (filterByStatus === "REVIEWED") {
      list = list.filter(
        (assignment) =>
          assignment.status === "APPROVED" || assignment.status === "REJECTED",
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (assignment) =>
          (assignment.projectName || "").toLowerCase().includes(query) ||
          (assignment.annotatorName || "").toLowerCase().includes(query),
      );
    }

    return list;
  }, [assignments, searchQuery, filterByStatus]);

  const handleReview = (assignment: ReviewAssignment) => {
    navigate(`/reviewer/review/${assignment.assignmentId}`);
  };

  const toggleStatusFilter = (status: string) => {
    setFilterByStatus(filterByStatus === status ? null : status);
  };

  const getStatusLabel = (status: string) =>
    translateAssignmentStatus(status).toUpperCase();

  const pendingCount = assignments.filter(
    (assignment) =>
      assignment.status === "SUBMITTED" &&
      (assignment.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const resubmittedCount = assignments.filter(
    (assignment) =>
      assignment.status === "RE_SUBMITTED" &&
      (assignment.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const queueTotalCount = assignments.filter(
    (assignment) =>
      assignment.status !== "IN_PROGRESS" &&
      (assignment.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const approvedCount = assignments.filter(
    (assignment) =>
      assignment.status === "APPROVED" &&
      (assignment.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const rejectedCount = assignments.filter(
    (assignment) =>
      assignment.status === "REJECTED" &&
      (assignment.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;

  const displayValue = (value: number | string) => (isLoading ? "-" : value);

  const kpis = [
    {
      label: t("reviewer:queue.kpi.submitted"),
      value: pendingCount,
      status: "SUBMITTED",
    },
    {
      label: t("reviewer:queue.kpi.resubmitted"),
      value: resubmittedCount,
      status: "RE_SUBMITTED",
    },
    {
      label: t("reviewer:queue.kpi.approved"),
      value: approvedCount,
      status: "APPROVED",
    },
    {
      label: t("reviewer:queue.kpi.rejected"),
      value: rejectedCount,
      status: "REJECTED",
    },
  ];

  return (
    <div
      className="min-h-screen bg-slate-50 font-['IBM_Plex_Sans','Segoe_UI',system-ui,sans-serif] text-slate-900"
      data-source-file={SOURCE_FILES.reviewerQueue}
      data-source-label="section:reviewer-queue-page"
    >
      <div className="w-full px-6 py-8 md:px-10">
        <div
          className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-200 pb-6"
          data-source-file={SOURCE_FILES.reviewerQueue}
          data-source-label="section:reviewer-queue-header"
        >
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              {t("reviewer:queue.title")}
            </p>
            <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.02em] text-slate-900">
              {t("reviewer:queue.title")}
            </h1>
            <p className="text-sm text-slate-500">
              {t("reviewer:queue.subtitle", {
                count: displayValue(queueTotalCount),
              })}
            </p>
          </div>
        </div>

        <div
          className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          data-source-file={SOURCE_FILES.reviewerQueue}
          data-source-label="section:reviewer-queue-kpi-cards"
        >
          {kpis.map((kpi, idx) => {
            const state = KPI_STYLES[kpi.status];
            const isActive = filterByStatus === kpi.status;
            return (
              <button
                key={kpi.label}
                type="button"
                onMouseEnter={() => setHoveredKpi(idx)}
                onMouseLeave={() => setHoveredKpi(null)}
                onClick={() => toggleStatusFilter(kpi.status)}
                data-source-file={SOURCE_FILES.reviewerQueue}
                data-source-label={`section:reviewer-queue-kpi-${kpi.status.toLowerCase()}`}
                className={`rounded-lg border p-5 text-left transition ${
                  isActive ? state.active : state.idle
                } ${
                  hoveredKpi === idx
                    ? "shadow-lg shadow-slate-200/80"
                    : "shadow-sm"
                }`}
              >
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {kpi.label}
                </p>
                <p className={`text-[32px] font-extrabold tracking-[-0.02em] ${state.value}`}>
                  {displayValue(kpi.value)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex justify-end">
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-500">
              search
            </span>
            <input
              type="text"
              data-source-file={SOURCE_FILES.reviewerQueue}
              data-source-label="section:reviewer-queue-search-input"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder={t("reviewer:queue.searchPlaceholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        {isLoading && (
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
          </div>
        )}

        {!isLoading && !error && reviewableAssignments.length === 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex h-[400px] w-full flex-col items-center justify-center">
              <span className="material-symbols-outlined mb-4 text-6xl text-emerald-300/60">
                check_circle
              </span>
              <h4 className="mb-2 text-xl font-bold text-slate-900">
                {t("reviewer:queue.noReviewTitle")}
              </h4>
              <p className="text-center text-sm text-slate-500">
                {t("reviewer:queue.noReviewHint")}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && reviewableAssignments.length > 0 && (
          <div
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            data-source-file={SOURCE_FILES.reviewerQueue}
            data-source-label="section:reviewer-assignment-list"
          >
            {!isMobile && (
              <div className="grid grid-cols-[60px_2fr_1.2fr_1.5fr_1fr_0.8fr_100px] items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  ID
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {t("reviewer:queue.table.project")}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {t("reviewer:queue.table.annotator")}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {t("reviewer:queue.table.dataset")}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {t("reviewer:queue.table.status")}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {t("reviewer:queue.table.progress")}
                </p>
                <p className="text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {t("reviewer:queue.table.action")}
                </p>
              </div>
            )}

            <div>
              {reviewableAssignments.map((assignment, idx) => {
                const status = (assignment.status || "PENDING").toUpperCase();
                const statusClass =
                  STATUS_STYLES[status] || "bg-slate-100 text-slate-500";
                const dotClass = STATUS_DOT_STYLES[status] || "bg-slate-500";
                const rowClass =
                  hoveredRow === idx
                    ? "bg-blue-50"
                    : idx % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50";

                if (isMobile) {
                  return (
                    <div
                      key={assignment.assignmentId}
                      onClick={() => handleReview(assignment)}
                      data-source-file={SOURCE_FILES.reviewerQueue}
                      data-source-label="section:reviewer-queue-mobile-assignment-card"
                      className={`cursor-pointer border-b border-slate-200 p-4 ${rowClass}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="font-mono text-xs text-slate-500">
                            #{assignment.assignmentId}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {assignment.projectName || "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {assignment.datasetName || "—"}
                          </span>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${statusClass}`}
                        >
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            {t("reviewer:queue.table.annotator")}
                          </p>
                          <p className="text-xs text-slate-600">
                            {assignment.annotatorName || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            {t("reviewer:queue.table.progress")}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700"
                                style={{ width: `${assignment.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-extrabold text-slate-900">
                              {assignment.progress ?? 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleReview(assignment);
                        }}
                        data-source-file={SOURCE_FILES.reviewerQueue}
                        data-source-label="section:reviewer-queue-mobile-review-button"
                        className="mt-3 h-9 w-full rounded-md bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        {status === "APPROVED"
                          ? t("reviewer:queue.actions.view")
                          : t("reviewer:queue.actions.review")}
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={assignment.assignmentId}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleReview(assignment)}
                    data-source-file={SOURCE_FILES.reviewerQueue}
                    data-source-label="section:reviewer-queue-assignment-row"
                    className={`grid cursor-pointer grid-cols-[60px_2fr_1.2fr_1.5fr_1fr_0.8fr_100px] items-center gap-4 border-b border-slate-200 px-6 py-4 transition ${rowClass}`}
                  >
                    <span
                      className={`font-mono text-xs transition ${
                        hoveredRow === idx ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      #{assignment.assignmentId}
                    </span>

                    <span
                      className={`truncate text-sm font-bold transition ${
                        hoveredRow === idx ? "text-blue-700" : "text-slate-900"
                      }`}
                    >
                      {assignment.projectName || "—"}
                    </span>

                    <span className="truncate text-sm text-slate-500">
                      {assignment.annotatorName || "—"}
                    </span>

                    <span className="truncate text-sm text-slate-500">
                      {assignment.datasetName || "—"}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${statusClass}`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
                      {getStatusLabel(status)}
                    </span>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-slate-900">
                        {assignment.progress ?? 0}%
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.06em] text-slate-500">
                        {t("common:labels.label")}
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleReview(assignment);
                        }}
                        data-source-file={SOURCE_FILES.reviewerQueue}
                        data-source-label="section:reviewer-queue-review-button"
                        className="h-8 rounded-md bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        {status === "APPROVED"
                          ? t("reviewer:queue.actions.view")
                          : t("reviewer:queue.actions.review")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && assignments.length > 0 && (
          <p className="mt-4 text-sm font-medium text-slate-500">
            {t("reviewer:queue.showingCount", {
              shown: reviewableAssignments.length,
              total:
                filterByStatus === "SUBMITTED"
                  ? pendingCount
                  : filterByStatus === "RE_SUBMITTED"
                    ? resubmittedCount
                    : filterByStatus === "APPROVED"
                      ? approvedCount
                      : filterByStatus === "REJECTED"
                        ? rejectedCount
                        : filterByStatus === "QUEUE"
                          ? queueTotalCount
                          : assignments.length,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
