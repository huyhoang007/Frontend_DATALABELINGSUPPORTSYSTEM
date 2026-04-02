import React, { useState } from "react";

interface ReviewerDashboardProps {
  user: any;
  onLogout: () => void;
}

const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const mockReviews = [
    {
      id: 1,
      taskName: "GÃ¡n nhÃ£n hÃ¬nh áº£nh xe cá»™",
      annotator: "Nguyá»…n VÄƒn A",
      project: "AI Vision Recognition",
      status: "pending",
      submittedAt: "2024-02-12T10:30:00Z",
      priority: "high",
      accuracy: null,
      itemsCount: 150,
    },
    {
      id: 2,
      taskName: "PhÃ¢n loáº¡i vÄƒn báº£n",
      annotator: "Tráº§n Thá»‹ B",
      project: "OCR Document Processing",
      status: "approved",
      submittedAt: "2024-02-11T14:20:00Z",
      priority: "medium",
      accuracy: 95,
      itemsCount: 200,
    },
    {
      id: 3,
      taskName: "GÃ¡n nhÃ£n y táº¿",
      annotator: "LÃª VÄƒn C",
      project: "Medical Image Analysis",
      status: "rejected",
      submittedAt: "2024-02-10T09:15:00Z",
      priority: "low",
      accuracy: 78,
      itemsCount: 80,
    },
    {
      id: 4,
      taskName: "Nháº­n diá»‡n Ä‘á»‘i tÆ°á»£ng",
      annotator: "HoÃ ng Thá»‹ D",
      project: "AI Vision Recognition",
      status: "in_review",
      submittedAt: "2024-02-12T16:45:00Z",
      priority: "high",
      accuracy: null,
      itemsCount: 300,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-emerald-600 bg-emerald-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-amber-600 bg-amber-100";
      case "in_review":
        return "text-violet-600 bg-violet-100";
      default:
        return "text-slate-500 bg-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "V";
      case "rejected":
        return "X";
      case "pending":
        return "O";
      case "in_review":
        return "R";
      default:
        return "?";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-amber-600 bg-amber-100";
      case "low":
        return "text-emerald-600 bg-emerald-100";
      default:
        return "text-slate-500 bg-slate-100";
    }
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (accuracy === null) return "text-slate-500";
    if (accuracy >= 90) return "text-emerald-600";
    if (accuracy >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const stats = [
    {
      label: "Chá» review",
      value: mockReviews.filter((r) => r.status === "pending").length,
      icon: "schedule",
      border: "border-t-amber-500",
      iconColor: "text-amber-600",
    },
    {
      label: "ÄÃ£ duyá»‡t",
      value: mockReviews.filter((r) => r.status === "approved").length,
      icon: "check_circle",
      border: "border-t-emerald-600",
      iconColor: "text-emerald-600",
    },
    {
      label: "Tá»« chá»‘i",
      value: mockReviews.filter((r) => r.status === "rejected").length,
      icon: "cancel",
      border: "border-t-red-600",
      iconColor: "text-red-600",
    },
    {
      label: "Äang review",
      value: mockReviews.filter((r) => r.status === "in_review").length,
      icon: "rate_review",
      border: "border-t-violet-600",
      iconColor: "text-violet-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-['IBM_Plex_Sans','Segoe_UI',system-ui,sans-serif]">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white px-10 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Báº£ng Ä‘iá»u khiá»ƒn Reviewer
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              ChÃ o má»«ng, {user.full_name}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-md border border-slate-300 bg-transparent px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
          >
            ÄÄƒng xuáº¥t
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-10 py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              onMouseEnter={() => setHoveredKpi(idx)}
              onMouseLeave={() => setHoveredKpi(null)}
              className={`rounded-lg border border-slate-200 border-t-[3px] bg-white p-5 transition ${
                hoveredKpi === idx ? "shadow-lg shadow-slate-200/80" : "shadow-sm"
              } ${stat.border}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {stat.label}
                </p>
                <span className={`material-symbols-outlined text-xl ${stat.iconColor}`}>
                  {stat.icon}
                </span>
              </div>
              <p className="text-[32px] font-extrabold leading-none text-slate-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">
            Nhiá»‡m vá»¥ Review
          </h2>

          <div className="flex flex-col gap-4">
            {mockReviews.map((review, idx) => (
              <div
                key={review.id}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`rounded-lg border border-slate-200 p-5 transition ${
                  hoveredCard === idx ? "bg-slate-50" : "bg-white"
                }`}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {review.taskName}
                    </h3>
                    <div
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${getStatusColor(
                        review.status,
                      )}`}
                    >
                      <span>{getStatusIcon(review.status)}</span>
                      {review.status}
                    </div>
                  </div>
                  <div
                    className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${getPriorityColor(
                      review.priority,
                    )}`}
                  >
                    Æ¯u tiÃªn{" "}
                    {review.priority === "high"
                      ? "cao"
                      : review.priority === "medium"
                        ? "trung bÃ¬nh"
                        : "tháº¥p"}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <span className="mb-1 block text-slate-500">
                      NgÆ°á»i gÃ¡n nhÃ£n
                    </span>
                    <span className="font-semibold text-slate-900">
                      {review.annotator}
                    </span>
                  </div>
                  <div>
                    <span className="mb-1 block text-slate-500">Dá»± Ã¡n</span>
                    <span className="font-semibold text-slate-900">
                      {review.project}
                    </span>
                  </div>
                  <div>
                    <span className="mb-1 block text-slate-500">Sá»‘ items</span>
                    <span className="font-semibold text-slate-900">
                      {review.itemsCount}
                    </span>
                  </div>
                  <div>
                    <span className="mb-1 block text-slate-500">Gá»­i lÃºc</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(review.submittedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {review.accuracy !== null && (
                  <div className="mb-4">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-slate-500">Äá»™ chÃ­nh xÃ¡c</span>
                      <span
                        className={`font-extrabold ${getAccuracyColor(
                          review.accuracy,
                        )}`}
                      >
                        {review.accuracy}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          review.accuracy >= 90
                            ? "bg-emerald-600"
                            : review.accuracy >= 80
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${review.accuracy}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <button className="h-9 rounded-md border border-slate-300 bg-slate-100 px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
                    Xem chi tiáº¿t
                  </button>

                  {review.status === "pending" && (
                    <>
                      <button className="h-9 rounded-md border border-emerald-200 bg-emerald-100 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200">
                        Duyá»‡t
                      </button>
                      <button className="h-9 rounded-md border border-red-200 bg-red-100 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-200">
                        Tá»« chá»‘i
                      </button>
                    </>
                  )}

                  {review.status === "in_review" && (
                    <button className="h-9 rounded-md border border-violet-200 bg-violet-100 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-200">
                      Tiáº¿p tá»¥c review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;
