import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Bảng màu Modern Enterprise UI
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  textPrimary: "#172B4D",
  textSecondary: "#44546F",
  textMuted: "#626F86",
  brand: "#0C66E4",
  brandHover: "#0055CC",
  brandLight: "#E9F2FF",
  green: "#1F845A",
  greenBg: "#DCFFF1",
  amber: "#A54800",
  amberBg: "#FFF7D6",
  purple: "#5E4DB2",
  purpleBg: "#F3F0FF",
};

interface AdminDashboardProps {
  user?: any;
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Fetch real data from backend
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        setIsLoading(true);
        const response = await userApi.getAllUsers({ page: 0, size: 1 });
        // Response has totalElements for total count
        setTotalUsers(response.totalElements || 0);
      } catch (error) {
        console.error('Failed to fetch user count:', error);
        setTotalUsers(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCount();
  }, []);

  return (
    <div style={{
      padding: "32px 40px",
      minHeight: "100%",
      background: T.bg,
      fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
    }}>
      {/* Welcome Header */}
      <div style={{
        padding: "32px",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "6px",
        marginBottom: "32px",
        boxShadow: "0 1px 3px rgba(9,30,66,.08)"
      }}>
        <div>
          <p style={{
            fontSize: "11px",
            fontWeight: 700,
            color: T.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "4px"
          }}>
            Quản trị hệ thống
          </p>
          <h1 style={{
            fontSize: "28px",
            fontWeight: 800,
            color: T.textPrimary,
            marginBottom: "8px",
            letterSpacing: "-0.02em"
          }}>
            Admin Dashboard
          </h1>
          <p style={{
            fontSize: "14px",
            color: T.textMuted
          }}>
            Quản lý toàn bộ hệ thống Data Labeling
          </p>
        </div>
      </div>

      {/* Hành động quản trị */}
      <div style={{
        padding: "32px",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "6px",
        marginBottom: "32px",
        boxShadow: "0 1px 3px rgba(9,30,66,.08)"
      }}>
        <h3 style={{
          marginBottom: "24px",
          fontSize: "11px",
          fontWeight: 700,
          color: T.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.1em"
        }}>
          Hành động quản trị
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          {/* Quản lý người dùng */}
          <button
            onClick={() => navigate('/admin/users')}
            onMouseEnter={() => setHoveredButton('users')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "48px",
              padding: "0 24px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#FFFFFF",
              background: hoveredButton === 'users' ? T.brandHover : T.brand,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s",
              boxShadow: "0 2px 4px rgba(9,30,66,.15)"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>group</span>
            Quản lý người dùng
          </button>

          {/* Theo dõi nhật ký */}
          <button
            onClick={() => navigate('/admin/logs')}
            onMouseEnter={() => setHoveredButton('logs')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "48px",
              padding: "0 24px",
              fontSize: "13px",
              fontWeight: 700,
              color: T.textPrimary,
              background: hoveredButton === 'logs' ? T.surfaceHover : T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>bar_chart</span>
            Theo dõi nhật ký
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "16px"
      }}>
        <div
          onMouseEnter={() => setHoveredKpi(0)}
          onMouseLeave={() => setHoveredKpi(null)}
          style={{
            padding: "24px",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: "6px",
            borderTop: `3px solid ${T.brand}`,
            boxShadow: hoveredKpi === 0 ? "0 4px 12px rgba(9,30,66,.12)" : "0 1px 3px rgba(9,30,66,.08)",
            transition: "all .2s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <p style={{
              fontSize: "11px",
              fontWeight: 700,
              color: T.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            }}>
              Tổng người dùng
            </p>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.brand }}>
              group
            </span>
          </div>
          <div style={{
            fontSize: "32px",
            fontWeight: 800,
            color: T.textPrimary,
            lineHeight: 1
          }}>
            {isLoading ? '...' : totalUsers.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;