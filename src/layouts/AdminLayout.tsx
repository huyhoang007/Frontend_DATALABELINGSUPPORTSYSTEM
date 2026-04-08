import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { SOURCE_FILES } from "../utils/sourceMeta";

/**
 * AdminLayout - Persistent layout for all Admin routes
 * 
 * Renders the left sidebar (fixed) and an outlet for page content (right).
 * This ensures the sidebar persists across all /admin/* routes.
 */
export function AdminLayout() {
    return (
        <div
            className="flex min-h-screen bg-background text-foreground"
            data-source-file={SOURCE_FILES.adminLayout}
      data-source-label="section:admin-layout-shell"
        >
            {/* Fixed Left Sidebar - role-aware, shows admin navigation */}
            <Sidebar />

            {/* Right Content Area - changes based on route */}
            <main
                className="flex-1 ml-64 bg-background"
                data-source-file={SOURCE_FILES.adminLayout}
        data-source-label="section:admin-layout-content-area"
            >
                <Outlet />
            </main>
        </div>
    );
}
