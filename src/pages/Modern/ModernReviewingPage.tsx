import React, { useState } from 'react';
import { Reviewing, Assignment, User, Label } from '../../types/cvat';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
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

const ModernReviewingPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Reviewing | null>(null);

  // Mock data theo ERD
  const reviews: Reviewing[] = [
    {
      reviewing_id: 1,
      assignment_id: 1,
      annotator_id: 2,
      label_id: 1,
      geometry: '{"type":"bbox","coordinates":[100,100,200,200]}',
      status: 'pending',
      is_improved: false,
      reviewer_id: 3,
      assignment: {
        assignment_id: 1,
        project_id: 1,
        dataset_id: 1,
        annotator_id: 2,
        reviewer_id: 3,
        status: 'in_progress',
        project: { project_id: 1, name: 'AI Vision Recognition', data_type: 'image', status: 'active', manager_id: 1 }
      },
      annotator: { user_id: 2, username: 'annotator1', full_name: 'Nguyễn Văn A', email: 'annotator1@example.com', status: 'active', role_id: 3, created_at: '2024-01-01' },
      reviewer: { user_id: 3, username: 'reviewer1', full_name: 'Trần Thị B', email: 'reviewer1@example.com', status: 'active', role_id: 4, created_at: '2024-01-01' },
      label: { label_id: 1, label_name: 'Person', color_code: '#ef4444' }
    },
    {
      reviewing_id: 2,
      assignment_id: 1,
      annotator_id: 2,
      label_id: 2,
      geometry: '{"type":"bbox","coordinates":[300,150,450,300]}',
      status: 'approved',
      is_improved: false,
      reviewer_id: 3,
      assignment: {
        assignment_id: 1,
        project_id: 1,
        dataset_id: 1,
        annotator_id: 2,
        reviewer_id: 3,
        status: 'in_progress',
        project: { project_id: 1, name: 'AI Vision Recognition', data_type: 'image', status: 'active', manager_id: 1 }
      },
      annotator: { user_id: 2, username: 'annotator1', full_name: 'Nguyễn Văn A', email: 'annotator1@example.com', status: 'active', role_id: 3, created_at: '2024-01-01' },
      reviewer: { user_id: 3, username: 'reviewer1', full_name: 'Trần Thị B', email: 'reviewer1@example.com', status: 'active', role_id: 4, created_at: '2024-01-01' },
      label: { label_id: 2, label_name: 'Car', color_code: '#3b82f6' }
    },
    {
      reviewing_id: 3,
      assignment_id: 2,
      annotator_id: 4,
      label_id: 3,
      geometry: '{"type":"polygon","coordinates":[[50,50],[150,50],[150,150],[50,150]]}',
      status: 'rejected',
      is_improved: true,
      reviewer_id: 3,
      assignment: {
        assignment_id: 2,
        project_id: 2,
        dataset_id: 2,
        annotator_id: 4,
        reviewer_id: 3,
        status: 'completed',
        project: { project_id: 2, name: 'OCR Document Processing', data_type: 'text', status: 'active', manager_id: 1 }
      },
      annotator: { user_id: 4, username: 'annotator2', full_name: 'Lê Văn C', email: 'annotator2@example.com', status: 'active', role_id: 3, created_at: '2024-01-01' },
      reviewer: { user_id: 3, username: 'reviewer1', full_name: 'Trần Thị B', email: 'reviewer1@example.com', status: 'active', role_id: 4, created_at: '2024-01-01' },
      label: { label_id: 3, label_name: 'Building', color_code: '#10b981' }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'P';
      case 'approved': return 'A';
      case 'rejected': return 'R';
      default: return '?';
    }
  };

  const filteredReviews = reviews.filter(review =>
    selectedStatus === 'all' || review.status === selectedStatus
  );

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
            Kiểm duyệt & Review
          </h1>
          <p style={{
            fontSize: '15px',
            color: T.textSecondary,
          }}>
            Quản lý quá trình review và kiểm duyệt annotations
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
            backgroundColor: T.amberBg,
            color: T.amber,
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
            }}>
              {reviews.filter(r => r.status === 'pending').length}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.8,
            }}>
              Chờ review
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
            backgroundColor: T.greenBg,
            color: T.green,
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
            }}>
              {reviews.filter(r => r.status === 'approved').length}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.8,
            }}>
              Đã duyệt
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
            backgroundColor: T.redBg,
            color: T.red,
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
            }}>
              {reviews.filter(r => r.status === 'rejected').length}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.8,
            }}>
              Từ chối
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
              {reviews.filter(r => r.is_improved).length}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.8,
            }}>
              Đã cải thiện
            </div>
          </div>
        </div>

        {/* Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '8px 16px',
              backgroundColor: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: T.textPrimary,
              outline: 'none',
              cursor: 'pointer',
              minWidth: '200px',
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </Card>

      {/* Reviews List */}
      <Card className="bg-card dark:bg-slate-800/60 backdrop-blur-xl border-border/50 overflow-hidden">
        {filteredReviews.map((review, index) => (
          <div
            key={review.reviewing_id}
            className={cn(
              "p-6 transition-all duration-200 hover:bg-muted/40",
              index < filteredReviews.length - 1 && "border-b border-border/50"
            )}
          >
            <div className="flex items-start gap-5">
              {/* Review Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-foreground">
                    Review #{review.reviewing_id}
                  </h3>
                  <div
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${getStatusColor(review.status)}15`,
                      color: getStatusColor(review.status)
                    }}
                  >
                    {getStatusIcon(review.status)}
                    {review.status}
                  </div>
                  {review.is_improved && (
                    <div className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-[10px] font-bold uppercase tracking-wide">
                      Improved
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Dự án</div>
                    <div className="text-sm font-semibold text-foreground truncate">
                      {review.assignment?.project?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Assignment #{review.assignment_id}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Label</div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: review.label?.color_code }}
                      />
                      {review.label?.label_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {review.label_id}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Annotator</div>
                    <div className="text-sm font-semibold text-foreground truncate">
                      {review.annotator?.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{review.annotator?.username}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Reviewer</div>
                    <div className="text-sm font-semibold text-foreground truncate">
                      {review.reviewer?.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{review.reviewer?.username}
                    </div>
                  </div>
                </div>

                {/* Geometry Preview */}
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground mb-1">Geometry</div>
                  <div className="bg-muted/40 p-2 rounded-md font-mono text-[10px] text-muted-foreground truncate border border-border/50 max-w-md">
                    {review.geometry}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 text-xs text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800"
                    onClick={() => {
                      setSelectedReview(review);
                      setShowReviewModal(true);
                    }}
                    leftIcon="eye"
                  >
                    Xem chi tiết
                  </Button>

                  {review.status === 'pending' && (
                    <>
                      <Button
                        variant="secondary"
                        className="h-8 text-xs text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800"
                        leftIcon="check"
                      >
                        Duyệt
                      </Button>

                      <Button
                        variant="secondary"
                        className="h-8 text-xs text-red-600 bg-red-500/10 hover:bg-red-500/20 border-red-200 dark:border-red-800"
                        leftIcon="close"
                      >
                        Từ chối
                      </Button>
                    </>
                  )}

                  <Button
                    variant="secondary"
                    className="h-8 text-xs text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800"
                    leftIcon="edit"
                  >
                    Ghi chú
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Review Detail Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Chi tiết Review #{selectedReview.reviewing_id}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => setShowReviewModal(false)}
              >
                X
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Thông tin Review</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Trạng thái</div>
                    <div
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${getStatusColor(selectedReview.status)}15`,
                        color: getStatusColor(selectedReview.status)
                      }}
                    >
                      {getStatusIcon(selectedReview.status)}
                      {selectedReview.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Label</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedReview.label?.color_code }}
                      />
                      {selectedReview.label?.label_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Cải thiện</div>
                    <div className={cn("text-sm font-medium", selectedReview.is_improved ? "text-emerald-500" : "text-muted-foreground")}>
                      {selectedReview.is_improved ? 'Đã cải thiện' : 'Chưa cải thiện'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Thông tin Assignment</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Dự án</div>
                    <div className="text-sm font-medium text-foreground">
                      {selectedReview.assignment?.project?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Annotator</div>
                    <div className="text-sm font-medium text-foreground">
                      {selectedReview.annotator?.full_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Reviewer</div>
                    <div className="text-sm font-medium text-foreground">
                      {selectedReview.reviewer?.full_name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Geometry Data</h3>
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50 font-mono text-xs text-muted-foreground break-all">
                {selectedReview.geometry}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
              >
                Đóng
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernReviewingPage;