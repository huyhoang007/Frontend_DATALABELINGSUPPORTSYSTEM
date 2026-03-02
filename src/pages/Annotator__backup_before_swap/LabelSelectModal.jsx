import * as React from "react";

/**
 * Modal to select labels for a newly drawn shape.
 * Multi-select with checkbox list. Require >=1 label.
 */
export default function LabelSelectModal({ labels, onSave, onCancel }) {
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [search, setSearch] = React.useState("");

    const filteredLabels = React.useMemo(() => {
        if (!search.trim()) return labels;
        const q = search.toLowerCase();
        return labels.filter((l) => l.name.toLowerCase().includes(q));
    }, [labels, search]);

    const toggle = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        if (selectedIds.length === 0) return;
        onSave(selectedIds);
    };

    // Close on Escape
    React.useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onCancel?.(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onCancel]);

    return (
        <div
            data-label-modal
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
        >
            <div className="bg-card border border-border rounded-xl shadow-2xl w-[360px] max-h-[480px] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground mb-2">Chọn label cho đối tượng</h3>
                    <input
                        type="text"
                        placeholder="Tìm label..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-annotator-primary"
                        autoFocus
                    />
                </div>

                {/* Label list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredLabels.map((label) => {
                        const checked = selectedIds.includes(label.id);
                        return (
                            <label
                                key={label.id}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${checked
                                        ? "bg-annotator-primary/10 border border-annotator-primary/30"
                                        : "hover:bg-muted border border-transparent"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(label.id)}
                                    className="accent-annotator-primary w-4 h-4"
                                />
                                <span
                                    className="w-3 h-3 rounded-sm shadow-sm flex-shrink-0"
                                    style={{ background: label.color }}
                                />
                                <span className="text-xs font-medium text-foreground flex-1 truncate">
                                    {label.name}
                                </span>
                                {label.groupName && (
                                    <span className="text-[9px] text-muted-foreground">{label.groupName}</span>
                                )}
                            </label>
                        );
                    })}
                    {filteredLabels.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6">Không tìm thấy label</p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                        {selectedIds.length} label đã chọn
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={selectedIds.length === 0}
                            className="px-4 py-1.5 text-xs font-bold rounded-md bg-annotator-primary text-white hover:bg-annotator-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
