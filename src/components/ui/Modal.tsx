import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

interface ModalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children?: React.ReactNode;
    actions?: React.ReactNode;
}

export function ModalDialog({ isOpen, onClose, title, children, actions }: ModalDialogProps) {
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={cn(
                    "w-full max-w-md rounded-lg border border-border bg-card shadow-xl transition-all",
                    "animate-in zoom-in-95 duration-200"
                )}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-h3 text-foreground">{title}</h3>
                    <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="px-6 py-4 text-body text-muted-foreground">
                    {children}
                </div>

                <div className="flex justify-end space-x-3 rounded-b-lg border-t border-border bg-muted/50 px-6 py-4">
                    {actions}
                </div>
            </div>
        </div>,
        document.body
    );
}

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: React.ReactNode;
    message?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    isDestructive = false,
}: ConfirmDialogProps) {
    return (
        <ModalDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            actions={
                <>
                    <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
                    <Button variant={isDestructive ? "destructive" : "primary"} onClick={onConfirm}>{confirmText}</Button>
                </>
            }
        >
            <p>{message}</p>
        </ModalDialog>
    );
}
