import * as React from "react";
import { Button } from "../ui/Button"; // Adjust path if needed imports might vary
import { cn } from "../../utils/cn"; // Adjust path

/**
 * Renders the list of policies
 */
export function PolicyTable({ policies, onEdit, onToggleStatus }) {
    if (policies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-lg border border-dashed border-border">
                <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">policy</span>
                <p className="text-muted-foreground">Chưa có policy nào</p>
            </div>
        );
    }

    const getLevelBadge = (level) => {
        const styles = {
            LOW: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
            MEDIUM: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
            HIGH: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        };
        return (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider", styles[level] || styles.LOW)}>
                {level}
            </span>
        );
    };

    return (
        <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                    <tr>
                        <th className="px-4 py-3">Tên lỗi</th>
                        <th className="px-4 py-3 w-32">Mức độ</th>
                        <th className="px-4 py-3 w-32">Trạng thái</th>
                        <th className="px-4 py-3 w-40">Cập nhật lần cuối</th>
                        <th className="px-4 py-3 w-20 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {policies.map((policy) => (
                        <tr key={policy.policyId} className="hover:bg-muted/50 transition-colors group">
                            <td className="px-4 py-3">
                                <div className="font-medium text-foreground">{policy.errorName}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1" title={policy.description}>
                                    {policy.description}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                {getLevelBadge(policy.errorLevel)}
                            </td>
                            <td className="px-4 py-3">
                                <button
                                    onClick={() => onToggleStatus(policy)}
                                    className={cn(
                                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-annotator-primary focus:ring-offset-2 focus:ring-offset-background",
                                        policy.status === "ACTIVE" ? "bg-green-500" : "bg-muted-foreground/30"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ease-out shadow-sm",
                                            policy.status === "ACTIVE" ? "translate-x-4.5" : "translate-x-0.5"
                                        )}
                                    />
                                </button>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                                {new Date(policy.updatedAt || policy.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => onEdit(policy)}
                                    className="p-1.5 text-muted-foreground hover:text-annotator-primary hover:bg-annotator-primary/10 rounded-md transition-all"
                                    title="Chỉnh sửa chính sách"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
