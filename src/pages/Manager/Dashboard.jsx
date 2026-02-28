import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/layout/Sidebar";
import { Button } from "../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { PROJECTS, TASKS } from "../../services/mockData";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function ManagerDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    const handleAction = (action) => {
        if (action === "Create Project") {
            navigate("/manager/projects");
            return;
        }
        addToast(`${action} action triggered (Mock)`, "info");
    };

    const projectStats = PROJECTS.map(proj => {
        const projTasks = TASKS.filter(t => t.projectId === proj.id);
        const completed = projTasks.filter(t => t.status === "APPROVED").length;
        const progress = projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;
        return { ...proj, taskCount: projTasks.length, completed, progress };
    });

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />

            <main className="flex-1 ml-64 p-8 bg-background">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-h1 font-extrabold tracking-tight text-foreground">Overview</h1>
                        <p className="text-muted-foreground mt-1">Project performance and team velocity.</p>
                    </div>
                    <Button variant="primary" leftIcon="add" onClick={() => handleAction("Create Project")}>New Project</Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Total Projects", value: PROJECTS.length, icon: "folder", color: "text-manager-primary" },
                        { label: "Active Annotators", value: "8", icon: "group", color: "text-green-500" },
                        { label: "Avg Throughput", value: "342/hr", icon: "bolt", color: "text-orange-500" },
                        { label: "Quality Score", value: "98.2%", icon: "verified", color: "text-blue-500" },
                    ].map((kpi) => (
                        <div key={kpi.label} className="p-6 rounded-xl bg-card border border-border shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-micro font-bold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                                    <p className="text-h2 mt-2 font-mono sm:text-2xl text-foreground">{kpi.value}</p>
                                </div>
                                <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                                    <span className="material-symbols-outlined text-[24px]">{kpi.icon}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Projects Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-h3 text-foreground">Active Projects</h2>
                        <Button variant="ghost" size="sm">View All</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Tasks</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectStats.map((proj) => (
                                <TableRow key={proj.id} className="cursor-default">
                                    <TableCell>
                                        <p className="font-bold text-foreground">{proj.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">{proj.id}</p>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-border bg-muted text-muted-foreground">
                                            {proj.type}
                                        </span>
                                    </TableCell>
                                    <TableCell><span className="text-foreground">{proj.taskCount}</span></TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2 w-32">
                                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-manager-primary" style={{ width: `${proj.progress}%` }} />
                                            </div>
                                            <span className="text-micro font-bold w-8 text-right text-muted-foreground">{proj.progress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end space-x-1">
                                            <Button size="icon" variant="ghost" onClick={() => handleAction("Edit")}>
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleAction("Export")}>
                                                <span className="material-symbols-outlined text-[18px]">download</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-8">
                    {/* Recent Activity Mock */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-h3 mb-4 text-foreground">Initial Recent Activity</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-start space-x-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-border mt-2" />
                                    <div>
                                        <p className="text-foreground"><span className="font-bold text-annotator-primary">Annotator A</span> submitted 5 tasks in Project A.</p>
                                        <p className="text-micro text-muted-foreground">2 mins ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Status Mock */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-h3 mb-4 text-foreground">System Health</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-3 rounded bg-green-500/5 border border-green-500/10">
                                <span className="text-sm font-medium text-green-400 flex items-center"><span className="material-symbols-outlined mr-2 text-[18px]">check_circle</span> API Status</span>
                                <span className="text-micro font-bold uppercase text-green-500">Operational</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded bg-green-500/5 border border-green-500/10">
                                <span className="text-sm font-medium text-green-400 flex items-center"><span className="material-symbols-outlined mr-2 text-[18px]">database</span> DB Latency</span>
                                <span className="text-micro font-bold uppercase text-green-500">12ms</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
