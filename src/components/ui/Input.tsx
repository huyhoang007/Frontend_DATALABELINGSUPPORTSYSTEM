import * as React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    leftIcon?: string;
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, leftIcon, error, ...props }, ref) => {
    return (
        <div className="w-full">
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <span className="material-symbols-outlined text-[20px]">{leftIcon}</span>
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        leftIcon && "pl-10",
                        error && "border-destructive focus-visible:ring-destructive",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
        </div>
    );
});
Input.displayName = "Input";

export { Input };
