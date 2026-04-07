import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMockData } from "../../utils/mockStorage";

const STORAGE_KEY = "mock_tasks";

function seedTasks() {
  return [
    { id: crypto.randomUUID(), taskName: "Label Batch Human_v1", project: "Human Detection", assignee: "Nguyễn Văn A", status: "IN_PROGRESS", progress: 65, createdAt: "2026-02-10T08:00:00" },
    { id: crypto.randomUUID(), taskName: "Label Batch Car_v2", project: "Vehicle Detection", assignee: "Trần Thị B", status: "COMPLETED", progress: 100, createdAt: "2026-02-08T10:30:00" },
    { id: crypto.randomUUID(), taskName: "Review Batch Dog_v1", project: "Animal Classification", assignee: "Lê Văn C", status: "PENDING", progress: 0, createdAt: "2026-02-15T14:00:00" },
    { id: crypto.randomUUID(), taskName: "Label Batch Sign_v1", project: "Traffic Sign", assignee: "Phạm Thị D", status: "RETURNED", progress: 30, createdAt: "2026-02-12T09:00:00" },
    { id: crypto.randomUUID(), taskName: "Label Batch Face_v3", project: "Face Recognition", assignee: "Nguyễn Văn A", status: "IN_PROGRESS", progress: 45, createdAt: "2026-02-14T11:00:00" },
  ];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  RETURNED: "bg-red-50 text-red-700",
};

const STATUS_OPTIONS = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "RETURNED"];

const tableHeaderClass =
  "text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500";

export default function Tasks() {
  const { t, i18n } = useTranslation(["manager", "common"]);
  const [tasks] = useState<any[]>(() => getMockData(STORAGE_KEY, seedTasks));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewTask, setViewTask] = useState<any>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const getStatusLabel = (status: string) =>
    t(`manager:tasks.statuses.${status}`, { defaultValue: status });

  const filtered = useMemo(
    () =>
      statusFilter === "ALL"
        ? tasks
        : tasks.filter((task) => task.status === statusFilter),
    [statusFilter, tasks],
  );

  return (
    <div className="min-h-screen bg-slate-50 px-10 py-8 font-['IBM_Plex_Sans','Segoe_UI',system-ui,sans-serif]">
      <h1 className="mb-8 text-[28px] font-extrabold tracking-[-0.02em] text-slate-900">
        {t("manager:tasks.title")}
      </h1>

      <div className="rounded-md border border-slate-300 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-500">
            {t("manager:tasks.filterStatus")}:
          </label>
          <select
            className="cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined mb-2 block text-6xl text-slate-300">
              task_alt
            </span>
            <p className="text-sm text-slate-500">{t("manager:tasks.empty")}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-300">
            <div className="grid grid-cols-[2fr_1.5fr_1.2fr_1fr_1fr_1.2fr_100px] items-center gap-4 border-b border-slate-300 bg-slate-50 px-6 py-3">
              <p className={tableHeaderClass}>
                {t("manager:tasks.table.name").toUpperCase()}
              </p>
              <p className={tableHeaderClass}>
                {t("manager:tasks.table.project").toUpperCase()}
              </p>
              <p className={tableHeaderClass}>
                {t("manager:tasks.table.assignee").toUpperCase()}
              </p>
              <p className={tableHeaderClass}>
                {t("manager:tasks.table.status").toUpperCase()}
              </p>
              <p className={tableHeaderClass}>
                {t("manager:tasks.table.progress").toUpperCase()}
              </p>
              <p className={tableHeaderClass}>
                {t("manager:tasks.table.createdAt").toUpperCase()}
              </p>
              <p className={`${tableHeaderClass} text-right`}>
                {t("manager:tasks.table.action").toUpperCase()}
              </p>
            </div>

            <div>
              {filtered.map((task, idx) => {
                const statusClass =
                  STATUS_STYLES[task.status] || "bg-slate-100 text-slate-500";
                return (
                  <div
                    key={task.id}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`grid grid-cols-[2fr_1.5fr_1.2fr_1fr_1fr_1.2fr_100px] items-center gap-4 border-b border-slate-300 px-6 py-4 transition ${
                      hoveredRow === idx
                        ? "bg-blue-50"
                        : idx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50"
                    }`}
                  >
                    <span className="text-sm font-bold text-slate-900">
                      {task.taskName}
                    </span>
                    <span className="text-sm text-slate-500">
                      {task.project}
                    </span>
                    <span className="text-sm text-slate-900">
                      {task.assignee}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${statusClass}`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-300">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="w-8 text-[11px] font-bold text-slate-500">
                        {task.progress}%
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(task.createdAt).toLocaleDateString(
                        i18n.language === "en" ? "en-US" : "vi-VN",
                      )}
                    </span>
                    <div className="text-right">
                      <button
                        onClick={() => setViewTask(task)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        <span className="material-symbols-outlined text-base">
                          visibility
                        </span>
                        {t("manager:tasks.view")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {viewTask && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-w-[500px] rounded-md bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold text-slate-900">
              {t("manager:tasks.detailTitle")}
            </h2>

            <div className="flex flex-col gap-3 text-sm">
              <div>
                <span className="font-semibold text-slate-900">
                  {t("manager:tasks.detail.name")}:
                </span>{" "}
                <span className="text-slate-500">{viewTask.taskName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  {t("manager:tasks.detail.project")}:
                </span>{" "}
                <span className="text-slate-500">{viewTask.project}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  {t("manager:tasks.detail.assignee")}:
                </span>{" "}
                <span className="text-slate-500">{viewTask.assignee}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {t("manager:tasks.detail.status")}:
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${
                    STATUS_STYLES[viewTask.status] || "bg-slate-100 text-slate-500"
                  }`}
                >
                  {getStatusLabel(viewTask.status)}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  {t("manager:tasks.detail.progress")}:
                </span>{" "}
                <span className="text-slate-500">{viewTask.progress}%</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  {t("manager:tasks.detail.createdAt")}:
                </span>{" "}
                <span className="text-slate-500">
                  {new Date(viewTask.createdAt).toLocaleString(
                    i18n.language === "en" ? "en-US" : "vi-VN",
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewTask(null)}
                className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                {t("manager:tasks.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
