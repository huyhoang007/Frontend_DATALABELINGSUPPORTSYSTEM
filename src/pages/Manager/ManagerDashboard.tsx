import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Project } from '../../types/cvat';
import { projectApi } from '../../api/projectApi';
import { userApi } from '../../api/userApi';
import { assignmentApi } from '../../api/assignmentApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  translateDataType,
  translateProjectStatus,
} from '../../i18n/helpers';
import { SOURCE_FILES } from '../../utils/sourceMeta';

interface ManagerDashboardProps {
  user?: any;
  onLogout?: () => void;
}

const resolveProjectId = (project: any) => project?.projectId ?? project?.project_id;

const normalizeAssignmentStatus = (status?: string) =>
  (status || "").toUpperCase();

const ManagerDashboard: React.FC<ManagerDashboardProps> = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["manager", "common"]);
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
      case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'pending': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = myProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(myProjects.length / projectsPerPage);

  return (
    <div
      className="p-8 min-h-full bg-transparent space-y-8"
      data-source-file={SOURCE_FILES.managerDashboard}
      data-source-label="section:manager-dashboard-page"
    >
      {/* Welcome Header */}
      <Card className="p-8 bg-white/60 backdrop-blur-xl border-border/50">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("manager:dashboard.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("manager:dashboard.subtitle")}
          </p>
        </div>
      </Card>

      {/* Hành động nhanh */}
      <Card className="p-8 bg-white/60 backdrop-blur-xl border-border/50">
        <h3 className="mb-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {t("manager:dashboard.quickActions")}
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="primary"
            className="h-12 px-6 text-sm shadow-md"
            onClick={() => navigate('/manager/projects')}
            leftIcon="add"
          >
            {t("manager:projects.createProject")}
          </Button>

          <Button
            variant="secondary"
            className="h-12 px-6 text-sm"
            onClick={() => navigate('/manager/labels')}
            leftIcon="label"
          >
            {t("common:nav.createLabel")}
          </Button>

          <Button
            variant="secondary"
            className="h-12 px-6 text-sm"
            onClick={() => navigate('/manager/policies')}
            leftIcon="policy"
          >
            {t("common:nav.createPolicy")}
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <Card className="p-6 transition-all hover:shadow-md bg-white/80">
          <div className="text-3xl font-bold text-foreground mb-1">
            {myProjects.length}
          </div>
          <div className="text-xs font-medium text-muted-foreground">{t("manager:dashboard.myProjects")}</div>
        </Card>

        <Card className="p-6 transition-all hover:shadow-md bg-white/80">
          <div className="text-3xl font-bold text-foreground mb-1">
            {myProjects.reduce((sum, p: any) => sum + (p.dataset_count ?? p.datasets?.length ?? 0), 0)}
          </div>
          <div className="text-xs font-medium text-muted-foreground">{t("common:labels.datasets")}</div>
        </Card>
        
        <Card className="p-6 transition-all hover:shadow-md bg-white/80">
          <div className="text-3xl font-bold text-foreground mb-1">
            {annotators.length}
          </div>
          <div className="text-xs font-medium text-muted-foreground">{t("role:annotator")}</div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* My Projects */}
        <Card className="p-6 bg-white/80">
          <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
            {t("manager:dashboard.myProjects")}
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              {t("common:states.loading")}
            </div>
          ) : myProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <div className="text-lg font-medium text-foreground mb-2">
                {t("manager:dashboard.noProjects")}
              </div>
              <div className="text-sm">
                {t("manager:dashboard.createFirstProject")}
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
                          {translateDataType(project.data_type)} •{" "}
                          {t("manager:dashboard.datasetCount", {
                            count:
                              (project as any).dataset_count ??
                              project.datasets?.length ??
                              0,
                          }).toLowerCase()}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(project.status)}`}>
                        {translateProjectStatus(project.status)}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs hover:bg-primary/5 hover:text-primary"
                        onClick={() => navigate(`/manager/projects/${project.project_id}`)}
                      >
                        {t("common:actions.viewDetail")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <div className="text-xs text-muted-foreground">
                    {t("manager:dashboard.showingProjects", {
                      start: indexOfFirstProject + 1,
                      end: Math.min(indexOfLastProject, myProjects.length),
                      total: myProjects.length,
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 text-xs"
                    >
                      ← {t("common:actions.back")}
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
                      {t("common:actions.view")} →
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
        
        {/* Annotator Progress */}
        <Card className="p-6 bg-white/80">
          <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
            {t("manager:dashboard.annotatorProgress")}
          </h3>
          {isLoadingAnnotators ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              {t("common:states.loading")}
            </div>
          ) : annotators.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <div className="text-sm">
                {t("manager:dashboard.noAnnotators")}
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
                          {t("manager:dashboard.taskCount", {
                            count: progress.total,
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">{t("manager:dashboard.averageProgress")}</span>
                        <span className="text-xs font-bold text-foreground">{progress.avgProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                          style={{ width: `${progress.avgProgress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center p-2 rounded-lg bg-emerald-50">
                        <div className="text-lg font-bold text-emerald-600">
                          {progress.completed}
                        </div>
                        <div className="text-[10px] text-emerald-600/70">
                          {t("manager:dashboard.completed")}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-50">
                        <div className="text-lg font-bold text-amber-600">
                          {progress.inProgress}
                        </div>
                        <div className="text-[10px] text-amber-600/70">
                          {t("manager:dashboard.inProgress")}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-100">
                        <div className="text-lg font-bold text-slate-600">
                          {progress.pending}
                        </div>
                        <div className="text-[10px] text-slate-600/70">
                          {t("manager:dashboard.pending")}
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
