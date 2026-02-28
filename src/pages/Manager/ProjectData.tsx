import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { datasetApi } from "../../api/datasetApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

/**
 * Data tab embedded in Project Detail.
 * projectId comes from URL params (required).
 */
export default function ProjectData() {
    const { projectId } = useParams();
    const numericProjectId = Number(projectId);
    const [batchName, setBatchName] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [datasets, setDatasets] = useState<any[]>([]);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [error, setError] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [loadingDatasets, setLoadingDatasets] = useState(true);

    const loadDatasets = useCallback(async () => {
        if (!numericProjectId) return;
        setLoadingDatasets(true);
        try {
            const data = await datasetApi.getDatasetsByProject(numericProjectId);
            setDatasets(Array.isArray(data) ? data : []);
        } catch {
            setDatasets([]);
        } finally {
            setLoadingDatasets(false);
        }
    }, [numericProjectId]);

    useEffect(() => { loadDatasets(); }, [loadDatasets]);

    const handleFiles = (newFiles: FileList) => {
        setFiles((prev) => [...prev, ...Array.from(newFiles)]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    };

    const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / 1048576).toFixed(1) + " MB";
    };

    const handleUpload = async () => {
        if (!batchName.trim() || files.length === 0) return;
        setStatus("uploading");
        setError("");
        try {
            await datasetApi.createDataset(numericProjectId, batchName.trim(), files);
            setStatus("success");
            setBatchName("");
            setFiles([]);
            loadDatasets();
            setTimeout(() => setStatus("idle"), 3000);
        } catch (err: any) {
            setStatus("error");
            setError(err?.message || "Upload thất bại");
        }
    };

    const canUpload = batchName.trim() && files.length > 0 && status !== "uploading";

    return (
        <div className="space-y-6">
            <Card className="p-6 space-y-4">
                {/* Batch Name */}
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Tên Batch</label>
                    <Input placeholder="VD: Human_Images_v1" value={batchName} onChange={(e) => setBatchName(e.target.value)} maxLength={100} />
                </div>

                {/* Dropzone */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-input-data")?.click()}
                >
                    <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">cloud_upload</span>
                    <p className="text-sm text-muted-foreground">
                        Kéo thả file vào đây hoặc <span className="text-primary font-medium">chọn file</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF, CSV, ZIP</p>
                    <input id="file-input-data" type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.csv,.zip" className="hidden"
                        onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); (e.target as any).value = ""; }} />
                </div>

                {/* File list */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">{files.length} file đã chọn</p>
                        <div className="max-h-40 overflow-auto space-y-1">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-muted/50 rounded text-sm">
                                    <span className="truncate text-foreground">{f.name}</span>
                                    <div className="flex items-center gap-2 ml-2 shrink-0">
                                        <span className="text-muted-foreground text-xs">{formatSize(f.size)}</span>
                                        <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload button */}
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={handleUpload} disabled={!canUpload} isLoading={status === "uploading"}>
                        <span className="material-symbols-outlined text-base mr-1">upload</span>Upload
                    </Button>
                    {status === "success" && <span className="text-sm text-green-600">✓ Upload thành công</span>}
                    {status === "error" && <span className="text-sm text-destructive">{error}</span>}
                </div>
            </Card>

            {/* Dataset history */}
            <Card className="p-6">
                <h2 className="text-base font-bold text-foreground mb-4">Danh sách Batch</h2>
                {loadingDatasets ? (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                ) : datasets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có batch nào.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Batch Name</TableHead>
                                <TableHead>Files</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {datasets.map((ds: any) => (
                                <TableRow key={ds.datasetId}>
                                    <TableCell>{ds.name}</TableCell>
                                    <TableCell>{ds.totalItems}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ds.status === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                ds.status === "FAILED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            }`}>{ds.status}</span>
                                    </TableCell>
                                    <TableCell>{ds.createdAt ? new Date(ds.createdAt).toLocaleDateString("vi-VN") : "—"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
