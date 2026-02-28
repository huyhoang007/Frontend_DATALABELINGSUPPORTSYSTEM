import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

const ToastContext = React.createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);

    const addToast = React.useCallback((message, type = "info") => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        }
    }, []);

    const removeToast = React.useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={cn(
                                "pointer-events-auto flex items-center w-full max-w-xs px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-full duration-300",
                                toast.type === "success" && "bg-dark-surface-panel border-green-500/20 text-green-400",
                                toast.type === "error" && "bg-dark-surface-panel border-red-500/20 text-red-400",
                                toast.type === "info" && "bg-dark-surface-panel border-blue-500/20 text-blue-400",
                            )}
                        >
                            <span className="material-symbols-outlined mr-2 text-[20px]">
                                {toast.type === "success" && "check_circle"}
                                {toast.type === "error" && "error"}
                                {toast.type === "info" && "info"}
                            </span>
                            <p className="text-sm font-medium">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-auto text-dark-text-muted hover:text-dark-text-primary"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
