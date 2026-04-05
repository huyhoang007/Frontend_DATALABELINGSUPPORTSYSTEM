import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";
import { translate } from "../i18n/helpers";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastObj {
    message?: string;
    type?: ToastType;
}

interface ToastContextValue {
    addToast: (messageOrObj: string | ToastObj, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const addToast = React.useCallback((messageOrObj: string | ToastObj, type: ToastType = "info") => {
        let msg: string;
        let t: ToastType = type;
        if (messageOrObj && typeof messageOrObj === "object") {
            msg = messageOrObj.message || String(messageOrObj);
            t = messageOrObj.type || type;
        } else {
            msg = messageOrObj as string;
        }
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message: msg, type: t }]);

        const duration = (t === "error" || t === "warning") ? 5000 : 3000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {createPortal(
                <div className="fixed top-6 right-6 z-[9999] flex flex-col space-y-3 pointer-events-none">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={cn(
                                "pointer-events-auto flex items-center gap-3 w-full max-w-md px-5 py-4 rounded-xl shadow-2xl border-2 animate-in slide-in-from-right-full duration-300 backdrop-blur-sm",
                                toast.type === "success" && "bg-emerald-500/95 border-emerald-400/50 text-white",
                                toast.type === "error" && "bg-red-500/95 border-red-400/50 text-white",
                                toast.type === "warning" && "bg-amber-500/95 border-amber-400/50 text-white",
                                toast.type === "info" && "bg-blue-500/95 border-blue-400/50 text-white",
                            )}
                        >
                            <span className="material-symbols-outlined text-[24px] font-bold">
                                {toast.type === "success" && "check_circle"}
                                {toast.type === "error" && "error"}
                                {toast.type === "warning" && "warning"}
                                {toast.type === "info" && "info"}
                            </span>
                            <p className="text-base font-semibold flex-1">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-2 hover:bg-white/20 rounded-lg p-1 transition-colors"
                                title={translate("common:toast.close")}
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
