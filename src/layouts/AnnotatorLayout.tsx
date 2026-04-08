import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { SOURCE_FILES } from "../utils/sourceMeta";

/**
 * AnnotatorLayout - Persistent layout for all Annotator routes
 * 
 * Renders the left sidebar (fixed) and an outlet for page content (right).
 * This ensures the sidebar persists across all /annotator/* routes.
 */
export function AnnotatorLayout() {
    return (
        <div
            className="flex min-h-screen bg-background text-foreground"
            data-source-file={SOURCE_FILES.annotatorLayout}
            data-source-label="Annotator layout shell"
        >
            {/* Fixed Left Sidebar */}
            <Sidebar />

            {/* Right Content Area - changes based on route */}
            <main
                className="flex-1 ml-64 bg-background"
                data-source-file={SOURCE_FILES.annotatorLayout}
                data-source-label="Annotator layout content area"
            >
                <Outlet />
            </main>
        </div>
    );
}
