import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole } from '../../utils/roleUtils';

/**
 * RoleGuard - Protects routes based on user role
 * 
 * Rules:
 * 1. If not authenticated (no token/user) => redirect to /login
 * 2. If authenticated but role not in allowedRoles => redirect to /unauthorized
 * 3. Otherwise, render children
 */
export function RoleGuard({ allowedRoles, children }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    // Wait for auth to load
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Normalize user role for comparison
    const userRole = normalizeRole(user.role);

    // Authenticated but wrong role - redirect to unauthorized
    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Authorized - render children
    return <>{children}</>;
}
