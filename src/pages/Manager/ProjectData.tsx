import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { datasetApi } from "../../api/datasetApi";
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

/**
 * Data tab (embedded in ProjectDetail).
 *
 * BE contract:
 *   POST   /api/projects/{projectId}/datasets  (multipart: batch_name + files)
 *   GET    /api/projects/{projectId}/datasets   → DatasetResponse[]
 *   GET    /api/datasets/{datasetId}/items      → DataItemResponse[]
 *   DELETE /api/items/{itemId}                  → soft-delete
 *
 * Upload limits from BE config:
 *   max-file-size: 10MB   max-request-size: 100MB
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_REQUEST_SIZE = 100 * 1024 * 1024; // 100 MB total
const ACCEPTED_EXTS = [".png", ".jpg", ".jpeg", ".pdf", ".csv", ".zip"];

export default function ProjectData() {
  const { projectId } = useParams();
  const numericProjectId = Number(projectId);

  const [batchName, setBatchName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");
  const [datasets, setDatasets] = useState<any[]>([]);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  /* ── Load batch list from API ── */
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

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  /* ── File handling ── */
  const validateFile = (f: File): string | null => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext))
      return `"${f.name}" — loại file không được hỗ trợ (chỉ ${ACCEPTED_EXTS.join(", ")})`;
    if (f.size > MAX_FILE_SIZE)
      return `"${f.name}" — vượt quá giới hạn 10 MB (${formatSize(f.size)})`;
    return null;
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const errors: string[] = [];
    const valid: File[] = [];

    arr.forEach((f) => {
      const err = validateFile(f);
      if (err) errors.push(err);
      else valid.push(f);
    });

    if (errors.length > 0) {
      showToast(errors[0]); // show first validation error
    }

    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const readAllFilesFromEntry = async (entry: any): Promise<File[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => entry.file((f: File) => resolve([f])));
    }
    if (entry.isDirectory) {
      const reader = entry.createReader();
      const allFiles: File[] = [];
      await new Promise<void>((resolve) => {
        const readBatch = () => {
          reader.readEntries(async (entries: any[]) => {
            if (!entries.length) {
              resolve();
              return;
            }
            const nested = await Promise.all(
              entries.map(readAllFilesFromEntry),
            );
            allFiles.push(...nested.flat());
            readBatch();
          });
        };
        readBatch();
      });
      return allFiles;
    }
    return [];
  };

  const handleFolderDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (!e.dataTransfer.items) return;
    const items = Array.from(e.dataTransfer.items);
    const allFiles: File[] = [];
    let folderName = "";
    for (const item of items) {
      const entry = (item as any).webkitGetAsEntry?.();
      if (entry) {
        if (entry.isDirectory && !folderName) folderName = entry.name;
        const entryFiles = await readAllFilesFromEntry(entry);
        allFiles.push(
          ...entryFiles.filter((f: File) =>
            /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(f.name),
          ),
        );
      }
    }
    if (allFiles.length > 0) {
      handleFiles(allFiles);
      if (!batchName.trim() && folderName) setBatchName(folderName);
    }
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  /* ── Upload ── */
  const batchOk = batchName.trim().length > 0;
  const filesOk = files.length > 0;
  const notUploading = status !== "uploading";
  const canUpload = batchOk && filesOk && notUploading;

  // Disabled reason for helper text
  const disabledReason = !batchOk
    ? "Nhập tên batch để upload"
    : !filesOk
      ? "Chọn ít nhất 1 file"
      : !notUploading
        ? "Đang upload..."
        : null;

  const handleUpload = async () => {
    console.log("[UPLOAD_CLICK]", {
      batchName,
      filesCount: files.length,
      status,
      canUpload,
      totalSize,
    });

    if (!batchOk) {
      showToast("Vui lòng nhập tên batch");
      return;
    }
    if (!filesOk) {
      showToast("Vui lòng chọn file để upload");
      return;
    }
    if (totalSize > MAX_REQUEST_SIZE) {
      showToast(
        `Tổng dung lượng ${formatSize(totalSize)} vượt quá giới hạn 100 MB`,
      );
      return;
    }

    setStatus("uploading");
    setError("");
    setProgress(0);

    try {
      console.log("[UPLOAD_START] calling datasetApi.createDataset", {
        projectId: numericProjectId,
        batchName: batchName.trim(),
        fileCount: files.length,
      });
      await datasetApi.createDataset(
        numericProjectId,
        batchName.trim(),
        files,
        (event: any) => {
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      );
      setStatus("success");
      setProgress(100);
      setBatchName("");
      setFiles([]);
      showToast("Upload thành công!");
      loadDatasets();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      console.error("[UPLOAD_ERROR]", err);
      setStatus("error");
      const httpStatus = err?.status;
      if (httpStatus === 413) {
        setError(
          "File quá lớn — BE từ chối (giới hạn 10 MB/file, 100 MB/request)",
        );
      } else if (httpStatus === 415) {
        setError("Định dạng file không được hỗ trợ");
      } else if (httpStatus === 401) {
        setError("Hết phiên đăng nhập — vui lòng đăng nhập lại");
      } else if (httpStatus === 403) {
        setError("Bạn không có quyền upload dữ liệu cho project này");
      } else {
        setError(err?.message || "Upload thất bại — vui lòng thử lại");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toast}
        </div>
      )}

      <Card className="p-6 space-y-4">
        {/* Batch Name */}
        <div className="max-w-md">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Tên Batch
          </label>
          <Input
            placeholder="VD: Human_Images_v1"
            value={batchName}
            onChange={(e: any) => setBatchName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Upload Mode Toggle */}
        <div className="flex gap-2">
          {(["files", "folder"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setUploadMode(mode);
                setFiles([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                uploadMode === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {mode === "files" ? "insert_drive_file" : "folder_open"}
              </span>
              {mode === "files" ? "Chọn file" : "Chọn thư mục"}
            </button>
          ))}
        </div>

        {/* Dropzone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={uploadMode === "folder" ? handleFolderDrop : handleDrop}
          onClick={() =>
            document
              .getElementById(
                uploadMode === "folder"
                  ? "folder-input-data"
                  : "file-input-data",
              )
              ?.click()
          }
        >
          <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">
            {uploadMode === "folder" ? "folder_open" : "cloud_upload"}
          </span>
          {uploadMode === "folder" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Kéo thả <strong className="text-foreground">thư mục</strong> vào
                đây hoặc{" "}
                <span className="text-primary font-medium">chọn thư mục</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Toàn bộ ảnh (PNG, JPG, JPEG) trong thư mục sẽ được tải lên
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Kéo thả file vào đây hoặc{" "}
                <span className="text-primary font-medium">chọn file</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, PDF, CSV, ZIP — tối đa 10 MB/file, 100 MB tổng
              </p>
            </>
          )}
          <input
            id="file-input-data"
            type="file"
            multiple
            accept={ACCEPTED_EXTS.join(",")}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              (e.target as any).value = "";
            }}
          />
          <input
            id="folder-input-data"
            type="file"
            {...({ webkitdirectory: "", mozdirectory: "" } as any)}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                const imageFiles = Array.from(e.target.files).filter((f) =>
                  /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(f.name),
                );
                if (imageFiles.length > 0) {
                  handleFiles(imageFiles);
                  if (!batchName.trim()) {
                    const rel = (imageFiles[0] as any)
                      .webkitRelativePath as string;
                    if (rel) setBatchName(rel.split("/")[0]);
                  }
                }
              }
              (e.target as any).value = "";
            }}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {uploadMode === "folder" ? (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-primary">
                      folder
                    </span>
                    {files.length} ảnh từ thư mục
                    {batchName ? ` "​${batchName}"` : ""}
                  </span>
                ) : (
                  `${files.length} file đã chọn`
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Tổng: {formatSize(totalSize)}
                {totalSize > MAX_REQUEST_SIZE && (
                  <span className="text-destructive ml-1">
                    (vượt giới hạn!)
                  </span>
                )}
              </p>
            </div>
            <div className="max-h-40 overflow-auto space-y-1">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-1.5 bg-muted/50 rounded text-sm"
                >
                  <span className="truncate text-foreground">{f.name}</span>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span
                      className={`text-xs ${f.size > MAX_FILE_SIZE ? "text-destructive font-medium" : "text-muted-foreground"}`}
                    >
                      {formatSize(f.size)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">
                        close
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {status === "uploading" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Đang upload...</span>
              <span className="font-mono text-foreground">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload button + status */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleUpload}
              disabled={!canUpload}
            >
              {status === "uploading" ? (
                <>
                  <span className="material-symbols-outlined text-base mr-1 animate-spin">
                    progress_activity
                  </span>
                  Uploading... {progress}%
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base mr-1">
                    upload
                  </span>
                  Upload
                </>
              )}
            </Button>
            {status === "success" && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">
                  check_circle
                </span>
                Upload thành công
              </span>
            )}
            {status === "error" && (
              <span className="text-sm text-destructive flex items-center gap-1">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {error}
              </span>
            )}
          </div>
          {disabledReason && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                info
              </span>
              {disabledReason}
            </p>
          )}
        </div>
      </Card>

      {/* Dataset history */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-foreground mb-4">
          Danh sách Batch
        </h2>
        {loadingDatasets ? (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">
              progress_activity
            </span>
            <p className="text-sm text-muted-foreground">Đang tải từ API...</p>
          </div>
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
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        ds.status === "COMPLETED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : ds.status === "FAILED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {ds.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {ds.createdAt
                      ? new Date(ds.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
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
