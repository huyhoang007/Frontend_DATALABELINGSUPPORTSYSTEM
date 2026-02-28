import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
        { id: crypto.randomUUID(), projectId: "1", projectName: "Human Detection", format: "COCO JSON", fileName: "human_det_coco_20260220.json", createdAt: "2026-02-20T15:30:00", status: "COMPLETED" },
        { id: crypto.randomUUID(), projectId: "2", projectName: "Vehicle Detection", format: "YOLO", fileName: "vehicle_yolo_20260218.zip", createdAt: "2026-02-18T10:00:00", status: "COMPLETED" },
        { id: crypto.randomUUID(), projectId: "3", projectName: "Animal Classification", format: "CSV", fileName: "animal_cls_20260215.csv", createdAt: "2026-02-15T08:45:00", status: "COMPLETED" },
    ];
}

/**
 * Export tab embedded in Project Detail.
 * projectId from URL params -> auto-scoped, no dropdown.
 */
export default function ProjectExport() {
    const { projectId } = useParams();
    const [format, setFormat] = useState("COCO JSON");
    const [includeImages, setIncludeImages] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const all = getMockData(STORAGE_KEY, seedExportHistory);
        setHistory(projectId ? all.filter((h: any) => h.projectId === projectId) : all);
    }, [projectId]);

    const handleExport = () => {
        setExporting(true);
        // TODO_BACKEND: Replace with real export API call
        setTimeout(() => {
            const ext = format === "COCO JSON" ? "json" : format === "YOLO" ? "zip" : format === "Pascal VOC" ? "xml" : "csv";
            const newEntry = {
                id: crypto.randomUUID(),
                projectId: projectId,
                projectName: `Project #${projectId}`,
                format,
                fileName: `project_${projectId}_${format.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.${ext}`,
                createdAt: new Date().toISOString(),
                status: "COMPLETED",
            };

            const allHistory = getMockData(STORAGE_KEY, seedExportHistory);
            allHistory.unshift(newEntry);
            setMockData(STORAGE_KEY, allHistory);
            setHistory(allHistory.filter((h: any) => h.projectId === projectId));
            setExporting(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Định dạng</label>
                        <select
                            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={format} onChange={(e) => setFormat(e.target.value)}>
                            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="includeImagesExport" checked={includeImages} onChange={(e) => setIncludeImages(e.target.checked)} className="rounded border-border" />
                    <label htmlFor="includeImagesExport" className="text-sm text-foreground">Bao gồm ảnh gốc</label>
                </div>

                <Button variant="secondary" onClick={handleExport} disabled={exporting} isLoading={exporting}>
                    <span className="material-symbols-outlined text-base mr-1">download</span>Export
                </Button>
            </Card>

            <Card className="p-6">
                <h2 className="text-base font-bold text-foreground mb-4">Lịch sử Export</h2>
                {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có bản export nào cho dự án này.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File</TableHead>
                                <TableHead>Định dạng</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Download</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium font-mono text-xs">{item.fileName}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{item.format}</span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{item.status}</span>
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
