import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

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

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredButton, setHoveredButton] = useState(false);

    // Form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            addToast("Vui lòng nhập đầy đủ thông tin", "error");
            return;
        }

        setIsLoading(true);
        try {
            const user = await login({ username, password });
            addToast(`Chào mừng trở lại, ${user.username}!`, "success");
            
            const roleRoutes = {
                ANNOTATOR: "/annotator/tasks",
                REVIEWER: "/reviewer/queue",
                MANAGER: "/manager/dashboard",
                ADMIN: "/admin/dashboard",
            };
            navigate(roleRoutes[user.role] || "/");
        } catch (error) {
            addToast(error.message || "Đăng nhập thất bại", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: "relative",
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background: T.bg,
            fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
        }}>
            
            {/* Mesh Gradient Background Elements */}
            <div style={{
                position: "absolute",
                top: "-10%",
                left: "-5%",
                width: "600px",
                height: "600px",
                background: T.brandLight,
                borderRadius: "50%",
                filter: "blur(120px)",
                opacity: 0.7,
                animation: "pulse 4s ease-in-out infinite"
            }} />
            <div style={{
                position: "absolute",
                bottom: "-10%",
                right: "-5%",
                width: "500px",
                height: "500px",
                background: T.purpleBg,
                borderRadius: "50%",
                filter: "blur(120px)",
                opacity: 0.7
            }} />
            <div style={{
                position: "absolute",
                top: "20%",
                right: "5%",
                width: "400px",
                height: "400px",
                background: T.greenBg,
                borderRadius: "50%",
                filter: "blur(100px)",
                opacity: 0.6
            }} />

            {/* Login Card */}
            <div style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                maxWidth: "420px",
                padding: "40px",
                background: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(40px)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.08)",
                borderRadius: "40px",
                transition: "all 0.5s"
            }}>
                
                {/* Logo & Header */}
                <div style={{ marginBottom: "48px", textAlign: "center" }}>
                    <h1 style={{
                        fontSize: "36px",
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: T.textPrimary,
                        marginBottom: "8px"
                    }}>
                        DataLabel<span style={{ color: T.brand }}>Core</span>
                    </h1>
                    <p style={{
                        color: T.textMuted,
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        opacity: 0.7
                    }}>
                        Hệ thống gán nhãn dữ liệu nội bộ
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Input Username */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{
                                fontSize: "10px",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.15em",
                                color: T.textMuted,
                                marginLeft: "8px"
                            }}>
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                placeholder="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "56px",
                                    padding: "0 24px",
                                    background: "rgba(248, 250, 252, 0.6)",
                                    border: `1px solid ${T.surface}`,
                                    borderRadius: "16px",
                                    transition: "all 0.3s",
                                    outline: "none",
                                    color: T.textPrimary,
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)"
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.background = T.surface;
                                    e.currentTarget.style.borderColor = T.brand + "50";
                                    e.currentTarget.style.boxShadow = `0 0 0 3px ${T.brand}20`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.background = "rgba(248, 250, 252, 0.6)";
                                    e.currentTarget.style.borderColor = T.surface;
                                    e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.04)";
                                }}
                            />
                        </div>

                        {/* Input Password */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{
                                fontSize: "10px",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.15em",
                                color: T.textMuted,
                                marginLeft: "8px"
                            }}>
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                placeholder="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "56px",
                                    padding: "0 24px",
                                    background: "rgba(248, 250, 252, 0.6)",
                                    border: `1px solid ${T.surface}`,
                                    borderRadius: "16px",
                                    transition: "all 0.3s",
                                    outline: "none",
                                    color: T.textPrimary,
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)"
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.background = T.surface;
                                    e.currentTarget.style.borderColor = T.brand + "50";
                                    e.currentTarget.style.boxShadow = `0 0 0 3px ${T.brand}20`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.background = "rgba(248, 250, 252, 0.6)";
                                    e.currentTarget.style.borderColor = T.surface;
                                    e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.04)";
                                }}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        onMouseEnter={() => setHoveredButton(true)}
                        onMouseLeave={() => setHoveredButton(false)}
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "56px",
                            background: `linear-gradient(135deg, ${T.brand}, ${T.brandHover})`,
                            color: "#FFFFFF",
                            fontWeight: 700,
                            fontSize: "13px",
                            letterSpacing: "0.08em",
                            borderRadius: "16px",
                            border: "none",
                            boxShadow: hoveredButton ? `0 20px 32px -8px ${T.brand}80` : `0 12px 24px -6px ${T.brand}60`,
                            transform: hoveredButton ? "translateY(-2px)" : "translateY(0)",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                            transition: "all 0.2s",
                            overflow: "hidden",
                            fontFamily: "inherit"
                        }}
                    >
                        <span style={{
                            position: "relative",
                            zIndex: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}>
                            {isLoading ? "ĐANG XÁC THỰC..." : "ĐĂNG NHẬP"}
                        </span>
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(255, 255, 255, 0.1)",
                            opacity: hoveredButton ? 1 : 0,
                            transition: "opacity 0.2s"
                        }} />
                    </button>
                </form>

                {/* Footer Links */}
                <div style={{ marginTop: "32px", textAlign: "center" }}>
                    <p style={{
                        fontSize: "13px",
                        color: T.textSecondary,
                        fontWeight: 500
                    }}>
                        Chưa có tài khoản?{" "}
                        <Link
                            to="/register"
                            style={{
                                color: T.brand,
                                fontWeight: 700,
                                textDecoration: "none"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                        >
                            Đăng ký
                        </Link>
                    </p>
                </div>

                {/* Footer Security Note */}
                <div style={{
                    marginTop: "48px",
                    paddingTop: "32px",
                    borderTop: `1px solid ${T.border}50`,
                    textAlign: "center"
                }}>
                    <p style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: T.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.25em",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                    }}>
                        <span style={{
                            width: "4px",
                            height: "4px",
                            background: T.brand,
                            borderRadius: "50%",
                            animation: "ping 2s ease-in-out infinite"
                        }} />
                        Truy cập hạn chế • Chỉ nội bộ
                    </p>
                </div>
            </div>
        </div>
    );
}