import React, { useState, useEffect, useCallback } from "react";
import { projectApi } from "../../api/projectApi";
import { datasetApi } from "../../api/datasetApi";

// Bảng màu Modern Enterprise UI
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  textPrimary: "#172B4D",
  textSecondary: "#44546F",
  textMuted: "#626F86",
  brand: "#0C66E4",
  brandHover: "#0055CC",
  brandLight: "#E9F2FF",
  green: "#1F845A",
  greenBg: "#DCFFF1",
  amber: "#A54800",
  amberBg: "#FFF7D6",
  purple: "#5E4DB2",
  purpleBg: "#F3F0FF",
  red: "#DE350B",
  redBg: "#FFEBE6",
};

export default function UploadData() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");
  const [datasets, setDatasets] = useState<any[]>([]);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Load projects
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

  // Load datasets when project changes
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

  // File handlers
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
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Upload
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
      setError(err?.message || "Tải lên thất bại");
    }
  };

  const canUpload =
    selectedProjectId &&
    batchName.trim() &&
    files.length > 0 &&
    status !== "uploading";

  return (
    <div
      style={{
        padding: "32px 40px",
        maxWidth: "1400px",
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: T.textPrimary,
          marginBottom: "32px",
          letterSpacing: "-0.02em",
        }}
      >
        Upload dữ liệu
      </h1>

      {/* Project & Batch */}
      <div
        style={{
          padding: "24px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: "6px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(9,30,66,.08)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: T.textMuted,
                marginBottom: "6px",
              }}
            >
              Dự án
            </label>
            <select
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "4px",
                border: `1px solid ${T.border}`,
                background: T.surface,
                color: T.textPrimary,
                fontSize: "13px",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects}
              onFocus={(e) => (e.currentTarget.style.borderColor = T.brand)}
              onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            >
              <option value="">-- Chọn dự án --</option>
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
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: T.textMuted,
                marginBottom: "6px",
              }}
            >
              Tên Batch
            </label>
            <input
              type="text"
              placeholder="VD: Human_Images_v1"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              maxLength={100}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "4px",
                fontSize: "13px",
                color: T.textPrimary,
                outline: "none",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = T.brand;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${T.brand}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Upload Mode Toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {(["files", "folder"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setUploadMode(mode);
                setFiles([]);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "4px",
                border: `1px solid ${uploadMode === mode ? T.brand : T.border}`,
                background: uploadMode === mode ? T.brandLight : T.surface,
                color: uploadMode === mode ? T.brand : T.textMuted,
                cursor: "pointer",
                transition: "all .15s",
                fontFamily: "inherit",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
              >
                {mode === "files" ? "insert_drive_file" : "folder_open"}
              </span>
              {mode === "files" ? "Chọn file" : "Chọn thư mục"}
            </button>
          ))}
        </div>

        {/* Dropzone */}
        <div
          style={{
            border: `2px dashed ${dragActive ? T.brand : T.border}`,
            borderRadius: "8px",
            padding: "32px",
            textAlign: "center",
            transition: "all .15s",
            cursor: "pointer",
            background: dragActive ? T.brandLight : T.surface,
          }}
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
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "48px",
              color: T.textMuted,
              marginBottom: "8px",
              display: "block",
            }}
          >
            {uploadMode === "folder" ? "folder_open" : "cloud_upload"}
          </span>
          {uploadMode === "folder" ? (
            <>
              <p style={{ fontSize: "13px", color: T.textMuted }}>
                Kéo thả{" "}
                <strong style={{ color: T.textPrimary }}>thư mục</strong> vào
                đây hoặc{" "}
                <span style={{ color: T.brand, fontWeight: 600 }}>
                  chọn thư mục
                </span>
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: T.textMuted,
                  marginTop: "4px",
                }}
              >
                Toàn bộ ảnh (PNG, JPG, JPEG) trong thư mục sẽ được tải lên
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: "13px", color: T.textMuted }}>
                Kéo thả file vào đây hoặc{" "}
                <span style={{ color: T.brand, fontWeight: 600 }}>
                  chọn file
                </span>
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: T.textMuted,
                  marginTop: "4px",
                }}
              >
                PNG, JPG, PDF, CSV, ZIP
              </p>
            </>
          )}
          <input
            id="file-input"
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.pdf,.csv,.zip"
            style={{ display: "none" }}
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
            style={{ display: "none" }}
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

        {/* File list */}
        {files.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: T.textPrimary,
                marginBottom: "8px",
              }}
            >
              {uploadMode === "folder" ? (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "16px",
                      verticalAlign: "middle",
                      marginRight: "4px",
                      color: T.brand,
                    }}
                  >
                    folder
                  </span>
                  {files.length} ảnh từ thư mục
                  {batchName ? ` "${batchName}"` : ""}
                </>
              ) : (
                `${files.length} file đã chọn`
              )}
            </p>
            <div
              style={{
                maxHeight: "160px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: T.surfaceHover,
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: T.textPrimary,
                    }}
                  >
                    {f.name}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginLeft: "8px",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: T.textMuted, fontSize: "11px" }}>
                      {formatSize(f.size)}
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      style={{
                        color: T.textMuted,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        transition: "color .15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = T.red)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = T.textMuted)
                      }
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "16px" }}
                      >
                        close
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            onClick={handleUpload}
            disabled={!canUpload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#FFFFFF",
              background: canUpload ? T.brand : T.border,
              border: "none",
              borderRadius: "4px",
              cursor: canUpload ? "pointer" : "not-allowed",
              transition: "all .15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) =>
              canUpload && (e.currentTarget.style.background = T.brandHover)
            }
            onMouseLeave={(e) =>
              canUpload && (e.currentTarget.style.background = T.brand)
            }
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px" }}
            >
              {status === "uploading" ? "progress_activity" : "upload"}
            </span>
            {status === "uploading" ? "Đang tải lên..." : "Tải lên"}
          </button>
          {status === "success" && (
            <span style={{ fontSize: "13px", color: T.green, fontWeight: 600 }}>
              Tải lên thành công
            </span>
          )}
          {status === "error" && (
            <span style={{ fontSize: "13px", color: T.red, fontWeight: 600 }}>
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Dataset history */}
      {selectedProjectId && (
        <div
          style={{
            padding: "24px",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: "6px",
            boxShadow: "0 1px 3px rgba(9,30,66,.08)",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: T.textPrimary,
              marginBottom: "16px",
            }}
          >
            Danh sách Batch
          </h2>
          {loadingDatasets ? (
            <p style={{ fontSize: "13px", color: T.textMuted }}>Đang tải...</p>
          ) : datasets.length === 0 ? (
            <p style={{ fontSize: "13px", color: T.textMuted }}>
              Chưa có batch nào cho dự án này.
            </p>
          ) : (
            <div
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
                  padding: "12px 24px",
                  background: "#FAFBFC",
                  borderBottom: `1px solid ${T.border}`,
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  TÊN BATCH
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  SỐ FILE
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  TRẠNG THÁI
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  NGÀY TẠO
                </p>
              </div>

              {/* Table Body */}
              <div>
                {datasets.map((ds, idx) => {
                  const statusStyle =
                    ds.status === "COMPLETED"
                      ? { bg: T.greenBg, text: T.green }
                      : ds.status === "FAILED"
                        ? { bg: T.redBg, text: T.red }
                        : { bg: T.amberBg, text: T.amber };
                  return (
                    <div
                      key={ds.datasetId}
                      onMouseEnter={() => setHoveredRow(idx)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
                        padding: "16px 24px",
                        background:
                          hoveredRow === idx
                            ? T.brandLight
                            : idx % 2 === 0
                              ? T.surface
                              : "#FAFBFC",
                        borderBottom: `1px solid ${T.border}`,
                        transition: "all .15s",
                        gap: "16px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: T.textPrimary,
                        }}
                      >
                        {ds.name}
                      </span>
                      <span style={{ fontSize: "13px", color: T.textMuted }}>
                        {ds.totalItems}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          width: "fit-content",
                        }}
                      >
                        {(
                          {
                            COMPLETED: "Hoàn thành",
                            FAILED: "Thất bại",
                            PROCESSING: "Đang xử lý",
                          } as Record<string, string>
                        )[ds.status] || ds.status}
                      </span>
                      <span style={{ fontSize: "12px", color: T.textMuted }}>
                        {ds.createdAt
                          ? new Date(ds.createdAt).toLocaleDateString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
