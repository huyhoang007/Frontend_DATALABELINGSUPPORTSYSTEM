import * as React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "destructive" | "link";
    size?: "base" | "sm" | "icon";
    isLoading?: boolean;
    leftIcon?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "base", isLoading, leftIcon, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-md text-body font-bold uppercase tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
            secondary: "bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground shadow-sm",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
            link: "text-primary underline-offset-4 hover:underline",
        };

        const sizes = {
            base: "h-10 px-4 py-2",
            sm: "h-8 px-3 text-caption",
            icon: "h-10 w-10 p-0",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <span className="material-symbols-outlined animate-spin mr-2 text-[18px]">progress_activity</span>
                )}
                {!isLoading && leftIcon && (
                    <span className="material-symbols-outlined mr-2 text-[18px]">{leftIcon}</span>
                )}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
