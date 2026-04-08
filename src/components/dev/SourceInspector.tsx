import * as React from "react";
import { useLocation } from "react-router-dom";

type InspectState = {
  file: string;
  label?: string;
  x: number;
  y: number;
} | null;

export function SourceInspector() {
  const location = useLocation();
  const [inspectState, setInspectState] = React.useState<InspectState>(null);
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);
  const lastPointerRef = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      if (!isShiftPressed) {
        setInspectState(null);
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        setInspectState(null);
        return;
      }

      const region = target.closest<HTMLElement>("[data-source-file]");
      const file = region?.dataset.sourceFile;
      if (!file) {
        setInspectState(null);
        return;
      }

      setInspectState({
        file,
        label: region.dataset.sourceLabel,
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
      if (event.key !== "Shift") return;
      setIsShiftPressed(true);

      const point = lastPointerRef.current;
      if (!point) return;
      const target = document.elementFromPoint(point.x, point.y);
      if (!(target instanceof HTMLElement)) return;
      const region = target.closest<HTMLElement>("[data-source-file]");
      const file = region?.dataset.sourceFile;
      if (!file) return;
      setInspectState({
        file,
        label: region.dataset.sourceLabel,
        x: point.x,
        y: point.y,
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Shift") return;
      setIsShiftPressed(false);
      setInspectState(null);
    };

    const handleWindowBlur = () => {
      setIsShiftPressed(false);
      setInspectState(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseout", handlePointerOut);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
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
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-300">
        Source File
      </div>
      <div className="font-mono text-[11px] leading-5">{inspectState.file}</div>
      {inspectState.label && (
        <div className="mt-1 text-[11px] text-slate-300">{inspectState.label}</div>
      )}
    </div>
  );
}
