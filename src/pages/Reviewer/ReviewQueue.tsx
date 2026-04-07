import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import reviewApi from "../../api/reviewApi";
import { useAuth } from "../../context/AuthContext";
import { translateAssignmentStatus } from "../../i18n/helpers";

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

// Modern Enterprise UI palette
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  textPrimary: "#172B4D",
  textSecondary: "#44546F",
  textMuted: "#626F86",
  brand: "#0C66E4",
  brandHover: "#0055CC",
  brandLight: "#E9F2FF",
  green: "#1F845A",
  greenBg: "#DCFFF1",
  amber: "#A54800",
  amberBg: "#FFF7D6",
  purple: "#5E4DB2",
  purpleBg: "#F3F0FF",
  red: "#DE350B",
  redBg: "#FFEBE6",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  SUBMITTED: { bg: T.purpleBg, text: T.purple, dot: T.purple },
  RE_SUBMITTED: { bg: "#FFF0E6", text: "#BF5700", dot: "#E07000" },
  APPROVED: { bg: T.greenBg, text: T.green, dot: T.green },
  REJECTED: { bg: T.redBg, text: T.red, dot: T.red },
  PENDING: { bg: T.amberBg, text: T.amber, dot: "#FF8B00" },
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
  const [filterByStatus, setFilterByStatus] = React.useState<string | null>("SUBMITTED"); // null | "SUBMITTED" | "RE_SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED"

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [t]);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchAssignments() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await reviewApi.getMyReviewAssignments();
        if (!cancelled) setAssignments(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        const error = err as { message?: string; response?: { data?: { message?: string } } };
        if (!cancelled)
          setError(
            error?.response?.data?.message ||
              error?.message ||
              t("reviewer:queue.loadFailed"),
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchAssignments();
    return () => {
      cancelled = true;
    };
  }, []);

  // Queue scope only includes assignments that still need reviewer attention.
  // Filter visible queue rows by search without changing the queue totals.
  const reviewableAssignments = React.useMemo(() => {
    // Display all assignments (including IN_PROGRESS) except those with PAUSED projects
    let list = assignments.filter((a) => {
      // Hide assignments whose project is paused
      if ((a.projectStatus || "").toUpperCase() === "PAUSED") {
        return false;
      }
      return true;
    });

    // Filter by status if active
    if (filterByStatus === "SUBMITTED" || filterByStatus === "RE_SUBMITTED") {
      list = list.filter((a) => a.status === filterByStatus);
    } else if (filterByStatus === "APPROVED") {
      list = list.filter((a) => a.status === "APPROVED");
    } else if (filterByStatus === "REJECTED") {
      list = list.filter((a) => a.status === "REJECTED");
    } else if (filterByStatus === "REVIEWED") {
      list = list.filter(
        (a) => a.status === "APPROVED" || a.status === "REJECTED",
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          (a.projectName || "").toLowerCase().includes(q) ||
          (a.annotatorName || "").toLowerCase().includes(q),
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

  const getStatusLabel = (status: string) => translateAssignmentStatus(status).toUpperCase();

  // Stats - count from all assignments except IN_PROGRESS, not just queue
  const pendingCount = assignments.filter(
    (a) => a.status === "SUBMITTED" && (a.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const resubmittedCount = assignments.filter(
    (a) => a.status === "RE_SUBMITTED" && (a.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const queueTotalCount = assignments.filter(
    (a) => a.status !== "IN_PROGRESS" && (a.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const approvedCount = assignments.filter(
    (a) => a.status === "APPROVED" && (a.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const rejectedCount = assignments.filter(
    (a) => a.status === "REJECTED" && (a.projectStatus || "").toUpperCase() !== "PAUSED",
  ).length;
  const displayValue = (value: number | string) => (isLoading ? "-" : value);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
        color: T.textPrimary,
      }}
    >
      <div style={{ padding: "32px 40px", width: "100%" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "32px",
            paddingBottom: "24px",
            borderBottom: `2px solid ${T.border}`,
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: T.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}
            >
              {t("reviewer:queue.title")}
            </p>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: T.textPrimary,
                letterSpacing: "-0.02em",
                marginBottom: "8px",
              }}
            >
              {t("reviewer:queue.title")}
            </h1>
            <p style={{ fontSize: "14px", color: T.textMuted }}>
              {t("reviewer:queue.subtitle", {
                count: displayValue(queueTotalCount),
              })}
            </p>
          </div>
        </div>

        {/* KPI Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              label: t("reviewer:queue.kpi.submitted"),
              value: pendingCount,
              color: T.purple,
              bg: T.purpleBg,
              status: "SUBMITTED",
            },
            {
              label: t("reviewer:queue.kpi.resubmitted"),
              value: resubmittedCount,
              color: "#BF5700",
              bg: "#FFF0E6",
              status: "RE_SUBMITTED",
            },
            {
              label: t("reviewer:queue.kpi.approved"),
              value: approvedCount,
              color: T.green,
              bg: T.greenBg,
              status: "APPROVED",
            },
            {
              label: t("reviewer:queue.kpi.rejected"),
              value: rejectedCount,
              color: T.red,
              bg: T.redBg,
              status: "REJECTED",
            },
          ].map((kpi, idx) => (
            <div
              key={kpi.label}
              onMouseEnter={() => setHoveredKpi(idx)}
              onMouseLeave={() => setHoveredKpi(null)}
              onClick={() => {
                if (kpi.status === "QUEUE") {
                  setFilterByStatus(
                    filterByStatus === "QUEUE" ? null : "QUEUE",
                  );
                } else {
                  toggleStatusFilter(kpi.status);
                }
              }}
              style={{
                padding: "20px 24px",
                background:
                  filterByStatus === kpi.status ||
                  (filterByStatus === "QUEUE" && kpi.status === "QUEUE")
                    ? kpi.bg
                    : T.surface,
                border:
                  filterByStatus === kpi.status ||
                  (filterByStatus === "QUEUE" && kpi.status === "QUEUE")
                    ? `2px solid ${kpi.color}`
                    : `1px solid ${T.border}`,
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all .15s",
                boxShadow:
                  hoveredKpi === idx
                    ? "0 4px 12px rgba(9,30,66,.12)"
                    : "0 1px 3px rgba(9,30,66,.08)",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: T.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                }}
              >
                {kpi.label}
              </p>
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: kpi.color,
                  letterSpacing: "-0.02em",
                }}
              >
                {displayValue(kpi.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{ width: "100%", maxWidth: "320px", position: "relative" }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: T.textMuted }}
              >
                search
              </span>
            </div>
            <input
              type="text"
              style={{
                width: "100%",
                paddingLeft: "40px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                fontSize: "13px",
                color: T.textPrimary,
                fontFamily: "inherit",
                outline: "none",
                transition: "all .15s",
              }}
              placeholder={t("reviewer:queue.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = T.brand;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${T.brand}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "64px 0",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "32px",
                color: T.textMuted,
                animation: "spin 1s linear infinite",
              }}
            >
              progress_activity
            </span>
            <span
              style={{
                marginLeft: "8px",
                color: T.textMuted,
                fontSize: "13px",
              }}
            >
              {t("common:states.loading")}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              borderRadius: "6px",
              background: T.redBg,
              border: `1px solid ${T.red}40`,
              marginBottom: "16px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", color: T.red }}
            >
              error
            </span>
            <p style={{ fontSize: "13px", color: T.red, flex: 1 }}>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && reviewableAssignments.length === 0 && (
          <div
            style={{
              borderRadius: "6px",
              border: `1px solid ${T.border}`,
              background: T.surface,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(9,30,66,.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                width: "100%",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "64px",
                  color: T.green + "40",
                  marginBottom: "16px",
                }}
              >
                check_circle
              </span>
              <h4
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: T.textPrimary,
                  marginBottom: "8px",
                }}
              >
                {t("reviewer:queue.noReviewTitle")}
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: T.textMuted,
                  textAlign: "center",
                }}
              >
                {t("reviewer:queue.noReviewHint")}
              </p>
            </div>
          </div>
        )}

        {/* Review Table */}
        {!isLoading && !error && reviewableAssignments.length > 0 && (
          <div
            style={{
              borderRadius: "6px",
              border: `1px solid ${T.border}`,
              background: T.surface,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(9,30,66,.08)",
            }}
          >
            {!isMobile && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 2fr 1.2fr 1.5fr 1fr 0.8fr 100px",
                  padding: "12px 24px",
                  borderBottom: `1px solid ${T.border}`,
                  background: "#FAFBFC",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  ID
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t("reviewer:queue.table.project")}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t("reviewer:queue.table.annotator")}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t("reviewer:queue.table.dataset")}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t("reviewer:queue.table.status")}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t("reviewer:queue.table.progress")}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    textAlign: "right",
                  }}
                >
                  {t("reviewer:queue.table.action")}
                </p>
              </div>
            )}

            {/* Table rows */}
            <div>
              {reviewableAssignments.map((a, idx) => {
                const status = (a.status || "PENDING").toUpperCase();
                const statusStyle = STATUS_STYLES[status] || {
                  bg: T.surfaceHover,
                  text: T.textMuted,
                  dot: T.textMuted,
                };
                const rowBg =
                  hoveredRow === idx
                    ? T.brandLight
                    : idx % 2 === 0
                      ? T.surface
                      : "#FAFBFC";

                if (isMobile) {
                  return (
                    <div
                      key={a.assignmentId}
                      onClick={() => handleReview(a)}
                      style={{
                        padding: "16px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        background: rowBg,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "12px",
                              color: T.textMuted,
                            }}
                          >
                            #{a.assignmentId}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: T.textPrimary,
                            }}
                          >
                            {a.projectName || "—"}
                          </span>
                          <span
                            style={{ fontSize: "12px", color: T.textMuted }}
                          >
                            {a.datasetName || "—"}
                          </span>
                        </div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              display: "inline-block",
                              background: statusStyle.dot,
                            }}
                          />
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: T.textMuted,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: "4px",
                            }}
                          >
                            {t("reviewer:queue.table.annotator")}
                          </p>
                          <p
                            style={{ fontSize: "12px", color: T.textSecondary }}
                          >
                            {a.annotatorName || "—"}
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: T.textMuted,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: "4px",
                            }}
                          >
                            {t("reviewer:queue.table.progress")}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: "6px",
                                background: T.border,
                                borderRadius: "99px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  background: `linear-gradient(to right, ${T.brand}, ${T.brandHover})`,
                                  borderRadius: "99px",
                                  width: `${a.progress ?? 0}%`,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: T.textPrimary,
                              }}
                            >
                              {a.progress ?? 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReview(a);
                        }}
                        style={{
                          height: "36px",
                          width: "100%",
                          padding: "0 16px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          background: T.brand,
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
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
                    key={a.assignmentId}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleReview(a)}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "60px 2fr 1.2fr 1.5fr 1fr 0.8fr 100px",
                      alignItems: "center",
                      padding: "16px 24px",
                      background: rowBg,
                      borderBottom: `1px solid ${T.border}`,
                      cursor: "pointer",
                      transition: "all .15s",
                      gap: "16px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: hoveredRow === idx ? T.textPrimary : T.textMuted,
                        transition: "color .15s",
                      }}
                    >
                      #{a.assignmentId}
                    </span>

                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: hoveredRow === idx ? T.brand : T.textPrimary,
                        transition: "color .15s",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {a.projectName || "—"}
                    </span>

                    <span
                      style={{
                        fontSize: "13px",
                        color: T.textMuted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {a.annotatorName || "—"}
                    </span>

                    <span
                      style={{
                        fontSize: "13px",
                        color: T.textMuted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {a.datasetName || "—"}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          display: "inline-block",
                          background: statusStyle.dot,
                        }}
                      />
                      {getStatusLabel(status)}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: T.textPrimary,
                        }}
                      >
                        {a.progress ?? 0}%
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: T.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {t("common:labels.label")}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReview(a);
                        }}
                        style={{
                          height: "32px",
                          padding: "0 16px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          background: T.brand,
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all .15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = T.brandHover)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = T.brand)
                        }
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

        {/* Count */}
        {!isLoading && assignments.length > 0 && (
          <p
            style={{
              fontSize: "13px",
              color: T.textMuted,
              marginTop: "16px",
              fontWeight: 500,
            }}
          >
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
