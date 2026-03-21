import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { activityLogApi } from '../../api/activityLogApi';

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

interface RoleStats {
  annotators: number;
  reviewers: number;
  managers: number;
  admins: number;
}

interface RecentActivity {
  id: number;
  message: string;
  timestamp: string;
  type: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [roleStats, setRoleStats] = useState<RoleStats>({
    annotators: 0,
    reviewers: 0,
    managers: 0,
    admins: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Không rõ';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Fetch real data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all users to calculate role distribution
        const usersResponse = await userApi.getAllUsers({ page: 0, size: 1000 }) as any;
        const users = usersResponse.content || [];
        
        setTotalUsers(usersResponse.totalElements || users.length);
        
        // Calculate role distribution from real data
        const stats = {
          annotators: users.filter((u: any) => u.roleName === 'ANNOTATOR').length,
          reviewers: users.filter((u: any) => u.roleName === 'REVIEWER').length,
          managers: users.filter((u: any) => u.roleName === 'MANAGER').length,
          admins: users.filter((u: any) => u.roleName === 'ADMIN').length
        };
        setRoleStats(stats);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setTotalUsers(0);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        // Fetch recent activity logs
        const logsResponse = await activityLogApi.getAllLogs({ page: 0, size: 5 }) as any;
        const logs = logsResponse.content || logsResponse || [];
        
        // Transform logs to activity format
        const activities: RecentActivity[] = logs.map((log: any, index: number) => {
          let message = '';
          const username = log.username || `Người dùng #${log.userId}`;
          
          // Format message based on action type
          if (log.action?.toLowerCase().includes('login')) {
            message = `${username} đã đăng nhập`;
          } else if (log.action?.toLowerCase().includes('create')) {
            const target = log.target || log.targetType || 'đối tượng';
            message = `${username} đã tạo ${target}`;
          } else if (log.action?.toLowerCase().includes('update')) {
            const target = log.target || log.targetType || 'đối tượng';
            message = `${username} đã cập nhật ${target}`;
          } else if (log.action?.toLowerCase().includes('delete')) {
            const target = log.target || log.targetType || 'đối tượng';
            message = `${username} đã xóa ${target}`;
          } else {
            message = `${username} - ${log.action}`;
          }
          
          // Format timestamp
          const timestamp = formatTimeAgo(log.timestamp || log.createdAt);
          
          return {
            id: log.logId || log.id || index,
            message,
            timestamp,
            type: log.action?.toLowerCase() || 'unknown'
          };
        });
        
        setRecentActivities(activities);
        
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
        setRecentActivities([]);
      }
    };

    fetchDashboardData();
    fetchRecentActivities();
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
            Bảng điều khiển Admin
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
        gap: "16px",
        marginBottom: "32px"
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

      {/* Role Distribution & Recent Activity */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px"
      }}>
        {/* Role Distribution */}
        <div style={{
          padding: "32px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: "6px",
          boxShadow: "0 1px 3px rgba(9,30,66,.08)"
        }}>
          <h3 style={{
            marginBottom: "24px",
            fontSize: "16px",
            fontWeight: 700,
            color: T.textPrimary
          }}>
            Phân bổ vai trò
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Annotators */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: T.textSecondary }}>Người chú thích</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: T.textPrimary }}>{roleStats.annotators}</span>
              </div>
              <div style={{ 
                height: "8px", 
                background: T.border, 
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${totalUsers > 0 ? (roleStats.annotators / totalUsers) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>

            {/* Reviewers */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: T.textSecondary }}>Người đánh giá</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: T.textPrimary }}>{roleStats.reviewers}</span>
              </div>
              <div style={{ 
                height: "8px", 
                background: T.border, 
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${totalUsers > 0 ? (roleStats.reviewers / totalUsers) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>

            {/* Managers */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: T.textSecondary }}>Quản lý</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: T.textPrimary }}>{roleStats.managers}</span>
              </div>
              <div style={{ 
                height: "8px", 
                background: T.border, 
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${totalUsers > 0 ? (roleStats.managers / totalUsers) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>

            {/* Admins */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: T.textSecondary }}>Quản trị viên</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: T.textPrimary }}>{roleStats.admins}</span>
              </div>
              <div style={{ 
                height: "8px", 
                background: T.border, 
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${totalUsers > 0 ? (roleStats.admins / totalUsers) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          padding: "32px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: "6px",
          boxShadow: "0 1px 3px rgba(9,30,66,.08)"
        }}>
          <h3 style={{
            marginBottom: "24px",
            fontSize: "16px",
            fontWeight: 700,
            color: T.textPrimary
          }}>
            Hoạt động gần đây
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {recentActivities.map((activity) => (
              <div key={activity.id} style={{
                paddingBottom: "16px",
                borderBottom: `1px solid ${T.border}`
              }}>
                <p style={{
                  fontSize: "14px",
                  color: T.textPrimary,
                  marginBottom: "4px"
                }}>
                  {activity.message}
                </p>
                <p style={{
                  fontSize: "12px",
                  color: T.textMuted
                }}>
                  {activity.timestamp}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;