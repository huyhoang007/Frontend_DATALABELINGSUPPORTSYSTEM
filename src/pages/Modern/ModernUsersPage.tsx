import React, { useState } from 'react';
import { User, Role } from '../../types/cvat';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const ModernUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock roles theo ERD
  const roles: Role[] = [
    { role_id: 1, role_name: 'admin' },
    { role_id: 2, role_name: 'manager' },
    { role_id: 3, role_name: 'annotator' },
    { role_id: 4, role_name: 'reviewer' }
  ];

  // Mock users theo ERD
  const users: User[] = [
    {
      user_id: 1,
      username: 'admin',
      email: 'admin@example.com',
      full_name: 'Admin User',
      status: 'active',
      role_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      role: roles[0]
    },
    {
      user_id: 2,
      username: 'annotator1',
      email: 'annotator1@example.com',
      full_name: 'Nguyễn Văn A',
      status: 'active',
      role_id: 3,
      created_at: '2024-01-05T00:00:00Z',
      role: roles[2]
    },
    {
      user_id: 3,
      username: 'reviewer1',
      email: 'reviewer1@example.com',
      full_name: 'Trần Thị B',
      status: 'active',
      role_id: 4,
      created_at: '2024-01-03T00:00:00Z',
      role: roles[3]
    },
    {
      user_id: 4,
      username: 'manager1',
      email: 'manager1@example.com',
      full_name: 'Lê Văn C',
      status: 'active',
      role_id: 2,
      created_at: '2024-01-02T00:00:00Z',
      role: roles[1]
    },
    {
      user_id: 5,
      username: 'annotator2',
      email: 'annotator2@example.com',
      full_name: 'Hoàng Văn E',
      status: 'active',
      role_id: 3,
      created_at: '2024-01-04T00:00:00Z',
      role: roles[2]
    }
  ];

  const roleOptions = [
    { value: 'all', label: 'Tất cả vai trò', count: users.length },
    { value: 'admin', label: 'Admin', count: users.filter(u => u.role?.role_name === 'admin').length },
    { value: 'manager', label: 'Manager', count: users.filter(u => u.role?.role_name === 'manager').length },
    { value: 'annotator', label: 'Annotator', count: users.filter(u => u.role?.role_name === 'annotator').length },
    { value: 'reviewer', label: 'Reviewer', count: users.filter(u => u.role?.role_name === 'reviewer').length },
  ];

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'admin': return '#ef4444';
      case 'manager': return '#3b82f6';
      case 'annotator': return '#10b981';
      case 'reviewer': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'admin': return '👑';
      case 'manager': return '👨‍💼';
      case 'annotator': return '✏️';
      case 'reviewer': return '👁️';
      default: return '👤';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role?.role_name === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 min-h-full bg-transparent space-y-8">
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <span>👥</span> Quản lý người dùng
            </h1>
            <p className="text-lg text-muted-foreground">
              Quản lý tài khoản và phân quyền người dùng trong hệ thống
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon="add"
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            Thêm người dùng
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
              🔍
            </div>
          </div>

          <div className="relative min-w-[200px]">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm cursor-pointer appearance-none"
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} ({role.count})
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">
              ▼
            </div>
          </div>
        </div>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
        {filteredUsers.map((user) => (
          <Card
            key={user.user_id}
            className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60 hover:border-primary/30 group"
          >
            {/* User Header */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border/50">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${getRoleColor(user.role?.role_name || '')}10 0%, ${getRoleColor(user.role?.role_name || '')}30 100%)`,
                  borderColor: `${getRoleColor(user.role?.role_name || '')}30`,
                  color: getRoleColor(user.role?.role_name || '')
                }}
              >
                {getRoleIcon(user.role?.role_name || '')}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground truncate mb-1">
                  {user.full_name}
                </h3>
                <p className="text-xs text-muted-foreground truncate font-medium">
                  {user.email}
                </p>
              </div>
              <div
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  user.status === 'active'
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                )}
              >
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Vai trò:</span>
                <span
                  className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border"
                  style={{
                    backgroundColor: `${getRoleColor(user.role?.role_name || '')}10`,
                    borderColor: `${getRoleColor(user.role?.role_name || '')}20`,
                    color: getRoleColor(user.role?.role_name || ''),
                  }}
                >
                  {user.role?.role_name}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded text-foreground">
                  @{user.username}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ngày tham gia:</span>
                <span className="font-medium text-foreground">
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 h-9 text-xs"
                leftIcon="edit"
              >
                Chỉnh sửa
              </Button>

              <Button
                variant="secondary"
                className="flex-1 h-9 text-xs text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
                leftIcon="lock"
              >
                Phân quyền
              </Button>

              <Button
                variant="destructive"
                className="h-9 w-9 px-0 text-destructive bg-destructive/10 hover:bg-destructive/20 border-transparent"
                leftIcon="delete"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span>➕</span> Thêm người dùng mới
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Nhập họ tên đầy đủ"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                <input
                  type="email"
                  placeholder="example@domain.com"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Vai trò</label>
                <select className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer">
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(false)}
              >
                Tạo người dùng
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernUsersPage;