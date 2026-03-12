import { useState, useEffect } from "react";
import { activityLogApi } from "../../api/activityLogApi";
import { useToast } from "../../context/ToastContext";

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

export default function ActivityLogs() {
    const { addToast } = useToast();
    const [hoveredRow, setHoveredRow] = useState(null);

    // State
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        q: "",
        action: "ALL"
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Load Data
    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const result = await activityLogApi.list({
                page: pagination.page,
                limit: pagination.limit,
                q: filters.q,
                action: filters.action
            });

            setLogs(result.data);
            setPagination(prev => ({
                ...prev,
                ...result.meta
            }));
        } catch (error) {
            console.error(error);
            addToast("Failed to load activity logs", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Effect: Reload on filter/page change
    useEffect(() => {
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, filters]); // Reload when page or filters change

    // Handlers
    const handleSearchChange = (e) => {
        setFilters(prev => ({ ...prev, q: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const handleActionChange = (e) => {
        setFilters(prev => ({ ...prev, action: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    // Helper: Role Badge
    const getRoleBadge = (role) => {
        const styles = {
            admin: { bg: T.redBg, text: T.red, border: T.red + "40" },
            manager: { bg: T.purpleBg, text: T.purple, border: T.purple + "40" },
            annotator: { bg: T.brandLight, text: T.brand, border: T.brand + "40" },
            reviewer: { bg: T.amberBg, text: T.amber, border: T.amber + "40" }
        };
        const style = styles[role] || { bg: T.surfaceHover, text: T.textMuted, border: T.border };
        return (
            <span style={{
                fontSize: "9px",
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: "4px",
                border: `1px solid ${style.border}`,
                marginLeft: "8px",
                background: style.bg,
                color: style.text
            }}>
                {role}
            </span>
        );
    };

    // Helper: Action Badge
    const getActionBadge = (action) => {
        let style = { bg: T.surfaceHover, text: T.textMuted, border: T.border };
        if (action.includes("CREATE")) style = { bg: T.greenBg, text: T.green, border: T.green + "40" };
        if (action.includes("REJECT")) style = { bg: T.redBg, text: T.red, border: T.red + "40" };
        if (action.includes("APPROVE")) style = { bg: T.brandLight, text: T.brand, border: T.brand + "40" };
        if (action.includes("SUBMIT")) style = { bg: T.purpleBg, text: T.purple, border: T.purple + "40" };

        return (
            <span style={{
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: "4px",
                border: `1px solid ${style.border}`,
                background: style.bg,
                color: style.text
            }}>
                {action}
            </span>
        );
    };

    return (
        <div style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "32px 40px",
            maxWidth: "1400px",
            margin: "0 auto",
            width: "100%",
            background: T.bg,
            fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
        }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: T.textPrimary,
                    marginBottom: "8px"
                }}>
                    Theo dõi nhật ký
                </h1>
                <p style={{
                    fontSize: "14px",
                    color: T.textMuted,
                    marginTop: "4px"
                }}>
                    Lịch sử hoạt động của hệ thống
                </p>
            </div>

            {/* Filters */}
            <div style={{
                display: "flex",
                flexDirection: "row",
                gap: "12px",
                marginBottom: "24px",
                flexWrap: "wrap"
            }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                    <span className="material-symbols-outlined" style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "20px",
                        color: T.textMuted
                    }}>
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm actor, message, ID..."
                        value={filters.q}
                        onChange={handleSearchChange}
                        style={{
                            width: "100%",
                            paddingLeft: "40px",
                            paddingRight: "16px",
                            paddingTop: "10px",
                            paddingBottom: "10px",
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: "6px",
                            fontSize: "13px",
                            color: T.textPrimary,
                            outline: "none",
                            transition: "all .15s",
                            fontFamily: "inherit"
                        }}
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
                <select
                    value={filters.action}
                    onChange={handleActionChange}
                    style={{
                        width: "100%",
                        maxWidth: "200px",
                        padding: "10px 16px",
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: T.textPrimary,
                        outline: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 600
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = T.brand}
                    onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                >
                    <option value="ALL">Tất cả hành động</option>
                    <option value="CREATE_PROJECT">Tạo dự án</option>
                    <option value="SUBMIT_TASK">Gửi nhiệm vụ</option>
                    <option value="APPROVE_TASK">Approve Task</option>
                    <option value="REJECT_TASK">Reject Task</option>
                    <option value="CREATE_USER">Create User</option>
                    <option value="LOGIN">Login</option>
                </select>
            </div>

            {/* List */}
            <div style={{
                flex: 1,
                minHeight: 0,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(9,30,66,.08)"
            }}>
                {isLoading ? (
                    <div style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: T.textMuted
                    }}>
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <span className="material-symbols-outlined" style={{
                                fontSize: "32px",
                                animation: "spin 1s linear infinite"
                            }}>
                                refresh
                            </span>
                            <span style={{ fontSize: "12px" }}>Đang tải logs...</span>
                        </div>
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "40px",
                        color: T.textMuted
                    }}>
                        <span className="material-symbols-outlined" style={{
                            fontSize: "64px",
                            marginBottom: "8px",
                            opacity: 0.2
                        }}>
                            history_toggle_off
                        </span>
                        <p style={{ fontSize: "14px" }}>Không có hoạt động nào phù hợp</p>
                    </div>
                ) : (
                    <div style={{ overflow: "auto", flex: 1 }}>
                        {/* Table Header */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "200px 280px 200px 1fr",
                            padding: "12px 24px",
                            background: "#FAFBFC",
                            borderBottom: `1px solid ${T.border}`,
                            position: "sticky",
                            top: 0,
                            zIndex: 10,
                            gap: "16px",
                            alignItems: "center"
                        }}>
                            <p style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: T.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em"
                            }}>
                                TIME
                            </p>
                            <p style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: T.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em"
                            }}>
                                ACTOR
                            </p>
                            <p style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: T.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em"
                            }}>
                                ACTION
                            </p>
                            <p style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: T.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em"
                            }}>
                                MESSAGE
                            </p>
                        </div>

                        {/* Table Body */}
                        <div>
                            {logs.map((log, idx) => (
                                <div
                                    key={log.logId}
                                    onMouseEnter={() => setHoveredRow(idx)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "200px 280px 200px 1fr",
                                        padding: "16px 24px",
                                        background: hoveredRow === idx ? T.brandLight : (idx % 2 === 0 ? T.surface : "#FAFBFC"),
                                        borderBottom: `1px solid ${T.border}`,
                                        transition: "all .15s",
                                        gap: "16px",
                                        alignItems: "center"
                                    }}
                                >
                                    <span style={{
                                        color: T.textMuted,
                                        fontFamily: "monospace",
                                        fontSize: "11px"
                                    }}>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <span style={{
                                                fontWeight: 600,
                                                color: T.textPrimary,
                                                fontSize: "13px"
                                            }}>
                                                {log.actorName}
                                            </span>
                                            {log.actorRole && getRoleBadge(log.actorRole)}
                                        </div>
                                        <div style={{
                                            fontSize: "10px",
                                            color: T.textMuted,
                                            fontFamily: "monospace",
                                            marginTop: "2px"
                                        }}>
                                            {log.actorId}
                                        </div>
                                    </div>
                                    <div>
                                        {getActionBadge(log.action)}
                                    </div>
                                    <span style={{
                                        color: T.textMuted,
                                        fontSize: "13px"
                                    }}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pagination Footer */}
                {!isLoading && pagination.total > 0 && (
                    <div style={{
                        borderTop: `1px solid ${T.border}`,
                        padding: "12px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#FAFBFC",
                        flexWrap: "wrap",
                        gap: "12px"
                    }}>
                        <div style={{
                            fontSize: "12px",
                            color: T.textMuted
                        }}>
                            Hiển thị <strong style={{ color: T.textPrimary }}>{(pagination.page - 1) * pagination.limit + 1}</strong> đến <strong style={{ color: T.textPrimary }}>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trong tổng số <strong style={{ color: T.textPrimary }}>{pagination.total}</strong> kết quả
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                                style={{
                                    height: "32px",
                                    padding: "0 16px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: T.textPrimary,
                                    background: T.surface,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: "4px",
                                    cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                                    opacity: pagination.page <= 1 ? 0.5 : 1,
                                    transition: "all .15s",
                                    fontFamily: "inherit"
                                }}
                                onMouseEnter={(e) => pagination.page > 1 && (e.currentTarget.style.background = T.surfaceHover)}
                                onMouseLeave={(e) => pagination.page > 1 && (e.currentTarget.style.background = T.surface)}
                            >
                                Trước
                            </button>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0 12px",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: T.brand,
                                background: T.brandLight,
                                borderRadius: "4px",
                                height: "32px"
                            }}>
                                Trang {pagination.page} / {pagination.totalPages}
                            </div>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                                style={{
                                    height: "32px",
                                    padding: "0 16px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: T.textPrimary,
                                    background: T.surface,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: "4px",
                                    cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
                                    opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                                    transition: "all .15s",
                                    fontFamily: "inherit"
                                }}
                                onMouseEnter={(e) => pagination.page < pagination.totalPages && (e.currentTarget.style.background = T.surfaceHover)}
                                onMouseLeave={(e) => pagination.page < pagination.totalPages && (e.currentTarget.style.background = T.surface)}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
