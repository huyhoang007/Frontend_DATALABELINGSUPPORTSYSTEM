import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { annotationApi } from "../../api/annotationApi";

/* ── Status tabs matching BE statuses ── */
const TABS = ["ALL", "PENDING", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"];

/* ── Status badge styles ── */
const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SUBMITTED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

interface AnnotatorDashboardProps {
  user: any;
}

const AnnotatorDashboard: React.FC<AnnotatorDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch assignments from BE API ── */
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await annotationApi.getMyAssignments();
      const apiList = Array.isArray(data) ? data : (data?.content || data?.data || []);
      console.log("[ANNOTATOR_DASHBOARD] API assignments:", apiList.length);
      setAssignments(apiList);
    } catch (err: any) {
      console.error("[ANNOTATOR_DASHBOARD] API failed", err);
      const status = err?.status;
      if (status === 401) {
        setError("Hết phiên đăng nhập — vui lòng đăng nhập lại.");
      } else if (status === 403) {
        setError("Bạn không có quyền xem danh sách task.");
      } else {
        setError(err?.message || "Không thể tải danh sách task từ server.");
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  /* ── Filtering ── */
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesTab = activeTab === "ALL" || (a.status || "").toUpperCase() === activeTab;
      const q = search.toLowerCase();
      const matchesSearch =
        String(a.assignmentId || "").includes(q) ||
        (a.projectName || "").toLowerCase().includes(q) ||
        (a.datasetName || "").toLowerCase().includes(q) ||
        (a.reviewerName || "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, assignments]);

  const handleOpen = (assignment: any) => {
    // Navigate using assignmentId (BE concept)
    navigate(`/annotator/task/${assignment.assignmentId}`);
  };

  /* ── Active count ── */
  const activeCount = assignments.filter((a) =>
    ["PENDING", "IN_PROGRESS", "REJECTED"].includes((a.status || "").toUpperCase())
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header is handled by the AnnotatorLayout (Sidebar + App Header), so simple page title here */}
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Chào mừng, <span className="text-primary font-semibold">{user?.full_name || user?.username || user?.name || "User"}</span>.
            {!loading && (
              <> Bạn có <span className="font-mono text-foreground">{activeCount}</span> nhiệm vụ cần xử lý.</>
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-xl text-emerald-500 font-bold">
                OK
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {assignments.filter(t => (t.status || '').toUpperCase() === 'COMPLETED').length}
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
                  {assignments.filter(t => (t.status || '').toUpperCase() === 'IN_PROGRESS').length}
                </h3>
                <p className="text-sm text-muted-foreground">Đang thực hiện</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-500/10 rounded-xl flex items-center justify-center text-xl text-slate-500">
                P
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">
                  {assignments.filter(t => (t.status || '').toUpperCase() === 'PENDING').length}
                </h3>
                <p className="text-sm text-muted-foreground">Chờ xử lý</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-muted rounded-lg border border-border flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                            px-3 py-1.5 rounded-[6px] text-[11px] font-bold uppercase tracking-wide transition-all
                            ${activeTab === tab
                    ? 'bg-background text-primary shadow-sm ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
                        `}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full md:w-72 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-muted-foreground text-[18px] group-focus-within:text-primary transition-colors">search</span>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="Search by project, dataset, or reviewer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined text-3xl text-muted-foreground animate-spin">progress_activity</span>
            <span className="ml-2 text-muted-foreground text-sm">Loading tasks...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
            <span className="material-symbols-outlined text-[16px] text-destructive">error</span>
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchAssignments} className="text-xs">Retry</Button>
          </div>
        )}

        {/* Task List Table */}
        {!loading && (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr className="hover:bg-transparent">
                  <th className="w-[80px] px-6 py-3">ID</th>
                  <th className="px-6 py-3">PROJECT</th>
                  <th className="px-6 py-3">DATASET</th>
                  <th className="px-6 py-3">REVIEWER</th>
                  <th className="w-[100px] px-6 py-3">PROGRESS</th>
                  <th className="px-6 py-3">STATUS</th>
                  <th className="text-right px-6 py-3">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => {
                  const status = (a.status || "PENDING").toUpperCase();
                  return (
                    <tr key={a.assignmentId} onClick={() => handleOpen(a)} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 group cursor-pointer hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          #{a.assignmentId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-sm text-foreground">{a.projectName || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{a.datasetName || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{a.reviewerName || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${a.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{a.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status as keyof typeof STATUS_STYLES] || "bg-muted text-muted-foreground"}`}>
                          {status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-right px-6 py-4">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                          {["PENDING", "REJECTED"].includes(status) && (
                            <Button size="sm" variant="primary" className="h-7 text-xs px-3" onClick={(e) => { e.stopPropagation(); handleOpen(a); }}>Start</Button>
                          )}
                          {status === "IN_PROGRESS" && (
                            <Button size="sm" variant="secondary" className="h-7 text-xs px-3 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" onClick={(e) => { e.stopPropagation(); handleOpen(a); }}>Continue</Button>
                          )}
                          {["SUBMITTED", "APPROVED", "COMPLETED"].includes(status) && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleOpen(a); }}>
                              <span className="material-symbols-outlined text-muted-foreground hover:text-foreground text-[20px]">visibility</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAssignments.length === 0 && (
                  <tr>
                    <td className="text-center py-16 text-muted-foreground" colSpan={7}>
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-muted-foreground/40 mb-3">assignment</span>
                        <h4 className="text-base font-semibold text-foreground mb-1">Chưa có nhiệm vụ nào</h4>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Manager sẽ phân công task cho bạn. Khi có task mới, bạn sẽ thấy tại đây.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Count */}
        {!loading && assignments.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Showing {filteredAssignments.length} of {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default AnnotatorDashboard;