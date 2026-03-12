import React from 'react';
import { useNavigate } from 'react-router-dom';

// Modern Enterprise UI Color Palette
const T = {
    bg: "#F7F8F9",
    surface: "#FFFFFF",
    surfaceHover: "#F1F2F4",
    border: "#DCDFE4",
    borderStrong: "#B3B9C4",
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

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: T.bg,
      fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{
        maxWidth: "400px",
        width: "100%",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "6px",
        padding: "32px",
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(9,30,66,.08)"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>

        <h1 style={{
          fontSize: "24px",
          fontWeight: 800,
          color: T.red,
          marginBottom: "8px",
          letterSpacing: "-0.02em"
        }}>
          Truy cập bị từ chối
        </h1>

        <p style={{
          fontSize: "13px",
          color: T.textMuted,
          marginBottom: "24px",
          lineHeight: "1.5"
        }}>
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => navigate('/')}
            onMouseEnter={(e) => e.currentTarget.style.background = T.brandHover}
            onMouseLeave={(e) => e.currentTarget.style.background = T.brand}
            style={{
              height: "32px",
              padding: "0 16px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#FFFFFF",
              background: T.brand,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s"
            }}
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate(-1)}
            onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceHover}
            onMouseLeave={(e) => e.currentTarget.style.background = T.surface}
            style={{
              height: "32px",
              padding: "0 16px",
              fontSize: "12px",
              fontWeight: 600,
              color: T.textPrimary,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s"
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}