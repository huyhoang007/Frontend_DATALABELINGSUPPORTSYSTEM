import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/layout/Sidebar";
import { PROJECTS, TASKS } from "../../services/mockData";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const progressToneClasses = {
  high: {
    bar: "bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-600",
    label: "Hoàn thành",
  },
  mid: {
    bar: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    label: "Đang chạy",
  },
  low: {
    bar: "bg-blue-600",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-600",
    label: "Mới bắt đầu",
  },
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [hoveredKpi, setHoveredKpi] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleAction = (action) => {
    if (action === "Create Project") {
      navigate("/manager/projects");
      return;
    }
    addToast(`${action} action triggered (Mock)`, "info");
  };

  const projectStats = PROJECTS.map((proj) => {
    const projTasks = TASKS.filter((t) => t.projectId === proj.id);
    const completed = projTasks.filter((t) => t.status === "APPROVED").length;
    const progress =
      projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;
    return { ...proj, taskCount: projTasks.length, completed, progress };
  });

  const kpis = [
    {
      label: "Tổng dự án",
      value: PROJECTS.length,
      icon: "folder_open",
      delta: "+2 tháng này",
      tone: "positive",
      positive: true,
    },
    {
      label: "Nhóm hoạt động",
      value: "8",
      icon: "group",
      delta: "Ổn định",
      tone: "neutral",
      positive: null,
    },
    {
      label: "Chất lượng",
      value: "98.2%",
      icon: "verified",
      delta: "+1.4% so với kỳ trước",
      tone: "positive",
      positive: true,
    },
    {
      label: "Tình trạng",
      value: "Tốt",
      icon: "health_and_safety",
      delta: "Không có sự cố",
      tone: "positive",
      positive: true,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-['IBM_Plex_Sans','Segoe_UI',system-ui,sans-serif] text-slate-900">
      <Sidebar />

      <main className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-10">
          <nav className="flex items-center gap-1 text-xs text-slate-500">
            <span className="material-symbols-outlined text-base">home</span>
            <span className="mx-1 text-slate-300">/</span>
            <span className="font-semibold text-slate-900">Bảng điều khiển</span>
          </nav>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
              <span className="material-symbols-outlined text-sm">tune</span>
              Bộ lọc
            </button>

            <button
              onClick={() => handleAction("Create Project")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-[11px] font-bold text-white transition hover:bg-blue-700"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Tạo dự án
            </button>
          </div>
        </header>

        <div className="flex-1 px-10 py-8">
          <div className="mb-8">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Quản lý dự án
            </p>
            <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900">
              Xin chào, {user?.username || "Manager"}
            </h1>
            <p className="text-sm text-slate-500">
              Tổng quan hoạt động hôm nay -{" "}
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-4">
            {kpis.map((kpi, idx) => (
              <div
                key={kpi.label}
                onMouseEnter={() => setHoveredKpi(idx)}
                onMouseLeave={() => setHoveredKpi(null)}
                className={`rounded-lg border border-slate-200 border-t-[3px] bg-white p-5 transition ${
                  hoveredKpi === idx ? "shadow-lg shadow-slate-200/80" : "shadow-sm"
                } ${
                  kpi.tone === "positive"
                    ? "border-t-emerald-600"
                    : kpi.tone === "warning"
                      ? "border-t-amber-600"
                      : "border-t-blue-600"
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    {kpi.label}
                  </p>
                  <span
                    className={`material-symbols-outlined text-xl ${
                      kpi.tone === "positive"
                        ? "text-emerald-700"
                        : kpi.tone === "warning"
                          ? "text-amber-700"
                          : "text-blue-700"
                    }`}
                  >
                    {kpi.icon}
                  </span>
                </div>

                <p className="mb-2 text-[32px] font-extrabold leading-none text-slate-900">
                  {kpi.value}
                </p>

                <p
                  className={`flex items-center gap-1 text-[11px] font-semibold ${
                    kpi.positive === true
                      ? "text-emerald-700"
                      : kpi.positive === false
                        ? "text-amber-700"
                        : "text-slate-500"
                  }`}
                >
                  {kpi.positive === true && (
                    <span className="material-symbols-outlined text-sm">
                      arrow_upward
                    </span>
                  )}
                  {kpi.positive === false && (
                    <span className="material-symbols-outlined text-sm">
                      arrow_downward
                    </span>
                  )}
                  {kpi.delta}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Danh sách dự án</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {PROJECTS.length} dự án đang hoạt động
                  </p>
                </div>
                <button
                  onClick={() => handleAction("View All")}
                  className="text-[11px] font-bold text-blue-700 transition hover:text-blue-800"
                >
                  Xem tất cả →
                </button>
              </div>

              <div className="grid grid-cols-[1fr_80px_180px_110px] gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Tên dự án
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Loại
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Tiến độ
                </p>
                <p className="text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Trạng thái
                </p>
              </div>

              {projectStats.map((proj, idx) => {
                const tone =
                  proj.progress >= 75
                    ? progressToneClasses.high
                    : proj.progress >= 40
                      ? progressToneClasses.mid
                      : progressToneClasses.low;

                return (
                  <div
                    key={proj.id}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleAction("View")}
                    className={`grid cursor-pointer grid-cols-[1fr_80px_180px_110px] items-center gap-3 border-b border-slate-200 px-6 py-4 transition ${
                      hoveredRow === idx
                        ? "bg-blue-50"
                        : idx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/60"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50">
                        <span className="material-symbols-outlined text-lg text-blue-700">
                          folder
                        </span>
                      </div>
                      <span
                        className={`truncate text-sm font-bold transition ${
                          hoveredRow === idx ? "text-blue-700" : "text-slate-900"
                        }`}
                      >
                        {proj.name}
                      </span>
                    </div>

                    <span className="w-fit rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
                      {proj.type}
                    </span>

                    <div>
                      <div className="mb-1.5 flex justify-between">
                        <span className="text-[10px] text-slate-500">Tiến độ</span>
                        <span className="text-[10px] font-extrabold text-slate-900">
                          {proj.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={`inline-flex justify-self-end rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${tone.badge}`}
                    >
                      <span className={`mr-1.5 mt-[3px] inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                      {tone.label}
                    </span>
                  </div>
                );
              })}
            </section>

            <div className="flex flex-col gap-4">
              <section className="flex-1 rounded-lg bg-blue-600 p-6 text-white">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/70">
                  Năng suất nhóm
                </p>
                <p className="mb-1 text-5xl font-extrabold tracking-tight">
                  84.2
                  <span className="text-2xl font-normal text-white/80">k</span>
                </p>
                <p className="mb-5 text-sm text-white/70">
                  tasks hoàn thành trong 30 ngày
                </p>
                <div className="flex h-14 items-end gap-1">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded bg-white/20 transition hover:bg-white/40"
                        style={{ height: `${height}%` }}
                      />
                    ),
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                    Mốc tiếp theo
                  </p>
                  <span className="material-symbols-outlined text-xl text-amber-500">
                    flag
                  </span>
                </div>
                <p className="mb-1 text-sm font-bold text-slate-900">
                  Gán nhãn dữ liệu V2
                </p>
                <p className="mb-4 text-sm text-slate-500">Deadline: 20/03/2026</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[62%] rounded-full bg-amber-500" />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-500">
                  62% hoàn thành
                </p>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Thao tác nhanh
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Phân công nhiệm vụ", icon: "assignment_ind" },
                    { label: "Xuất báo cáo", icon: "download" },
                    { label: "Lên lịch họp", icon: "event" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleAction(item.label)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-900 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-500">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
              <span className="text-[11px] font-semibold text-slate-500">
                Tất cả hệ thống hoạt động bình thường
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cập nhật lần cuối: vừa xong
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
