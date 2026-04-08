import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { datasetApi } from "../../api/datasetApi";
import { assignmentApi } from "../../api/assignmentApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/Table";
import { SOURCE_FILES } from "../../utils/sourceMeta";

const FORMATS = ["COCO JSON", "YOLO", "Pascal VOC", "CSV"];

type HistoryEntry = {
  id: string;
  datasetName: string;
  format: string;
  fileName: string;
  exportedAt: string;
  status: "COMPLETED" | "FAILED";
};

/**
 * Compute batch status from assignments
 * COMPLETED: all assignments are APPROVED or COMPLETED
 * IN_PROGRESS: some SUBMITTED, IN_PROGRESS, or RE_SUBMITTED
 * PENDING: no assignments or all PENDING
 */
function computeBatchStatus(assignments: any[]): string {
  if (!assignments || assignments.length === 0) return "PENDING";
  const statuses = assignments.map((a: any) => a.status);

  // Check if all assignments are completed/approved
  const completeStatuses = ["APPROVED", "COMPLETED"];
  if (statuses.every((s: string) => completeStatuses.includes(s)))
    return "COMPLETED";

  // Check if any assignment is in progress or submitted
  if (
    statuses.some((s: string) =>
      ["IN_PROGRESS", "SUBMITTED", "RE_SUBMITTED"].includes(s),
    )
  )
    return "IN_PROGRESS";

  return "PENDING";
}

function downloadBlob(
  blob: Blob | ArrayBuffer | string,
  filename: string,
  mimeType: string,
) {
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
  const { t, i18n } = useTranslation(["manager", "common"]);
  const { projectId } = useParams();

  const [datasets, setDatasets] = useState<any[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [batchStatus, setBatchStatus] = useState<string>("PENDING");
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
    } catch {
      /* ignore quota errors */
    }
  }, [history, storageKey]);

  const loadDatasets = useCallback(async () => {
    if (!projectId) return;
    setLoadingDatasets(true);
    try {
      const data = await datasetApi.getDatasetsByProject(Number(projectId));
      const list = Array.isArray(data) ? data : [];
      setDatasets(list);
      if (list.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(
          String(list[0].datasetId ?? list[0].dataset_id ?? ""),
        );
      }
    } catch {
      setDatasets([]);
    } finally {
      setLoadingDatasets(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  // Load batch status when dataset changes
  useEffect(() => {
    if (!selectedDatasetId || !projectId) return;

    (async () => {
      try {
        const assignments = await assignmentApi.getAssignmentsByProject(
          Number(projectId),
        );

        const relevantAssignments = assignments.filter(
          (a: any) => String(a.datasetId ?? a.dataset_id) === selectedDatasetId,
        );

        const statusResult = computeBatchStatus(relevantAssignments);

        setBatchStatus(statusResult);
      } catch {
        setBatchStatus("PENDING");
      }
    })();
  }, [selectedDatasetId, projectId]);

  const handleExport = async () => {
    if (!selectedDatasetId) {
      setError(t("manager:export.messages.selectDataset"));
      return;
    }

    // Check if batch is completed before allowing export
    if (batchStatus !== "COMPLETED") {
      const translatedStatus =
        batchStatus === "COMPLETED"
          ? t("manager:export.batchStatuses.completed")
          : batchStatus === "IN_PROGRESS"
            ? t("manager:export.batchStatuses.inProgress")
            : t("manager:export.batchStatuses.pending");
      setError(
        t("manager:export.messages.batchIncomplete", {
          status: translatedStatus,
        }),
      );
      return;
    }

    setError("");
    setExporting(true);

    const datasetId = Number(selectedDatasetId);
    const statusParam = "APPROVED" as any;
    const selectedDataset = datasets.find(
      (d) => String(d.datasetId ?? d.dataset_id) === selectedDatasetId,
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
      const msg = err?.message || t("manager:export.messages.exportFailed");
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
    <div
      className="space-y-6"
      data-source-file={SOURCE_FILES.managerProjectExport}
      data-source-label="Manager project export tab"
    >
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {/* Dataset selector */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("manager:export.datasetBatch")}
            </label>{" "}
            <select
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              disabled={loadingDatasets}
            >
              {loadingDatasets && (
                <option value="">{t("manager:export.loadingDatasets")}</option>
              )}
              {!loadingDatasets && datasets.length === 0 && (
                <option value="">{t("manager:export.noDatasets")}</option>
              )}
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
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("manager:export.format")}
            </label>
            <select
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Format description */}
        <p className="text-xs text-muted-foreground max-w-2xl">
          {format === "COCO JSON" &&
            t("manager:export.formatDescriptions.coco")}
          {format === "YOLO" && t("manager:export.formatDescriptions.yolo")}
          {format === "Pascal VOC" &&
            t("manager:export.formatDescriptions.pascalVoc")}
          {format === "CSV" && t("manager:export.formatDescriptions.csv")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("manager:export.approvedOnly")}
        </p>

        {/* Batch status display */}
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs font-medium text-muted-foreground">
            {t("manager:export.batchStatus")}:
            <span
              className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                batchStatus === "COMPLETED"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : batchStatus === "IN_PROGRESS"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              {batchStatus === "COMPLETED"
                ? t("manager:export.batchStatuses.completed")
                : batchStatus === "IN_PROGRESS"
                  ? t("manager:export.batchStatuses.inProgress")
                  : t("manager:export.batchStatuses.pending")}
            </span>
          </p>
          {batchStatus !== "COMPLETED" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              {t("manager:export.completedOnly")}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={
            exporting ||
            !selectedDatasetId ||
            loadingDatasets ||
            batchStatus !== "COMPLETED"
          }
          isLoading={exporting}
        >
          <span className="material-symbols-outlined text-base mr-1">
            download
          </span>
          {t("manager:export.export")}
        </Button>
      </Card>

      {/* Session export history */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-foreground mb-4">
          {t("manager:export.history")}
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("manager:export.emptyHistory")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("manager:export.table.dataset")}</TableHead>
                <TableHead>{t("manager:export.table.format")}</TableHead>
                <TableHead>{t("manager:export.table.file")}</TableHead>
                <TableHead>{t("manager:export.table.time")}</TableHead>
                <TableHead>{t("manager:export.table.status")}</TableHead>
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
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.fileName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(item.exportedAt).toLocaleTimeString(
                      i18n.language === "en" ? "en-US" : "vi-VN",
                    )}
                  </TableCell>
                  <TableCell>
                    {item.status === "COMPLETED" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {t("manager:export.statusCompleted")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        {t("manager:export.statusFailed")}
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
