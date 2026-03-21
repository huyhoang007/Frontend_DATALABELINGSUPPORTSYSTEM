import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { datasetApi } from "../../api/datasetApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

const FORMATS = ["COCO JSON", "YOLO", "Pascal VOC", "CSV"];

type HistoryEntry = {
    id: string;
    datasetName: string;
    format: string;
    fileName: string;
    exportedAt: string;
    status: "COMPLETED" | "FAILED";
};

function downloadBlob(blob: Blob | ArrayBuffer | string, filename: string, mimeType: string) {
    const b = blob instanceof Blob ? blob : new Blob([blob], { type: mimeType });
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export tab embedded in Project Detail.
 * Fetches datasets for the project, then calls the real export API endpoints.
 */
export default function ProjectExport() {
    const { projectId } = useParams();

    const [datasets, setDatasets] = useState<any[]>([]);
    const [loadingDatasets, setLoadingDatasets] = useState(true);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
    const [format, setFormat] = useState("COCO JSON");
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    // Persist export history in sessionStorage so it survives navigation
    const storageKey = `export_history_project_${projectId}`;
    const [history, setHistory] = useState<HistoryEntry[]>(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    useEffect(() => {
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(history));
        } catch { /* ignore quota errors */ }
    }, [history, storageKey]);

    const loadDatasets = useCallback(async () => {
        if (!projectId) return;
        setLoadingDatasets(true);
        try {
            const data = await datasetApi.getDatasetsByProject(Number(projectId));
            const list = Array.isArray(data) ? data : [];
            setDatasets(list);
            if (list.length > 0 && !selectedDatasetId) {
                setSelectedDatasetId(String(list[0].datasetId ?? list[0].dataset_id ?? ""));
            }
        } catch {
            setDatasets([]);
        } finally {
            setLoadingDatasets(false);
        }
    }, [projectId]);

    useEffect(() => { loadDatasets(); }, [loadDatasets]);

    const handleExport = async () => {
        if (!selectedDatasetId) { setError("Vui lòng chọn dataset"); return; }
        setError("");
        setExporting(true);

        const datasetId = Number(selectedDatasetId);
        const statusParam = "APPROVED";
        const selectedDataset = datasets.find(
            (d) => String(d.datasetId ?? d.dataset_id) === selectedDatasetId
        );
        const datasetName = selectedDataset?.name ?? `Dataset #${datasetId}`;

        try {
            let blob: any;
            let ext: string;
            let mimeType: string;

            if (format === "COCO JSON") {
                blob = await datasetApi.exportCoco(datasetId, statusParam);
                ext = "json";
                mimeType = "application/json";
            } else if (format === "YOLO") {
                blob = await datasetApi.exportYolo(datasetId, statusParam);
                ext = "zip";
                mimeType = "application/zip";
            } else if (format === "Pascal VOC") {
                blob = await datasetApi.exportPascalVoc(datasetId, statusParam);
                ext = "zip";
                mimeType = "application/zip";
            } else {
                blob = await datasetApi.exportCsv(datasetId, statusParam);
                ext = "csv";
                mimeType = "text/csv";
            }

            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const formatSlug = format.replace(/\s+/g, "_").toLowerCase();
            const fileName = `dataset_${datasetId}_${formatSlug}_${dateStr}.${ext}`;

            downloadBlob(blob, fileName, mimeType);

            setHistory((prev) => [
                {
                    id: crypto.randomUUID(),
                    datasetName,
                    format,
                    fileName,
                    exportedAt: new Date().toISOString(),
                    status: "COMPLETED",
                },
                ...prev,
            ]);
        } catch (err: any) {
            const msg = err?.message || "Export thất bại — vui lòng thử lại";
            setError(msg);
            setHistory((prev) => [
                {
                    id: crypto.randomUUID(),
                    datasetName,
                    format,
                    fileName: "-",
                    exportedAt: new Date().toISOString(),
                    status: "FAILED",
                },
                ...prev,
            ]);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    {/* Dataset selector */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Dataset / Batch</label>
                        <select
                            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={selectedDatasetId}
                            onChange={(e) => setSelectedDatasetId(e.target.value)}
                            disabled={loadingDatasets}
                        >
                            {loadingDatasets && <option value="">Đang tải...</option>}
                            {!loadingDatasets && datasets.length === 0 && <option value="">Không có dataset</option>}
                            {datasets.map((d) => {
                                const id = d.datasetId ?? d.dataset_id;
                                return (
                                    <option key={id} value={String(id)}>
                                        {d.name ?? `Dataset #${id}`}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Format selector */}
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

                {/* Format description */}
                <p className="text-xs text-muted-foreground max-w-2xl">
                    {format === "COCO JSON" && "Xuất file JSON theo chuẩn COCO (images, annotations, categories). Phù hợp với hầu hết ML framework."}
                    {format === "YOLO" && "Xuất file ZIP gồm classes.txt, labels/*.txt (bbox chuẩn hóa 0-1) và ảnh gốc trong images/*."}
                    {format === "Pascal VOC" && "Xuất file ZIP gồm Annotations/*.xml (bndbox) và ảnh gốc trong JPEGImages/*."}
                    {format === "CSV" && "Xuất CSV phẳng — mỗi dòng là 1 annotation kèm tọa độ geometry thô."}
                </p>
                <p className="text-xs text-muted-foreground">Chỉ export các annotation đã được duyệt (APPROVED).</p>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                    variant="secondary"
                    onClick={handleExport}
                    disabled={exporting || !selectedDatasetId || loadingDatasets}
                    isLoading={exporting}
                >
                    <span className="material-symbols-outlined text-base mr-1">download</span>
                    Export
                </Button>
            </Card>

            {/* Session export history */}
            <Card className="p-6">
                <h2 className="text-base font-bold text-foreground mb-4">Lịch sử Export</h2>
                {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có bản export nào.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dataset</TableHead>
                                <TableHead>Định dạng</TableHead>
                                <TableHead>File</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-sm">{item.datasetName}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                            {item.format}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{item.fileName}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {new Date(item.exportedAt).toLocaleTimeString("vi-VN")}
                                    </TableCell>
                                    <TableCell>
                                        {item.status === "COMPLETED" ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                COMPLETED
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                FAILED
                                            </span>
                                        )}
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


