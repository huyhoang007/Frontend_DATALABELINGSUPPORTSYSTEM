import * as React from "react";
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { annotationApi } from "../../api/annotationApi";

// Bảng màu Modern Enterprise UI
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

const TABS = [
  "ALL",
  "PENDING",
  "IN_PROGRESS",
  "SUBMITTED",
  "RE_SUBMITTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
];

const STATUS_STYLES = {
  PENDING: { bg: T.amberBg, text: T.amber, dot: "#FF8B00" },
  IN_PROGRESS: { bg: T.brandLight, text: T.brand, dot: T.brand },
  SUBMITTED: { bg: T.purpleBg, text: T.purple, dot: T.purple },
  RE_SUBMITTED: { bg: "#FFF3E0", text: "#BF5700", dot: "#BF5700" },
  APPROVED: { bg: T.greenBg, text: T.green, dot: T.green },
  REJECTED: { bg: T.redBg, text: T.red, dot: T.red },
  COMPLETED: { bg: T.greenBg, text: T.green, dot: T.green },
};

const STATUS_VI = {
  ALL: "TẤT CẢ",
  PENDING: "CHỜ XỬ LÝ",
  IN_PROGRESS: "ĐANG LÀM",
  SUBMITTED: "ĐÃ NỘP",
  RE_SUBMITTED: "NỘP LẠI",
  APPROVED: "ĐÃ DUYỆT",
  REJECTED: "TỪ CHỐI",
  COMPLETED: "HOÀN THÀNH",
};

