import * as React from "react";
import { cn } from "../../utils/cn";

export interface BadgeStatusProps {
    status: string;
}

const statusConfig: Record<string, { color: string; dot?: string; icon?: string }> = {
    TODO: { color: "text-slate-600 bg-slate-100 border-slate-200", dot: "bg-slate-400" },
    IN_PROGRESS: { color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500 animate-pulse" },
    SUBMITTED: { color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500" },
    REJECTED: { color: "text-red-700 bg-red-50 border-red-200", icon: "error" },
    APPROVED: { color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
};

const statusLabels: Record<string, string> = {
    TODO: "Cần làm",
    IN_PROGRESS: "Đang thực hiện",
    SUBMITTED: "Đã gửi",
    REJECTED: "Từ chối",
    APPROVED: "Đã duyệt",
};

export function BadgeStatus({ status }: BadgeStatusProps) {
    const config = statusConfig[status] || statusConfig.TODO;
    const label = statusLabels[status] || status.replace("_", " ");

    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wide",
            config.color
        )}>
            {config.dot && (
                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", config.dot)} />
            )}
            {config.icon && (
                <span className="material-symbols-outlined text-[12px] mr-1">error</span>
            )}
            {label}
        </span>
    );
}
