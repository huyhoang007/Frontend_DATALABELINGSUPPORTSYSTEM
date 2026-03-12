import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { annotationApi } from "../../api/annotationApi";

// Bảng màu Modern Enterprise UI (Atlassian/Jira style)
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  borderStrong: "#B3B9C4",
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

/* ── Status tabs matching BE statuses ── */
const TABS = ["ALL", "PENDING", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"];

/* ── Status badge styles ── */
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: T.amberBg, text: T.amber, dot: "#FF8B00" },
  IN_PROGRESS: { bg: T.brandLight, text: T.brand, dot: T.brand },
  SUBMITTED: { bg: T.purpleBg, text: T.purple, dot: T.purple },
  APPROVED: { bg: T.greenBg, text: T.green, dot: T.green },
  REJECTED: { bg: T.redBg, text: T.red, dot: T.red },
  COMPLETED: { bg: T.greenBg, text: T.green, dot: T.green },
};

interface AnnotatorDashboardProps {
  user: any;
}

const AnnotatorDashboard: React.FC<AnnotatorDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch assignments from BE API ── */
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data: any = await annotationApi.getMyAssignments();
      const apiList = Array.isArray(data) ? data : (data?.content || data?.data || []);
      console.log("[ANNOTATOR_DASHBOARD] API assignments:", apiList.length);
      setAssignments(apiList);
    } catch (err: any) {
      console.error("[ANNOTATOR_DASHBOARD] API failed", err);
      const status = err?.status;
      if (status === 401) {
        setError("Hết phiên đăng nhập — vui lòng đăng nhập lại.");
      } else if (status === 403) {
        setError("Bạn không có quyền xem danh sách task.");
      } else {
        setError(err?.message || "Không thể tải danh sách task từ server.");
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  /* ── Filtering ── */
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
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

  const handleOpen = (assignment: any) => {
    // Navigate using assignmentId (BE concept)
    navigate(`/annotator/task/${assignment.assignmentId}`);
  };

  /* ── Active count ── */
  const activeCount = assignments.filter((a) =>
    ["PENDING", "IN_PROGRESS", "REJECTED"].includes((a.status || "").toUpperCase())
  ).length;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif", color: T.textPrimary }}>
      <div style={{ padding: "32px 40px", width: "100%" }}>
        {/* Page title */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{
            fontSize: "11px",
            fontWeight: 700,
            color: T.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "4px"
          }}>
            Annotator Dashboard
          </p>
          <h1 style={{
            fontSize: "24px",
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: "-0.02em",
            marginBottom: "4px"
          }}>
            Chào mừng, {user?.full_name || user?.username || user?.name || "User"}
          </h1>
          <p style={{ fontSize: "13px", color: T.textMuted, marginTop: "4px" }}>
            {!loading && (
              <>Bạn có <span style={{ fontFamily: "monospace", color: T.textPrimary, fontWeight: 600 }}>{activeCount}</span> nhiệm vụ cần xử lý.</>
            )}
          </p>
        </div>

        {/* Stats KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Hoàn thành", value: assignments.filter(t => (t.status || '').toUpperCase() === 'COMPLETED').length, icon: "check_circle", color: T.green },
            { label: "Đang thực hiện", value: assignments.filter(t => (t.status || '').toUpperCase() === 'IN_PROGRESS').length, icon: "pending", color: T.brand },
            { label: "Chờ xử lý", value: assignments.filter(t => (t.status || '').toUpperCase() === 'PENDING').length, icon: "schedule", color: T.amber },
          ].map((kpi, idx) => (
            <div
              key={kpi.label}
              onMouseEnter={() => setHoveredKpi(idx)}
              onMouseLeave={() => setHoveredKpi(null)}
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                padding: "20px",
                borderTop: `3px solid ${kpi.color}`,
                boxShadow: hoveredKpi === idx ? "0 4px 12px rgba(9,30,66,.12)" : "none",
                transition: "all .2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <p style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: T.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}>
                  {kpi.label}
                </p>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: kpi.color }}>
                  {kpi.icon}
                </span>
              </div>
              <p style={{
                fontSize: "32px",
                fontWeight: 800,
                color: T.textPrimary,
                lineHeight: 1
              }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          {/* Status Tabs */}
          <div style={{
            display: "inline-flex",
            padding: "4px",
            background: T.surfaceHover,
            borderRadius: "6px",
            border: `1px solid ${T.border}`,
            flexWrap: "wrap",
            gap: "4px"
          }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  transition: "all .15s",
                  background: activeTab === tab ? T.surface : "transparent",
                  color: activeTab === tab ? T.brand : T.textMuted,
                  border: activeTab === tab ? `1px solid ${T.brand}20` : "1px solid transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: activeTab === tab ? "0 1px 3px rgba(9,30,66,.08)" : "none"
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.background = T.surface + "80";
                    e.currentTarget.style.color = T.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = T.textMuted;
                  }
                }}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ width: "100%", maxWidth: "320px", position: "relative" }}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "12px",
              transform: "translateY(-50%)",
              pointerEvents: "none"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.textMuted }}>search</span>
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
                transition: "all .15s"
              }}
              placeholder="Tìm kiếm theo project, dataset..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "32px", color: T.textMuted, animation: "spin 1s linear infinite" }}>progress_activity</span>
            <span style={{ marginLeft: "8px", color: T.textMuted, fontSize: "13px" }}>Đang tải...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "6px",
            background: T.redBg,
            border: `1px solid ${T.red}40`,
            marginBottom: "16px"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.red }}>error</span>
            <p style={{ fontSize: "13px", color: T.red, flex: 1 }}>{error}</p>
            <button
              onClick={fetchAssignments}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: T.red,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAssignments.length === 0 && (
          <div style={{
            borderRadius: "6px",
            border: `1px solid ${T.border}`,
            background: T.surface,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(9,30,66,.08)"
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "600px",
              width: "100%"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "64px", color: T.textMuted + "40", marginBottom: "16px" }}>assignment</span>
              <h4 style={{ fontSize: "20px", fontWeight: 700, color: T.textPrimary, marginBottom: "8px" }}>Chưa có nhiệm vụ nào</h4>
              <p style={{
                fontSize: "14px",
                color: T.textMuted,
                textAlign: "center",
                maxWidth: "480px",
                margin: "0 auto",
                padding: "0 16px"
              }}>
                Manager sẽ phân công task cho bạn. Khi có task mới, bạn sẽ thấy tại đây.
              </p>
            </div>
          </div>
        )}

        {/* Task List Table with data */}
        {!loading && filteredAssignments.length > 0 && (
          <div style={{
            borderRadius: "6px",
            border: `1px solid ${T.border}`,
            background: T.surface,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(9,30,66,.08)"
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "60px 2fr 1.5fr 1.2fr 1.5fr 1fr 100px",
              padding: "12px 24px",
              borderBottom: `1px solid ${T.border}`,
              background: "#FAFBFC",
              gap: "16px",
              alignItems: "center"
            }}>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>ID</p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>PROJECT</p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>DATASET</p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>REVIEWER</p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>PROGRESS</p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>STATUS</p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>ACTION</p>
            </div>

            {/* Table rows */}
            <div>
              {filteredAssignments.map((a, idx) => {
                const status = (a.status || "PENDING").toUpperCase();
                const statusStyle = STATUS_STYLES[status] || { bg: T.surfaceHover, text: T.textMuted, dot: T.textMuted };
                
                return (
                  <div
                    key={a.assignmentId}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleOpen(a)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 2fr 1.5fr 1.2fr 1.5fr 1fr 100px",
                      alignItems: "center",
                      padding: "16px 24px",
                      background: hoveredRow === idx ? T.brandLight : (idx % 2 === 0 ? T.surface : "#FAFBFC"),
                      borderBottom: `1px solid ${T.border}`,
                      cursor: "pointer",
                      transition: "all .15s",
                      gap: "16px"
                    }}
                  >
                    {/* ID */}
                    <span style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: hoveredRow === idx ? T.textPrimary : T.textMuted,
                      transition: "color .15s"
                    }}>
                      #{a.assignmentId}
                    </span>

                    {/* Project */}
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: hoveredRow === idx ? T.brand : T.textPrimary,
                      transition: "color .15s",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {a.projectName || "—"}
                    </span>

                    {/* Dataset */}
                    <span style={{
                      fontSize: "13px",
                      color: T.textMuted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {a.datasetName || "—"}
                    </span>

                    {/* Reviewer */}
                    <span style={{
                      fontSize: "13px",
                      color: T.textMuted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {a.reviewerName || "—"}
                    </span>

                    {/* Progress */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        flex: 1,
                        height: "6px",
                        background: T.border,
                        borderRadius: "99px",
                        overflow: "hidden",
                        minWidth: "100px"
                      }}>
                        <div style={{
                          height: "100%",
                          background: `linear-gradient(to right, ${T.brand}, ${T.brandHover})`,
                          borderRadius: "99px",
                          width: `${a.progress || 0}%`,
                          transition: "width .5s ease"
                        }} />
                      </div>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: T.textPrimary,
                        minWidth: "45px",
                        textAlign: "right"
                      }}>
                        {a.progress || 0}%
                      </span>
                    </div>

                    {/* Status */}
                    <span style={{
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
                      color: statusStyle.text
                    }}>
                      <span style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        display: "inline-block",
                        background: statusStyle.dot
                      }} />
                      {status.replace("_", " ")}
                    </span>

                    {/* Action */}
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "8px",
                      opacity: hoveredRow === idx ? 1 : 0,
                      transition: "opacity .15s"
                    }}>
                      {["PENDING", "REJECTED"].includes(status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpen(a); }}
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
                            transition: "all .15s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = T.brandHover}
                          onMouseLeave={(e) => e.currentTarget.style.background = T.brand}
                        >
                          Start
                        </button>
                      )}
                      {status === "IN_PROGRESS" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpen(a); }}
                          style={{
                            height: "32px",
                            padding: "0 16px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: T.amber,
                            background: T.amberBg,
                            border: `1px solid ${T.amber}40`,
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all .15s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = T.amber + "20";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = T.amberBg;
                          }}
                        >
                          Continue
                        </button>
                      )}
                      {["SUBMITTED", "APPROVED", "COMPLETED"].includes(status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpen(a); }}
                          style={{
                            width: "32px",
                            height: "32px",
                            padding: 0,
                            background: "transparent",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all .15s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = T.surfaceHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.textMuted }}>visibility</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Count */}
        {!loading && assignments.length > 0 && (
          <p style={{ fontSize: "12px", color: T.textMuted, marginTop: "12px" }}>
            Hiển thị {filteredAssignments.length} / {assignments.length} nhiệm vụ
          </p>
        )}
      </div>
    </div>
  );
};

export default AnnotatorDashboard;