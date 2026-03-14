import * as React from "react";

const ThemeContext = React.createContext({
    theme: "light",
    toggleTheme: () => { },
});

export function ThemeProvider({ children }) {
    // Always light mode
    const theme = "light";

    // Remove dark class on mount and keep it removed
    React.useLayoutEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }, []);

    const toggleTheme = () => { }; // no-op

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
