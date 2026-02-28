import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

interface AnnotatorDashboardProps {
  user: any;
  onLogout: () => void;
}

const AnnotatorDashboard: React.FC<AnnotatorDashboardProps> = ({ user, onLogout }) => {
  const mockTasks = [
    {
      id: 1,
      name: 'Gán nhãn hình ảnh xe cộ',
      project: 'AI Vision Recognition',
      status: 'in_progress',
      progress: 65,
      deadline: '2024-02-15',
      priority: 'high'
    },
    {
      id: 2,
      name: 'Phân loại văn bản',
      project: 'OCR Document Processing',
      status: 'pending',
      progress: 0,
      deadline: '2024-02-20',
      priority: 'medium'
    },
    {
      id: 3,
      name: 'Gán nhãn y tế',
      project: 'Medical Image Analysis',
      status: 'completed',
      progress: 100,
      deadline: '2024-02-10',
      priority: 'low'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '↻';
      case 'pending': return '○';
      default: return '?';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shadow-emerald-500/30">
              A
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Annotator Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Chào mừng, {user.full_name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={onLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </Card>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-xl text-emerald-500">
                ✓
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {mockTasks.filter(t => t.status === 'completed').length}
                </h3>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-xl text-amber-500">
                ↻
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {mockTasks.filter(t => t.status === 'in_progress').length}
                </h3>
                <p className="text-sm text-muted-foreground">Đang thực hiện</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-500/10 rounded-xl flex items-center justify-center text-xl text-slate-500">
                ⏳
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {mockTasks.filter(t => t.status === 'pending').length}
                </h3>
                <p className="text-sm text-muted-foreground">Chờ xử lý</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tasks */}
        <Card className="p-8 bg-card/80 backdrop-blur border-border/60">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Tasks
          </h2>

          <div className="space-y-4">
            {mockTasks.map((task) => (
              <div
                key={task.id}
                className="p-5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      {task.name}
                    </h3>
                    <div
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"
                      style={{
                        backgroundColor: `${getStatusColor(task.status)}15`,
                        color: getStatusColor(task.status)
                      }}
                    >
                      <span>{getStatusIcon(task.status)}</span>
                      {task.status}
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${getPriorityColor(task.priority)}15`,
                      color: getPriorityColor(task.priority)
                    }}
                  >
                    {task.priority} Priority
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Dự án: <span className="text-foreground">{task.project}</span>
                </p>

                <div className="space-y-4 mb-4">
                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">Tiến độ</span>
                      <span className="font-bold text-foreground">{task.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${task.progress}%`,
                          backgroundColor: getStatusColor(task.status)
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Deadline: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 text-xs"
                  >
                    Xem chi tiết
                  </Button>

                  {task.status !== 'completed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-9 text-xs text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800"
                    >
                      Bắt đầu
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnnotatorDashboard;