import * as React from "react";
import { useTranslation } from "react-i18next";

/**
 * Label selection modal – grouped by LabelRule.
 *
 * Props:
 *  labelGroups: { ruleId, ruleName, labels: [{id, name, color, type}] }[]
 *  onSave(labelIds: number[])
 *  onCancel()
 */
export default function LabelSelectModal({
  labelGroups = [],
  initialSelectedIds = [],
  onSave,
  onCancel,
}) {
  const { t } = useTranslation(["annotator", "common"]);
  const [selectedIds, setSelectedIds] = React.useState(initialSelectedIds);
  const [search, setSearch] = React.useState("");
  const [activeRuleIdx, setActiveRuleIdx] = React.useState(0);
  const [viewMode, setViewMode] = React.useState(null); // null | "labels" | "rules"

  const isSearching = search.trim().length > 0;

  // Only reset selectedIds when modal first opens (when initialSelectedIds changes from empty/different)
  React.useEffect(() => {
    // Only update if we haven't selected anything yet, or if initial changed significantly
    setSelectedIds((prev) => {
      // If user has already selected, don't override
      if (prev.length > 0 && initialSelectedIds.length === prev.length) {
        return prev;
      }
      return initialSelectedIds;
    });
  }, [initialSelectedIds?.join(",")]); // Use string join to prevent re-render on object reference change

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
            g.ruleName.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.labels.length > 0);
  }, [search, labelGroups, isSearching]);

  /* ── flat labels list (for "labels" view) ── */
  const allLabelsFlat = React.useMemo(
    () => labelGroups.flatMap((g) => g.labels),
    [labelGroups],
  );

  /* ── filtered flat labels when searching ── */
  const searchLabelsFlat = React.useMemo(() => {
    if (!isSearching) return [];
    const q = search.toLowerCase();
    return allLabelsFlat.filter((l) => l.name.toLowerCase().includes(q));
  }, [search, allLabelsFlat, isSearching]);

  /* ── filtered rule groups when searching in rules view ── */
  const searchRuleGroups = React.useMemo(() => {
    if (!isSearching) return labelGroups;
    const q = search.toLowerCase();
    return labelGroups
      .map((g) => ({
        ...g,
        labels: (g.labels || []).filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            g.ruleName?.toLowerCase().includes(q),
        ),
      }))
      .filter(
        (g) => g.labels.length > 0 || g.ruleName?.toLowerCase().includes(q),
      );
  }, [search, labelGroups, isSearching]);

  const currentGroup = labelGroups[activeRuleIdx] || null;

  const toggle = (id) => {
    // Toggle: click to select, click again to deselect
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // If already selected, remove it
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        // If not selected, add it (single-select mode: replace the list)
        return [id];
      }
    });
  };

  const handleSave = () => {
    if (selectedIds.length === 0) return;
    onSave(selectedIds);
  };

  /* build name map for footer display */
  const selectedNames = selectedIds
    .map((id) => allLabelsFlat.find((l) => l.id === id)?.name)
    .filter(Boolean);

  React.useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
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
        <div
          className="px-4 pt-4 pb-3 shrink-0"
          style={{ borderBottom: "1px solid #1e2f42" }}
        >
          <p
            className="text-[13px] font-semibold mb-2.5"
            style={{ color: "#e2e8f0" }}
          >
            {t("annotator:workspace.modal.selectLabel")}
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
              placeholder={t("annotator:workspace.modal.searchPlaceholder")}
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
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14 }}
                >
                  close
                </span>
              </button>
            )}
          </div>

          {/* ── Toggle buttons: Labels / Label Rules ── */}
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={() =>
                setViewMode((prev) => (prev === "labels" ? null : "labels"))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={
                viewMode === "labels"
                  ? { background: "#00bfa5", color: "#fff" }
                  : {
                      background: "#182233",
                      color: "#4a6788",
                      border: "1px solid #253347",
                    }
              }
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14 }}
              >
                label
              </span>
              {t("annotator:workspace.modal.labels", {
                count: allLabelsFlat.length,
              })}
            </button>
            <button
              onClick={() =>
                setViewMode((prev) => (prev === "rules" ? null : "rules"))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={
                viewMode === "rules"
                  ? { background: "#00bfa5", color: "#fff" }
                  : {
                      background: "#182233",
                      color: "#4a6788",
                      border: "1px solid #253347",
                    }
              }
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14 }}
              >
                rule
              </span>
              {t("annotator:workspace.modal.labelRules", {
                count: labelGroups.length,
              })}
            </button>
          </div>
        </div>

        {/* Body — only show when a view is active or searching */}
        {(viewMode !== null || isSearching) && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* ── When searching without a specific tab: show BOTH labels + rules ── */}
              {isSearching && viewMode === null
                ? (() => {
                    const hasLabels = searchLabelsFlat.length > 0;
                    const hasRules = searchRuleGroups.length > 0;
                    if (!hasLabels && !hasRules) {
                      return (
                        <p
                          className="text-xs text-center py-8"
                          style={{ color: "#4a6788" }}
                        >
                          {t("annotator:workspace.modal.noResults")}
                        </p>
                      );
                    }
                    return (
                      <>
                        {/* Labels section */}
                        {hasLabels && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 13, color: "#4a6788" }}
                              >
                                label
                              </span>
                              <span
                                className="text-[11px] font-semibold"
                                style={{ color: "#4a6788" }}
                              >
                                {t("annotator:workspace.modal.labels", {
                                  count: searchLabelsFlat.length,
                                })}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {searchLabelsFlat.map((label) => (
                                <LabelChip
                                  key={label.id}
                                  label={label}
                                  selected={selectedIds.includes(label.id)}
                                  onClick={() => toggle(label.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Label Rules section */}
                        {hasRules && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 13, color: "#4a6788" }}
                              >
                                rule
                              </span>
                              <span
                                className="text-[11px] font-semibold"
                                style={{ color: "#4a6788" }}
                              >
                                {t("annotator:workspace.modal.labelRules", {
                                  count: searchRuleGroups.length,
                                })}
                              </span>
                            </div>
                            {searchRuleGroups.map((g) => (
                              <div
                                key={g.ruleId ?? g.ruleName}
                                className="rounded-lg overflow-hidden mb-2"
                                style={{
                                  background: "#182233",
                                  border: "1px solid #253347",
                                }}
                              >
                                <div
                                  className="flex items-center gap-2 px-3 py-2"
                                  style={{
                                    borderBottom:
                                      g.labels?.length > 0
                                        ? "1px solid #253347"
                                        : "none",
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 14, color: "#00bfa5" }}
                                  >
                                    rule
                                  </span>
                                  <span
                                    className="text-xs font-bold"
                                    style={{ color: "#e2e8f0" }}
                                  >
                                    {g.ruleName}
                                  </span>
                                  <span
                                    className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full"
                                    style={{
                                      background: "#0e1621",
                                      color: "#4a6788",
                                    }}
                                  >
                                    {t("annotator:workspace.modal.ruleItemCount", {
                                      count: g.labels?.length || 0,
                                    })}
                                  </span>
                                </div>
                                {g.labels?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 p-3">
                                    {g.labels.map((label) => (
                                      <LabelChip
                                        key={label.id}
                                        label={label}
                                        selected={selectedIds.includes(
                                          label.id,
                                        )}
                                        onClick={() => toggle(label.id)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()
                : viewMode === "labels"
                  ? /* ── Flat labels view ── */
                    (() => {
                      const displayLabels = isSearching
                        ? searchLabelsFlat
                        : allLabelsFlat;
                      if (displayLabels.length === 0) {
                        return (
                          <p
                            className="text-xs text-center py-8"
                            style={{ color: "#4a6788" }}
                          >
                            {t("annotator:workspace.modal.noLabelResults")}
                          </p>
                        );
                      }
                      return (
                        <div className="flex flex-wrap gap-2">
                          {displayLabels.map((label) => (
                            <LabelChip
                              key={label.id}
                              label={label}
                              selected={selectedIds.includes(label.id)}
                              onClick={() => toggle(label.id)}
                            />
                          ))}
                        </div>
                      );
                    })()
                  : viewMode === "rules"
                    ? /* ── Grouped by Label Rule view (with search filtering) ── */
                      (() => {
                        const displayGroups = isSearching
                          ? searchRuleGroups
                          : labelGroups;
                        if (displayGroups.length === 0) {
                          return (
                            <p
                              className="text-xs text-center py-8"
                              style={{ color: "#4a6788" }}
                            >
                            {t("annotator:workspace.modal.noRuleResults")}
                            </p>
                          );
                        }
                        return displayGroups.map((g) => (
                          <div
                            key={g.ruleId ?? g.ruleName}
                            className="rounded-lg overflow-hidden"
                            style={{
                              background: "#182233",
                              border: "1px solid #253347",
                            }}
                          >
                            {/* Rule name header */}
                            <div
                              className="flex items-center gap-2 px-3 py-2"
                              style={{
                                borderBottom:
                                  g.labels?.length > 0
                                    ? "1px solid #253347"
                                    : "none",
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 14, color: "#00bfa5" }}
                              >
                                rule
                              </span>
                              <span
                                className="text-xs font-bold"
                                style={{ color: "#e2e8f0" }}
                              >
                                {g.ruleName}
                              </span>
                              <span
                                className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: "#0e1621",
                                  color: "#4a6788",
                                }}
                              >
                                  {t("annotator:workspace.modal.ruleItemCount", {
                                    count: g.labels?.length || 0,
                                  })}
                              </span>
                            </div>
                            {/* Labels inside the rule */}
                            {g.labels?.length > 0 ? (
                              <div className="flex flex-wrap gap-2 p-3">
                                {g.labels.map((label) => (
                                  <LabelChip
                                    key={label.id}
                                    label={label}
                                    selected={selectedIds.includes(label.id)}
                                    onClick={() => toggle(label.id)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="px-3 py-2">
                                <p
                                  className="text-[10px]"
                                  style={{ color: "#3a5068" }}
                                >
                                  {t("annotator:workspace.modal.ruleEmpty")}
                                </p>
                              </div>
                            )}
                          </div>
                        ));
                      })()
                    : null}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="px-4 py-3 flex items-center gap-3 shrink-0"
          style={{ borderTop: "1px solid #1e2f42" }}
        >
          <div className="flex-1 flex flex-wrap gap-1 min-w-0 overflow-hidden">
            <span className="text-[10px] w-full" style={{ color: "#4a6788" }}>
              {t("annotator:workspace.modal.singleSelect")}
            </span>
            {selectedNames.length === 0 ? (
              <span className="text-[11px]" style={{ color: "#4a6788" }}>
                {t("annotator:workspace.modal.noSelectedLabel")}
              </span>
            ) : (
              selectedNames.map((name, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "#182233",
                    color: "#00bfa5",
                    border: "1px solid #253347",
                  }}
                >
                  {name}
                </span>
              ))
            )}
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{
              background: "#1e2f42",
              color: "#94a3b8",
              border: "1px solid #253347",
            }}
          >
            {t("common:actions.cancel")}
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
            {t("common:actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Label chip button ── */
function LabelChip({ label, selected, onClick }) {
  const getLabelTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case "OBJECT":
        return "#8b5cf6";
      case "CLASSIFICATION":
        return "#10b981";
      case "SEGMENTATION":
        return "#f59e0b";
      case "DETECTION":
        return "#06b6d4";
      default:
        return "#6b7280";
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="flex flex-col items-start gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        background: selected ? `${label.color}22` : "#182233",
        border: selected ? `1.5px solid ${label.color}` : "1.5px solid #253347",
        color: selected ? label.color : "#94a3b8",
      }}
    >
      <div className="flex items-center gap-1.5 w-full">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: label.color }}
        />
        <span className="font-medium">{label.name}</span>
        {selected && (
          <span
            className="material-symbols-outlined ml-auto"
            style={{ fontSize: 12 }}
          >
            check
          </span>
        )}
      </div>
      {label.type && (
        <div className="flex items-center gap-1 ml-4">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
            style={{
              backgroundColor: `${getLabelTypeColor(label.type)}20`,
              color: getLabelTypeColor(label.type),
            }}
          >
            {label.type}
          </span>
        </div>
      )}
    </button>
  );
}
