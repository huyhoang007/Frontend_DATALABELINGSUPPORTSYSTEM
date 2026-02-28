import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Workspace3Column } from "../../components/layout/WorkspaceLayout";
import { Button } from "../../components/ui/Button";
import { TASKS } from "../../services/mockData";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../utils/cn";

// Mock Object Classes
const CLASSES = [
    { id: 1, name: "Traffic Light", color: "#ef4444" },
    { id: 2, name: "Stop Sign", color: "#f97316" },
    { id: 3, name: "Car", color: "#3b82f6" },
    { id: 4, name: "Pedestrian", color: "#8b5cf6" },
];

// Mock Task Items (Images within the task)
const MOCK_TOTAL_IMAGES = 20;

export default function Workspace() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const task = TASKS.find(t => t.id === taskId);

    // Tools State
    const [activeTool, setActiveTool] = React.useState("select");
    const [zoom, setZoom] = React.useState(100);

    // Navigation State
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    // Progress State (simulated)
    const [savedIndices, setSavedIndices] = React.useState(new Set([0, 1, 2, 3, 4])); // Mock some initial progress

    // Annotations State (mock load per image)
    const [annotations, setAnnotations] = React.useState([
        { id: 1, classId: 1, x: 200, y: 150, w: 100, h: 200 }
    ]);

    // Label Row State (Visibility & Lock)
    const [labelState, setLabelState] = React.useState({}); // { annId: { hidden: bool, locked: bool } }

    if (!task) {
        return <div className="p-10 text-center">Task not found</div>;
    }

    const progressPercent = Math.round((savedIndices.size / MOCK_TOTAL_IMAGES) * 100);

    const toggleLabelState = (annId, key) => {
        setLabelState(prev => ({
            ...prev,
            [annId]: {
                ...prev[annId],
                [key]: !prev[annId]?.[key]
            }
        }));
    };

    const handleSave = () => {
        // Update progress
        setSavedIndices(prev => {
            const next = new Set(prev);
            next.add(currentImageIndex);
            return next;
        });

        // TODO_BACKEND: save draft endpoint
        // POST/PUT /tasks/:id/draft

        addToast("Đã lưu nháp", "success");
    };

    const handleSubmit = () => {
        addToast("Task submitted for review", "success");
        navigate("/annotator/tasks");
    };

    const handleNavigate = (direction) => {
        let newIndex = currentImageIndex;
        if (direction === 'first') newIndex = 0;
        if (direction === 'prev') newIndex = Math.max(0, currentImageIndex - 1);
        if (direction === 'next') newIndex = Math.min(MOCK_TOTAL_IMAGES - 1, currentImageIndex + 1);
        if (direction === 'last') newIndex = MOCK_TOTAL_IMAGES - 1;

        if (newIndex !== currentImageIndex) {
            // Auto save draft logic could go here
            // addToast("Auto saved", "info"); 
            setCurrentImageIndex(newIndex);
            // In real app, we would load annotations for newIndex here
        }
    };

    // --- Left Column: Context / Task List ---
    const LeftPanel = (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-border bg-card">
                <Button variant="ghost" size="sm" onClick={() => navigate("/annotator/tasks")} leftIcon="arrow_back" className="mb-3 -ml-2 text-muted-foreground hover:text-foreground">
                    Back to List
                </Button>
                <div className="space-y-1">
                    <h2 className="text-lg font-bold tracking-tight text-foreground truncate">{task.projectName}</h2>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{task.id}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Progress Block */}
                <div className="mx-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progress</span>
                        <span className="text-[10px] font-mono font-bold text-annotator-primary">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-annotator-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="mt-2 text-right">
                        <span className="text-[10px] text-muted-foreground">{savedIndices.size}/{MOCK_TOTAL_IMAGES} ảnh</span>
                    </div>
                </div>

                <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Current Batch</p>
                {TASKS.filter(t => t.projectId === task.projectId).map((t) => (
                    <div
                        key={t.id}
                        onClick={() => navigate(`/annotator/task/${t.id}`)}
                        className={cn(
                            "flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent",
                            t.id === taskId
                                ? "bg-annotator-primary/10 border-annotator-primary/20 shadow-sm"
                                : "hover:bg-muted hover:border-border"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center mr-3 transition-colors",
                            t.id === taskId ? "bg-annotator-primary/20 text-annotator-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
                        )}>
                            <span className="material-symbols-outlined text-[16px]">image</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-medium truncate mb-0.5", t.id === taskId ? "text-annotator-primary" : "text-muted-foreground group-hover:text-foreground")}>
                                {t.id}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className={cn("w-1.5 h-1.5 rounded-full", t.status === 'TODO' ? 'bg-gray-500' : 'bg-green-500')} />
                                <span className="text-[10px] text-muted-foreground lowercase">{t.status.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- Center Column: Canvas ---
    const CenterPanel = (
        <>
            {/* Image Navigation Control */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-card/90 backdrop-blur border border-border rounded-lg p-1 shadow-sm">
                <button
                    onClick={() => handleNavigate('first')}
                    disabled={currentImageIndex === 0}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
                </button>
                <button
                    onClick={() => handleNavigate('prev')}
                    disabled={currentImageIndex === 0}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                <span className="font-mono text-xs font-bold w-16 text-center select-none">
                    {currentImageIndex + 1} / {MOCK_TOTAL_IMAGES}
                </span>

                <button
                    onClick={() => handleNavigate('next')}
                    disabled={currentImageIndex === MOCK_TOTAL_IMAGES - 1}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button
                    onClick={() => handleNavigate('last')}
                    disabled={currentImageIndex === MOCK_TOTAL_IMAGES - 1}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_right</span>
                </button>
            </div>

            {/* Floating Toolbar Island */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                <div className="bg-popover/90 backdrop-blur-md border border-border rounded-full p-1.5 flex items-center shadow-xl shadow-black/5 ring-1 ring-black/5">
                    {[
                        { id: "select", icon: "arrow_selector_tool", label: "Select (V)" },
                        { id: "pan", icon: "pan_tool", label: "Pan (Space)" },
                        { id: "box", icon: "crop_free", label: "Box (R)" },
                        { id: "polygon", icon: "pentagon", label: "Poly (P)" },
                    ].map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                                activeTool === tool.id
                                    ? "bg-annotator-primary text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            title={tool.label}
                        >
                            <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
                        </button>
                    ))}
                    <div className="w-px h-4 bg-border mx-2" />
                    <div className="flex items-center gap-1 px-1">
                        <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="text-[10px] font-mono font-bold w-10 text-center text-muted-foreground tabular-nums select-none">{zoom}%</span>
                        <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-transparent">
                <div
                    className="relative bg-black shadow-2xl transition-transform duration-200 ease-out border border-white/10 ring-1 ring-black/40"
                    style={{ width: 800 * (zoom / 100), height: 600 * (zoom / 100) }}
                >
                    {/* Mock Image Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 select-none">
                        <div className="text-center opacity-30">
                            <span className="material-symbols-outlined text-6xl mb-4">image</span>
                            <p className="text-xs font-mono tracking-wide uppercase">Image {currentImageIndex + 1}</p>
                            <p className="text-[10px] mt-1">{task.id}</p>
                        </div>
                    </div>

                    {/* Annotation Overlay (Mock) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {annotations
                            .filter(ann => !labelState[ann.id]?.hidden)
                            .map(ann => (
                                <rect
                                    key={ann.id}
                                    x={`${(ann.x / 800) * 100}%`}
                                    y={`${(ann.y / 600) * 100}%`}
                                    width={`${(ann.w / 800) * 100}%`}
                                    height={`${(ann.h / 600) * 100}%`}
                                    fill="none"
                                    stroke={CLASSES.find(c => c.id === ann.classId)?.color}
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                    className={cn(
                                        "drop-shadow-md transition-opacity duration-200",
                                        labelState[ann.id]?.locked ? "stroke-dashed" : "" // Visual cue for locked
                                    )}
                                />
                            ))}
                    </svg>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="h-14 border-t border-border bg-card flex items-center justify-between px-6 z-10">
                <div className="flex space-x-6 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span><strong className="text-foreground">V</strong> Select</span>
                    <span><strong className="text-foreground">R</strong> Box</span>
                    <span><strong className="text-foreground">Space</strong> Pan</span>
                </div>
                <div className="flex space-x-3">
                    <Button variant="secondary" onClick={handleSave} className="h-9 text-xs">Lưu</Button>
                    <Button variant="primary" onClick={handleSubmit} className="h-9 text-xs font-bold px-6 shadow-lg shadow-annotator-primary/20">Submit</Button>
                </div>
            </div>
        </>
    );

    // --- Right Column: Classes & Annotations ---
    const RightPanel = (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-border">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Classes</h4>
                <div className="grid grid-cols-1 gap-2">
                    {CLASSES.map(cls => (
                        <button key={cls.id} className="flex items-center space-x-2 px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted hover:border-muted-foreground/20 transition-all text-left group">
                            <span className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ background: cls.color }} />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{cls.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground ml-auto bg-muted px-1.5 rounded">1</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Annotations ({annotations.length})</h4>
                <div className="space-y-2">
                    {annotations.map((ann, i) => {
                        const cls = CLASSES.find(c => c.id === ann.classId);
                        const isHidden = labelState[ann.id]?.hidden;
                        const isLocked = labelState[ann.id]?.locked;

                        return (
                            <div key={ann.id} className={cn(
                                "p-3 rounded-lg border flex items-center group transition-all",
                                isHidden ? "bg-muted/10 border-transparent opacity-60" : "bg-muted/30 border-border hover:border-annotator-primary/30 hover:bg-muted/60"
                            )}>
                                <span className="text-[10px] font-mono text-muted-foreground w-6 opacity-50">#{i + 1}</span>
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cls.color }} />
                                        <p className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate">{cls.name}</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground pl-3.5">Bounding Box</p>
                                </div>

                                {/* Row Tools */}
                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-[16px] text-muted-foreground" title="Bounding Box">crop_free</span>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleLabelState(ann.id, 'hidden'); }}
                                        className="p-1 hover:bg-background rounded hover:text-foreground text-muted-foreground transition-colors"
                                        title={isHidden ? "Show" : "Hide"}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{isHidden ? "visibility_off" : "visibility"}</span>
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleLabelState(ann.id, 'locked'); }}
                                        className={cn(
                                            "p-1 hover:bg-background rounded transition-colors",
                                            isLocked ? "text-annotator-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title={isLocked ? "Unlock" : "Lock"}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{isLocked ? "lock" : "lock_open"}</span>
                                    </button>

                                    <button className="p-1 hover:bg-background rounded hover:text-destructive text-muted-foreground transition-colors" disabled={isLocked}>
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );

    return <Workspace3Column left={LeftPanel} center={CenterPanel} right={RightPanel} rightWidth="w-[420px]" />;
}
