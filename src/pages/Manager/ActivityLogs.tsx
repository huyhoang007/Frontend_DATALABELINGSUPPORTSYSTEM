import { useEffect, useState } from "react";
import { activityLogApi } from "../../api/activityLogApi";
import { useToast } from "../../context/ToastContext";

interface ActivityLog {
  logId: number;
  createdAt: string;
  actorName: string;
  actorRole: string;
  actorId: string | number;
  action: string;
  message: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const roleBadgeClasses: Record<string, string> = {
  admin: "border-red-200 bg-red-50 text-red-600",
  manager: "border-violet-200 bg-violet-50 text-violet-600",
  annotator: "border-blue-200 bg-blue-50 text-blue-600",
  reviewer: "border-amber-200 bg-amber-50 text-amber-700",
};

function getActionBadgeClass(action: string): string {
  if (action.includes("CREATE")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (action.includes("REJECT")) return "border-red-200 bg-red-50 text-red-600";
  if (action.includes("APPROVE")) return "border-blue-200 bg-blue-50 text-blue-600";
  if (action.includes("SUBMIT")) return "border-violet-200 bg-violet-50 text-violet-600";
  return "border-slate-300 bg-slate-100 text-slate-500";
}

const tableHeaderClass =
  "text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500";

export default function ActivityLogs() {
  const { addToast } = useToast();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: "",
    action: "ALL",
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const result = await (activityLogApi as any).list({
        page: pagination.page,
        limit: pagination.limit,
        q: filters.q,
        action: filters.action,
      });

      setLogs((result as any).data);
      setPagination((prev) => ({
        ...prev,
        ...(result as any).meta,
      }));
    } catch (error) {
      console.error(error);
      addToast("Không thể tải nhật ký hoạt động", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, q: e.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, action: e.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const getRoleBadge = (role: string) => {
    const badgeClass =
      roleBadgeClasses[role] || "border-slate-300 bg-slate-100 text-slate-500";
    return (
      <span
        className={`ml-2 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${badgeClass}`}
      >
        {role}
      </span>
    );
  };

  const getActionBadge = (action: string) => (
    <span
      className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold ${getActionBadgeClass(action)}`}
    >
      {action}
    </span>
  );

  return (
    <div className="mx-auto flex h-full min-h-screen w-full max-w-[1400px] flex-col bg-slate-50 px-10 py-8 font-['IBM_Plex_Sans','Segoe_UI',system-ui,sans-serif]">
      <div className="mb-8">
        <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.02em] text-slate-900">
          Theo dõi nhật ký
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Lịch sử hoạt động của hệ thống
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative w-full max-w-[400px] flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-500">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm actor, message, ID..."
            value={filters.q}
            onChange={handleSearchChange}
            className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <select
          value={filters.action}
          onChange={handleActionChange}
          className="w-full max-w-[200px] cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600"
        >
          <option value="ALL">Tất cả hành động</option>
          <option value="CREATE_PROJECT">Tạo dự án</option>
          <option value="SUBMIT_TASK">Gửi nhiệm vụ</option>
          <option value="APPROVE_TASK">Duyệt nhiệm vụ</option>
          <option value="REJECT_TASK">Từ chối nhiệm vụ</option>
          <option value="CREATE_USER">Tạo người dùng</option>
          <option value="LOGIN">Đăng nhập</option>
        </select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-slate-500">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-3xl">
                refresh
              </span>
              <span className="text-xs">Đang tải logs...</span>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-10 text-slate-500">
            <span className="material-symbols-outlined mb-2 text-6xl opacity-20">
              history_toggle_off
            </span>
            <p className="text-sm">Không có hoạt động nào phù hợp</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="sticky top-0 z-10 grid grid-cols-[200px_280px_200px_1fr] items-center gap-4 border-b border-slate-300 bg-slate-50 px-6 py-3">
              <p className={tableHeaderClass}>THỜI GIAN</p>
              <p className={tableHeaderClass}>NGƯỜI DÙNG</p>
              <p className={tableHeaderClass}>HÀNH ĐỘNG</p>
              <p className={tableHeaderClass}>NỘI DUNG</p>
            </div>

            <div>
              {logs.map((log, idx) => (
                <div
                  key={log.logId}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`grid grid-cols-[200px_280px_200px_1fr] items-center gap-4 border-b border-slate-300 px-6 py-4 transition ${
                    hoveredRow === idx
                      ? "bg-blue-50"
                      : idx % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50"
                  }`}
                >
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-slate-900">
                        {log.actorName}
                      </span>
                      {log.actorRole && getRoleBadge(log.actorRole)}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                      {log.actorId}
                    </div>
                  </div>
                  <div>{getActionBadge(log.action)}</div>
                  <span className="text-sm text-slate-500">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && pagination.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 bg-slate-50 px-6 py-3">
            <div className="text-xs text-slate-500">
              Hiển thị <strong className="text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</strong> đến{" "}
              <strong className="text-slate-900">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              trong tổng số <strong className="text-slate-900">{pagination.total}</strong> kết quả
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="h-8 rounded-md border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-900 transition enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <div className="flex h-8 items-center rounded-md bg-blue-50 px-3 text-xs font-bold text-blue-600">
                Trang {pagination.page} / {pagination.totalPages}
              </div>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="h-8 rounded-md border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-900 transition enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
