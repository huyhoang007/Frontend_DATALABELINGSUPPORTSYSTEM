import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { policiesAPI } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SOURCE_FILES } from "../../utils/sourceMeta";

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function CreateErrorType() {
    const { t } = useTranslation(["manager", "common"]);
    const navigate = useNavigate();
    const [form, setForm] = useState({
        errorName: "",
        errorLevel: "MEDIUM",
        description: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const set = (key: string, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.errorName.trim()) e.errorName = t("manager:errorTypes.form.validation.nameRequired");
        else if (form.errorName.length > 100) e.errorName = t("manager:errorTypes.form.validation.nameTooLong");
        if (form.description.length > 300) e.description = t("manager:errorTypes.form.validation.descriptionTooLong");
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await policiesAPI.create({
                errorName: form.errorName.trim(),
                errorLevel: form.errorLevel,
                description: form.description.trim(),
            });
            navigate("/manager/error-types");
        } catch (err: any) {
            console.error("Failed to create policy:", err);
            const raw = err?.response?.data?.message || err?.response?.data || err?.message || t("manager:errorTypes.form.validation.createFailed");
            const msg = typeof raw === "string" ? raw : t("manager:errorTypes.form.validation.createFailed");
            const translated = msg.toLowerCase().includes("already exist")
                ? t("manager:errorTypes.form.validation.duplicate")
                : msg;
            setErrors({ errorName: translated });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="p-8 space-y-6 max-w-2xl"
            data-source-file={SOURCE_FILES.managerCreateErrorType}
            data-source-label="Manager create error type page"
        >
            <div className="flex items-center gap-3">
                <button onClick={() => navigate("/manager/error-types")} className="text-muted-foreground hover:text-foreground transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-2xl font-bold text-foreground">{t("manager:errorTypes.form.title")}</h1>
            </div>

            <Card className="p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("manager:errorTypes.form.name")} <span className="text-destructive">*</span></label>
                    <Input placeholder={t("manager:errorTypes.form.placeholders.name")} value={form.errorName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("errorName", e.target.value)} maxLength={100} />
                    {errors.errorName && <p className="text-xs text-destructive mt-1">{errors.errorName}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("manager:errorTypes.form.severity")}</label>
                    <select
                        className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={form.errorLevel}
                        onChange={(e) => set("errorLevel", e.target.value)}
                    >
                        {SEVERITIES.map((s) => <option key={s} value={s}>{t(`manager:errorTypes.severity.${s}`, { defaultValue: s })}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("manager:errorTypes.form.description")}</label>
                    <textarea
                        className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        rows={3}
                        placeholder={t("manager:errorTypes.form.placeholders.description")}
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        maxLength={300}
                    />
                    {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Button variant="secondary" onClick={handleSave} disabled={saving}>
                        {saving ? t("common:states.saving") : t("common:actions.save")}
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/manager/error-types")}>{t("common:actions.cancel")}</Button>
                </div>
            </Card>
        </div>
    );
}
