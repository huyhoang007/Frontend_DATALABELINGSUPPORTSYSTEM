import React, { useState } from 'react';
import { DashboardStats } from '../../types/cvat';

// Modern Enterprise UI - Bảng màu T chuẩn
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F8F9FA",
  border: "#DFE1E6",
  borderLight: "#EBECF0",
  textPrimary: "#172B4D",
  textSecondary: "#5E6C84",
  textMuted: "#8993A4",
  brand: "#0052CC",
  brandHover: "#0747A6",
  brandLight: "#DEEBFF",
  success: "#00875A",
  successBg: "#E3FCEF",
  warning: "#FF991F",
  warningBg: "#FFFAE6",
  danger: "#DE350B",
  dangerBg: "#FFEBE6",
  info: "#0065FF",
  infoBg: "#DEEBFF",
  purple: "#5243AA",
  purpleBg: "#EAE6FF",
};

const ModernDashboardPage: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  // Mock dashboard stats theo ERD
  const stats: DashboardStats = {
    total_users: 1234,
    active_projects: 56,
    completed_tasks: 2890,
    total_datasets: 128,
    pending_reviews: 45,
    quality_score: 94.5
  };

  const dashboardCards = [
    {
      title: 'Tổng người dùng',
      value: stats.total_users.toLocaleString(),
      change: '+12%',
      icon: 'U',
      color: '#3b82f6'
    },
    {
      title: 'Dự án đang hoạt động',
      value: stats.active_projects.toString(),
      change: '+8%',
      icon: 'P',
      color: '#10b981'
    },
    {
      title: 'Nhiệm vụ hoàn thành',
      value: stats.completed_tasks.toLocaleString(),
      change: '+23%',
      icon: 'T',
      color: '#f59e0b'
    },
    {
      title: 'Tổng datasets',
      value: stats.total_datasets.toString(),
      change: '+15%',
      icon: 'D',
      color: '#8b5cf6'
    },
    {
      title: 'Chờ review',
      value: stats.pending_reviews.toString(),
      change: '-5%',
      icon: 'R',
      color: '#ef4444'
    },
    {
      title: 'Điểm chất lượng',
      value: `${stats.quality_score}%`,
      change: '+2%',
      icon: 'Q',
      color: '#06b6d4'
    }
  ];

  const recentActivities = [
    { user: 'Nguyễn Văn A', action: 'Hoàn thành gán nhãn', project: 'Dự án AI Vision', time: '5 phút trước', type: 'success' },
    { user: 'Trần Thị B', action: 'Tạo dự án mới', project: 'Nhận diện khuôn mặt', time: '15 phút trước', type: 'info' },
    { user: 'Lê Văn C', action: 'Cập nhật dataset', project: 'Phân loại hình ảnh', time: '30 phút trước', type: 'warning' },
    { user: 'Phạm Thị D', action: 'Kiểm duyệt chất lượng', project: 'OCR Documents', time: '1 giờ trước', type: 'success' },
  ];

  return (
    <div style={{
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: T.bg,
    }}>
      {/* Welcome Section */}
      <div style={{
        padding: '32px',
        backgroundColor: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: '12px',
        marginBottom: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: T.textPrimary,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            Chào mừng trở lại, Admin!
          </h1>
          <p style={{
            fontSize: '15px',
            color: T.textSecondary,
            lineHeight: '1.6',
          }}>
            Hôm nay là {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}. Hệ thống đang hoạt động tốt.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {dashboardCards.map((stat, index) => (
          <div
            key={index}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              padding: '24px',
              backgroundColor: T.surface,
              border: `1px solid ${hoveredCard === index ? T.brand : T.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: hoveredCard === index ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hoveredCard === index 
                ? '0 8px 16px rgba(0,0,0,0.12)' 
                : '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '600',
                backgroundColor: `${stat.color}15`,
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <div style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: stat.change.startsWith('+') ? T.successBg : T.dangerBg,
                color: stat.change.startsWith('+') ? T.success : T.danger,
              }}>
                {stat.change}
              </div>
            </div>
            <div>
              <h3 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: T.textPrimary,
                marginBottom: '4px',
                letterSpacing: '-0.02em',
              }}>
                {stat.value}
              </h3>
              <p style={{
                fontSize: '13px',
                fontWeight: '500',
                color: T.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {stat.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div style={{
        padding: '32px',
        backgroundColor: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: T.textPrimary,
          }}>
            Hoạt động gần đây
          </h2>
          <button style={{
            padding: '8px 16px',
            backgroundColor: T.brandLight,
            color: T.brand,
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = T.brand;
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = T.brandLight;
            e.currentTarget.style.color = T.brand;
          }}>
            Xem tất cả
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentActivities.map((activity, index) => {
            const getActivityColor = () => {
              if (activity.type === 'success') return { bg: T.successBg, text: T.success };
              if (activity.type === 'info') return { bg: T.infoBg, text: T.info };
              return { bg: T.warningBg, text: T.warning };
            };
            const colors = getActivityColor();

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredActivity(index)}
                onMouseLeave={() => setHoveredActivity(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: hoveredActivity === index ? T.surfaceHover : T.bg,
                  border: `1px solid ${T.borderLight}`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: colors.bg,
                  color: colors.text,
                  flexShrink: 0,
                }}>
                  {activity.type === 'success' ? '✓' : activity.type === 'info' ? 'i' : '!'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: T.textPrimary,
                    marginBottom: '4px',
                  }}>
                    <span style={{ color: T.brand, fontWeight: '600' }}>{activity.user}</span> {activity.action}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: T.textSecondary,
                  }}>
                    {activity.project} • {activity.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModernDashboardPage;