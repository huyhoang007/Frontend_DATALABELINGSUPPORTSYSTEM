import * as React from "react";

import { cn } from "../../utils/cn";

// We need to install class-variance-authority for cleaner component variants
// Running: npm install class-variance-authority
// But for now I will implement manually or assume user allows me to add it. 
// Actually, it's better to stick to the plan. I didn't install CVA. 
// I'll implementation Button without CVA first to minimize deps, or I can add it.
// Given "utilitarian" instructions, I'll stick to simple logical implementation or CVA if I added it.
// I did NOT add CVA in the install command. I will use standard props.

const Button = React.forwardRef(
    ({ className, variant = "primary", size = "base", isLoading, leftIcon, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-md text-body font-bold uppercase tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            // Primary: Soft Indigo, standard for main actions
            primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
            // Secondary: Outline/Ghost hybrid for secondary actions
            secondary: "bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground shadow-sm",
            // Ghost: Text-only for tertiary
            ghost: "hover:bg-accent hover:text-accent-foreground",
            // Destructive: Soft Red, reserved for errors/deletes
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
            // Link: For text links
            link: "text-primary underline-offset-4 hover:underline",
        };

        // Size isn't explicitly defined in Button specs apart from padding
        // designSystem.json: Button base: radius md (8px), text uppercase bold.
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
