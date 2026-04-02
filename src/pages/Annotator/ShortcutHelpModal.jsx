import * as React from "react";
import { useTranslation } from "react-i18next";

function Kbd({ children }) {
  return (
    <kbd className="inline-flex min-w-[26px] items-center justify-center rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-blue-300 shadow-[0_1px_0_#0d1a2a]">
      {children}
    </kbd>
  );
}

export default function ShortcutHelpModal({ onClose }) {
  const { t } = useTranslation();
  const shortcutGroups = t("annotator:workspace.shortcutHelp.groups", {
    returnObjects: true,
  });
  const groups = Array.isArray(shortcutGroups) ? shortcutGroups : [];

  React.useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-[480px] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 px-7 py-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="m-0 text-[15px] font-bold tracking-[0.01em] text-slate-200">
            ⌨ {t("annotator:workspace.shortcutHelp.title")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-lg leading-none text-slate-500 transition hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                {group.title}
              </div>
              <div className="flex flex-col gap-1.5">
                {group.rows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-slate-400">{row.desc}</span>
                    <div className="flex items-center gap-1">
                      {row.keys.map((k, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && (
                            <span className="text-[11px] text-slate-600">+</span>
                          )}
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

        <p className="mt-5 text-center text-[11px] text-slate-600">
          {t("annotator:workspace.shortcutHelp.closeHint.prefix")} <Kbd>Esc</Kbd>{" "}
          {t("annotator:workspace.shortcutHelp.closeHint.suffix")}
        </p>
      </div>
    </div>
  );
}
