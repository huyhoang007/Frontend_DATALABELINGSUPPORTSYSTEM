import * as React from "react";

const GROUPS = [
    {
        title: "Công cụ vẽ",
        rows: [
            { keys: ["G"], desc: "Polygon (đa giác)" },
            { keys: ["B"], desc: "Bounding Box (hộp)" },
            { keys: ["L"], desc: "Polyline (đường)" },
            { keys: ["K"], desc: "Points (điểm)" },
            { keys: ["S", "V"], desc: "Select (chọn)" },
        ],
    },
    {
        title: "Annotation",
        rows: [
            { keys: ["Delete", "⌫"], desc: "Xóa annotation đang chọn" },
            { keys: ["H"], desc: "Ẩn / hiện annotation đang chọn" },
            { keys: ["Ctrl", "Z"], desc: "Undo" },
            { keys: ["Ctrl", "Y"], desc: "Redo" },
        ],
    },
    {
        title: "Điều hướng ảnh",
        rows: [
            { keys: ["→", "D"], desc: "Ảnh tiếp theo" },
            { keys: ["←", "A"], desc: "Ảnh trước" },
        ],
    },
    {
        title: "Zoom",
        rows: [
            { keys: ["+"], desc: "Phóng to" },
            { keys: ["-"], desc: "Thu nhỏ" },
            { keys: ["0"], desc: "Reset về 100%" },
        ],
    },
    {
        title: "Khác",
        rows: [
            { keys: ["Enter"], desc: "Hoàn thành polygon / polyline" },
            { keys: ["Esc"], desc: "Hủy đang vẽ" },
            { keys: ["P (giữ)"], desc: "Freehand polygon" },
            { keys: ["Ctrl", "Enter"], desc: "Nộp bài" },
            { keys: ["?"], desc: "Mở / đóng bảng phím tắt" },
        ],
    },
];

function Kbd({ children }) {
    return (
        <kbd style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 26, padding: "2px 6px",
            background: "#1e2f42", border: "1px solid #2e4460",
            borderRadius: 5, fontSize: 11, fontFamily: "monospace",
            color: "#93c5fd", fontWeight: 700,
            boxShadow: "0 1px 0 #0d1a2a",
        }}>
            {children}
        </kbd>
    );
}

export default function ShortcutHelpModal({ onClose }) {
    // Close on Escape
    React.useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#111d2c",
                    border: "1px solid #253347",
                    borderRadius: 14,
                    padding: "24px 28px",
                    width: 480,
                    maxHeight: "80vh",
                    overflowY: "auto",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.01em" }}>
                        ⌨ Phím tắt
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#64748b", fontSize: 18, lineHeight: 1, padding: 4,
                        }}
                    >✕</button>
                </div>

                {/* Groups */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {GROUPS.map((group) => (
                        <div key={group.title}>
                            <div style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                                textTransform: "uppercase", color: "#00bfa5",
                                marginBottom: 8,
                            }}>
                                {group.title}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {group.rows.map((row, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, color: "#94a3b8" }}>{row.desc}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            {row.keys.map((k, j) => (
                                                <React.Fragment key={j}>
                                                    {j > 0 && <span style={{ color: "#3a5068", fontSize: 11 }}>+</span>}
                                                    <Kbd>{k}</Kbd>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <p style={{ marginTop: 20, fontSize: 11, color: "#3a5068", textAlign: "center" }}>
                    Nhấn <Kbd>Esc</Kbd> hoặc click bên ngoài để đóng
                </p>
            </div>
        </div>
    );
}
