import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addMockItem } from "../../utils/mockStorage";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// TODO_BACKEND: Replace with real API when available

const STORAGE_KEY = "mock_error_types";
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function CreateErrorType() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        code: "",
        severity: "MEDIUM",
        description: "",
        isActive: true,
    });
    const [errors, setErrors] = useState({});

    const set = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Tên loại lỗi là bắt buộc";
        else if (form.name.length > 100) e.name = "Tối đa 100 ký tự";
        if (form.code && form.code.length > 50) e.code = "Tối đa 50 ký tự";
        if (form.description.length > 300) e.description = "Tối đa 300 ký tự";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        addMockItem(STORAGE_KEY, {
            name: form.name.trim(),
            code: form.code.trim().toUpperCase() || form.name.trim().toUpperCase().replace(/\s+/g, "_"),
            severity: form.severity,
            description: form.description.trim(),
            isActive: form.isActive,
        });
        navigate("/manager/error-types");
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
                    <Input placeholder="VD: Missing Label" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Mã (Code)</label>
                    <Input placeholder="VD: MISSING_LABEL (tự sinh nếu trống)" value={form.code} onChange={(e) => set("code", e.target.value)} maxLength={50} className="font-mono" />
                    {errors.code && <p className="text-xs text-destructive mt-1">{errors.code}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Severity</label>
                    <select
                        className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={form.severity}
                        onChange={(e) => set("severity", e.target.value)}
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

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={form.isActive}
                        onChange={(e) => set("isActive", e.target.checked)}
                        className="rounded border-border"
                    />
                    <label htmlFor="isActive" className="text-sm text-foreground">Active</label>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Button variant="secondary" onClick={handleSave}>Lưu</Button>
                    <Button variant="ghost" onClick={() => navigate("/manager/error-types")}>Hủy</Button>
                </div>
            </Card>
        </div>
    );
}
