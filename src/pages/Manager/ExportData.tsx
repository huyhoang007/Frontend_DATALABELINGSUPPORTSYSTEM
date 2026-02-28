import React, { useState, useEffect } from "react";
import { projectApi } from "../../api/projectApi";
import { getMockData, setMockData } from "../../utils/mockStorage";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

// TODO_BACKEND: Replace with real API when available

const STORAGE_KEY = "mock_export_history";
const FORMATS = ["COCO JSON", "YOLO", "Pascal VOC", "CSV"];

function seedExportHistory() {
    return [
        { id: crypto.randomUUID(), projectName: "Human Detection", format: "COCO JSON", fileName: "human_det_coco_20260220.json", createdAt: "2026-02-20T15:30:00", status: "COMPLETED" },
        { id: crypto.randomUUID(), projectName: "Vehicle Detection", format: "YOLO", fileName: "vehicle_yolo_20260218.zip", createdAt: "2026-02-18T10:00:00", status: "COMPLETED" },
        { id: crypto.randomUUID(), projectName: "Animal Classification", format: "CSV", fileName: "animal_cls_20260215.csv", createdAt: "2026-02-15T08:45:00", status: "COMPLETED" },
    ];
}

export default function ExportData() {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedProjectName, setSelectedProjectName] = useState("");
    const [format, setFormat] = useState("COCO JSON");
    const [includeImages, setIncludeImages] = useState(false);
    const [history, setHistory] = useState([]);
    const [exporting, setExporting] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await projectApi.getMyProjects();
                setProjects(Array.isArray(data) ? data : []);
            } catch {
                setProjects([]);
            } finally {
                setLoadingProjects(false);
            }
        })();
        setHistory(getMockData(STORAGE_KEY, seedExportHistory));
    }, []);

    const handleProjectChange = (e) => {
        const id = e.target.value;
        setSelectedProjectId(id);
        const proj = projects.find((p) => String(p.project_id ?? p.projectId) === id);
        setSelectedProjectName(proj?.project_name ?? proj?.name ?? `Project #${id}`);
    };

    const handleExport = () => {
        if (!selectedProjectId) return;
        setExporting(true);

        // TODO_BACKEND: Replace with real export API call
        setTimeout(() => {
            const ext = format === "COCO JSON" ? "json" : format === "YOLO" ? "zip" : format === "Pascal VOC" ? "xml" : "csv";
            const newEntry = {
                id: crypto.randomUUID(),
                projectName: selectedProjectName,
                format: format,
                fileName: `${selectedProjectName.replace(/\s+/g, "_").toLowerCase()}_${format.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.${ext}`,
                createdAt: new Date().toISOString(),
                status: "COMPLETED",
            };
            const updated = [newEntry, ...history];
            setHistory(updated);
            setMockData(STORAGE_KEY, updated);
            setExporting(false);
        }, 1500);
    };

    return (
        <div className="p-8 space-y-6 max-w-5xl">
            <h1 className="text-2xl font-bold text-foreground">Export</h1>

            {/* Export Config */}
            <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Dự án</label>
                        <select
                            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={selectedProjectId}
                            onChange={handleProjectChange}
                            disabled={loadingProjects}
                        >
                            <option value="">-- Chọn dự án --</option>
                            {projects.map((p) => (
                                <option key={p.project_id ?? p.projectId} value={p.project_id ?? p.projectId}>
                                    {p.project_name ?? p.name ?? `Project #${p.project_id ?? p.projectId}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Định dạng</label>
                        <select
                            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                        >
                            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="includeImages"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="rounded border-border"
                    />
                    <label htmlFor="includeImages" className="text-sm text-foreground">Bao gồm ảnh gốc</label>
                </div>

                <Button
                    variant="secondary"
                    onClick={handleExport}
                    disabled={!selectedProjectId || exporting}
                    isLoading={exporting}
                >
                    <span className="material-symbols-outlined text-base mr-1">download</span>
                    Export
                </Button>
            </Card>

            {/* Export History */}
            <Card className="p-6">
                <h2 className="text-base font-bold text-foreground mb-4">Lịch sử Export</h2>
                {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có bản export nào.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File</TableHead>
                                <TableHead>Dự án</TableHead>
                                <TableHead>Định dạng</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Download</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium font-mono text-xs">{item.fileName}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.projectName}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{item.format}</span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            {item.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" disabled title="API chưa hỗ trợ download">
                                            <span className="material-symbols-outlined text-base">download</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
