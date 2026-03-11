import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { policiesAPI } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function CreateErrorType() {
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
        if (!form.errorName.trim()) e.errorName = "Tên loại lỗi là bắt buộc";
        else if (form.errorName.length > 100) e.errorName = "Tối đa 100 ký tự";
        if (form.description.length > 300) e.description = "Tối đa 300 ký tự";
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
            const msg = err?.response?.data?.message || err?.response?.data || "Lỗi khi tạo loại lỗi";
            setErrors({ errorName: typeof msg === "string" ? msg : "Lỗi khi tạo loại lỗi" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate("/manager/error-types")} className="text-muted-foreground hover:text-foreground transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-2xl font-bold text-foreground">Thêm loại lỗi mới</h1>
            </div>

            <Card className="p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Tên loại lỗi <span className="text-destructive">*</span></label>
                    <Input placeholder="VD: Missing Label" value={form.errorName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("errorName", e.target.value)} maxLength={100} />
                    {errors.errorName && <p className="text-xs text-destructive mt-1">{errors.errorName}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Severity</label>
                    <select
                        className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={form.errorLevel}
                        onChange={(e) => set("errorLevel", e.target.value)}
                    >
                        {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Mô tả</label>
                    <textarea
                        className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        rows={3}
                        placeholder="Mô tả chi tiết..."
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        maxLength={300}
                    />
                    {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Button variant="secondary" onClick={handleSave} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/manager/error-types")}>Hủy</Button>
                </div>
            </Card>
        </div>
    );
}
