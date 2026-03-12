import React, { useState } from 'react';
import { Assignment, User, Project, DataSet } from '../../types/cvat';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const ModernAssignmentsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data theo ERD
  const assignments: Assignment[] = [
    {
      assignment_id: 1,
      project_id: 1,
      dataset_id: 1,
      annotator_id: 2,
      reviewer_id: 3,
      status: 'in_progress',
      project: { project_id: 1, name: 'AI Vision Recognition', data_type: 'image', status: 'active', manager_id: 1 },
      dataset: { dataset_id: 1, project_id: 1, name: 'Training Images', created_at: '2024-01-15' },
      annotator: { user_id: 2, username: 'annotator1', full_name: 'Nguyễn Văn A', email: 'annotator1@example.com', status: 'active', role_id: 3, created_at: '2024-01-01' },
      reviewer: { user_id: 3, username: 'reviewer1', full_name: 'Trần Thị B', email: 'reviewer1@example.com', status: 'active', role_id: 4, created_at: '2024-01-01' }
    },
    {
      assignment_id: 2,
      project_id: 2,
      dataset_id: 2,
      annotator_id: 4,
      reviewer_id: 3,
      status: 'completed',
      project: { project_id: 2, name: 'OCR Document Processing', data_type: 'text', status: 'active', manager_id: 1 },
      dataset: { dataset_id: 2, project_id: 2, name: 'Document Scans', created_at: '2024-01-10' },
      annotator: { user_id: 4, username: 'annotator2', full_name: 'Lê Văn C', email: 'annotator2@example.com', status: 'active', role_id: 3, created_at: '2024-01-01' },
      reviewer: { user_id: 3, username: 'reviewer1', full_name: 'Trần Thị B', email: 'reviewer1@example.com', status: 'active', role_id: 4, created_at: '2024-01-01' }
    },
    {
      assignment_id: 3,
      project_id: 1,
      dataset_id: 3,
      annotator_id: 2,
      reviewer_id: 5,
      status: 'pending',
      project: { project_id: 1, name: 'AI Vision Recognition', data_type: 'image', status: 'active', manager_id: 1 },
      dataset: { dataset_id: 3, project_id: 1, name: 'Validation Set', created_at: '2024-01-20' },
      annotator: { user_id: 2, username: 'annotator1', full_name: 'Nguyễn Văn A', email: 'annotator1@example.com', status: 'active', role_id: 3, created_at: '2024-01-01' },
      reviewer: { user_id: 5, username: 'reviewer2', full_name: 'Phạm Thị D', email: 'reviewer2@example.com', status: 'active', role_id: 4, created_at: '2024-01-01' }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'reviewed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'P';
      case 'in_progress': return 'W';
      case 'completed': return 'C';
      case 'reviewed': return 'R';
      default: return '?';
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    selectedStatus === 'all' || assignment.status === selectedStatus
  );

  return (
    <div className="p-8 min-h-full bg-transparent space-y-8">
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              Phân công nhiệm vụ
            </h1>
            <p className="text-lg text-muted-foreground">
              Quản lý phân công annotator và reviewer cho các dataset
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon="add"
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            Tạo phân công mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center bg-amber-500/10 text-amber-600 border-amber-500/20">
            <div className="text-2xl font-bold mb-1">
              {assignments.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-xs font-medium opacity-80">Chờ xử lý</div>
          </div>
          <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center bg-blue-500/10 text-blue-600 border-blue-500/20">
            <div className="text-2xl font-bold mb-1">
              {assignments.filter(a => a.status === 'in_progress').length}
            </div>
            <div className="text-xs font-medium opacity-80">Đang thực hiện</div>
          </div>
          <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <div className="text-2xl font-bold mb-1">
              {assignments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-xs font-medium opacity-80">Hoàn thành</div>
          </div>
          <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center bg-purple-500/10 text-purple-600 border-purple-500/20">
            <div className="text-2xl font-bold mb-1">
              {assignments.filter(a => a.status === 'reviewed').length}
            </div>
            <div className="text-xs font-medium opacity-80">Đã review</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-6">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer min-w-[200px]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="reviewed">Đã review</option>
          </select>
        </div>
      </Card>

      {/* Assignments List */}
      <Card className="bg-card dark:bg-slate-800/60 backdrop-blur-xl border-border/50 overflow-hidden">
        {filteredAssignments.map((assignment, index) => (
          <div
            key={assignment.assignment_id}
            className={cn(
              "p-6 transition-all duration-200 hover:bg-muted/40",
              index < filteredAssignments.length - 1 && "border-b border-border/50"
            )}
          >
            <div className="flex items-start gap-5">
              {/* Assignment Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-foreground">
                    Phân công #{assignment.assignment_id}
                  </h3>
                  <div
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${getStatusColor(assignment.status)}15`,
                      color: getStatusColor(assignment.status)
                    }}
                  >
                    {getStatusIcon(assignment.status)}
                    {assignment.status}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Dự án</div>
                    <div className="text-sm font-semibold text-foreground truncate">
                      {assignment.project?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {assignment.project?.data_type}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Dataset</div>
                    <div className="text-sm font-semibold text-foreground truncate">
                      {assignment.dataset?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tạo: {assignment.dataset?.created_at}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Người gán nhãn</div>
                    <div className="text-sm font-semibold text-foreground truncate">
                      {assignment.annotator?.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{assignment.annotator?.username}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Người kiểm duyệt</div>
                    <div className="text-sm font-semibold text-foreground truncate">
                      {assignment.reviewer?.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{assignment.reviewer?.username}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 text-xs text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800"
                    leftIcon="eye"
                  >
                    Xem chi tiết
                  </Button>

                  <Button
                    variant="secondary"
                    className="h-8 text-xs text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800"
                    leftIcon="edit"
                  >
                    Chỉnh sửa
                  </Button>

                  <Button
                    variant="secondary"
                    className="h-8 text-xs text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800"
                    leftIcon="refresh"
                  >
                    Thay đổi trạng thái
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              Tạo phân công mới
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Dự án</label>
                <select className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer">
                  <option value="">Chọn dự án</option>
                  <option value="1">AI Vision Recognition</option>
                  <option value="2">OCR Document Processing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Dataset</label>
                <select className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer">
                  <option value="">Chọn dataset</option>
                  <option value="1">Training Images</option>
                  <option value="2">Validation Set</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Annotator</label>
                <select className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer">
                  <option value="">Chọn người gán nhãn</option>
                  <option value="2">Nguyễn Văn A</option>
                  <option value="4">Lê Văn C</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Người kiểm duyệt</label>
                <select className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer">
                  <option value="">Chọn người kiểm duyệt</option>
                  <option value="3">Trần Thị B</option>
                  <option value="5">Phạm Thị D</option>
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
                Tạo phân công
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernAssignmentsPage;