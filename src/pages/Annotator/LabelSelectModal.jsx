import * as React from "react";

/**
 * Label selection modal – grouped by LabelRule.
 *
 * Props:
 *  labelGroups: { ruleId, ruleName, labels: [{id, name, color, type}] }[]
 *  onSave(labelIds: number[])
 *  onCancel()
 */
export default function LabelSelectModal({ labelGroups = [], onSave, onCancel }) {
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [activeRuleIdx, setActiveRuleIdx] = React.useState(0);

    const isSearching = search.trim().length > 0;

    /* ── filtered groups when searching ── */
    const searchResults = React.useMemo(() => {
        if (!isSearching) return [];
        const q = search.toLowerCase();
        return labelGroups
            .map((g) => ({
                ...g,
                labels: g.labels.filter(
                    (l) =>
                        l.name.toLowerCase().includes(q) ||
                        g.ruleName.toLowerCase().includes(q)
                ),
            }))
            .filter((g) => g.labels.length > 0);
    }, [search, labelGroups, isSearching]);

    const currentGroup = labelGroups[activeRuleIdx] || null;

    const toggle = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        if (selectedIds.length === 0) return;
        onSave(selectedIds);
    };

    /* build name map for footer display */
    const allLabelsFlat = React.useMemo(
        () => labelGroups.flatMap((g) => g.labels),
        [labelGroups]
    );
    const selectedNames = selectedIds
        .map((id) => allLabelsFlat.find((l) => l.id === id)?.name)
        .filter(Boolean);

    React.useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onCancel?.(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onCancel]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
        >
            <div
                className="flex flex-col overflow-hidden rounded-xl shadow-2xl"
                style={{
                    width: 560,
                    maxHeight: 500,
                    background: "#0f1923",
                    border: "1px solid #1e2f42",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: "1px solid #1e2f42" }}>
                    <p className="text-[13px] font-semibold mb-2.5" style={{ color: "#e2e8f0" }}>
                        Chọn label cho đối tượng
                    </p>
                    <div className="relative">
                        <span
                            className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2"
                            style={{ fontSize: 16, color: "#4a6788", pointerEvents: "none" }}
                        >
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm label rule hoặc label..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg focus:outline-none"
                            style={{
                                background: "#182233",
                                border: "1px solid #253347",
                                color: "#e2e8f0",
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                                style={{ color: "#4a6788" }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {isSearching ? (
                        /* ── Search results grouped by rule ── */
                        <div className="flex-1 overflow-y-auto p-3 space-y-4">
                            {searchResults.length === 0 ? (
                                <p className="text-xs text-center py-8" style={{ color: "#4a6788" }}>
                                    Không tìm thấy label
                                </p>
                            ) : (
                                searchResults.map((g) => (
                                    <div key={g.ruleId ?? g.ruleName}>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                                            style={{ color: "#4a6788" }}>
                                            {g.ruleName}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {g.labels.map((label) => (
                                                <LabelChip
                                                    key={label.id}
                                                    label={label}
                                                    selected={selectedIds.includes(label.id)}
                                                    onClick={() => toggle(label.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* ── Empty state: prompt user to search ── */
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10">
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 36, color: "#253347" }}
                            >
                                manage_search
                            </span>
                            <p className="text-xs" style={{ color: "#4a6788" }}>
                                Nhập tên label hoặc nhóm để tìm kiếm
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="px-4 py-3 flex items-center gap-3 shrink-0"
                    style={{ borderTop: "1px solid #1e2f42" }}
                >
                    <div className="flex-1 flex flex-wrap gap-1 min-w-0 overflow-hidden">
                        {selectedNames.length === 0 ? (
                            <span className="text-[11px]" style={{ color: "#4a6788" }}>
                                Chưa chọn label nào
                            </span>
                        ) : (
                            selectedNames.map((name, i) => (
                                <span
                                    key={i}
                                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: "#182233", color: "#00bfa5", border: "1px solid #253347" }}
                                >
                                    {name}
                                </span>
                            ))
                        )}
                    </div>
                    <button
                        onClick={onCancel}
                        className="shrink-0 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors"
                        style={{ background: "#1e2f42", color: "#94a3b8", border: "1px solid #253347" }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={selectedIds.length === 0}
                        className="shrink-0 px-4 py-1.5 text-xs font-bold rounded-lg transition-opacity"
                        style={{
                            background: selectedIds.length > 0 ? "#00bfa5" : "#0e3d35",
                            color: selectedIds.length > 0 ? "#fff" : "#2a6b5e",
                            cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Label chip button ── */
function LabelChip({ label, selected, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
                background: selected ? `${label.color}22` : "#182233",
                border: selected ? `1.5px solid ${label.color}` : "1.5px solid #253347",
                color: selected ? label.color : "#94a3b8",
            }}
        >
            <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: label.color }}
            />
            {label.name}
            {selected && (
                <span className="material-symbols-outlined" style={{ fontSize: 12, marginLeft: 2 }}>
                    check
                </span>
            )}
        </button>
    );
}
