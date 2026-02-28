import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface AdminDashboardProps {
  user?: any;
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="p-8 min-h-full bg-transparent space-y-8">
      {/* Welcome Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-4xl shadow-sm border border-primary/20">
            👑
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Quản lý toàn bộ hệ thống Data Labeling
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Actions - Admin Only */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <h3 className="mb-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
          ⚡ Admin Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          {/* Quản lý người dùng */}
          <Button
            variant="primary"
            size="base"
            className="h-12 px-6 text-sm shadow-md"
            onClick={() => navigate('/admin/users')}
            leftIcon="group"
          >
            Quản lý người dùng
          </Button>

          {/* Theo dõi nhật ký */}
          <Button
            variant="secondary"
            size="base"
            className="h-12 px-6 text-sm"
            onClick={() => navigate('/admin/logs')}
            leftIcon="bar_chart"
          >
            Theo dõi nhật ký
          </Button>
        </div>
      </Card>

      {/* Stats Overview - Only Total Users */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        <Card className="p-6 transition-all hover:shadow-md bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xl">
              👥
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? '...' : totalUsers.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-muted-foreground">Tổng người dùng</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;