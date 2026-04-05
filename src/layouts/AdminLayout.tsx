import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";

/**
 * AdminLayout - Persistent layout for all Admin routes
 * 
 * Renders the left sidebar (fixed) and an outlet for page content (right).
 * This ensures the sidebar persists across all /admin/* routes.
 */
export function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Fixed Left Sidebar - role-aware, shows admin navigation */}
            <Sidebar />

            {/* Right Content Area - changes based on route */}
            <main className="flex-1 ml-64 bg-background">
                <Outlet />
            </main>
        </div>
    );
}
