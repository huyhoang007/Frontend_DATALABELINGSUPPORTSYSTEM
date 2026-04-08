import { cn } from "../../utils/cn";

interface Workspace3ColumnProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
  rightWidth?: string;
  sourceFile?: string;
  leftSourceFile?: string;
  leftSourceLabel?: string;
  centerSourceFile?: string;
  centerSourceLabel?: string;
  rightSourceFile?: string;
  rightSourceLabel?: string;
}

export function Workspace3Column({
  left,
  center,
  right,
  leftWidth = "w-72",
  rightWidth = "w-80",
  sourceFile,
  leftSourceFile,
  leftSourceLabel,
  centerSourceFile,
  centerSourceLabel,
  rightSourceFile,
  rightSourceLabel,
}: Workspace3ColumnProps) {
  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-annotator-primary/30 font-sans"
      data-source-file={sourceFile}
      data-source-label="3-column workspace shell"
    >
      {/* Left Column */}
      <aside
        className={cn("border-r border-border flex flex-col bg-card", leftWidth)}
        data-source-file={leftSourceFile}
        data-source-label={leftSourceLabel}
      >
        {left}
      </aside>

      {/* Center Column */}
      <main
        className="relative flex flex-1 flex-col overflow-hidden bg-muted/20 group"
        data-source-file={centerSourceFile}
        data-source-label={centerSourceLabel}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[length:24px_24px] opacity-[0.05]"
        />
        <div className="relative z-10 flex-1 flex flex-col">{center}</div>
      </main>

      {/* Right Column */}
      <aside
        className={cn("border-l border-border flex flex-col bg-card", rightWidth)}
        data-source-file={rightSourceFile}
        data-source-label={rightSourceLabel}
      >
        {right}
      </aside>
    </div>
  );
}
