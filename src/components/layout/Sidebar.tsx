import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuConfig: Record<string, { text: string; icon: string; path: string }[]> = {
  ADMIN: [
    { text: 'Dashboard', icon: '📊', path: '/dashboard' },
    { text: 'Quản lý người dùng', icon: '👥', path: '/users' },
    { text: 'Cấu hình hệ thống', icon: '⚙️', path: '/settings' },
  ],
  MANAGER: [
    { text: 'Dashboard', icon: '📊', path: '/dashboard' },
    { text: 'Quản lý dự án', icon: '📁', path: '/projects' },
    { text: 'Tạo dự án mới', icon: '➕', path: '/projects/create' },
    { text: 'Quản lý người dùng', icon: '👥', path: '/users' },
  ],
  ANNOTATOR: [
    { text: 'Dashboard', icon: '📊', path: '/dashboard' },
    { text: 'Nhiệm vụ của tôi', icon: '📋', path: '/my-tasks' },
    { text: 'Gán nhãn', icon: '🏷️', path: '/annotate' },
  ],
  REVIEWER: [
    { text: 'Dashboard', icon: '📊', path: '/dashboard' },
    { text: 'Kiểm duyệt', icon: '🔍', path: '/review' },
    { text: 'Xem dự án', icon: '👁️', path: '/projects/view' },
  ],
};

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const roleName: string = user?.role
    ? (typeof user.role === 'object' ? (user.role as any).roleName ?? '' : String(user.role))
    : '';

  const menuItems = menuConfig[roleName] || [{ text: 'Dashboard', icon: '📊', path: '/dashboard' }];

  const handleItemClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 60, left: 0, bottom: 0,
        width: drawerWidth, zIndex: 1300,
        backgroundColor: '#fff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        transform: open ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
        transition: 'transform 0.25s ease',
        overflowY: 'auto',
      }}>
        <nav>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.text}
                onClick={() => handleItemClick(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', border: 'none', background: isActive ? '#e3f2fd' : 'none',
                  color: isActive ? '#1976d2' : '#374151',
                  fontWeight: isActive ? 600 : 400, fontSize: 14,
                  cursor: 'pointer', textAlign: 'left',
                  borderLeft: isActive ? '3px solid #1976d2' : '3px solid transparent',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </button>
            );
          })}
        </nav>
        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
      </div>
    </>
  );
};

export default Sidebar;
