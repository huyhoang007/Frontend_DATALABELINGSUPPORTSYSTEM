import * as React from "react";
import { cn } from "../../utils/cn";


const statusConfig = {
    TODO: { color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700", dot: "bg-slate-400" },
    IN_PROGRESS: { color: "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-500 border-amber-200 dark:border-amber-900/50", dot: "bg-amber-500 animate-pulse" },
    SUBMITTED: { color: "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-900/50", dot: "bg-blue-500" },
    REJECTED: { color: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900/50", icon: "error" },
    APPROVED: { color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50", dot: "bg-emerald-500" },
};

export function BadgeStatus({ status }) {
    const config = statusConfig[status] || statusConfig.TODO;

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
            {status.replace("_", " ")}
        </span>
    );
}
