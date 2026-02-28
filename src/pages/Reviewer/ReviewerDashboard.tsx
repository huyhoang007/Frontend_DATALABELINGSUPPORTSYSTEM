import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

interface ReviewerDashboardProps {
  user: any;
  onLogout: () => void;
}

const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({ user, onLogout }) => {
  const mockReviews = [
    {
      id: 1,
      taskName: 'Gán nhãn hình ảnh xe cộ',
      annotator: 'Nguyễn Văn A',
      project: 'AI Vision Recognition',
      status: 'pending',
      submittedAt: '2024-02-12T10:30:00Z',
      priority: 'high',
      accuracy: null,
      itemsCount: 150
    },
    {
      id: 2,
      taskName: 'Phân loại văn bản',
      annotator: 'Trần Thị B',
      project: 'OCR Document Processing',
      status: 'approved',
      submittedAt: '2024-02-11T14:20:00Z',
      priority: 'medium',
      accuracy: 95,
      itemsCount: 200
    },
    {
      id: 3,
      taskName: 'Gán nhãn y tế',
      annotator: 'Lê Văn C',
      project: 'Medical Image Analysis',
      status: 'rejected',
      submittedAt: '2024-02-10T09:15:00Z',
      priority: 'low',
      accuracy: 78,
      itemsCount: 80
    },
    {
      id: 4,
      taskName: 'Nhận diện đối tượng',
      annotator: 'Hoàng Thị D',
      project: 'AI Vision Recognition',
      status: 'in_review',
      submittedAt: '2024-02-12T16:45:00Z',
      priority: 'high',
      accuracy: null,
      itemsCount: 300
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'in_review': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✓';
      case 'rejected': return '✗';
      case 'pending': return '○';
      case 'in_review': return '◐';
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

  const getAccuracyColor = (accuracy: number | null) => {
    if (accuracy === null) return '#6b7280';
    if (accuracy >= 90) return '#10b981';
    if (accuracy >= 80) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shadow-violet-500/30">
              R
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Reviewer Dashboard
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
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-xl text-amber-500">
                ○
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {mockReviews.filter(r => r.status === 'pending').length}
                </h3>
                <p className="text-sm text-muted-foreground">Chờ review</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-xl text-emerald-500">
                ✓
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {mockReviews.filter(r => r.status === 'approved').length}
                </h3>
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-xl text-red-500">
                ✗
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {mockReviews.filter(r => r.status === 'rejected').length}
                </h3>
                <p className="text-sm text-muted-foreground">Từ chối</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-xl text-violet-500">
                ◐
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {mockReviews.filter(r => r.status === 'in_review').length}
                </h3>
                <p className="text-sm text-muted-foreground">Đang review</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Review Tasks */}
        <Card className="p-8 bg-card/80 backdrop-blur border-border/60">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Review Tasks
          </h2>

          <div className="space-y-4">
            {mockReviews.map((review) => (
              <div
                key={review.id}
                className="p-5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      {review.taskName}
                    </h3>
                    <div
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"
                      style={{
                        backgroundColor: `${getStatusColor(review.status)}15`,
                        color: getStatusColor(review.status)
                      }}
                    >
                      <span>{getStatusIcon(review.status)}</span>
                      {review.status}
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${getPriorityColor(review.priority)}15`,
                      color: getPriorityColor(review.priority)
                    }}
                  >
                    {review.priority} Priority
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Annotator</span>
                    <span className="font-medium text-foreground">{review.annotator}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Dự án</span>
                    <span className="font-medium text-foreground">{review.project}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Số items</span>
                    <span className="font-medium text-foreground">{review.itemsCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Gửi lúc</span>
                    <span className="font-medium text-foreground">
                      {new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {review.accuracy !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">Độ chính xác</span>
                      <span
                        className="font-bold"
                        style={{ color: getAccuracyColor(review.accuracy) }}
                      >
                        {review.accuracy}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${review.accuracy}%`,
                          backgroundColor: getAccuracyColor(review.accuracy)
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 text-xs"
                  >
                    Xem chi tiết
                  </Button>

                  {review.status === 'pending' && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 text-xs text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800"
                      >
                        Duyệt
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 text-xs text-red-600 bg-red-500/10 hover:bg-red-500/20 border-red-200 dark:border-red-800"
                      >
                        Từ chối
                      </Button>
                    </>
                  )}

                  {review.status === 'in_review' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-9 text-xs text-violet-600 bg-violet-500/10 hover:bg-violet-500/20 border-violet-200 dark:border-violet-800"
                    >
                      Tiếp tục review
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

export default ReviewerDashboard;