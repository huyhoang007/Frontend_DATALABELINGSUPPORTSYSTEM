import * as React from "react";
import { cn } from "../../utils/cn";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { translateRole } from "../../i18n/helpers";
import { SOURCE_FILES } from "../../utils/sourceMeta";

export function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(["common"]);

    // Define role-specific navigation links
    const adminLinks = [
        { to: "/admin/dashboard", label: t("common:nav.overview"), icon: "dashboard" },
        { to: "/admin/users", label: t("common:nav.users"), icon: "group" },
        { to: "/admin/logs", label: t("common:nav.activityLogs"), icon: "history" },
    ];

    const managerLinks = [
        { to: "/manager/dashboard", label: t("common:nav.overview"), icon: "dashboard" },
        { to: "/manager/projects", label: t("common:nav.projects"), icon: "folder" },
        { to: "/manager/labels", label: t("common:nav.createLabel"), icon: "label" },
        { to: "/manager/policies", label: t("common:nav.createPolicy"), icon: "policy" },
    ];

    const annotatorLinks = [
        { to: "/annotator/dashboard", label: t("common:nav.overview"), icon: "dashboard" },
        { to: "/annotator/tasks", label: t("common:nav.myTasks"), icon: "assignment" },
    ];

    const reviewerLinks = [
        { to: "/reviewer/queue", label: t("common:nav.reviewQueue"), icon: "checklist" },
    ];

    // Select links based on user role (source of truth from AuthContext)
    let links = [];
    if (user?.role === "ADMIN") links = adminLinks;
    else if (user?.role === "ANNOTATOR") links = annotatorLinks;
    else if (user?.role === "REVIEWER") links = reviewerLinks;
    else links = managerLinks;

    // Determine role display and badge
    const roleDisplay = translateRole(user?.role);
    const roleBadge = user?.role === "ADMIN" ? "AD" : user?.role === "ANNOTATOR" ? "AN" : user?.role === "REVIEWER" ? "RV" : "MG";

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Determine role-based home route
    const getHomeRoute = () => {
        switch (user?.role) {
            case 'ADMIN': return '/admin';
            case 'MANAGER': return '/manager';
            case 'ANNOTATOR': return '/annotator';
            case 'REVIEWER': return '/reviewer';
            default: return '/login';
        }
    };

    const handleTitleClick = () => {
        navigate(getHomeRoute());
    };

    return (
        <aside
            className="w-64 border-r border-border bg-card text-card-foreground flex flex-col h-screen fixed left-0 top-0 transition-colors duration-200"
            data-source-file={SOURCE_FILES.sidebar}
      data-source-label="section:shared-sidebar-navigation"
        >
            <div className="h-16 flex items-center justify-center px-4 border-b border-border">
                <div
                    className="cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center gap-3"
                    onClick={handleTitleClick}
                >
                    <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight">
                        <span className="text-foreground">Data</span><span className="text-primary">Label</span>
                    </span>
                </div>
            </div>

            <nav className="flex-1 py-4 px-2 space-y-1">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => cn(
                            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            isActive
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {link.icon && (
                            <span className="material-symbols-outlined mr-3 text-[20px] w-5 h-5 flex items-center justify-center transition-colors">
                                {link.icon}
                            </span>
                        )}
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <div
                    className="flex items-center cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors group"
                    onClick={handleLogout}
                >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                        {roleBadge}
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-foreground">{roleDisplay}</p>
                        <p className="text-xs text-muted-foreground group-hover:text-red-500 transition-colors">{t("common:actions.logout")}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
