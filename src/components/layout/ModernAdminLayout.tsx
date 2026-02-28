import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

interface ModernAdminLayoutProps {
  children: React.ReactNode;
  currentUser?: any;
  currentPage?: string;
  onPageChange?: (page: string) => void;
  onLogout?: () => void;
}

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({
  children,
  currentUser,
  currentPage = 'dashboard',
  onPageChange,
  onLogout
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chỉ các trang cần thiết theo ERD
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Tổng quan hệ thống' },
    { id: 'users', label: 'Quản lý người dùng', icon: '👥', description: 'Users & Roles' },
    { id: 'projects', label: 'Quản lý dự án', icon: '📁', description: 'Projects & Datasets' },
    { id: 'assignments', label: 'Phân công nhiệm vụ', icon: '📋', description: 'Task Assignments' },
    { id: 'labels', label: 'Quản lý nhãn', icon: '🏷️', description: 'Labels & Rules' },
    { id: 'reviewing', label: 'Kiểm duyệt', icon: '👁️', description: 'Review Process' },
    { id: 'policies', label: 'Chính sách', icon: '🛡️', description: 'Quality Policies' },
    { id: 'audit', label: 'Nhật ký hệ thống', icon: '📜', description: 'Activity Logs' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Modern Sidebar */}
      <div
        className={cn(
          "bg-card/95 backdrop-blur border-r border-border flex flex-col transition-all duration-300 relative z-20 shadow-xl",
          sidebarOpen ? "w-[300px]" : "w-[80px]"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white" />
              </svg>
            </div>
            {sidebarOpen && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <h2 className="m-0 text-lg font-bold bg-gradient-to-br from-blue-500 to-blue-700 bg-clip-text text-transparent">
                  ADMIN PANEL
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Data Labeling System
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform z-30 border-2 border-background"
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        {/* Navigation Menu */}
        <div className="flex-1 py-6 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {adminMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange?.(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group relative overflow-hidden",
                currentPage === item.id
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !sidebarOpen && "justify-center px-2"
              )}
            >
              {/* Active indicator */}
              {currentPage === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-lg" />
              )}

              <div className={cn(
                "text-xl transition-transform duration-200",
                currentPage === item.id && "scale-110",
                !sidebarOpen && "scale-125"
              )}>
                {item.icon}
              </div>

              {sidebarOpen && (
                <div className="flex-1 text-left animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="font-semibold text-sm">
                    {item.label}
                  </div>
                  <div className="text-[11px] font-normal opacity-70 mt-0.5">
                    {item.description}
                  </div>
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {!sidebarOpen && (
                <div className="absolute left-[70px] bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md border pointer-events-none">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border/50 bg-muted/20">
          {sidebarOpen && currentUser && (
            <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {currentUser.first_name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-foreground truncate">
                  {currentUser.first_name} {currentUser.last_name}
                </div>
                <div className="text-xs text-blue-500 font-medium">
                  Administrator
                </div>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 text-red-500 hover:bg-red-500/10 hover:text-red-600 justify-center",
              sidebarOpen ? "px-4" : "px-0"
            )}
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Đăng xuất</span>}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        {/* Top Header */}
        <div className="h-20 border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-8 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {adminMenuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {adminMenuItems.find(item => item.id === currentPage)?.description || 'Tổng quan hệ thống'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </div>
            <div className="w-px h-8 bg-border/60 mx-2 hidden md:block" />
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto bg-muted/5 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModernAdminLayout;