import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../api/userApi';
import { activityLogApi } from '../../api/activityLogApi';
import {
  translateAdminLogAction,
  translateAdminLogTargetNoun,
  translateRole,
} from '../../i18n/helpers';
import { SOURCE_FILES } from '../../utils/sourceMeta';

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

const ROLE_BARS = [
  { key: 'annotators' as const, gradient: 'from-violet-500 to-purple-600' },
  { key: 'reviewers'  as const, gradient: 'from-cyan-500 to-sky-600' },
  { key: 'managers'   as const, gradient: 'from-blue-500 to-blue-700' },
  { key: 'admins'     as const, gradient: 'from-red-500 to-red-700' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["admin", "common"]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [roleStats, setRoleStats] = useState<RoleStats>({ annotators: 0, reviewers: 0, managers: 0, admins: 0 });
  const [recentActivityLogs, setRecentActivityLogs] = useState<any[]>([]);

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return t("admin:dashboard.unknownTime");
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t("admin:dashboard.justNow");
    if (diffMins < 60) return t("admin:dashboard.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("admin:dashboard.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("admin:dashboard.yesterday");
    if (diffDays < 7) return t("admin:dashboard.daysAgo", { count: diffDays });
    return date.toLocaleDateString(i18n.language === "en" ? "en-US" : "vi-VN");
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const usersResponse = await userApi.getAllUsers({ page: 0, size: 1000 }) as any;
        const users = usersResponse.content || [];
        setTotalUsers(usersResponse.totalElements || users.length);
        setRoleStats({
          annotators: users.filter((u: any) => u.roleName === 'ANNOTATOR').length,
          reviewers:  users.filter((u: any) => u.roleName === 'REVIEWER').length,
          managers:   users.filter((u: any) => u.roleName === 'MANAGER').length,
          admins:     users.filter((u: any) => u.roleName === 'ADMIN').length,
        });
      } catch { setTotalUsers(0); }
      finally { setIsLoading(false); }
    })();

    (async () => {
      try {
        const res = await activityLogApi.getAllLogs({ page: 0, size: 5 }) as any;
        setRecentActivityLogs(res.content || res || []);
      } catch { setRecentActivityLogs([]); }
    })();
  }, []);

  const recentActivities = useMemo(() =>
    recentActivityLogs.map((log: any, index: number) => {
      const username = log.username || t("admin:dashboard.activityMessages.userFallback", { id: log.userId });
      const target = translateAdminLogTargetNoun(log.target || log.targetType) || t("admin:dashboard.activityMessages.targetFallback");
      let message = "";
      const action = log.action?.toLowerCase() || "";
      if (action.includes("login"))  message = t("admin:dashboard.activityMessages.login",   { user: username });
      else if (action.includes("create")) message = t("admin:dashboard.activityMessages.create", { user: username, target });
      else if (action.includes("update")) message = t("admin:dashboard.activityMessages.update", { user: username, target });
      else if (action.includes("delete")) message = t("admin:dashboard.activityMessages.delete", { user: username, target });
      else message = t("admin:dashboard.activityMessages.generic", { user: username, action: translateAdminLogAction(log.action) });
      return { id: log.logId || log.id || index, message, timestamp: formatTimeAgo(log.timestamp || log.createdAt) };
    }),
  [recentActivityLogs, t, i18n.language]);

  return (
    <div
      className="p-8 min-h-full bg-background space-y-6"
      data-source-file={SOURCE_FILES.adminDashboard}
      data-source-label="section:admin-dashboard-page"
    >

      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
          {t("admin:dashboard.systemAdmin")}
        </p>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
          {t("admin:dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("admin:dashboard.subtitle")}</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-6">
          {t("admin:dashboard.adminActions")}
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            data-shift-content="FE"
            className="flex items-center gap-2 h-12 px-6 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            {t("common:nav.users")}
          </button>
          <button
            onClick={() => navigate('/admin/logs')}
            data-shift-content="FE"
            className="flex items-center gap-2 h-12 px-6 text-sm font-bold text-foreground bg-card hover:bg-accent border border-border rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            {t("common:nav.activityLogs")}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="bg-card border border-t-4 border-t-primary border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div data-shift-content={"GET /api/users?page=0&size=1000\nTong so user trong he thong\nFE doc totalElements hoac users.length"}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {t("admin:dashboard.totalUsers")}
          </p>
          <span className="material-symbols-outlined text-[20px] text-primary">group</span>
        </div>
        <div className="text-4xl font-extrabold text-foreground leading-none">
          {isLoading ? '...' : totalUsers.toLocaleString()}
        </div>
        </div>
      </div>

      {/* Role Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Role Distribution */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-6">{t("admin:dashboard.roleDistribution")}</h3>
          <div
            className="space-y-5"
            data-shift-content={"GET /api/users?page=0&size=1000\nPhan bo role nguoi dung\nFE filter users theo roleName va tinh % tren tong totalUsers"}
          >
            {ROLE_BARS.map(({ key, gradient }) => {
              const count = roleStats[key];
              const pct = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">{translateRole(key.slice(0, -1).toUpperCase())}</span>
                    <span className="text-base font-bold text-foreground">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-6">{t("admin:dashboard.recentActivity")}</h3>
          <div data-shift-content={"GET /api/activity-logs?page=0&size=5\n5 hoat dong gan day cua he thong\nFE format message va time ago tu activity logs"}>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin:dashboard.noActivity")}</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                  <p className="text-sm text-foreground mb-1">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
