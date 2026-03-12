import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const ModernSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: 'Data Labeling System',
    siteDescription: 'Hệ thống gán nhãn dữ liệu AI',
    allowRegistration: true,
    requireEmailVerification: true,
    maxFileSize: '100',
    allowedFileTypes: 'jpg,png,pdf,txt',
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    enableAuditLog: true,
    enableNotifications: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    enableSSL: true
  });

  const tabs = [
    { id: 'general', label: 'Cài đặt chung', icon: 'G' },
    { id: 'security', label: 'Bảo mật', icon: 'S' },
    { id: 'email', label: 'Email', icon: 'E' },
    { id: 'storage', label: 'Lưu trữ', icon: 'D' },
    { id: 'backup', label: 'Sao lưu', icon: 'B' }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Tên hệ thống
        </label>
        <input
          type="text"
          value={settings.siteName}
          onChange={(e) => handleSettingChange('siteName', e.target.value)}
          className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Mô tả hệ thống
        </label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
        <div>
          <div className="text-sm font-semibold text-foreground mb-1">
            Cho phép đăng ký
          </div>
          <div className="text-xs text-muted-foreground">
            Người dùng có thể tự đăng ký tài khoản mới
          </div>
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowRegistration}
            onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
            className="hidden"
          />
          <div className={cn(
            "w-12 h-6 rounded-full relative transition-colors duration-200",
            settings.allowRegistration ? "bg-primary" : "bg-muted-foreground/30"
          )}>
            <div className={cn(
              "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200",
              settings.allowRegistration ? "left-[26px]" : "left-0.5"
            )} />
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
        <div>
          <div className="text-sm font-semibold text-foreground mb-1">
            Xác thực email
          </div>
          <div className="text-xs text-muted-foreground">
            Yêu cầu xác thực email khi đăng ký
          </div>
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requireEmailVerification}
            onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
            className="hidden"
          />
          <div className={cn(
            "w-12 h-6 rounded-full relative transition-colors duration-200",
            settings.requireEmailVerification ? "bg-primary" : "bg-muted-foreground/30"
          )}>
            <div className={cn(
              "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200",
              settings.requireEmailVerification ? "left-[26px]" : "left-0.5"
            )} />
          </div>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Thời gian hết hạn phiên (phút)
        </label>
        <input
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
          className="w-[200px] px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Số lần đăng nhập sai tối đa
        </label>
        <input
          type="number"
          value={settings.maxLoginAttempts}
          onChange={(e) => handleSettingChange('maxLoginAttempts', e.target.value)}
          className="w-[200px] px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
        <div>
          <div className="text-sm font-semibold text-foreground mb-1">
            Bật nhật ký audit
          </div>
          <div className="text-xs text-muted-foreground">
            Ghi lại tất cả hoạt động của người dùng
          </div>
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enableAuditLog}
            onChange={(e) => handleSettingChange('enableAuditLog', e.target.checked)}
            className="hidden"
          />
          <div className={cn(
            "w-12 h-6 rounded-full relative transition-colors duration-200",
            settings.enableAuditLog ? "bg-primary" : "bg-muted-foreground/30"
          )}>
            <div className={cn(
              "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200",
              settings.enableAuditLog ? "left-[26px]" : "left-0.5"
            )} />
          </div>
        </label>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            SMTP Host
          </label>
          <input
            type="text"
            value={settings.smtpHost}
            onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            SMTP Port
          </label>
          <input
            type="text"
            value={settings.smtpPort}
            onChange={(e) => handleSettingChange('smtpPort', e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          SMTP Username
        </label>
        <input
          type="text"
          value={settings.smtpUsername}
          onChange={(e) => handleSettingChange('smtpUsername', e.target.value)}
          className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          SMTP Password
        </label>
        <input
          type="password"
          value={settings.smtpPassword}
          onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
          className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
        <div>
          <div className="text-sm font-semibold text-foreground mb-1">
            Bật SSL/TLS
          </div>
          <div className="text-xs text-muted-foreground">
            Sử dụng kết nối bảo mật cho email
          </div>
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enableSSL}
            onChange={(e) => handleSettingChange('enableSSL', e.target.checked)}
            className="hidden"
          />
          <div className={cn(
            "w-12 h-6 rounded-full relative transition-colors duration-200",
            settings.enableSSL ? "bg-primary" : "bg-muted-foreground/30"
          )}>
            <div className={cn(
              "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200",
              settings.enableSSL ? "left-[26px]" : "left-0.5"
            )} />
          </div>
        </label>
      </div>
    </div>
  );

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Kích thước file tối đa (MB)
        </label>
        <input
          type="number"
          value={settings.maxFileSize}
          onChange={(e) => handleSettingChange('maxFileSize', e.target.value)}
          className="w-[200px] px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Định dạng file được phép
        </label>
        <input
          type="text"
          value={settings.allowedFileTypes}
          onChange={(e) => handleSettingChange('allowedFileTypes', e.target.value)}
          placeholder="jpg,png,pdf,txt"
          className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
        <div className="text-xs text-muted-foreground mt-1">
          Phân cách bằng dấu phẩy (,)
        </div>
      </div>

      <div className="p-5 bg-blue-500/10 rounded-xl border border-blue-500/20">
        <h3 className="mb-4 text-base font-semibold text-blue-600 dark:text-blue-400">
          Thống kê lưu trữ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xl font-bold text-foreground">2.4 GB</div>
            <div className="text-xs text-muted-foreground">Đã sử dụng</div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">47.6 GB</div>
            <div className="text-xs text-muted-foreground">Còn lại</div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">1,234</div>
            <div className="text-xs text-muted-foreground">Tổng files</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
        <h3 className="mb-4 text-base font-semibold text-emerald-600 dark:text-emerald-400">
          Sao lưu tự động
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-semibold text-foreground">Lần cuối:</div>
            <div className="text-xs text-muted-foreground">23/01/2024 02:00</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Lần tiếp theo:</div>
            <div className="text-xs text-muted-foreground">24/01/2024 02:00</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Kích thước:</div>
            <div className="text-xs text-muted-foreground">1.2 GB</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="primary"
          leftIcon="refresh"
        >
          Sao lưu ngay
        </Button>

        <Button
          variant="secondary"
          className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800"
          leftIcon="download"
        >
          Khôi phục
        </Button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'security': return renderSecuritySettings();
      case 'email': return renderEmailSettings();
      case 'storage': return renderStorageSettings();
      case 'backup': return renderBackupSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="p-8 min-h-full bg-transparent space-y-8">
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          Cài đặt hệ thống
        </h1>
        <p className="text-lg text-muted-foreground">
          Cấu hình và tùy chỉnh các thông số hệ thống
        </p>
      </Card>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <Card className="lg:w-[280px] h-fit p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
          <div className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 text-left",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Content */}
        <div className="flex-1">
          <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="text-2xl">{tabs.find(tab => tab.id === activeTab)?.icon}</span>
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>

            {renderTabContent()}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-border/50 flex gap-3">
              <Button
                variant="primary"
                leftIcon="save"
              >
                Lưu cài đặt
              </Button>

              <Button
                variant="ghost"
                leftIcon="refresh"
              >
                Khôi phục mặc định
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernSettingsPage;