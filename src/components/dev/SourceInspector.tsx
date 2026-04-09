import * as React from "react";
import { useLocation } from "react-router-dom";

type InspectState = {
  content: string;
  x: number;
  y: number;
} | null;

function formatSectionLabel(label?: string) {
  return label || "section:root";
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

function hasCustomShiftExplainer(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest<HTMLElement>("[data-shift-explainer='custom']"));
}

function getShiftContent(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest<HTMLElement>("[data-shift-content]")?.dataset.shiftContent ?? null;
}

export function SourceInspector() {
  const location = useLocation();
  const [inspectState, setInspectState] = React.useState<InspectState>(null);
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);
  const lastPointerRef = React.useRef<{ x: number; y: number } | null>(null);
  const currentFileRef = React.useRef<string | null>(null);
  const currentLabelRef = React.useRef<string | undefined>(undefined);
  const hasCustomExplainerRef = React.useRef(false);
  const currentShiftContentRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      const sourceRegion = getSourceRegion(event.target);
      currentFileRef.current = sourceRegion?.file ?? null;
      currentLabelRef.current = sourceRegion?.label;
      hasCustomExplainerRef.current = hasCustomShiftExplainer(event.target);
      currentShiftContentRef.current = getShiftContent(event.target);

      if (!isShiftPressed) {
        setInspectState(null);
        return;
      }

      if (!sourceRegion || hasCustomExplainerRef.current) {
        setInspectState(null);
        return;
      }

      setInspectState({
        content: currentShiftContentRef.current || "FE",
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        const fileToCopy = currentFileRef.current;
        if (!fileToCopy || event.repeat) return;
        navigator.clipboard
          ?.writeText([fileToCopy, formatSectionLabel(currentLabelRef.current)].join("\n"))
          .catch(() => {});
        return;
      }
      if (event.key === "Alt") {
        if (event.repeat || hasCustomExplainerRef.current || !currentFileRef.current) return;
        navigator.clipboard
          ?.writeText(currentShiftContentRef.current || "FE")
          .catch(() => {});
        return;
      }
      if (event.key === "Shift") {
        setIsShiftPressed(true);
        const point = lastPointerRef.current;
        if (!point) return;
        const target = document.elementFromPoint(point.x, point.y);
        const sourceRegion = getSourceRegion(target);
        const hasCustom = hasCustomShiftExplainer(target);
        currentShiftContentRef.current = getShiftContent(target);
        hasCustomExplainerRef.current = hasCustom;
        if (!sourceRegion || hasCustom) {
          setInspectState(null);
          return;
        }
        setInspectState({
          content: currentShiftContentRef.current || "FE",
          x: point.x,
          y: point.y,
        });
        return;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Shift") return;
      setIsShiftPressed(false);
      setInspectState(null);
    };

    const handleWindowBlur = () => {
      currentFileRef.current = null;
      currentLabelRef.current = undefined;
      hasCustomExplainerRef.current = false;
      currentShiftContentRef.current = null;
      setIsShiftPressed(false);
      setInspectState(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isShiftPressed, location.pathname]);

  if (!inspectState || !isShiftPressed) return null;

  return (
    <div
      className="pointer-events-none fixed z-[10000] max-w-[320px] rounded-lg border border-sky-400/40 bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow-2xl shadow-slate-950/50 backdrop-blur-sm"
      style={{
        left: Math.min(inspectState.x + 14, window.innerWidth - 340),
        top: Math.min(inspectState.y + 18, window.innerHeight - 100),
      }}
    >
      <div className="whitespace-pre-line text-[11px] leading-5">{inspectState.content}</div>
    </div>
  );
}
