import * as React from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LANGUAGE_STORAGE_KEY } from "../../i18n";
import vnFlag from "../../assets/language-vn.png";
import enFlag from "../../assets/language-en.png";

const LANGUAGES = [
  { code: "vi", label: "VN", icon: vnFlag },
  { code: "en", label: "EN", icon: enFlag },
];

const DEFAULT_RIGHT = 16;
const WORKSPACE_TOP = 56;
const DEFAULT_TOP = 16;
const DRAG_THRESHOLD = 4;

export function LanguageSwitcher() {
  const location = useLocation();
  const { i18n: i18nInstance } = useTranslation();
  const isWorkspaceRoute =
    location.pathname.startsWith("/annotator/task/") ||
    location.pathname.startsWith("/reviewer/review/");
  const [position, setPosition] = React.useState({
    top: isWorkspaceRoute ? WORKSPACE_TOP : DEFAULT_TOP,
    right: DEFAULT_RIGHT,
  });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDragReady, setIsDragReady] = React.useState(false);
  const hasCustomPositionRef = React.useRef(false);
  const dragStateRef = React.useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startTop: number;
    startRight: number;
    moved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTop: 0,
    startRight: 0,
    moved: false,
  });
  const suppressClickRef = React.useRef(false);
  const activeLanguage = (
    i18nInstance.resolvedLanguage ||
    i18nInstance.language ||
    "vi"
  )
    .toLowerCase()
    .split("-")[0];

  const changeLanguage = (code: string) => {
    if (activeLanguage === code) return;
    i18nInstance.changeLanguage(code);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    }
  };

  React.useEffect(() => {
    if (hasCustomPositionRef.current) return;
    setPosition((current) => ({
      ...current,
      top: isWorkspaceRoute ? WORKSPACE_TOP : DEFAULT_TOP,
    }));
  }, [isWorkspaceRoute]);

  React.useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Control" && !isDragging) {
        setIsDragReady(false);
      }
    };

    const handleWindowBlur = () => {
      if (!isDragging) {
        setIsDragReady(false);
      }
    };

    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isDragging]);

  React.useEffect(() => {
    if (!isDragging) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (dragState.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      if (
        !dragState.moved &&
        Math.abs(deltaX) < DRAG_THRESHOLD &&
        Math.abs(deltaY) < DRAG_THRESHOLD
      ) {
        return;
      }

      dragState.moved = true;
      hasCustomPositionRef.current = true;

      const maxRight = Math.max(12, window.innerWidth - 80);
      const maxTop = Math.max(12, window.innerHeight - 56);

      setPosition({
        right: Math.min(
          maxRight,
          Math.max(12, dragState.startRight - deltaX)
        ),
        top: Math.min(maxTop, Math.max(12, dragState.startTop + deltaY)),
      });
    };

    const stopDragging = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) {
        return;
      }

      if (dragState.moved) {
        suppressClickRef.current = true;
      }

      dragState.pointerId = null;
      dragState.moved = false;
      setIsDragging(false);
      setIsDragReady(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) {
      setIsDragReady(false);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTop: position.top,
      startRight: position.right,
      moved: false,
    };

    setIsDragReady(true);
    setIsDragging(true);
  };

  const handleButtonClick = (code: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    changeLanguage(code);
  };

  return (
    <div
      className={`fixed z-[1100] flex select-none items-center gap-0.5 rounded-full border p-[3px] shadow-2xl backdrop-blur-md ${
        isDragging ? "cursor-grabbing" : isDragReady ? "cursor-grab" : "cursor-default"
      }`}
      onPointerDown={handlePointerDown}
      style={{
        top: position.top,
        right: position.right,
        background: "rgba(255,255,255,0.92)",
        borderColor: "rgba(148,163,184,0.25)",
        boxShadow: "0 12px 32px rgba(15,23,42,0.18)",
      }}
    >
      {LANGUAGES.map((language) => {
        const isActive = activeLanguage === language.code;
        return (
          <button
            key={language.code}
            onClick={() => handleButtonClick(language.code)}
            title={language.label}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all ${
              isActive
                ? "bg-indigo-50 text-slate-800 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.15)]"
                : "bg-transparent text-slate-500"
            }`}
            style={
              undefined
            }
            aria-label={language.label}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
              style={{
                background: "#fff",
              }}
            >
              <img
                src={language.icon}
                alt={language.label}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </span>
            <span className="text-[13px] font-semibold tracking-[0.08em]">
              {language.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
