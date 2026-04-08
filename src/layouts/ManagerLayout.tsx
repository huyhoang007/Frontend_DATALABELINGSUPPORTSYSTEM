import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { SOURCE_FILES } from "../utils/sourceMeta";

/**
 * ManagerLayout - Persistent layout for all Manager routes
 * 
 * Renders the left sidebar (fixed) and an outlet for page content (right).
 * This ensures the sidebar persists across all /manager/* routes.
 */
export function ManagerLayout() {
    return (
        <div
            className="flex min-h-screen bg-background text-foreground"
            data-source-file={SOURCE_FILES.managerLayout}
            data-source-label="Manager layout shell"
        >
            {/* Fixed Left Sidebar - matches screenshot exactly */}
            <Sidebar />

            {/* Right Content Area - changes based on route */}
            <main
                className="flex-1 ml-64 bg-background"
                data-source-file={SOURCE_FILES.managerLayout}
                data-source-label="Manager layout content area"
            >
                <Outlet />
            </main>
        </div>
    );
}
