import * as React from "react";
import { cn } from "../../utils/cn";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Define role-specific navigation links
    const adminLinks = [
        { to: "/admin/users", label: "Quản lý người dùng", icon: "group" },
        { to: "/admin/logs", label: "Theo dõi nhật ký", icon: "history" },
    ];

    const managerLinks = [
        { to: "/manager/dashboard", label: "Dashboard", icon: "dashboard" },
        { to: "/manager/projects", label: "Projects", icon: "folder" },
        { to: "/manager/policies", label: "Tạo policy", icon: "policy" },
    ];

    const annotatorLinks = [
        { to: "/annotator/dashboard", label: "Dashboard", icon: "dashboard" },
        { to: "/annotator/tasks", label: "My Tasks", icon: "assignment" },
    ];

    // Select links based on user role (source of truth from AuthContext)
    let links = [];
    if (user?.role === "ADMIN") links = adminLinks;
    else if (user?.role === "ANNOTATOR") links = annotatorLinks;
    else links = managerLinks;

    // Determine role display and badge
    const roleDisplay = user?.role === "ADMIN" ? "Admin" : user?.role === "ANNOTATOR" ? "Annotator" : "Manager";
    const roleBadge = user?.role === "ADMIN" ? "AD" : user?.role === "ANNOTATOR" ? "AN" : "MG";

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
        <aside className="w-64 border-r border-border bg-card text-card-foreground flex flex-col h-screen fixed left-0 top-0 transition-colors duration-200">
            <div className="h-16 flex items-center justify-center px-4 border-b border-border">
                <span
                    className="font-bold text-xl tracking-tight cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center justify-center"
                    onClick={handleTitleClick}
                >
                    <span className="text-foreground">DataLabel</span><span className="text-primary">Core</span>
                </span>
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
                        <p className="text-xs text-muted-foreground group-hover:text-red-500 transition-colors">Logout</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
