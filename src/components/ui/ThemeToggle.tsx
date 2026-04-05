import * as React from "react";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../utils/cn";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "fixed top-4 right-20 z-50 p-2 rounded-full transition-all duration-300 shadow-lg border",
                theme === "dark"
                    ? "bg-card text-yellow-400 border-border hover:bg-muted"
                    : "bg-white text-orange-500 border-border hover:bg-muted"
            )}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            <span className="material-symbols-outlined text-[20px] block">
                {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
        </button>
    );
}
