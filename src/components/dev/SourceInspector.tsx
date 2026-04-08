import * as React from "react";
import { useLocation } from "react-router-dom";

type InspectState = {
  file: string;
  label?: string;
  x: number;
  y: number;
} | null;

function formatSectionLabel(label?: string) {
  return `section:${label || "root"}`;
}

function getSourceRegion(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  const region = target.closest<HTMLElement>("[data-source-file]");
  const file = region?.dataset.sourceFile;
  if (!file) return null;
  return {
    file,
    label: region.dataset.sourceLabel,
  };
}

export function SourceInspector() {
  const location = useLocation();
  const [inspectState, setInspectState] = React.useState<InspectState>(null);
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);
  const [didCopy, setDidCopy] = React.useState(false);
  const lastPointerRef = React.useRef<{ x: number; y: number } | null>(null);
  const copyTimeoutRef = React.useRef<number | null>(null);
  const currentFileRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      const sourceRegion = getSourceRegion(event.target);
      currentFileRef.current = sourceRegion?.file ?? null;

      if (!isShiftPressed) {
        setInspectState(null);
        return;
      }

      if (!sourceRegion) {
        setInspectState(null);
        return;
      }

      setInspectState({
        file: sourceRegion.file,
        label: sourceRegion.label,
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handlePointerOut = (event: MouseEvent) => {
      if (!(event.relatedTarget instanceof HTMLElement)) {
        setInspectState(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        const fileToCopy = currentFileRef.current;
        const point = lastPointerRef.current;
        const sourceRegion = point
          ? getSourceRegion(document.elementFromPoint(point.x, point.y))
          : null;
        if (!fileToCopy || event.repeat) return;
        navigator.clipboard
          ?.writeText(
            [fileToCopy, formatSectionLabel(sourceRegion?.label)].join("\n"),
          )
          .catch(() => {});
        setDidCopy(true);
        if (copyTimeoutRef.current) {
          window.clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = window.setTimeout(() => {
          setDidCopy(false);
        }, 1200);
        return;
      }

      if (event.key !== "Shift") return;
      setIsShiftPressed(true);
      setDidCopy(false);

      const point = lastPointerRef.current;
      if (!point) return;
      const sourceRegion = getSourceRegion(document.elementFromPoint(point.x, point.y));
      if (!sourceRegion) return;
      currentFileRef.current = sourceRegion.file;
      setInspectState({
        file: sourceRegion.file,
        label: sourceRegion.label,
        x: point.x,
        y: point.y,
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Shift") return;
      setIsShiftPressed(false);
      setDidCopy(false);
      setInspectState(null);
    };

    const handleWindowBlur = () => {
      setIsShiftPressed(false);
      setDidCopy(false);
      currentFileRef.current = null;
      setInspectState(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseout", handlePointerOut);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseout", handlePointerOut);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isShiftPressed, location.pathname]);

  if (!inspectState || !isShiftPressed) return null;

  return (
    <div
      className="pointer-events-none fixed z-[10000] max-w-[360px] rounded-lg border border-sky-400/40 bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow-2xl shadow-slate-950/50 backdrop-blur-sm"
      style={{
        left: Math.min(inspectState.x + 14, window.innerWidth - 380),
        top: Math.min(inspectState.y + 18, window.innerHeight - 120),
      }}
    >
      <div className="font-mono text-[11px] leading-5">{inspectState.file}</div>
      <div className="mt-1 text-[11px] text-slate-300">
        {formatSectionLabel(inspectState.label)}
      </div>
      {didCopy && (
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
          Copied
        </div>
      )}
    </div>
  );
}
