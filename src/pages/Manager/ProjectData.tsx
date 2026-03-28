import React, { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { datasetApi } from "../../api/datasetApi";
import { assignmentApi } from "../../api/assignmentApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/Table";

const toArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
};

const computeBatchStatus = (assignments: any[]): string => {
  if (!assignments || assignments.length === 0) return "PENDING";
  const statuses = assignments.map((a: any) => a.status);
  if (statuses.every((s: string) => s === "APPROVED")) return "COMPLETED";
  if (statuses.some((s: string) => s === "REJECTED")) return "REJECTED";
  if (statuses.some((s: string) => ["IN_PROGRESS", "SUBMITTED", "RE_SUBMITTED"].includes(s))) return "IN_PROGRESS";
  return "PENDING";
};

const BATCH_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING:     { label: "Cho xu ly",  className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  IN_PROGRESS: { label: "Dang xu ly", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  REJECTED:    { label: "Bi tu choi", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  COMPLETED:   { label: "Hoan thanh", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = 100 * 1024 * 1024;
const ACCEPTED_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];
export default function ProjectData() {
  const { projectId } = useParams();
  const numericProjectId = Number(projectId);
  const { project: parentProject } = (useOutletContext() as any) || {};
  
  const isProjectCompleted = parentProject?.status?.toLowerCase() === "completed";

  const [batchName, setBatchName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");
  const [datasets, setDatasets] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const loadDatasets = useCallback(async () => {
    if (!numericProjectId) return;
    setLoadingDatasets(true);
    try {
      const [dsRes, asRes] = await Promise.all([
        datasetApi.getDatasetsByProject(numericProjectId),
        assignmentApi.getAssignmentsByProject(numericProjectId),
      ]);
      const dsArr = toArray(dsRes);
      const asArr = toArray(asRes);
      console.log("[ProjectData] datasets:", dsArr, "assignments:", asArr);
      const asByDataset: Record<number, any[]> = {};
      asArr.forEach((a: any) => {
        if (!asByDataset[a.datasetId]) asByDataset[a.datasetId] = [];
        asByDataset[a.datasetId].push(a);
      });
      const enriched = dsArr.map((ds: any) => ({
        ...ds,
        computedStatus: computeBatchStatus(asByDataset[ds.datasetId] || []),
      }));
      setDatasets(enriched);
    } catch {
      setDatasets([]);
    } finally {
      setLoadingDatasets(false);
    }
  }, [numericProjectId]);

  useEffect(() => { loadDatasets(); }, [loadDatasets]);

  const validateFile = (f: File): string | null => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) return `"${f.name}" -- loai file khong duoc ho tro`;
    if (f.size > MAX_FILE_SIZE) return `"${f.name}" -- vuot qua gioi han 10 MB`;
    return null;
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const errors: string[] = [];
    const valid: File[] = [];
    arr.forEach((f) => { const err = validateFile(f); if (err) errors.push(err); else valid.push(f); });
    if (errors.length > 0) showToast(errors[0]);
    if (valid.length > 0) setFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const readAllFilesFromEntry = async (entry: any): Promise<File[]> => {
    if (entry.isFile) return new Promise((resolve) => entry.file((f: File) => resolve([f])));
    if (entry.isDirectory) {
      const reader = entry.createReader();
      const allFiles: File[] = [];
      await new Promise<void>((resolve) => {
        const readBatch = () => {
          reader.readEntries(async (entries: any[]) => {
            if (!entries.length) { resolve(); return; }
            const nested = await Promise.all(entries.map(readAllFilesFromEntry));
            allFiles.push(...nested.flat()); readBatch();
          });
        };
        readBatch();
      });
      return allFiles;
    }
    return [];
  };

  const handleFolderDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    if (!e.dataTransfer.items) return;
    const items = Array.from(e.dataTransfer.items);
    const allFiles: File[] = [];
    let folderName = "";
    for (const item of items) {
      const entry = (item as any).webkitGetAsEntry?.();
      if (entry) {
        if (entry.isDirectory && !folderName) folderName = entry.name;
        const ef = await readAllFilesFromEntry(entry);
        allFiles.push(...ef.filter((f: File) => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(f.name)));
      }
    }
    if (allFiles.length > 0) { handleFiles(allFiles); if (!batchName.trim() && folderName) setBatchName(folderName); }
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const batchOk = batchName.trim().length > 0;
  const filesOk = files.length > 0;
  const notUploading = status !== "uploading";
  const canUpload = !isProjectCompleted && batchOk && filesOk && notUploading;
  const disabledReason = isProjectCompleted ? "Du an da hoan thanh - chi co the xuat du lieu" : !batchOk ? "Nhap ten batch de upload" : !filesOk ? "Chon it nhat 1 file" : !notUploading ? "Dang upload..." : null;

  const handleUpload = async () => {
    if (!batchOk) { showToast("Vui long nhap ten batch"); return; }
    if (!filesOk) { showToast("Vui long chon file de upload"); return; }
    if (totalSize > MAX_REQUEST_SIZE) { showToast("Tong dung luong vuot qua gioi han 100 MB"); return; }
    setStatus("uploading"); setError(""); setProgress(0);
    try {
      await datasetApi.createDataset(numericProjectId, batchName.trim(), files,
        (event: any) => { if (event.total) setProgress(Math.round((event.loaded / event.total) * 100)); });
      setStatus("success"); setProgress(100); setBatchName(""); setFiles([]);
      showToast("Upload thanh cong!"); loadDatasets(); setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      const s = err?.status;
      if (s === 413) setError("File qua lon");
      else if (s === 415) setError("Dinh dang file khong duoc ho tro");
      else if (s === 401) setError("Het phien dang nhap");
      else if (s === 403) setError("Khong co quyen upload");
      else setError(err?.message || "Upload that bai");
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg">
          {toast}
        </div>
      )}
      
      {isProjectCompleted && (
        <div className="px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-base mt-0.5">lock</span>
          <div>
            <p className="font-medium text-orange-900 dark:text-orange-200 text-sm">Du an COMPLETED - Chi co the xuat du lieu</p>
            <p className="text-xs text-orange-800 dark:text-orange-300 mt-1">Du an da hoan thanh tat ca cac tac vu. Chi co the xuat du lieu, cac chuc nang khac bi khoa.</p>
          </div>
        </div>
      )}
      
      <Card className="p-6 space-y-4">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-muted-foreground mb-1">Ten Batch</label>
          <Input placeholder="VD: Human_Images_v1" value={batchName} onChange={(e: any) => setBatchName(e.target.value)} maxLength={100} />
        </div>
        <div className="flex gap-2">
          {(["files", "folder"] as const).map((mode) => (
            <button key={mode} type="button" disabled={isProjectCompleted} onClick={() => { setUploadMode(mode); setFiles([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${isProjectCompleted ? "opacity-50 cursor-not-allowed" : ""} ${uploadMode === mode ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-muted-foreground"}`}>
              <span className="material-symbols-outlined text-base">{mode === "files" ? "insert_drive_file" : "folder_open"}</span>
              {mode === "files" ? "Chon file" : "Chon thu muc"}
            </button>
          ))}
        </div>
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isProjectCompleted ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${dragActive && !isProjectCompleted ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
          onDragOver={(e) => { if (!isProjectCompleted) { e.preventDefault(); setDragActive(true); } }}
          onDragLeave={() => setDragActive(false)}
          onDrop={!isProjectCompleted ? (uploadMode === "folder" ? handleFolderDrop : handleDrop) : undefined}
          onClick={() => !isProjectCompleted && document.getElementById(uploadMode === "folder" ? "folder-input-data" : "file-input-data")?.click()}>
          <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">{uploadMode === "folder" ? "folder_open" : "cloud_upload"}</span>
          <p className="text-sm text-muted-foreground">Keo tha file vao day hoac <span className="text-primary font-medium">chon file</span></p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG, GIF, BMP, WEBP -- toi da 10 MB/file, 100 MB tong</p>
          <input id="file-input-data" type="file" multiple accept={ACCEPTED_EXTS.join(",")} className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); (e.target as any).value = ""; }} />
          <input id="folder-input-data" type="file" {...({ webkitdirectory: "", mozdirectory: "" } as any)} multiple accept="image/*" className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                const imgs = Array.from(e.target.files).filter((f) => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(f.name));
                if (imgs.length > 0) { handleFiles(imgs); if (!batchName.trim()) { const rel = (imgs[0] as any).webkitRelativePath as string; if (rel) setBatchName(rel.split("/")[0]); } }
              }
              (e.target as any).value = "";
            }} />
        </div>
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{files.length} file da chon</p>
              <p className="text-xs text-muted-foreground">Tong: {formatSize(totalSize)}{totalSize > MAX_REQUEST_SIZE && <span className="text-destructive ml-1">(vuot gioi han!)</span>}</p>
            </div>
            <div className="max-h-40 overflow-auto space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-muted/50 rounded text-sm">
                  <span className="truncate text-foreground">{f.name}</span>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className={`text-xs ${f.size > MAX_FILE_SIZE ? "text-destructive font-medium" : "text-muted-foreground"}`}>{formatSize(f.size)}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground hover:text-destructive transition-colors">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {status === "uploading" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dang upload...</span>
              <span className="font-mono text-foreground">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button type="button" variant="primary" onClick={handleUpload} disabled={!canUpload}>
              {status === "uploading" ? (<><span className="material-symbols-outlined text-base mr-1 animate-spin">progress_activity</span>Uploading... {progress}%</>) : (<><span className="material-symbols-outlined text-base mr-1">upload</span>Upload</>)}
            </Button>
            {status === "success" && <span className="text-sm text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-base">check_circle</span>Upload thanh cong</span>}
            {status === "error" && <span className="text-sm text-destructive flex items-center gap-1"><span className="material-symbols-outlined text-base">error</span>{error}</span>}
          </div>
          {disabledReason && <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span>{disabledReason}</p>}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-bold text-foreground mb-4">Danh sach Batch</h2>
        {loadingDatasets ? (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">progress_activity</span>
            <p className="text-sm text-muted-foreground">Dang tai tu API...</p>
          </div>
        ) : datasets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chua co batch nao.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Ngay tao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((ds: any) => {
                const s = ds.computedStatus || "PENDING";
                const badge = BATCH_STATUS_MAP[s] ?? BATCH_STATUS_MAP["PENDING"];
                return (
                  <TableRow key={ds.datasetId}>
                    <TableCell>{ds.name}</TableCell>
                    <TableCell>{ds.totalItems}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>{badge.label}</span>
                    </TableCell>
                    <TableCell>{ds.createdAt ? new Date(ds.createdAt).toLocaleDateString("vi-VN") : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
