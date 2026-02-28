import * as React from "react";

const ThemeContext = React.createContext({
    theme: "dark",
    toggleTheme: () => { },
});

export function ThemeProvider({ children }) {
    // 1. Initialize state from localStorage or system preference
    const [theme, setTheme] = React.useState(() => {
        if (typeof window !== "undefined" && window.localStorage) {
            const savedTheme = window.localStorage.getItem("theme");
            if (savedTheme) {
                return savedTheme;
            }
            // Default to system preference if no saved theme
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }
        return "dark"; // Fallback
    });

    // 2. Sync with DOM and localStorage
    React.useLayoutEffect(() => {
        const root = window.document.documentElement;
        // "light" is default (no class), "dark" adds class
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        // Persist
        localStorage.setItem("theme", theme);
    }, [theme]);

    // 3. Toggle handler
    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook for easy consumption
export const useTheme = () => {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