export default function TaskList() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("ALL");
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
      const apiList = Array.isArray(data)
        ? data
        : data?.content || data?.data || [];
      setAssignments(apiList);
    } catch (err) {
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

  React.useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
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

  const handleOpen = (assignment) => {
    navigate(`/annotator/task/${assignment.assignmentId}`);
  };

  const getActionConfig = (status) => {
    if (["PENDING", "REJECTED", "RE_SUBMITTED"].includes(status)) {
      return { label: "Bắt đầu", text: "#FFFFFF", background: T.brand, border: "none" };
    }
    if (status === "IN_PROGRESS") {
      return { label: "Tiếp tục", text: T.amber, background: T.amberBg, border: `1px solid ${T.amber}40` };
    }
    if (["SUBMITTED", "APPROVED", "COMPLETED"].includes(status)) {
      return { label: "Xem", text: T.textSecondary, background: T.surfaceHover, border: `1px solid ${T.border}`, icon: "visibility" };
    }
    return null;
  };

  const activeCount = assignments.filter((a) =>
    ["PENDING", "IN_PROGRESS", "REJECTED"].includes(
      (a.status || "").toUpperCase(),
    ),
  ).length;

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
              Danh sách nhiệm vụ
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
              Nhiệm vụ của tôi
            </h1>
            <p style={{ fontSize: "14px", color: T.textMuted }}>
              Chào mừng trở lại,{" "}
              <span style={{ color: T.brand, fontWeight: 600 }}>
                {user?.displayName || user?.username || user?.name || "User"}
              </span>
              .
              {!loading && (
                <>
                  {" "}
                  Bạn có{" "}
                  <span
                    style={{
                      fontFamily: "monospace",
                      color: T.textPrimary,
                      fontWeight: 700,
                    }}
                  >
                    {activeCount}
                  </span>{" "}
                  nhiệm vụ đang hoạt động.
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "40px",
              padding: "0 20px",
              fontSize: "14px",
              fontWeight: 600,
              color: T.red,
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.redBg;
              e.currentTarget.style.borderColor = T.red + "40";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
            >
              logout
            </span>
            Đăng xuất
          </button>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Status Tabs */}
          <div
            style={{
              display: "inline-flex",
              padding: "4px",
              background: T.surfaceHover,
              borderRadius: "6px",
              border: `1px solid ${T.border}`,
              flexWrap: "wrap",
              gap: "4px",
            }}
          >
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
                  border:
                    activeTab === tab
                      ? `1px solid ${T.brand}20`
                      : "1px solid transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow:
                    activeTab === tab ? "0 1px 3px rgba(9,30,66,.08)" : "none",
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
                {STATUS_VI[tab] || tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Search */}
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
              Đang tải...
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
            <button
              onClick={fetchAssignments}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: T.red,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAssignments.length === 0 && (
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
                height: "600px",
                width: "100%",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "64px",
                  color: T.textMuted + "40",
                  marginBottom: "16px",
                }}
              >
                assignment
              </span>
              <h4
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: T.textPrimary,
                  marginBottom: "8px",
                }}
              >
                Chưa có nhiệm vụ nào
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: T.textMuted,
                  textAlign: "center",
                  maxWidth: "480px",
                  margin: "0 auto",
                  padding: "0 16px",
                }}
              >
                Manager sẽ phân công task cho bạn. Khi có task mới, bạn sẽ thấy
                tại đây.
              </p>
            </div>
          </div>
        )}

        {/* Task List Table with data */}
        {!loading && filteredAssignments.length > 0 && (
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
                gridTemplateColumns: "60px 2fr 1.5fr 1.2fr 1.5fr 1fr 100px",
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
                DỰ ÁN
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
                BỘ DỮ LIỆU
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
                NGƯỜI ĐÁNH GIÁ
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
                TIẾN ĐỘ
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
                TRẠNG THÁI
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
                THAO TÁC
              </p>
            </div>
            )}

            {/* Table rows */}
            <div>
              {filteredAssignments.map((a, idx) => {
                const status = (a.status || "PENDING").toUpperCase();
                const statusStyle = STATUS_STYLES[status] || {
                  bg: T.surfaceHover,
                  text: T.textMuted,
                  dot: T.textMuted,
                };
                const action = getActionConfig(status);

                if (isMobile) {
                  return (
                    <div
                      key={a.assignmentId}
                      onClick={() => handleOpen(a)}
                      style={{
                        padding: "16px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        background: idx % 2 === 0 ? T.surface : "#FAFBFC",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "12px", color: T.textMuted }}>#{a.assignmentId}</span>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: T.textPrimary }}>{a.projectName || "—"}</span>
                          <span style={{ fontSize: "12px", color: T.textMuted }}>{a.datasetName || "—"}</span>
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
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", display: "inline-block", background: statusStyle.dot }} />
                          {STATUS_VI[status] || status.replace("_", " ")}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Người đánh giá</p>
                          <p style={{ fontSize: "12px", color: T.textSecondary }}>{a.reviewerName || "—"}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Tiến độ</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ flex: 1, height: "6px", background: T.border, borderRadius: "99px", overflow: "hidden" }}>
                              <div style={{ height: "100%", background: `linear-gradient(to right, ${T.brand}, ${T.brandHover})`, borderRadius: "99px", width: `${a.progress || 0}%` }} />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: T.textPrimary }}>{a.progress || 0}%</span>
                          </div>
                        </div>
                      </div>

                      {action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(a);
                          }}
                          style={{
                            height: "36px",
                            width: "100%",
                            padding: "0 16px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: action.text,
                            background: action.background,
                            border: action.border,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          {action.icon && <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{action.icon}</span>}
                          {action.label}
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={a.assignmentId}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleOpen(a)}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "60px 2fr 1.5fr 1.2fr 1.5fr 1fr 100px",
                      alignItems: "center",
                      padding: "16px 24px",
                      background:
                        hoveredRow === idx
                          ? T.brandLight
                          : idx % 2 === 0
                            ? T.surface
                            : "#FAFBFC",
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
                      {a.datasetName || "—"}
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
                      {a.reviewerName || "—"}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: "6px",
                          background: T.border,
                          borderRadius: "99px",
                          overflow: "hidden",
                          minWidth: "100px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: `linear-gradient(to right, ${T.brand}, ${T.brandHover})`,
                            borderRadius: "99px",
                            width: `${a.progress || 0}%`,
                            transition: "width .5s ease",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: T.textPrimary,
                          minWidth: "45px",
                          textAlign: "right",
                        }}
                      >
                        {a.progress || 0}%
                      </span>
                    </div>

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
                      {STATUS_VI[status] || status.replace("_", " ")}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                      }}
                    >
                      {["PENDING", "REJECTED", "RE_SUBMITTED"].includes(status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(a);
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
                          Bắt đầu
                        </button>
                      )}
                      {status === "IN_PROGRESS" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(a);
                          }}
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
                            transition: "all .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = T.amber + "20";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = T.amberBg;
                          }}
                        >
                          Tiếp tục
                        </button>
                      )}
                      {["SUBMITTED", "APPROVED", "COMPLETED"].includes(
                        status,
                      ) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(a);
                          }}
                          style={{
                            height: "32px",
                            padding: "0 16px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: T.textSecondary,
                            background: T.surfaceHover,
                            border: `1px solid ${T.border}`,
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = T.border;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = T.surfaceHover;
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "16px" }}
                          >
                            visibility
                          </span>
                          Xem
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
          <p
            style={{
              fontSize: "13px",
              color: T.textMuted,
              marginTop: "16px",
              fontWeight: 500,
            }}
          >
            Hiển thị {filteredAssignments.length} trong tổng số{" "}
            {assignments.length} nhiệm vụ
          </p>
        )}
      </div>
    </div>
  );
}
