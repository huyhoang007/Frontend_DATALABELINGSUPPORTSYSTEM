import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { labelApi } from "../../api/labelApi";
import { useToast } from "../../context/ToastContext";

export default function AdminLabels() {
  const { t } = useTranslation(["admin", "common"]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { addToast } = useToast();

  // Form state - matches backend CreateLabelRequest DTO
  const [newLabel, setNewLabel] = useState({
    labelName: "",
    colorCode: "#3b82f6",
    labelType: "OBJECT",
    description: "",
    shortcutKey: "",
  });

  // Fetch labels on mount
  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    setIsLoading(true);
    try {
      const data = await labelApi.getAllLabels();
      setLabels(data || []);
    } catch (error) {
      console.error("Failed to fetch labels:", error);
      // Don't show error toast if it's just empty
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabel.labelName || !newLabel.colorCode || !newLabel.labelType) {
      addToast(t("admin:labels.required"), "error");
      return;
    }

    setIsCreating(true);
    try {
      await labelApi.createLabel({
        labelName: newLabel.labelName,
        colorCode: newLabel.colorCode,
        labelType: newLabel.labelType,
        description: newLabel.description || null,
        shortcutKey: newLabel.shortcutKey || null,
      });
      addToast(t("admin:labels.createSuccess"), "success");
      setShowCreateModal(false);
      setNewLabel({
        labelName: "",
        colorCode: "#3b82f6",
        labelType: "OBJECT",
        description: "",
        shortcutKey: "",
      });
      fetchLabels(); // Refresh list
    } catch (error) {
      const raw = error?.response?.data?.message || error?.message || "";
      const msg =
        typeof raw === "string" && raw.toLowerCase().includes("already exist")
          ? t("admin:labels.duplicate")
          : raw || t("admin:labels.createFailed");
      addToast(msg, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const getLabelTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case "OBJECT":
        return "#8b5cf6";
      case "CLASSIFICATION":
        return "#10b981";
      case "SEGMENTATION":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getLabelTypeLabel = (type) => {
    const normalized = String(type || "").toUpperCase();
    if (normalized === "OBJECT") return t("admin:labels.types.object");
    if (normalized === "CLASSIFICATION")
      return t("admin:labels.types.classification");
    if (normalized === "SEGMENTATION")
      return t("admin:labels.types.segmentation");
    return type || t("common:labels.unknown");
  };

  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t("admin:labels.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("admin:labels.subtitle")}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {t("admin:labels.create")}
            </button>
          </div>

          {/* Labels List */}
          <div className="bg-card border border-border rounded-lg p-6">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="text-4xl mb-4 animate-spin">...</div>
                <p>{t("admin:labels.loading")}</p>
              </div>
            ) : labels.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="text-6xl mb-4">L</div>
                <p className="text-lg font-medium mb-2">{t("admin:labels.empty")}</p>
                <p className="text-sm">{t("admin:labels.emptyHint")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {labels.map((label) => (
                  <div
                    key={label.labelId || label.id}
                    className="bg-background border border-border rounded-lg p-4 hover:border-blue-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{
                          backgroundColor: label.colorCode || "#3b82f6",
                        }}
                      >
                        {label.shortcutKey ||
                          label.labelName?.[0]?.toUpperCase() ||
                          "L"}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {label.labelName}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${getLabelTypeColor(label.labelType)}20`,
                              color: getLabelTypeColor(label.labelType),
                            }}
                          >
                            {getLabelTypeLabel(label.labelType)}
                          </span>
                          {label.isActive !== false && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {t("admin:labels.active")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {label.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {label.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Label Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  {t("admin:labels.createTitle")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t("admin:labels.name")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLabel.labelName}
                      onChange={(e) =>
                        setNewLabel({ ...newLabel, labelName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      placeholder={t("admin:labels.placeholders.labelName")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t("admin:labels.color")} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newLabel.colorCode}
                        onChange={(e) =>
                          setNewLabel({
                            ...newLabel,
                            colorCode: e.target.value,
                          })
                        }
                        className="w-12 h-10 bg-background border border-border rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newLabel.colorCode}
                        onChange={(e) =>
                          setNewLabel({
                            ...newLabel,
                            colorCode: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono"
                        placeholder={t("admin:labels.placeholders.color")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t("admin:labels.type")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newLabel.labelType}
                      onChange={(e) =>
                        setNewLabel({ ...newLabel, labelType: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    >
                      <option value="OBJECT">{t("admin:labels.types.object")}</option>
                      <option value="CLASSIFICATION">{t("admin:labels.types.classification")}</option>
                      <option value="SEGMENTATION">{t("admin:labels.types.segmentation")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t("admin:labels.shortcut")}
                    </label>
                    <input
                      type="text"
                      value={newLabel.shortcutKey}
                      onChange={(e) =>
                        setNewLabel({
                          ...newLabel,
                          shortcutKey: e.target.value.slice(0, 20),
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      placeholder={t("admin:labels.placeholders.shortcut")}
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t("admin:labels.description")}
                    </label>
                    <textarea
                      value={newLabel.description}
                      onChange={(e) =>
                        setNewLabel({
                          ...newLabel,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground resize-none"
                      placeholder={t("admin:labels.placeholders.description")}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                    disabled={isCreating}
                  >
                    {t("common:actions.cancel")}
                  </button>
                  <button
                    onClick={handleCreateLabel}
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors"
                  >
                    {isCreating ? t("common:states.creating") : t("common:actions.create")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
