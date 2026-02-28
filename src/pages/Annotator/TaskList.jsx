import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { BadgeStatus } from "../../components/ui/BadgeStatus";
import { TASKS } from "../../services/mockData";
import { useAuth } from "../../context/AuthContext";

const TABS = ["ALL", "TODO", "IN_PROGRESS", "REJECTED", "SUBMITTED", "APPROVED"];

export default function TaskList() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = React.useState("ALL");
    const [search, setSearch] = React.useState("");

    const filteredTasks = React.useMemo(() => {
        return TASKS.filter((task) => {
            const matchesTab = activeTab === "ALL" || task.status === activeTab;
            const matchesSearch = task.projectName.toLowerCase().includes(search.toLowerCase()) ||
                task.id.toLowerCase().includes(search.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [activeTab, search]);

    const handleAction = (task) => {
        navigate(`/annotator/task/${task.id}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 sm:p-8 font-sans">
            {/* Header */}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-border gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">My Tasks</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Welcome back, <span className="text-primary font-semibold">{user?.displayName || user?.name || "User"}</span>.
                        You have <span className="font-mono text-foreground">{TASKS.filter(t => ['TODO', 'IN_PROGRESS', 'REJECTED'].includes(t.status)).length}</span> active tasks.
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => logout()} leftIcon="logout">
                    Logout
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">

                {/* Status Tabs - Segmented Style */}
                <div className="inline-flex p-1 bg-muted rounded-lg border border-border">
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
                        placeholder="Search tasks by ID or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Task List Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead className="text-right">Last Updated</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTasks.map((task) => (
                            <TableRow key={task.id} onClick={() => handleAction(task)} className="group cursor-pointer hover:bg-muted/50">
                                <TableCell>
                                    <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                        {task.id}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-foreground">{task.projectName}</span>
                                        {/* Inline Reject Comment */}
                                        {task.status === 'REJECTED' && task.rejectComment && (
                                            <div className="mt-1 flex items-center text-destructive text-[11px] bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20 w-fit">
                                                <span className="material-symbols-outlined text-[12px] mr-1">warning</span>
                                                {task.rejectComment}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <BadgeStatus status={task.status} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'HIGH' ? 'bg-orange-500 shadow-sm' : 'bg-slate-400'}`} />
                                        <span className={`text-xs font-medium ${task.priority === 'HIGH' ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-muted-foreground text-xs font-mono">
                                        {new Date(task.lastUpdated).toLocaleDateString()}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                        {['TODO', 'REJECTED'].includes(task.status) && (
                                            <Button size="sm" variant="primary" className="h-7 text-xs px-3" onClick={(e) => { e.stopPropagation(); handleAction(task); }}>Start</Button>
                                        )}
                                        {task.status === 'IN_PROGRESS' && (
                                            <Button size="sm" variant="secondary" className="h-7 text-xs px-3 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" onClick={(e) => { e.stopPropagation(); handleAction(task); }}>Continue</Button>
                                        )}
                                        {['SUBMITTED', 'APPROVED'].includes(task.status) && (
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleAction(task); }}>
                                                <span className="material-symbols-outlined text-muted-foreground hover:text-foreground text-[20px]">visibility</span>
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredTasks.length === 0 && (
                            <TableRow>
                                <TableCell className="text-center py-12 text-muted-foreground" colSpan={6}>
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                        <p>No tasks found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
