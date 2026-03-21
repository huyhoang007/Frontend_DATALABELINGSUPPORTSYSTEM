import * as React from "react";
import { ModalDialog } from "../ui/Modal";
import { Button } from "../ui/Button";

export function PolicyForm({ isOpen, onClose, onSubmit, initialData }) {
    const isEditMode = !!initialData;

    // Initial State
    const [formData, setFormData] = React.useState({
        errorName: "",
        errorLevel: "LOW",
        description: "",
        status: "ACTIVE"
    });

    const [errors, setErrors] = React.useState({});

    // Reset or Load Data on Open
    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    errorName: initialData.errorName,
                    errorLevel: initialData.errorLevel,
                    description: initialData.description,
                    status: initialData.status
                });
            } else {
                setFormData({
                    errorName: "",
                    errorLevel: "LOW",
                    description: "",
                    status: "ACTIVE"
                });
            }
            setErrors({});
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (checked ? "ACTIVE" : "INACTIVE") : value
        }));

        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.errorName.trim()) newErrors.errorName = "Tên lỗi là bắt buộc";
        if (!formData.description.trim()) newErrors.description = "Mô tả là bắt buộc";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit(formData);
    };

    return (
        <ModalDialog
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "Chỉnh sửa chính sách" : "Tạo chính sách mới"}
            actions={
                <>
                    <Button variant="secondary" onClick={onClose}>Hủy</Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {isEditMode ? "Cập nhật" : "Tạo"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Error Name */}
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tên lỗi</label>
                    <input
                        name="errorName"
                        value={formData.errorName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-annotator-primary"
                        placeholder="VD: Bounding Box quá lỏng"
                    />
                    {errors.errorName && <p className="text-[10px] text-red-500">{errors.errorName}</p>}
                </div>

                {/* Error Level */}
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mức độ</label>
                    <select
                        name="errorLevel"
                        value={formData.errorLevel}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-annotator-primary appearance-none"
                    >
                        <option value="LOW">Thấp</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HIGH">Cao</option>
                    </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mô tả</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-annotator-primary min-h-[100px]"
                        placeholder="Mô tả quy tắc gán nhãn..."
                    />
                    {errors.description && <p className="text-[10px] text-red-500">{errors.description}</p>}
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="status"
                            checked={formData.status === "ACTIVE"}
                            onChange={handleChange}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                    <span className="text-sm font-medium text-foreground">
                        {formData.status === "ACTIVE" ? "Đang hoạt động" : "Không hoạt động"}
                    </span>
                </div>
            </div>
        </ModalDialog>
    );
}
