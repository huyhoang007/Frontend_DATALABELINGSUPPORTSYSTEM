import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "../../api/projectApi";
import { datasetApi } from "../../api/datasetApi";
import { SOURCE_FILES } from "../../utils/sourceMeta";

const statusBadgeClasses: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  default: "bg-amber-100 text-amber-700",
};

export default function UploadData() {
  const { t, i18n } = useTranslation(["manager", "common"]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");
  const [datasets, setDatasets] = useState<any[]>([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

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
  }, []);

  const loadDatasets = useCallback(async (projectId: string) => {
    if (!projectId) {
      setDatasets([]);
      return;
    }
    setLoadingDatasets(true);
    try {
      const data = await datasetApi.getDatasetsByProject(Number(projectId));
      setDatasets(Array.isArray(data) ? data : []);
    } catch {
      setDatasets([]);
    } finally {
      setLoadingDatasets(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets(selectedProjectId);
  }, [selectedProjectId, loadDatasets]);

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    setFiles((prev) => [...prev, ...fileArray]);
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (uploadMode === "folder" && e.dataTransfer.items) {
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
    } else if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!selectedProjectId || !batchName.trim() || files.length === 0) return;
    setStatus("uploading");
    setError("");
    try {
      await datasetApi.createDataset(
        Number(selectedProjectId),
        batchName.trim(),
        files,
      );
      setStatus("success");
      setBatchName("");
      setFiles([]);
      loadDatasets(selectedProjectId);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || t("manager:uploadData.uploadFailed"));
    }
  };

  const canUpload =
    selectedProjectId &&
    batchName.trim() &&
    files.length > 0 &&
    status !== "uploading";

  return (
    <div
      className="min-h-screen bg-slate-50 px-6 py-8 md:px-10"
      data-source-file={SOURCE_FILES.managerUploadData}
      data-source-label="section:manager-upload-data-page"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {t("manager:uploadData.title")}
        </h1>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500">
                {t("manager:uploadData.project")}
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={loadingProjects}
              >
                <option value="">{t("manager:uploadData.selectProject")}</option>
                {projects.map((p) => (
                  <option
                    key={p.project_id ?? p.projectId}
                    value={p.project_id ?? p.projectId}
                  >
                    {p.project_name ??
                      p.name ??
                      `Project #${p.project_id ?? p.projectId}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500">
                {t("manager:uploadData.batchName")}
              </label>
              <input
                type="text"
                placeholder={t("manager:uploadData.batchPlaceholder")}
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                maxLength={100}
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {(["files", "folder"] as const).map((mode) => {
              const active = uploadMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setUploadMode(mode);
                    setFiles([]);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {mode === "files" ? "insert_drive_file" : "folder_open"}
                  </span>
                  {mode === "files"
                    ? t("manager:uploadData.chooseFiles")
                    : t("manager:uploadData.chooseFolder")}
                </button>
              );
            })}
          </div>

          <div
            className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-white hover:border-slate-400"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() =>
              document
                .getElementById(
                  uploadMode === "folder" ? "folder-input" : "file-input",
                )
                ?.click()
            }
          >
            <span className="material-symbols-outlined mb-2 block text-5xl text-slate-500">
              {uploadMode === "folder" ? "folder_open" : "cloud_upload"}
            </span>
            {uploadMode === "folder" ? (
              <>
                <p className="text-sm text-slate-600">
                  {t("manager:uploadData.dropFolderTitle")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t("manager:uploadData.dropFolderHint")}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  {t("manager:uploadData.dropFilesTitle")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t("manager:uploadData.dropFilesHint")}
                </p>
              </>
            )}

            <input
              id="file-input"
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              id="folder-input"
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
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-slate-900">
                {uploadMode === "folder" ? (
                  <span className="inline-flex items-center gap-1 text-blue-700">
                    <span className="material-symbols-outlined text-base">
                      folder
                    </span>
                    {t("manager:uploadData.folderImages", {
                      count: files.length,
                      name: batchName,
                    })}
                  </span>
                ) : (
                  t("manager:uploadData.selectedFiles", { count: files.length })
                )}
              </p>

              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-slate-100 px-3 py-2 text-xs"
                  >
                    <span className="truncate pr-3 text-slate-900">
                      {f.name}
                    </span>
                    <div className="ml-2 flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {formatSize(f.size)}
                      </span>
                      <button
                        onClick={() => removeFile(i)}
                        className="flex items-center text-slate-500 transition hover:text-red-600"
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

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={!canUpload}
              className={`inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-bold text-white transition ${
                canUpload
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {status === "uploading" ? "progress_activity" : "upload"}
              </span>
              {status === "uploading"
                ? t("manager:uploadData.uploading")
                : t("manager:uploadData.upload")}
            </button>

            {status === "success" && (
              <span className="text-sm font-semibold text-emerald-700">
                {t("manager:uploadData.uploadSuccess")}
              </span>
            )}

            {status === "error" && (
              <span className="text-sm font-semibold text-red-700">
                {error}
              </span>
            )}
          </div>
        </section>

        {selectedProjectId && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {t("manager:uploadData.batchList")}
            </h2>

            {loadingDatasets ? (
              <p className="text-sm text-slate-500">
                {t("common:states.loading")}
              </p>
            ) : datasets.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("manager:uploadData.noProjectBatch")}
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    {t("manager:uploadData.table.batchName").toUpperCase()}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    {t("manager:uploadData.table.fileCount").toUpperCase()}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    {t("manager:uploadData.table.status").toUpperCase()}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    {t("manager:uploadData.table.createdAt").toUpperCase()}
                  </p>
                </div>

                <div>
                  {datasets.map((ds, idx) => {
                    const badgeClasses =
                      statusBadgeClasses[ds.status] || statusBadgeClasses.default;

                    return (
                      <div
                        key={ds.datasetId}
                        onMouseEnter={() => setHoveredRow(idx)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={`grid grid-cols-[2fr_1fr_1fr_1.5fr] items-center gap-4 border-b border-slate-200 px-6 py-4 transition ${
                          hoveredRow === idx
                            ? "bg-blue-50"
                            : idx % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/60"
                        }`}
                      >
                        <span className="text-sm font-semibold text-slate-900">
                          {ds.name}
                        </span>
                        <span className="text-sm text-slate-500">
                          {ds.totalItems}
                        </span>
                        <span
                          className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${badgeClasses}`}
                        >
                          {t(`manager:uploadData.statuses.${ds.status}`, {
                            defaultValue: ds.status,
                          })}
                        </span>
                        <span className="text-xs text-slate-500">
                          {ds.createdAt
                            ? new Date(ds.createdAt).toLocaleDateString(
                                i18n.language === "en" ? "en-US" : "vi-VN",
                              )
                            : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
