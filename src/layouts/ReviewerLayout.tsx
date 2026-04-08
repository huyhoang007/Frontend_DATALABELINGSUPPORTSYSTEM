import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { SOURCE_FILES } from "../utils/sourceMeta";

/**
 * ReviewerLayout - Persistent layout for Reviewer pages (NOT workspace).
 * 
 * Renders the left sidebar (fixed) and an outlet for page content (right).
 * The ReviewWorkspace route is kept OUTSIDE this layout to use its own 3-column layout.
 */
export function ReviewerLayout() {
    return (
        <div
            className="flex min-h-screen bg-background text-foreground"
            data-source-file={SOURCE_FILES.reviewerLayout}
            data-source-label="Reviewer layout shell"
        >
            {/* Fixed Left Sidebar */}
            <Sidebar />

            {/* Right Content Area - changes based on route */}
            <main
                className="flex-1 ml-64 bg-background"
                data-source-file={SOURCE_FILES.reviewerLayout}
                data-source-label="Reviewer layout content area"
            >
                <Outlet />
            </main>
        </div>
    );
}
