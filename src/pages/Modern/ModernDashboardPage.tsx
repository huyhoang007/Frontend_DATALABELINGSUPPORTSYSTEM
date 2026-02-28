import React from 'react';
import { DashboardStats } from '../../types/cvat';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

const ModernDashboardPage: React.FC = () => {
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
      icon: '👥',
      color: '#3b82f6'
    },
    {
      title: 'Dự án đang hoạt động',
      value: stats.active_projects.toString(),
      change: '+8%',
      icon: '📁',
      color: '#10b981'
    },
    {
      title: 'Nhiệm vụ hoàn thành',
      value: stats.completed_tasks.toLocaleString(),
      change: '+23%',
      icon: '✅',
      color: '#f59e0b'
    },
    {
      title: 'Tổng datasets',
      value: stats.total_datasets.toString(),
      change: '+15%',
      icon: '💾',
      color: '#8b5cf6'
    },
    {
      title: 'Chờ review',
      value: stats.pending_reviews.toString(),
      change: '-5%',
      icon: '👁️',
      color: '#ef4444'
    },
    {
      title: 'Điểm chất lượng',
      value: `${stats.quality_score}%`,
      change: '+2%',
      icon: '⭐',
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
    <div className="p-8 min-h-full bg-transparent space-y-8">
      {/* Welcome Section */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-blue-500/30">
            👋
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Chào mừng trở lại, Admin!
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Hôm nay là {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}. Hệ thống đang hoạt động tốt.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
        {dashboardCards.map((stat, index) => (
          <Card
            key={index}
            className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60 hover:border-primary/30 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                style={{
                  backgroundColor: `${stat.color}15`,
                  color: stat.color
                }}
              >
                {stat.icon}
              </div>
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  stat.change.startsWith('+')
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-red-500/10 text-red-600"
                )}
              >
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            🔥 Hoạt động gần đây
          </h2>
          <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 rounded-lg text-sm font-medium transition-all">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border/50 transition-all"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                  activity.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
                    activity.type === 'info' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-amber-500/10 text-amber-600'
                )}
              >
                {activity.type === 'success' ? '✅' : activity.type === 'info' ? 'ℹ️' : '⚠️'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground mb-1">
                  <span className="text-primary">{activity.user}</span> {activity.action}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.project} • {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ModernDashboardPage;