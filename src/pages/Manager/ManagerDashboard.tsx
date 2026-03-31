import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types/cvat';
import { projectApi } from '../../api/projectApi';
import { userApi } from '../../api/userApi';
import { assignmentApi } from '../../api/assignmentApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface ManagerDashboardProps {
  user?: any;
  onLogout?: () => void;
}

const resolveProjectId = (project: any) => project?.projectId ?? project?.project_id;

const normalizeAssignmentStatus = (status?: string) =>
  (status || "").toUpperCase();

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 5;
  
  // Annotator data
  const [annotators, setAnnotators] = useState<any[]>([]);
  const [annotatorProgress, setAnnotatorProgress] = useState<Record<number, any>>({});
  const [isLoadingAnnotators, setIsLoadingAnnotators] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    fetchAnnotatorsAndProgress();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectApi.getMyProjects();
      // Response is an array of projects
      const projectList = Array.isArray(response) ? response : [];
      // Map backend projectId to frontend project_id
      const mappedProjects = projectList.map((p: any) => ({
        project_id: resolveProjectId(p),
        name: p.name,
        data_type: p.type || p.dataType || p.data_type,
        status: p.status,
        dataset_count: Number(p.datasetCount ?? p.dataset_count ?? 0),
        datasets: p.datasets,
        manager_id: p.managerId || p.manager_id,
      }));
      setMyProjects(mappedProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setMyProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnnotatorsAndProgress = async () => {
    setIsLoadingAnnotators(true);
    try {
      // 1. Get all users and filter annotators
      const usersData: any = await userApi.getAllUsers({ page: 0, size: 200 });
      const allUsers = Array.isArray(usersData) ? usersData : ((usersData as any)?.content || []);
      
      // Filter annotators (roleId = 3 or roleName = 'ANNOTATOR')
      const annotatorList = allUsers.filter((u: any) => 
        u.roleId === 3 || u.roleName?.toUpperCase() === 'ANNOTATOR'
      );
      setAnnotators(annotatorList);
      
      // 2. Get all assignments from my projects
      const projectsResponse = await projectApi.getMyProjects();
      const projects = Array.isArray(projectsResponse) ? projectsResponse : [];
      
      const allAssignments: any[] = [];
      for (const project of projects) {
        const projectId = resolveProjectId(project);
        if (!projectId) continue;
        try {
          const assignments: any = await assignmentApi.getAssignmentsByProject(projectId);
          const assignmentList = Array.isArray(assignments) ? assignments : ((assignments as any)?.content || []);
          allAssignments.push(...assignmentList);
        } catch (err) {
          console.error(`Failed to fetch assignments for project ${projectId}:`, err);
        }
      }
      
      // 3. Calculate progress for each annotator
      const progressMap: Record<number, any> = {};
      
      annotatorList.forEach((annotator: any) => {
        const annotatorAssignments = allAssignments.filter(
          (a: any) => a.annotatorId === annotator.userId || a.annotatorId === annotator.id
        );
        
        const total = annotatorAssignments.length;
        const completed = annotatorAssignments.filter(
          (a: any) => ["COMPLETED", "APPROVED"].includes(normalizeAssignmentStatus(a.status))
        ).length;
        const inProgress = annotatorAssignments.filter(
          (a: any) => ["IN_PROGRESS", "SUBMITTED", "RE_SUBMITTED", "REJECTED"].includes(normalizeAssignmentStatus(a.status))
        ).length;
        const pending = annotatorAssignments.filter(
          (a: any) => ["PENDING", "DRAFT"].includes(normalizeAssignmentStatus(a.status))
        ).length;
        
        // Calculate average progress percentage
        const avgProgress = annotatorAssignments.length > 0
          ? Math.round(
              annotatorAssignments.reduce((sum: number, a: any) => sum + (a.progress || 0), 0) / 
              annotatorAssignments.length
            )
          : 0;
        
        progressMap[annotator.userId || annotator.id] = {
          total,
          completed,
          inProgress,
          pending,
          avgProgress,
          assignments: annotatorAssignments
        };
      });
      
      setAnnotatorProgress(progressMap);
      
    } catch (error) {
      console.error('Failed to fetch annotators and progress:', error);
    } finally {
      setIsLoadingAnnotators(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'completed': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'in_progress': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'pending': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'UNKNOWN';
    return status.toUpperCase();
  };

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = myProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(myProjects.length / projectsPerPage);

  return (
    <div className="p-8 min-h-full bg-transparent space-y-8">
      {/* Welcome Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bảng điều khiển Manager
          </h1>
          <p className="text-lg text-muted-foreground">
            Quản lý dự án và team của bạn
          </p>
        </div>
      </Card>

      {/* Hành động nhanh */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <h3 className="mb-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Hành động nhanh
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="primary"
            className="h-12 px-6 text-sm shadow-md"
            onClick={() => navigate('/manager/projects')}
            leftIcon="add"
          >
            Tạo dự án
          </Button>

          <Button
            variant="secondary"
            className="h-12 px-6 text-sm"
            onClick={() => navigate('/manager/labels')}
            leftIcon="label"
          >
            Tạo nhãn
          </Button>

          <Button
            variant="secondary"
            className="h-12 px-6 text-sm"
            onClick={() => navigate('/manager/policies')}
            leftIcon="policy"
          >
            Tạo policy
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <Card className="p-6 transition-all hover:shadow-md bg-white/80 dark:bg-slate-800/80">
          <div className="text-3xl font-bold text-foreground mb-1">
            {myProjects.length}
          </div>
          <div className="text-xs font-medium text-muted-foreground">Dự án của tôi</div>
        </Card>

        <Card className="p-6 transition-all hover:shadow-md bg-white/80 dark:bg-slate-800/80">
          <div className="text-3xl font-bold text-foreground mb-1">
            {myProjects.reduce((sum, p: any) => sum + (p.dataset_count ?? p.datasets?.length ?? 0), 0)}
          </div>
          <div className="text-xs font-medium text-muted-foreground">Datasets</div>
        </Card>
        
        <Card className="p-6 transition-all hover:shadow-md bg-white/80 dark:bg-slate-800/80">
          <div className="text-3xl font-bold text-foreground mb-1">
            {annotators.length}
          </div>
          <div className="text-xs font-medium text-muted-foreground">Người chú thích</div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* My Projects */}
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80">
          <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
            Dự án của tôi
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              Đang tải...
            </div>
          ) : myProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <div className="text-lg font-medium text-foreground mb-2">
                Chưa có dự án nào
              </div>
              <div className="text-sm">
                Hãy tạo dự án đầu tiên của bạn
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {currentProjects.map((project) => (
                  <div
                    key={project.project_id}
                    className="group p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="m-0 text-base font-semibold text-foreground truncate">
                          {project.name}
                        </h4>
                        <div className="text-xs text-muted-foreground truncate">
                          {project.data_type} • {(project as any).dataset_count ?? project.datasets?.length ?? 0} datasets
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(project.status)}`}>
                        {formatStatus(project.status)}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs hover:bg-primary/5 hover:text-primary"
                        onClick={() => navigate(`/manager/projects/${project.project_id}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Hiển thị {indexOfFirstProject + 1}-{Math.min(indexOfLastProject, myProjects.length)} / {myProjects.length} dự án
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 text-xs"
                    >
                      ← Trước
                    </Button>
                    <div className="flex items-center justify-center h-8 px-3 rounded-md bg-primary/10 text-primary text-xs font-bold">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 text-xs"
                    >
                      Tiếp →
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
        
        {/* Annotator Progress */}
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80">
          <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
            Tiến độ Annotators
          </h3>
          {isLoadingAnnotators ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              Đang tải...
            </div>
          ) : annotators.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <div className="text-sm">
                Chưa có annotator nào
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
              {annotators.map((annotator) => {
                const progress = annotatorProgress[annotator.userId || annotator.id] || {
                  total: 0,
                  completed: 0,
                  inProgress: 0,
                  pending: 0,
                  avgProgress: 0
                };
                
                return (
                  <div
                    key={annotator.userId || annotator.id}
                    className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {(annotator.fullName || annotator.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {annotator.fullName || annotator.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progress.total} tasks
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Tiến độ trung bình</span>
                        <span className="text-xs font-bold text-foreground">{progress.avgProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                          style={{ width: `${progress.avgProgress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {progress.completed}
                        </div>
                        <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                          Hoàn thành
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {progress.inProgress}
                        </div>
                        <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                          Đang làm
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                          {progress.pending}
                        </div>
                        <div className="text-[10px] text-slate-600/70 dark:text-slate-400/70">
                          Chờ xử lý
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
