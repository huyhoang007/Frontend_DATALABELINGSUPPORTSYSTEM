import * as React from "react";
import { useTranslation } from "react-i18next";
import { SOURCE_FILES } from "../../utils/sourceMeta";

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
  const [viewMode, setViewMode] = React.useState(null);

  const isSearching = search.trim().length > 0;

  React.useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.length > 0 && initialSelectedIds.length === prev.length) {
        return prev;
      }
      return initialSelectedIds;
    });
  }, [initialSelectedIds?.join(",")]);

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

  const allLabelsFlat = React.useMemo(
    () => labelGroups.flatMap((g) => g.labels),
    [labelGroups],
  );

  const searchLabelsFlat = React.useMemo(() => {
    if (!isSearching) return [];
    const q = search.toLowerCase();
    return allLabelsFlat.filter((l) => l.name.toLowerCase().includes(q));
  }, [search, allLabelsFlat, isSearching]);

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
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [id],
    );
  };

  const handleSave = () => {
    if (selectedIds.length === 0) return;
    onSave(selectedIds);
  };

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55"
      data-source-file={SOURCE_FILES.annotatorLabelModal}
      data-source-label="section:annotator-label-selection-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        className="flex max-h-[500px] w-[560px] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-700 px-4 pb-3 pt-4">
          <p className="mb-2.5 text-[13px] font-semibold text-slate-200">
            {t("annotator:workspace.modal.selectLabel")}
          </p>

          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-500">
              search
            </span>
            <input
              type="text"
              placeholder={t("annotator:workspace.modal.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 pl-8 pr-8 text-xs text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() =>
                setViewMode((prev) => (prev === "labels" ? null : "labels"))
              }
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                viewMode === "labels"
                  ? "bg-emerald-500 text-white"
                  : "border border-slate-700 bg-slate-900 text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-sm">label</span>
              {t("annotator:workspace.modal.labels", {
                count: allLabelsFlat.length,
              })}
            </button>
            <button
              onClick={() =>
                setViewMode((prev) => (prev === "rules" ? null : "rules"))
              }
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                viewMode === "rules"
                  ? "bg-emerald-500 text-white"
                  : "border border-slate-700 bg-slate-900 text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-sm">rule</span>
              {t("annotator:workspace.modal.labelRules", {
                count: labelGroups.length,
              })}
            </button>
          </div>
        </div>

        {(viewMode !== null || isSearching) && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto p-3">
              {isSearching && viewMode === null
                ? (() => {
                    const hasLabels = searchLabelsFlat.length > 0;
                    const hasRules = searchRuleGroups.length > 0;
                    if (!hasLabels && !hasRules) {
                      return (
                        <p className="py-8 text-center text-xs text-slate-500">
                          {t("annotator:workspace.modal.noResults")}
                        </p>
                      );
                    }
                    return (
                      <>
                        {hasLabels && (
                          <div>
                            <div className="mb-2 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[13px] text-slate-500">
                                label
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">
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

                        {hasRules && (
                          <div>
                            <div className="mb-2 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[13px] text-slate-500">
                                rule
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">
                                {t("annotator:workspace.modal.labelRules", {
                                  count: searchRuleGroups.length,
                                })}
                              </span>
                            </div>
                            {searchRuleGroups.map((g) => (
                              <RuleGroup
                                key={g.ruleId ?? g.ruleName}
                                group={g}
                                selectedIds={selectedIds}
                                toggle={toggle}
                                t={t}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()
                : viewMode === "labels"
                  ? (() => {
                      const displayLabels = isSearching
                        ? searchLabelsFlat
                        : allLabelsFlat;
                      if (displayLabels.length === 0) {
                        return (
                          <p className="py-8 text-center text-xs text-slate-500">
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
                    ? (() => {
                        const displayGroups = isSearching
                          ? searchRuleGroups
                          : labelGroups;
                        if (displayGroups.length === 0) {
                          return (
                            <p className="py-8 text-center text-xs text-slate-500">
                              {t("annotator:workspace.modal.noRuleResults")}
                            </p>
                          );
                        }
                        return displayGroups.map((g) => (
                          <RuleGroup
                            key={g.ruleId ?? g.ruleName}
                            group={g}
                            selectedIds={selectedIds}
                            toggle={toggle}
                            t={t}
                          />
                        ));
                      })()
                    : null}
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3 border-t border-slate-700 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap gap-1 overflow-hidden">
            <span className="w-full text-[10px] text-slate-500">
              {t("annotator:workspace.modal.singleSelect")}
            </span>
            {selectedNames.length === 0 ? (
              <span className="text-[11px] text-slate-500">
                {t("annotator:workspace.modal.noSelectedLabel")}
              </span>
            ) : (
              selectedNames.map((name, i) => (
                <span
                  key={i}
                  className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
                >
                  {name}
                </span>
              ))
            )}
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
          >
            {t("common:actions.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={selectedIds.length === 0}
            className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              selectedIds.length > 0
                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                : "cursor-not-allowed bg-emerald-950 text-emerald-800"
            }`}
          >
            {t("common:actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleGroup({ group, selectedIds, toggle, t }) {
  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
      <div
        className={`flex items-center gap-2 px-3 py-2 ${
          group.labels?.length > 0 ? "border-b border-slate-700" : ""
        }`}
      >
        <span className="material-symbols-outlined text-sm text-emerald-400">
          rule
        </span>
        <span className="text-xs font-bold text-slate-200">{group.ruleName}</span>
        <span className="ml-auto rounded-full bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-500">
          {t("annotator:workspace.modal.ruleItemCount", {
            count: group.labels?.length || 0,
          })}
        </span>
      </div>

      {group.labels?.length > 0 ? (
        <div className="flex flex-wrap gap-2 p-3">
          {group.labels.map((label) => (
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
          <p className="text-[10px] text-slate-600">
            {t("annotator:workspace.modal.ruleEmpty")}
          </p>
        </div>
      )}
    </div>
  );
}

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
      className="flex flex-col items-start gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition"
      style={{
        background: selected ? `${label.color}22` : "#182233",
        border: selected ? `1.5px solid ${label.color}` : "1.5px solid #253347",
        color: selected ? label.color : "#94a3b8",
      }}
    >
      <div className="flex w-full items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: label.color }}
        />
        <span className="font-medium">{label.name}</span>
        {selected && (
          <span className="material-symbols-outlined ml-auto text-[12px]">
            check
          </span>
        )}
      </div>
      {label.type && (
        <div className="ml-4 flex items-center gap-1">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
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
