import * as React from "react";
import { cn } from "../../utils/cn";

export function Workspace3Column({ left, center, right, leftWidth = "w-72", rightWidth = "w-80" }) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-annotator-primary/30 font-sans">
            {/* Left Column (Navigation/List) */}
            <aside className={cn("border-r border-border flex flex-col bg-card", leftWidth)}>
                {left}
            </aside>

            {/* Center Column (Canvas) - Flexible */}
            <main className="relative flex flex-1 flex-col overflow-hidden bg-muted/20 group">
                {/* Dotted pattern background for canvas feel */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="relative z-10 flex-1 flex flex-col">
                    {center}
                </div>
            </main>

            {/* Right Column (Metadata/Labels) */}
            <aside className={cn("border-l border-border flex flex-col bg-card", rightWidth)}>
                {right}
            </aside>
        </div>
    );
}
