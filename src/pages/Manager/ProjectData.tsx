import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { datasetApi } from "../../api/datasetApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ImagePreviewModal } from "../../components/Manager/ImagePreviewModal";
import {
  fetchProjectDatasets,
  getHotspotQueryBehavior,
  invalidateProjectDatasetData,
  projectQueryKeys,
} from "../../query/projectQueries";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/Table";
import { SOURCE_FILES } from "../../utils/sourceMeta";

const BATCH_STATUS_MAP = {
  PENDING:
    "bg-yellow-100 text-yellow-800",
  IN_PROGRESS:
    "bg-blue-100 text-blue-800",
  COMPLETED:
    "bg-green-100 text-green-800",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = 100 * 1024 * 1024;
const ACCEPTED_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];

export default function ProjectData() {
  const { t, i18n } = useTranslation(["manager", "common"]);
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const numericProjectId = Number(projectId);
  const { project: parentProject } = (useOutletContext() as any) || {};

  const isProjectCompleted =
    parentProject?.status?.toLowerCase() === "completed";

  const [batchName, setBatchName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState("");
  
  // Image preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [selectedDatasetName, setSelectedDatasetName] = useState("");

  // Delete dataset confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const hotspot = getHotspotQueryBehavior(30_000, 300_000) as {
    staleTime: number;
    gcTime: number;
    refetchOnMount: boolean | "always";
  };

  const {
    data: datasets = [],
    isLoading: loadingDatasets,
    refetch: refetchDatasets,
  } = useQuery<any[]>({
    queryKey: projectQueryKeys.datasets(numericProjectId),
    queryFn: () => fetchProjectDatasets(numericProjectId),
    enabled: Boolean(numericProjectId),
    placeholderData: (previousData: any) => previousData,
    ...hotspot,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!numericProjectId) return;
    const interval = setInterval(() => {
      refetchDatasets();
    }, 10_000);
    return () => clearInterval(interval);
  }, [numericProjectId, refetchDatasets]);

  const validateFile = (f: File): string | null => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      return t("manager:data.errors.invalidType", { name: f.name });
    }
    if (f.size > MAX_FILE_SIZE) {
      return t("manager:data.errors.tooLarge", { name: f.name });
    }
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
    if (errors.length > 0) showToast(errors[0]);
    if (valid.length > 0) setFiles((prev) => [...prev, ...valid]);
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
            const nested = await Promise.all(entries.map(readAllFilesFromEntry));
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
        const ef = await readAllFilesFromEntry(entry);
        allFiles.push(
          ...ef.filter((f: File) =>
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
  const batchOk = batchName.trim().length > 0;
  const filesOk = files.length > 0;
  const notUploading = status !== "uploading";
  const canUpload = !isProjectCompleted && batchOk && filesOk && notUploading;
  const disabledReason = isProjectCompleted
    ? t("manager:data.disabledReasons.completed")
    : !batchOk
      ? t("manager:data.disabledReasons.batchName")
      : !filesOk
        ? t("manager:data.disabledReasons.files")
        : !notUploading
          ? t("manager:data.disabledReasons.uploading")
          : null;

  const getBatchStatusLabel = (rawStatus: string) => {
    switch (rawStatus) {
      case "COMPLETED":
        return t("manager:data.batchStatuses.completed");
      case "IN_PROGRESS":
        return t("manager:data.batchStatuses.inProgress");
      default:
        return t("manager:data.batchStatuses.pending");
    }
  };

  const handleUpload = async () => {
    if (!batchOk) {
      showToast(t("manager:data.errors.enterBatchName"));
      return;
    }
    if (!filesOk) {
      showToast(t("manager:data.errors.selectFiles"));
      return;
    }
    if (totalSize > MAX_REQUEST_SIZE) {
      showToast(t("manager:data.errors.totalTooLarge"));
      return;
    }

    setStatus("uploading");
    setError("");
    setProgress(0);

    try {
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
      showToast(t("manager:data.uploadSuccessToast"));
      await invalidateProjectDatasetData(queryClient, numericProjectId);
      await refetchDatasets();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      const s = err?.status;
      if (s === 413) setError(t("manager:data.errors.fileTooLarge"));
      else if (s === 415)
        setError(t("manager:data.errors.unsupportedFormat"));
      else if (s === 401) setError(t("manager:data.errors.sessionExpired"));
      else if (s === 403) setError(t("manager:data.errors.noPermission"));
      else setError(err?.message || t("manager:data.uploadFailed"));
    }
  };

  const handleDeleteDataset = async () => {
    if (!datasetToDelete) return;

    setIsDeleting(true);
    try {
      await datasetApi.deleteDataset(datasetToDelete.datasetId);
      showToast(t("manager:data.deleteSuccessToast"));
      setDeleteConfirmOpen(false);
      setDatasetToDelete(null);
      await invalidateProjectDatasetData(queryClient, numericProjectId);
      await refetchDatasets();
    } catch (err: any) {
      showToast(err?.message || t("manager:data.deleteFailedToast"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="space-y-6"
      data-source-file={SOURCE_FILES.managerProjectData}
      data-source-label="section:manager-project-data-tab"
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm shadow-lg">
          {toast}
        </div>
      )}

      {isProjectCompleted && (
        <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined text-orange-600 text-base mt-0.5">
            lock
          </span>
          <div>
            <p className="font-medium text-orange-900 text-sm">
              {t("manager:assignments.completedLockedTitle")}
            </p>
            <p className="text-xs text-orange-800 mt-1">
              {t("manager:assignments.completedLockedDescription")}
            </p>
          </div>
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {t("manager:data.batchName")}
          </label>
          <Input
            placeholder={t("manager:data.batchPlaceholder")}
            value={batchName}
            onChange={(e: any) => setBatchName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="flex gap-2">
          {(["files", "folder"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={isProjectCompleted}
              onClick={() => {
                setUploadMode(mode);
                setFiles([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${isProjectCompleted ? "opacity-50 cursor-not-allowed" : ""} ${uploadMode === mode ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-muted-foreground"}`}
            >
              <span className="material-symbols-outlined text-base">
                {mode === "files" ? "insert_drive_file" : "folder_open"}
              </span>
              {mode === "files"
                ? t("manager:data.chooseFiles")
                : t("manager:data.chooseFolder")}
            </button>
          ))}
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isProjectCompleted ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${dragActive && !isProjectCompleted ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
          onDragOver={(e) => {
            if (!isProjectCompleted) {
              e.preventDefault();
              setDragActive(true);
            }
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={
            !isProjectCompleted
              ? uploadMode === "folder"
                ? handleFolderDrop
                : handleDrop
              : undefined
          }
          onClick={() =>
            !isProjectCompleted &&
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
          <p className="text-sm text-muted-foreground">
            {t("manager:data.dropHint")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("manager:data.dropSubHint")}
          </p>
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
                const imgs = Array.from(e.target.files).filter((f) =>
                  /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(f.name),
                );
                if (imgs.length > 0) {
                  handleFiles(imgs);
                  if (!batchName.trim()) {
                    const rel = (imgs[0] as any).webkitRelativePath as string;
                    if (rel) setBatchName(rel.split("/")[0]);
                  }
                }
              }
              (e.target as any).value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {t("manager:data.selectedFiles", { count: files.length })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("manager:data.totalSize", { size: formatSize(totalSize) })}
                {totalSize > MAX_REQUEST_SIZE && (
                  <span className="text-destructive ml-1">
                    {t("manager:data.overLimit")}
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

        {status === "uploading" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("manager:data.uploading")}
              </span>
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
                  {t("manager:data.uploading")} {progress}%
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base mr-1">
                    upload
                  </span>
                  {t("manager:data.uploadButton")}
                </>
              )}
            </Button>

            {status === "success" && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">
                  check_circle
                </span>
                {t("manager:data.uploadSuccess")}
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

      <Card className="p-6">
        <h2 className="text-base font-bold text-foreground mb-4">
          {t("manager:data.batchList")}
        </h2>
        {loadingDatasets ? (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-2xl text-muted-foreground animate-spin block mb-2">
              progress_activity
            </span>
            <p className="text-sm text-muted-foreground">
              {t("manager:data.loadingApi")}
            </p>
          </div>
        ) : datasets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("manager:data.noBatch")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("manager:data.table.batchName")}</TableHead>
                <TableHead>{t("manager:data.table.files")}</TableHead>
                <TableHead>{t("manager:data.table.status")}</TableHead>
                <TableHead>{t("manager:data.table.createdAt")}</TableHead>
                <TableHead className="text-right">{t("common:table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(datasets as any[]).map((ds: any) => {
                const s = ds.computedStatus || "PENDING";
                const badgeClass =
                  BATCH_STATUS_MAP[s as keyof typeof BATCH_STATUS_MAP] ?? BATCH_STATUS_MAP["PENDING"];
                return (
                  <TableRow key={ds.datasetId}>
                    <TableCell>{ds.name}</TableCell>
                    <TableCell>{ds.totalItems}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}
                      >
                        {getBatchStatusLabel(s)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ds.createdAt
                        ? new Date(ds.createdAt).toLocaleDateString(
                            i18n.language === "en" ? "en-US" : "vi-VN",
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => {
                            setSelectedDatasetId(ds.datasetId);
                            setSelectedDatasetName(ds.name);
                            setPreviewModalOpen(true);
                          }}
                          title={t("manager:data.table.viewImages")}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            preview
                          </span>
                          {t("common:actions.view")}
                        </button>
                        <button
                          onClick={() => {
                            setDatasetToDelete(ds);
                            setDeleteConfirmOpen(true);
                          }}
                          title={t("manager:data.table.deleteDataset")}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                          {t("common:actions.delete")}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Image Preview Modal */}
      {selectedDatasetId && (
        <ImagePreviewModal
          datasetId={selectedDatasetId}
          datasetName={selectedDatasetName}
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedDatasetId(null);
            setSelectedDatasetName("");
          }}
        />
      )}

      {/* Delete Dataset Confirmation Modal */}
      {deleteConfirmOpen && datasetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-2xl text-red-600 mt-0.5">
                  warning
                </span>
                <div>
                  <h3 className="font-bold text-foreground">
                    {t("manager:data.deleteConfirmTitle")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("manager:data.deleteConfirmMessage", {
                      datasetName: datasetToDelete.name,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setDatasetToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm font-medium rounded border border-input hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {t("common:actions.cancel")}
                </button>
                <button
                  onClick={handleDeleteDataset}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin inline mr-1">
                        progress_activity
                      </span>
                      {t("common:actions.deleting")}
                    </>
                  ) : (
                    t("common:actions.delete")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

