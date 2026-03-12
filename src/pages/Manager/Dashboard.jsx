import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/layout/Sidebar";
import { Button } from "../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { PROJECTS, TASKS } from "../../services/mockData";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

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
    sidebarBg: "#1D2125",
    sidebarText: "#B6C2CF",
};

export default function ManagerDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    const handleAction = (action) => {
        if (action === "Create Project") {
            navigate("/manager/projects");
            return;
        }
        addToast(`${action} action triggered (Mock)`, "info");
    };

    const projectStats = PROJECTS.map(proj => {
        const projTasks = TASKS.filter(t => t.projectId === proj.id);
        const completed = projTasks.filter(t => t.status === "APPROVED").length;
        const progress = projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;
        return { ...proj, taskCount: projTasks.length, completed, progress };
    });

    const kpis = [
        { label: "Tổng dự án", value: PROJECTS.length, icon: "folder_open", delta: "+2 tháng này", positive: true },
        { label: "Nhóm hoạt động", value: "8", icon: "group", delta: "Ổn định", positive: null },
        { label: "Chất lượng", value: "98.2%", icon: "verified", delta: "+1.4% so với kỳ trước", positive: true },
        { label: "Tình trạng", value: "Tốt", icon: "health_and_safety", delta: "Không có sự cố", positive: true },
    ];

    // Hover states for interactive elements
    const [hoveredKpi, setHoveredKpi] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif", color: T.textPrimary }}>
            <Sidebar />

            <main style={{ flex: 1, marginLeft: "256px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

                {/* Top navigation bar */}
                <header style={{
                    background: T.surface,
                    borderBottom: `1px solid ${T.border}`,
                    padding: "0 40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "56px",
                    position: "sticky",
                    top: 0,
                    zIndex: 10
                }}>
                    <nav style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: T.textMuted }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>home</span>
                        <span style={{ margin: "0 4px", color: T.border }}>/</span>
                        <span style={{ fontWeight: 600, color: T.textPrimary }}>Bảng điều khiển</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: T.textSecondary,
                            border: `1px solid ${T.border}`,
                            background: T.surface,
                            borderRadius: "4px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all .15s"
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>tune</span>
                            Bộ lọc
                        </button>
                        <button
                            onClick={() => handleAction("Create Project")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                height: "32px",
                                padding: "0 16px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: T.brand,
                                color: "#FFFFFF",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                transition: "all .15s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = T.brandHover}
                            onMouseLeave={(e) => e.currentTarget.style.background = T.brand}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
                            Tạo dự án
                        </button>
                    </div>
                </header>

                <div style={{ flex: 1, padding: "32px 40px" }}>

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
                            Quản lý dự án
                        </p>
                        <h1 style={{
                            fontSize: "24px",
                            fontWeight: 800,
                            color: T.textPrimary,
                            letterSpacing: "-0.02em",
                            marginBottom: "4px"
                        }}>
                            Xin chào, {user?.username || "Manager"}
                        </h1>
                        <p style={{ fontSize: "13px", color: T.textMuted, marginTop: "4px" }}>
                            Tổng quan hoạt động hôm nay — {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </div>

                    {/* KPI Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
                        {kpis.map((kpi, idx) => (
                            <div
                                key={kpi.label}
                                onMouseEnter={() => setHoveredKpi(idx)}
                                onMouseLeave={() => setHoveredKpi(null)}
                                style={{
                                    background: T.surface,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: "6px",
                                    padding: "20px",
                                    borderTop: `3px solid ${kpi.positive === true ? T.green : kpi.positive === false ? T.amber : T.brand}`,
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
                                    <span className="material-symbols-outlined" style={{
                                        fontSize: "20px",
                                        color: kpi.positive === true ? T.green : kpi.positive === false ? T.amber : T.brand
                                    }}>
                                        {kpi.icon}
                                    </span>
                                </div>
                                <p style={{
                                    fontSize: "32px",
                                    fontWeight: 800,
                                    color: T.textPrimary,
                                    lineHeight: 1,
                                    marginBottom: "8px"
                                }}>
                                    {kpi.value}
                                </p>
                                <p style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: kpi.positive === true ? T.green : kpi.positive === false ? T.amber : T.textMuted,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                }}>
                                    {kpi.positive === true && <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_upward</span>}
                                    {kpi.positive === false && <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_downward</span>}
                                    {kpi.delta}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Main content: Table + Sidebar panel */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>

                        {/* Project table */}
                        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "6px", overflow: "hidden" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "16px 24px",
                                borderBottom: `1px solid ${T.border}`,
                                background: "#FAFBFC"
                            }}>
                                <div>
                                    <h2 style={{ fontSize: "13px", fontWeight: 700, color: T.textPrimary }}>Danh sách dự án</h2>
                                    <p style={{ fontSize: "11px", color: T.textMuted, marginTop: "2px" }}>{PROJECTS.length} dự án đang hoạt động</p>
                                </div>
                                <button
                                    onClick={() => handleAction("View All")}
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: T.brand,
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: "inherit"
                                    }}
                                >
                                    Xem tất cả →
                                </button>
                            </div>
                            
                            {/* Table header */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 80px 180px 110px",
                                padding: "12px 24px",
                                borderBottom: `1px solid ${T.border}`,
                                background: "#F7F8F9",
                                gap: "12px"
                            }}>
                                <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tên dự án</p>
                                <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Loại</p>
                                <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tiến độ</p>
                                <p style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>Trạng thái</p>
                            </div>

                            {/* Table rows */}
                            {projectStats.map((proj, idx) => (
                                <div
                                    key={proj.id}
                                    onMouseEnter={() => setHoveredRow(idx)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    onClick={() => handleAction("View")}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 80px 180px 110px",
                                        alignItems: "center",
                                        padding: "16px 24px",
                                        background: hoveredRow === idx ? T.brandLight : (idx % 2 === 0 ? T.surface : "#FAFBFC"),
                                        borderBottom: `1px solid ${T.border}`,
                                        cursor: "pointer",
                                        transition: "all .15s",
                                        gap: "12px"
                                    }}
                                >
                                    {/* Name */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                        <div style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "6px",
                                            flexShrink: 0,
                                            background: `${T.brand}1A`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.brand }}>folder</span>
                                        </div>
                                        <span style={{
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            color: hoveredRow === idx ? T.brand : T.textPrimary,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            transition: "color .15s"
                                        }}>
                                            {proj.name}
                                        </span>
                                    </div>

                                    {/* Type */}
                                    <span style={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: T.textSecondary,
                                        background: T.surfaceHover,
                                        border: `1px solid ${T.border}`,
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        justifySelf: "start"
                                    }}>
                                        {proj.type}
                                    </span>

                                    {/* Progress */}
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <span style={{ fontSize: "10px", color: T.textMuted }}>Tiến độ</span>
                                            <span style={{ fontSize: "10px", fontWeight: 800, color: T.textPrimary }}>{proj.progress}%</span>
                                        </div>
                                        <div style={{ height: "6px", background: T.border, borderRadius: "99px", overflow: "hidden" }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${proj.progress}%`,
                                                background: proj.progress >= 75 ? T.green : proj.progress >= 40 ? "#FF8B00" : T.brand,
                                                borderRadius: "99px",
                                                transition: "width .6s ease"
                                            }} />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <span style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        padding: "4px 10px",
                                        borderRadius: "4px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        justifySelf: "end",
                                        background: proj.progress >= 75 ? T.greenBg : proj.progress >= 40 ? T.amberBg : T.brandLight,
                                        color: proj.progress >= 75 ? T.green : proj.progress >= 40 ? T.amber : T.brand
                                    }}>
                                        <span style={{
                                            width: "6px",
                                            height: "6px",
                                            borderRadius: "50%",
                                            display: "inline-block",
                                            background: proj.progress >= 75 ? T.green : proj.progress >= 40 ? "#FF8B00" : T.brand
                                        }} />
                                        {proj.progress >= 75 ? "Hoàn thành" : proj.progress >= 40 ? "Đang chạy" : "Mới bắt đầu"}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Right panel */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                            {/* Team productivity */}
                            <div style={{
                                background: T.brand,
                                color: "#FFFFFF",
                                borderRadius: "6px",
                                padding: "24px",
                                flex: 1
                            }}>
                                <p style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    color: "rgba(255,255,255,0.7)",
                                    marginBottom: "4px"
                                }}>
                                    Năng suất nhóm
                                </p>
                                <p style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                                    84.2<span style={{ fontSize: "24px", fontWeight: 400, color: "rgba(255,255,255,0.8)" }}>k</span>
                                </p>
                                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "20px" }}>
                                    tasks hoàn thành trong 30 ngày
                                </p>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "56px" }}>
                                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                borderRadius: "4px",
                                                background: "rgba(255,255,255,0.2)",
                                                height: `${h}%`,
                                                transition: "all .15s"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Next milestone */}
                            <div style={{
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                borderRadius: "6px",
                                padding: "24px"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                    <p style={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em",
                                        color: T.textMuted
                                    }}>
                                        Mốc tiếp theo
                                    </p>
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#FF8B00" }}>flag</span>
                                </div>
                                <p style={{ fontSize: "13px", fontWeight: 700, color: T.textPrimary, marginBottom: "4px" }}>
                                    Gán nhãn dữ liệu V2
                                </p>
                                <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: "16px" }}>
                                    Deadline: 20/03/2026
                                </p>
                                <div style={{ width: "100%", height: "6px", background: T.border, borderRadius: "99px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", background: "#FF8B00", borderRadius: "99px", width: "62%" }} />
                                </div>
                                <p style={{ fontSize: "11px", color: T.textMuted, marginTop: "8px", fontWeight: 600 }}>
                                    62% hoàn thành
                                </p>
                            </div>

                            {/* Quick actions */}
                            <div style={{
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                borderRadius: "6px",
                                padding: "20px"
                            }}>
                                <p style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    color: T.textMuted,
                                    marginBottom: "12px"
                                }}>
                                    Thao tác nhanh
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {[
                                        { label: "Phân công nhiệm vụ", icon: "assignment_ind" },
                                        { label: "Xuất báo cáo", icon: "download" },
                                        { label: "Lên lịch họp", icon: "event" },
                                    ].map(item => (
                                        <button
                                            key={item.label}
                                            onClick={() => handleAction(item.label)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: T.textPrimary,
                                                background: "transparent",
                                                border: "none",
                                                padding: "10px 12px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontFamily: "inherit",
                                                textAlign: "left",
                                                transition: "all .15s"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = T.brandLight;
                                                e.currentTarget.style.color = T.brand;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "transparent";
                                                e.currentTarget.style.color = T.textPrimary;
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.textMuted }}>
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer info bar */}
                    <div style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: "6px",
                        padding: "12px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: T.green,
                                display: "inline-block",
                                animation: "pulse 2s infinite"
                            }} />
                            <span style={{ fontSize: "11px", fontWeight: 600, color: T.textMuted }}>
                                Tất cả hệ thống hoạt động bình thường
                            </span>
                        </div>
                        <p style={{ fontSize: "11px", color: T.textMuted }}>
                            Cập nhật lần cuối: vừa xong
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}