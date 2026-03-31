import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { labelApi } from "../../api/labelApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const LABEL_TYPES = ["CLASSIFICATION", "DETECTION", "SEGMENTATION"];
const PRESET_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
  "#06B6D4",
];

export default function CreateLabel() {
  const { t } = useTranslation(["manager", "common"]);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    labelName: "",
    colorCode: "#3B82F6",
    labelType: "CLASSIFICATION",
    description: "",
    shortcutKey: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.labelName.trim()) e.labelName = t("manager:labels.form.validation.nameRequired");
    else if (form.labelName.length > 50) e.labelName = t("manager:labels.form.validation.nameTooLong");
    if (!/^#[0-9A-Fa-f]{6}$/.test(form.colorCode))
      e.colorCode = t("manager:labels.form.validation.colorInvalid");
    if (!form.labelType) e.labelType = t("manager:labels.form.validation.typeRequired");
    if (form.description.length > 200) e.description = t("manager:labels.form.validation.descriptionTooLong");
    if (form.shortcutKey && form.shortcutKey.length > 20)
      e.shortcutKey = t("manager:labels.form.validation.shortcutTooLong");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError("");
    try {
      await labelApi.createLabel({
        labelName: form.labelName.trim(),
        colorCode: form.colorCode,
        labelType: form.labelType,
        description: form.description.trim() || null,
        shortcutKey: form.shortcutKey.trim() || null,
      });
      navigate("/manager/labels");
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.message || "";
      const msg =
        typeof raw === "string" && raw.toLowerCase().includes("already exist")
          ? t("manager:labels.form.validation.duplicate")
          : raw || t("manager:labels.form.validation.createFailed");
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/manager/labels")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground">{t("manager:labels.form.title")}</h1>
      </div>

      {apiError && <p className="text-sm text-destructive">{apiError}</p>}

      <Card className="p-6 space-y-5">
        {/* Label Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("manager:labels.form.name")} <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder={t("manager:labels.form.placeholders.name")}
            value={form.labelName}
            onChange={(e) => set("labelName", e.target.value)}
            maxLength={50}
          />
          {errors.labelName && (
            <p className="text-xs text-destructive mt-1">{errors.labelName}</p>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("manager:labels.form.color")} <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.colorCode === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => set("colorCode", c)}
                />
              ))}
            </div>
            <Input
              type="text"
              value={form.colorCode}
              onChange={(e) => set("colorCode", e.target.value)}
              className="w-28 font-mono text-sm"
              maxLength={7}
            />
            <div
              className="w-8 h-8 rounded border border-border"
              style={{ backgroundColor: form.colorCode }}
            />
          </div>
          {errors.colorCode && (
            <p className="text-xs text-destructive mt-1">{errors.colorCode}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("manager:labels.form.type")} <span className="text-destructive">*</span>
          </label>
          <select
            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.labelType}
            onChange={(e) => set("labelType", e.target.value)}
          >
            {LABEL_TYPES.map((labelType) => (
              <option key={labelType} value={labelType}>
                {t(`manager:labels.types.${labelType}`, { defaultValue: labelType })}
              </option>
            ))}
          </select>
          {errors.labelType && (
            <p className="text-xs text-destructive mt-1">{errors.labelType}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("manager:labels.form.description")}
          </label>
          <textarea
            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={3}
            placeholder={t("manager:labels.form.placeholders.description")}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">
            {form.description.length}/200
          </p>
          {errors.description && (
            <p className="text-xs text-destructive mt-1">
              {errors.description}
            </p>
          )}
        </div>

        {/* Shortcut Key */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("manager:labels.form.shortcut")}{" "}
            <span className="text-muted-foreground font-normal">
              {t("manager:labels.form.shortcutOptional")}
            </span>
          </label>
          <Input
            placeholder={t("manager:labels.form.placeholders.shortcut")}
            value={form.shortcutKey}
            onChange={(e) => set("shortcutKey", e.target.value.slice(0, 20))}
            className="w-48"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("manager:labels.form.shortcutHint")}
          </p>
          {errors.shortcutKey && (
            <p className="text-xs text-destructive mt-1">
              {errors.shortcutKey}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <Button variant="secondary" onClick={handleSave} isLoading={saving}>
            {t("manager:labels.form.save")}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/manager/labels")}>
            {t("common:actions.cancel")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
