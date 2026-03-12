import React, { useState } from 'react';
import { ActivityLog, User } from '../../types/cvat';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

// Bảng màu Modern Enterprise UI (Atlassian/Jira style)
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  borderStrong: "#B3B9C4",
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
  red: "#DE350B",
  redBg: "#FFEBE6",
};

const ModernAuditPage: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [timeFilter, setTimeFilter] = useState('today');

  // Mock users theo ERD
  const users: User[] = [
    {
      user_id: 1,
      username: 'admin',
      email: 'admin@example.com',
      full_name: 'Admin User',
      status: 'active',
      role_id: 1,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      user_id: 2,
      username: 'annotator1',
      email: 'annotator1@example.com',
      full_name: 'Nguyễn Văn A',
      status: 'active',
      role_id: 3,
      created_at: '2024-01-05T00:00:00Z'
    },
    {
      user_id: 3,
      username: 'reviewer1',
      email: 'reviewer1@example.com',
      full_name: 'Trần Thị B',
      status: 'active',
      role_id: 4,
      created_at: '2024-01-03T00:00:00Z'
    },
    {
      user_id: 4,
      username: 'manager1',
      email: 'manager1@example.com',
      full_name: 'Lê Văn C',
      status: 'active',
      role_id: 2,
      created_at: '2024-01-02T00:00:00Z'
    }
  ];

  // Mock activity logs theo ERD
  const activityLogs: ActivityLog[] = [
    {
      activity_id: 1,
      user_id: 1,
      action: 'CREATE_PROJECT',
      target: 'AI Vision Recognition',
      created_at: '2024-01-23T10:30:00Z',
      user: users[0]
    },
    {
      activity_id: 2,
      user_id: 2,
      action: 'COMPLETE_ANNOTATION',
      target: 'Dataset: Training Images',
      created_at: '2024-01-23T09:15:00Z',
      user: users[1]
    },
    {
      activity_id: 3,
      user_id: 3,
      action: 'APPROVE_REVIEW',
      target: 'Assignment #1',
      created_at: '2024-01-23T08:45:00Z',
      user: users[2]
    },
    {
      activity_id: 4,
      user_id: 1,
      action: 'CREATE_USER',
      target: 'User: annotator2',
      created_at: '2024-01-22T16:20:00Z',
      user: users[0]
    },
    {
      activity_id: 5,
      user_id: 2,
      action: 'UPDATE_ANNOTATION',
      target: 'Item ID: 123',
      created_at: '2024-01-22T14:30:00Z',
      user: users[1]
    },
    {
      activity_id: 6,
      user_id: 3,
      action: 'REJECT_REVIEW',
      target: 'Assignment #2',
      created_at: '2024-01-22T11:15:00Z',
      user: users[2]
    },
    {
      activity_id: 7,
      user_id: 4,
      action: 'CREATE_DATASET',
      target: 'Dataset: Medical Images',
      created_at: '2024-01-21T15:45:00Z',
      user: users[3]
    },
    {
      activity_id: 8,
      user_id: 1,
      action: 'DELETE_PROJECT',
      target: 'Old Test Project',
      created_at: '2024-01-21T13:20:00Z',
      user: users[0]
    }
  ];

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return '#10b981';
    if (action.includes('UPDATE')) return '#3b82f6';
    if (action.includes('DELETE')) return '#ef4444';
    if (action.includes('APPROVE')) return '#8b5cf6';
    if (action.includes('REJECT')) return '#f59e0b';
    if (action.includes('COMPLETE')) return '#06b6d4';
    return '#6b7280';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return 'C';
    if (action.includes('UPDATE')) return 'U';
    if (action.includes('DELETE')) return 'D';
    if (action.includes('APPROVE')) return 'A';
    if (action.includes('REJECT')) return 'R';
    if (action.includes('COMPLETE')) return 'F';
    return 'X';
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesAction = selectedAction === 'all' || log.action.includes(selectedAction);
    const matchesUser = selectedUser === 'all' || log.user_id.toString() === selectedUser;
    return matchesAction && matchesUser;
  });

  const actionTypes = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'COMPLETE'
  ];

  return (
    <div style={{
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: T.bg,
    }}>
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: T.textPrimary,
            marginBottom: '8px',
          }}>
            Nhật ký hệ thống
          </h1>
          <p style={{
            fontSize: '15px',
            color: T.textSecondary,
          }}>
            Theo dõi tất cả hoạt động và thay đổi trong hệ thống
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            border: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: T.greenBg,
            color: T.green,
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
            }}>
              {activityLogs.filter(log => log.action.includes('CREATE')).length}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.8,
            }}>
              Tạo mới
            </div>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            border: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: T.brandLight,
            color: T.brand,
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
            }}>
              {activityLogs.filter(log => log.action.includes('UPDATE')).length}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.8,
            }}>
              Cập nhật
            </div>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            border: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: T.purpleBg,
            color: T.purple,
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
            }}>
              {activityLogs.filter(log => log.action.includes('APPROVE')).length}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.8,
            }}>
              Phê duyệt
            </div>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            border: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: T.brandLight,
            color: T.brand,
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
            }}>
              {activityLogs.filter(log => log.action.includes('COMPLETE')).length}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.8,
            }}>
              Hoàn thành
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer min-w-[200px]"
          >
            <option value="all">Tất cả hành động</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>
                {action === 'CREATE' ? 'Tạo mới' : 
                 action === 'UPDATE' ? 'Cập nhật' : 
                 action === 'DELETE' ? 'Xóa' : 
                 action === 'APPROVE' ? 'Phê duyệt' : 
                 action === 'REJECT' ? 'Từ chối' : 
                 action === 'COMPLETE' ? 'Hoàn thành' : action}
              </option>
            ))}
          </select>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer min-w-[200px]"
          >
            <option value="all">Tất cả người dùng</option>
            {users.map(user => (
              <option key={user.user_id} value={user.user_id.toString()}>
                {user.full_name}
              </option>
            ))}
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer min-w-[150px]"
          >
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="all">Tất cả</option>
          </select>
        </div>
      </Card>

      {/* Activity Logs */}
      <Card className="bg-card dark:bg-slate-800/60 backdrop-blur-xl border-border/50 overflow-hidden">
        {filteredLogs.map((log, index) => (
          <div
            key={log.activity_id}
            className={cn(
              "p-6 transition-all duration-200 hover:bg-muted/40",
              index < filteredLogs.length - 1 && "border-b border-border/50"
            )}
          >
            <div className="flex items-start gap-5">
              {/* Log Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${getActionColor(log.action)}20`,
                      color: getActionColor(log.action)
                    }}
                  >
                    {log.action}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {new Date(log.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Người thực hiện</div>
                    <div className="text-sm font-semibold text-foreground">
                      {log.user?.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{log.user?.username}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Đối tượng</div>
                    <div className="text-sm font-semibold text-foreground">
                      {log.target}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Mã hoạt động</div>
                    <div className="text-sm font-semibold text-foreground">
                      #{log.activity_id}
                    </div>
                  </div>
                </div>

                {/* Action Details */}
                <div className="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground border border-border/50">
                  <strong className="text-foreground">{log.user?.full_name}</strong> đã thực hiện{' '}
                  <strong style={{ color: getActionColor(log.action) }}>{log.action}</strong> trên{' '}
                  <strong className="text-foreground">{log.target}</strong>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-right text-[10px] text-muted-foreground shrink-0 font-medium opacity-60">
                <div>{new Date(log.created_at).toLocaleDateString('vi-VN')}</div>
                <div>{new Date(log.created_at).toLocaleTimeString('vi-VN')}</div>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-lg font-semibold mb-2">
              Không có hoạt động nào
            </div>
            <div className="text-sm">
              Không tìm thấy hoạt động nào phù hợp với bộ lọc hiện tại
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModernAuditPage;