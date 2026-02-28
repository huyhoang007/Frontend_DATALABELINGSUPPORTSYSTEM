import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Workspace3Column } from "../../components/layout/WorkspaceLayout";
import { Button } from "../../components/ui/Button";
import { ModalDialog } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { TASKS } from "../../services/mockData";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../utils/cn";

export default function ReviewWorkspace() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const task = TASKS.find(t => t.id === taskId);
    const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
    const [rejectComment, setRejectComment] = React.useState("");
    const [rejectErrorType, setRejectErrorType] = React.useState("accuracy");

    if (!task) return <div>Task not found</div>;

    const handleApprove = () => {
        addToast(`Task ${task.id} approved successfully`, "success");
        navigate("/reviewer/queue");
    };

    const handleReject = () => {
        if (!rejectComment.trim()) {
            addToast("Reject comment is required.", "error");
            return;
        }
        addToast(`Task ${task.id} rejected. Sent back to annotator.`, "success"); // In a real app we'd update state
        setIsRejectModalOpen(false);
        navigate("/reviewer/queue");
    };

    // Simplified Panels since we are reusing concepts from Annotator Workspace but read-only
    const LeftPanel = (
        <div className="p-4 bg-card h-full">
            <Button variant="ghost" size="sm" onClick={() => navigate("/reviewer/queue")} leftIcon="arrow_back" className="mb-4 text-muted-foreground hover:text-foreground">
                Back to Queue
            </Button>
            <div className="bg-muted/10 p-4 rounded-xl border border-border mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Project</p>
                <h3 className="text-lg font-bold text-foreground mb-4">{task.projectName}</h3>

                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Submitter</p>
                <div className="flex items-center mb-4">
                    <div className="w-6 h-6 rounded-full bg-annotator-primary text-white flex items-center justify-center text-[10px] font-bold mr-2 ring-2 ring-background">
                        {task.assignee.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{task.assignee}</span>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Time Spent</p>
                <p className="font-mono text-sm text-muted-foreground">45m 12s</p>
            </div>
        </div>
    );

    const CenterPanel = (
        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-transparent">
            <div
                className="relative bg-black shadow-2xl border border-white/10 ring-1 ring-black/40 w-[800px] h-[600px]"
            >
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 select-none">
                    <div className="text-center opacity-30">
                        <span className="material-symbols-outlined text-6xl mb-4">image</span>
                        <p className="text-xs font-mono tracking-wide uppercase">Review Mode</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const RightPanel = (
        <div className="flex flex-col h-full bg-card">
            <div className="flex-1 p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Guidelines</h4>
                <div className="text-sm text-muted-foreground space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="flex gap-2"><span className="text-annotator-primary">1.</span> Check for tight bounding boxes.</p>
                    <p className="flex gap-2"><span className="text-annotator-primary">2.</span> Ensure no occlusion is ignored.</p>
                    <p className="flex gap-2"><span className="text-annotator-primary">3.</span> Verify correct class labels.</p>
                </div>
            </div>

            {/* Approve / Reject Bar */}
            <div className="p-6 border-t border-border bg-card space-y-3 z-10">
                <Button variant="primary" className="w-full bg-green-600 hover:bg-green-500 focus:ring-green-600 h-10 font-bold shadow-lg shadow-green-900/20" leftIcon="check" onClick={handleApprove}>
                    Approve (A)
                </Button>
                <Button variant="destructive" className="w-full h-10 border-white/10 hover:bg-white/5" leftIcon="close" onClick={() => setIsRejectModalOpen(true)}>
                    Reject (R)
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <Workspace3Column left={LeftPanel} center={CenterPanel} right={RightPanel} leftWidth="w-64" rightWidth="w-72" />

            <ModalDialog
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                title="Reject Task"
                actions={
                    <>
                        <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Confirm Reject</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm">Please provide a reason for rejecting this task. This will be sent to the annotator.</p>

                    <div className="space-y-1">
                        <label className="text-caption font-bold">Error Type</label>
                        <div className="flex space-x-2">
                            {['Accuracy', 'Missing', 'Wrong Class'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setRejectErrorType(type.toLowerCase())}
                                    className={cn(
                                        "px-3 py-1 text-xs rounded border border-border",
                                        rejectErrorType === type.toLowerCase() ? "bg-red-500/10 text-red-500 border-red-500" : "text-muted-foreground"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-caption font-bold">Comment *</label>
                        <textarea
                            className="w-full h-24 rounded-md border border-input bg-background p-3 text-sm focus:ring-1 focus:ring-red-500 focus:outline-none placeholder:text-muted-foreground text-foreground"
                            placeholder="Describe what needs to be fixed..."
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                        />
                    </div>
                </div>
            </ModalDialog>
        </>
    );
}
