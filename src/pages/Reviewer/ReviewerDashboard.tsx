import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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

interface ReviewerDashboardProps {
  user: any;
  onLogout: () => void;
}

const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({ user, onLogout }) => {
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const mockReviews = [
    {
      id: 1,
      taskName: 'Gán nhãn hình ảnh xe cộ',
      annotator: 'Nguyễn Văn A',
      project: 'AI Vision Recognition',
      status: 'pending',
      submittedAt: '2024-02-12T10:30:00Z',
      priority: 'high',
      accuracy: null,
      itemsCount: 150
    },
    {
      id: 2,
      taskName: 'Phân loại văn bản',
      annotator: 'Trần Thị B',
      project: 'OCR Document Processing',
      status: 'approved',
      submittedAt: '2024-02-11T14:20:00Z',
      priority: 'medium',
      accuracy: 95,
      itemsCount: 200
    },
    {
      id: 3,
      taskName: 'Gán nhãn y tế',
      annotator: 'Lê Văn C',
      project: 'Medical Image Analysis',
      status: 'rejected',
      submittedAt: '2024-02-10T09:15:00Z',
      priority: 'low',
      accuracy: 78,
      itemsCount: 80
    },
    {
      id: 4,
      taskName: 'Nhận diện đối tượng',
      annotator: 'Hoàng Thị D',
      project: 'AI Vision Recognition',
      status: 'in_review',
      submittedAt: '2024-02-12T16:45:00Z',
      priority: 'high',
      accuracy: null,
      itemsCount: 300
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'in_review': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'V';
      case 'rejected': return 'X';
      case 'pending': return 'O';
      case 'in_review': return 'R';
      default: return '?';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (accuracy === null) return '#6b7280';
    if (accuracy >= 90) return '#10b981';
    if (accuracy >= 80) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{
        padding: "20px 40px",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em" }}>
              Bảng điều khiển Reviewer
            </h1>
            <p style={{ fontSize: "13px", color: T.textMuted, marginTop: "4px" }}>
              Chào mừng, {user.full_name}
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              color: T.red,
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.redBg;
              e.currentTarget.style.borderColor = T.red + "40";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Chờ review", value: mockReviews.filter(r => r.status === 'pending').length, icon: "schedule", color: T.amber },
            { label: "Đã duyệt", value: mockReviews.filter(r => r.status === 'approved').length, icon: "check_circle", color: T.green },
            { label: "Từ chối", value: mockReviews.filter(r => r.status === 'rejected').length, icon: "cancel", color: T.red },
            { label: "Đang review", value: mockReviews.filter(r => r.status === 'in_review').length, icon: "rate_review", color: T.purple },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              onMouseEnter={() => setHoveredKpi(idx)}
              onMouseLeave={() => setHoveredKpi(null)}
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                padding: "20px",
                borderTop: `3px solid ${stat.color}`,
                boxShadow: hoveredKpi === idx ? "0 4px 12px rgba(9,30,66,.12)" : "none",
                transition: "all .2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <p style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: T.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}>
                  {stat.label}
                </p>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: stat.color }}>
                  {stat.icon}
                </span>
              </div>
              <p style={{
                fontSize: "32px",
                fontWeight: 800,
                color: T.textPrimary,
                lineHeight: 1
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Review Tasks */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: "6px",
          padding: "32px",
          boxShadow: "0 1px 3px rgba(9,30,66,.08)"
        }}>
          <h2 style={{
            fontSize: "18px",
            fontWeight: 700,
            color: T.textPrimary,
            marginBottom: "24px"
          }}>
            Nhiệm vụ Review
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mockReviews.map((review, idx) => (
              <div
                key={review.id}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: "20px",
                  borderRadius: "6px",
                  border: `1px solid ${T.border}`,
                  background: hoveredCard === idx ? T.surfaceHover : T.surface,
                  transition: "all .15s"
                }}
              >
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: T.textPrimary
                    }}>
                      {review.taskName}
                    </h3>
                    <div style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: `${getStatusColor(review.status)}15`,
                      color: getStatusColor(review.status)
                    }}>
                      <span>{getStatusIcon(review.status)}</span>
                      {review.status}
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: `${getPriorityColor(review.priority)}15`,
                    color: getPriorityColor(review.priority)
                  }}>
                    Ưu tiên {review.priority === 'high' ? 'cao' : review.priority === 'medium' ? 'trung bình' : 'thấp'}
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  marginBottom: "16px",
                  fontSize: "13px"
                }}>
                  <div>
                    <span style={{ color: T.textMuted, display: "block", marginBottom: "4px" }}>Người gán nhãn</span>
                    <span style={{ fontWeight: 600, color: T.textPrimary }}>{review.annotator}</span>
                  </div>
                  <div>
                    <span style={{ color: T.textMuted, display: "block", marginBottom: "4px" }}>Dự án</span>
                    <span style={{ fontWeight: 600, color: T.textPrimary }}>{review.project}</span>
                  </div>
                  <div>
                    <span style={{ color: T.textMuted, display: "block", marginBottom: "4px" }}>Số items</span>
                    <span style={{ fontWeight: 600, color: T.textPrimary }}>{review.itemsCount}</span>
                  </div>
                  <div>
                    <span style={{ color: T.textMuted, display: "block", marginBottom: "4px" }}>Gửi lúc</span>
                    <span style={{ fontWeight: 600, color: T.textPrimary }}>
                      {new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {review.accuracy !== null && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      fontSize: "12px"
                    }}>
                      <span style={{ color: T.textMuted }}>Độ chính xác</span>
                      <span style={{
                        fontWeight: 800,
                        color: getAccuracyColor(review.accuracy)
                      }}>
                        {review.accuracy}%
                      </span>
                    </div>
                    <div style={{
                      height: "6px",
                      width: "100%",
                      background: T.border,
                      borderRadius: "99px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        borderRadius: "99px",
                        width: `${review.accuracy}%`,
                        background: getAccuracyColor(review.accuracy),
                        transition: "width .5s ease"
                      }} />
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "8px" }}>
                  <button style={{
                    height: "36px",
                    padding: "0 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.textPrimary,
                    background: T.surfaceHover,
                    border: `1px solid ${T.border}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = T.border}
                  onMouseLeave={(e) => e.currentTarget.style.background = T.surfaceHover}
                  >
                    Xem chi tiết
                  </button>

                  {review.status === 'pending' && (
                    <>
                      <button style={{
                        height: "36px",
                        padding: "0 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: T.green,
                        background: T.greenBg,
                        border: `1px solid ${T.green}40`,
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all .15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = T.green + "30"}
                      onMouseLeave={(e) => e.currentTarget.style.background = T.greenBg}
                      >
                        Duyệt
                      </button>
                      <button style={{
                        height: "36px",
                        padding: "0 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: T.red,
                        background: T.redBg,
                        border: `1px solid ${T.red}40`,
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all .15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = T.red + "30"}
                      onMouseLeave={(e) => e.currentTarget.style.background = T.redBg}
                      >
                        Từ chối
                      </button>
                    </>
                  )}

                  {review.status === 'in_review' && (
                    <button style={{
                      height: "36px",
                      padding: "0 16px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: T.purple,
                      background: T.purpleBg,
                      border: `1px solid ${T.purple}40`,
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all .15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.purple + "30"}
                    onMouseLeave={(e) => e.currentTarget.style.background = T.purpleBg}
                    >
                      Tiếp tục review
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