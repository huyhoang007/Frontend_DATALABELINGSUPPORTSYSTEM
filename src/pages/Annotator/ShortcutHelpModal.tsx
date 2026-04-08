import * as React from "react";
import { useTranslation } from "react-i18next";
import { SOURCE_FILES } from "../../utils/sourceMeta";

function Kbd({ children }) {
    return (
        <kbd className="inline-flex items-center justify-center min-w-[26px] px-1.5 py-0.5 bg-[#1e2f42] border border-[#2e4460] rounded text-[11px] font-mono text-blue-300 font-bold shadow-[0_1px_0_#0d1a2a]">
            {children}
        </kbd>
    );
}

export default function ShortcutHelpModal({ onClose }) {
    const { t } = useTranslation();
    const shortcutGroups = t("annotator:workspace.shortcutHelp.groups", { returnObjects: true });
    const groups = Array.isArray(shortcutGroups) ? shortcutGroups : [];

    React.useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center backdrop-blur-sm"
            data-source-file={SOURCE_FILES.annotatorShortcutModal}
      data-source-label="section:annotator-shortcut-help-modal"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#111d2c] border border-[#253347] rounded-xl px-7 py-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="m-0 text-[15px] font-bold text-slate-200 tracking-[0.01em]">
                        ⌨ {t("annotator:workspace.shortcutHelp.title")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none cursor-pointer text-slate-500 text-lg leading-none p-1 hover:text-slate-300 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Groups */}
                <div className="flex flex-col gap-5">
                    {groups.map((group) => (
                        <div key={group.title}>
                            <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-teal-400 mb-2">
                                {group.title}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {group.rows.map((row, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-[13px] text-slate-400">{row.desc}</span>
                                        <div className="flex items-center gap-1">
                                            {row.keys.map((k, j) => (
                                                <React.Fragment key={j}>
                                                    {j > 0 && <span className="text-[#3a5068] text-[11px]">+</span>}
                                                    <Kbd>{k}</Kbd>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-5 text-[11px] text-[#3a5068] text-center">
                    {t("annotator:workspace.shortcutHelp.closeHint.prefix")} <Kbd>Esc</Kbd>{" "}
                    {t("annotator:workspace.shortcutHelp.closeHint.suffix")}
                </p>
            </div>
        </div>
    );
}
