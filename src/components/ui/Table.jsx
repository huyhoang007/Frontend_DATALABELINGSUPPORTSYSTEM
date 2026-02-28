import * as React from "react";
import { cn } from "../../utils/cn";

// designSystem.json:
// Table:
// - header: micro, uppercase, tracking-wide, weight 800, bg subtle_surface
// - row: body size, hover enabled (subtle_bg, optional_left_border_accent)
// - dense: true

export function Table({ children, className }) {
    return (
        <div className={cn("w-full overflow-auto", className)}>
            <table className="w-full caption-bottom text-sm text-left">
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ children }) {
    return (
        <thead className="border-b border-border bg-muted/50">
            {children}
        </thead>
    );
}

export function TableBody({ children }) {
    return (
        <tbody className="divide-y divide-border">
            {children}
        </tbody>
    );
}

export function TableRow({ children, className, onClick }) {
    return (
        <tr
            className={cn(
                "transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                onClick && "cursor-pointer active:scale-[0.99]",
                className
            )}
            onClick={onClick}
        >
            {children}
        </tr>
    );
}

export function TableHead({ children, className }) {
    return (
        <th className={cn(
            "h-10 px-4 text-left align-middle font-semibold text-[10px] uppercase tracking-wider text-muted-foreground select-none",
            className
        )}>
            {children}
        </th>
    );
}

export function TableCell({ children, className }) {
    return (
        <td className={cn(
            "px-4 py-3 align-middle text-sm text-foreground",
            className
        )}>
            {children}
        </td>
    );
}
