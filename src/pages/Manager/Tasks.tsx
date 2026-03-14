import { useState, useEffect } from "react";
import { getMockData } from "../../utils/mockStorage";

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

// TODO_BACKEND: Replace with real API when available

const STORAGE_KEY = "mock_tasks";

function seedTasks() {
    return [
        { id: crypto.randomUUID(), taskName: "Label Batch Human_v1", project: "Human Detection", assignee: "Nguyễn Văn A", status: "IN_PROGRESS", progress: 65, createdAt: "2026-02-10T08:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Car_v2", project: "Vehicle Detection", assignee: "Trần Thị B", status: "COMPLETED", progress: 100, createdAt: "2026-02-08T10:30:00" },
        { id: crypto.randomUUID(), taskName: "Review Batch Dog_v1", project: "Animal Classification", assignee: "Lê Văn C", status: "PENDING", progress: 0, createdAt: "2026-02-15T14:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Sign_v1", project: "Traffic Sign", assignee: "Phạm Thị D", status: "RETURNED", progress: 30, createdAt: "2026-02-12T09:00:00" },
        { id: crypto.randomUUID(), taskName: "Label Batch Face_v3", project: "Face Recognition", assignee: "Nguyễn Văn A", status: "IN_PROGRESS", progress: 45, createdAt: "2026-02-14T11:00:00" },
    ];
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: T.amberBg, text: T.amber },
    IN_PROGRESS: { bg: T.brandLight, text: T.brand },
    COMPLETED: { bg: T.greenBg, text: T.green },
    RETURNED: { bg: T.redBg, text: T.red },
};

const STATUS_OPTIONS = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "RETURNED"];

const STATUS_VI: Record<string, string> = {
  ALL: "Tất cả",
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  RETURNED: "Trả lại",
};

export default function Tasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [viewTask, setViewTask] = useState<any>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    useEffect(() => {
        setTasks(getMockData(STORAGE_KEY, seedTasks));
    }, []);

    const filtered = statusFilter === "ALL" ? tasks : tasks.filter((t) => t.status === statusFilter);

    return (
        <div style={{
            padding: "32px 40px",
            maxWidth: "1400px",
            minHeight: "100vh",
            background: T.bg,
            fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
        }}>
            <h1 style={{
                fontSize: "28px",
                fontWeight: 800,
                color: T.textPrimary,
                marginBottom: "32px",
                letterSpacing: "-0.02em"
            }}>
                Quản lý nhiệm vụ
            </h1>

            <div style={{
                padding: "24px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                boxShadow: "0 1px 3px rgba(9,30,66,.08)"
            }}>
                {/* Filters */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "24px"
                }}>
                    <label style={{
                        fontSize: "13px",
                        color: T.textMuted,
                        fontWeight: 600
                    }}>
                        Trạng thái:
                    </label>
                    <select
                        style={{
                            padding: "8px 16px",
                            borderRadius: "4px",
                            border: `1px solid ${T.border}`,
                            background: T.surface,
                            color: T.textPrimary,
                            fontSize: "13px",
                            fontWeight: 600,
                            outline: "none",
                            cursor: "pointer",
                            fontFamily: "inherit"
                        }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                        onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                    >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_VI[s]}</option>)}
                    </select>
                </div>

                {filtered.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "64px 0"
                    }}>
                        <span className="material-symbols-outlined" style={{
                            fontSize: "64px",
                            color: T.textMuted + "40",
                            marginBottom: "8px",
                            display: "block"
                        }}>
                            task_alt
                        </span>
                        <p style={{
                            color: T.textMuted,
                            fontSize: "14px"
                        }}>
                            Chưa có nhiệm vụ nào
                        </p>
                    </div>
                ) : (
                    <div style={{
                        border: `1px solid ${T.border}`,
                        borderRadius: "6px",
                        overflow: "hidden"
                    }}>
                        {/* Table Header */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr 1.2fr 100px",
                            padding: "12px 24px",
                            background: "#FAFBFC",
                            borderBottom: `1px solid ${T.border}`,
                            gap: "16px",
                            alignItems: "center"
                        }}>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>TÊN NHIỆM VỤ</p>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>DỰ ÁN</p>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>NGƯỜI THỰC HIỆN</p>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>TRẠNG THÁI</p>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>TIẾN ĐỘ</p>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>NGÀY TẠO</p>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>HÀNH ĐỘNG</p>
                        </div>

                        {/* Table Body */}
                        <div>
                            {filtered.map((task, idx) => {
                                const statusStyle = STATUS_STYLES[task.status] || { bg: T.surfaceHover, text: T.textMuted };
                                return (
                                    <div
                                        key={task.id}
                                        onMouseEnter={() => setHoveredRow(idx)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr 1.2fr 100px",
                                            padding: "16px 24px",
                                            background: hoveredRow === idx ? T.brandLight : (idx % 2 === 0 ? T.surface : "#FAFBFC"),
                                            borderBottom: `1px solid ${T.border}`,
                                            transition: "all .15s",
                                            gap: "16px",
                                            alignItems: "center"
                                        }}
                                    >
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: T.textPrimary }}>{task.taskName}</span>
                                        <span style={{ fontSize: "13px", color: T.textMuted }}>{task.project}</span>
                                        <span style={{ fontSize: "13px", color: T.textPrimary }}>{task.assignee}</span>
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            padding: "4px 10px",
                                            borderRadius: "4px",
                                            fontSize: "10px",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                            background: statusStyle.bg,
                                            color: statusStyle.text,
                                            width: "fit-content"
                                        }}>
                                            {STATUS_VI[task.status] || task.status}
                                        </span>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{
                                                width: "80px",
                                                height: "6px",
                                                background: T.border,
                                                borderRadius: "99px",
                                                overflow: "hidden"
                                            }}>
                                                <div style={{
                                                    height: "100%",
                                                    borderRadius: "99px",
                                                    background: T.brand,
                                                    width: `${task.progress}%`,
                                                    transition: "width .5s ease"
                                                }} />
                                            </div>
                                            <span style={{
                                                fontSize: "11px",
                                                color: T.textMuted,
                                                width: "32px",
                                                fontWeight: 700
                                            }}>
                                                {task.progress}%
                                            </span>
                                        </div>
                                        <span style={{ fontSize: "11px", color: T.textMuted }}>
                                            {new Date(task.createdAt).toLocaleDateString("vi-VN")}
                                        </span>
                                        <div style={{ textAlign: "right" }}>
                                            <button
                                                onClick={() => setViewTask(task)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    padding: "6px 12px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    color: T.brand,
                                                    background: "transparent",
                                                    border: `1px solid ${T.border}`,
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    transition: "all .15s",
                                                    fontFamily: "inherit"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = T.brandLight;
                                                    e.currentTarget.style.borderColor = T.brand + "40";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = "transparent";
                                                    e.currentTarget.style.borderColor = T.border;
                                                }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>
                                                Xem
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* View Task Modal */}
            {viewTask && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999
                }}>
                    <div style={{
                        background: T.surface,
                        padding: "32px",
                        borderRadius: "6px",
                        maxWidth: "500px",
                        width: "90%",
                        boxShadow: "0 8px 24px rgba(9,30,66,.25)"
                    }}>
                        <h2 style={{
                            fontSize: "20px",
                            fontWeight: 700,
                            color: T.textPrimary,
                            marginBottom: "24px"
                        }}>
                            Chi tiết nhiệm vụ
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                            <div>
                                <span style={{ fontWeight: 600, color: T.textPrimary }}>Tên:</span>{" "}
                                <span style={{ color: T.textMuted }}>{viewTask.taskName}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 600, color: T.textPrimary }}>Dự án:</span>{" "}
                                <span style={{ color: T.textMuted }}>{viewTask.project}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 600, color: T.textPrimary }}>Người thực hiện:</span>{" "}
                                <span style={{ color: T.textMuted }}>{viewTask.assignee}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 600, color: T.textPrimary }}>Trạng thái:</span>
                                <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "4px 10px",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    background: STATUS_STYLES[viewTask.status]?.bg || T.surfaceHover,
                                    color: STATUS_STYLES[viewTask.status]?.text || T.textMuted
                                }}>
                                    {STATUS_VI[viewTask.status] || viewTask.status}
                                </span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 600, color: T.textPrimary }}>Tiến độ:</span>{" "}
                                <span style={{ color: T.textMuted }}>{viewTask.progress}%</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 600, color: T.textPrimary }}>Ngày tạo:</span>{" "}
                                <span style={{ color: T.textMuted }}>{new Date(viewTask.createdAt).toLocaleString("vi-VN")}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setViewTask(null)}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: T.textPrimary,
                                    background: T.surface,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    transition: "all .15s",
                                    fontFamily: "inherit"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceHover}
                                onMouseLeave={(e) => e.currentTarget.style.background = T.surface}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
