import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/* ─── Inline keyframes injected once ─── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

@keyframes scanLine {
  0%   { top: -4px; opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes bboxPulse {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
}
@keyframes gridFade {
  0%, 100% { opacity: 0.18; }
  50%       { opacity: 0.32; }
}
@keyframes floatUp {
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
}
@keyframes inputGlow {
  0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  100% { box-shadow: 0 0 0 3px rgba(59,130,246,0.25); }
}

.login-input:focus {
  outline: none;
  border-color: rgba(96,165,250,0.9) !important;
  background: rgba(255,255,255,0.13) !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
}
.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
  box-shadow: 0 8px 32px rgba(37,99,235,0.65) !important;
  transform: translateY(-1px);
}
.login-btn:active:not(:disabled) {
  transform: translateY(0);
}
`;

/* ─── AI Bounding Box component ─── */
function BBox({ style, label, confidence }) {
  return (
    <div style={{
      position: 'absolute',
      border: '1.5px solid #22c55e',
      borderRadius: '3px',
      animation: 'bboxPulse 2.4s ease-in-out infinite',
      pointerEvents: 'none',
      ...style,
    }}>
      {/* Corner accents */}
      {[
        { top: -1, left: -1, borderTop: '2px solid #22c55e', borderLeft: '2px solid #22c55e', width: 8, height: 8 },
        { top: -1, right: -1, borderTop: '2px solid #22c55e', borderRight: '2px solid #22c55e', width: 8, height: 8 },
        { bottom: -1, left: -1, borderBottom: '2px solid #22c55e', borderLeft: '2px solid #22c55e', width: 8, height: 8 },
        { bottom: -1, right: -1, borderBottom: '2px solid #22c55e', borderRight: '2px solid #22c55e', width: 8, height: 8 },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', ...s }} />
      ))}
      {/* Label */}
      <div style={{
        position: 'absolute', top: -18, left: -1,
        background: '#22c55e', color: '#000',
        fontSize: '9px', fontWeight: 700,
        padding: '1px 5px', borderRadius: '2px',
        whiteSpace: 'nowrap', letterSpacing: '0.05em',
        fontFamily: 'monospace',
      }}>
        {label} {confidence}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const user = await login({ username, password });
      addToast(`Chào mừng trở lại, ${user.username}!`, 'success');
      const roleRoutes = {
        ANNOTATOR: '/annotator/tasks',
        REVIEWER: '/reviewer/queue',
        MANAGER: '/manager/dashboard',
        ADMIN: '/admin/dashboard',
      };
      navigate(roleRoutes[user.role] || '/');
    } catch (error) {
      addToast(error.message || 'Đăng nhập thất bại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div style={{
        position: 'relative', minHeight: '100vh', width: '100%',
        display: 'flex', alignItems: 'center',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        overflow: 'hidden',
      }}>

        {/* ── Background image ── */}
        <img src="/login-bg.jpg" alt="" style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 40%',
        }} />

        {/* ── Dark blue gradient overlay ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(110deg, rgba(3,10,40,0.68) 0%, rgba(5,18,65,0.58) 45%, rgba(8,22,75,0.45) 100%)',
        }} />

        {/* ── Scanning line ── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.0) 20%, rgba(96,165,250,0.6) 50%, rgba(96,165,250,0.0) 80%, transparent 100%)',
          animation: 'scanLine 6s linear infinite',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* ── AI Bounding Boxes (positioned over road area) ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          <BBox label="CAR" confidence="0.97" style={{ left: '22%', top: '52%', width: 80, height: 48, animationDelay: '0s' }} />
          <BBox label="CAR" confidence="0.94" style={{ left: '30%', top: '58%', width: 64, height: 40, animationDelay: '0.6s' }} />
          <BBox label="VEHICLE" confidence="0.89" style={{ left: '14%', top: '62%', width: 96, height: 52, animationDelay: '1.2s' }} />
          <BBox label="CAR" confidence="0.96" style={{ left: '38%', top: '55%', width: 56, height: 36, animationDelay: '0.3s' }} />
          <BBox label="TRUCK" confidence="0.91" style={{ left: '8%', top: '68%', width: 110, height: 58, animationDelay: '1.8s' }} />
        </div>

        {/* ── Grid dots bottom-left ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '320px', height: '220px',
          backgroundImage: 'radial-gradient(rgba(96,165,250,0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '22px 22px',
          animation: 'gridFade 4s ease-in-out infinite',
          zIndex: 2, pointerEvents: 'none',
          maskImage: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, transparent 70%)',
        }} />

        {/* ── Main content ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '1280px',
          margin: '0 auto', padding: '0 5%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '40px',
        }}>

          {/* ════ LEFT: Marketing text ════ */}
          <div style={{ flex: '0 0 40%', color: '#fff', maxWidth: '480px' }}>
            {/* Small label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              marginBottom: '20px',
            }}>
              <div style={{ width: '20px', height: '1.5px', background: 'rgba(96,165,250,0.7)' }} />
              <span style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}>
                Nền tảng gán nhãn dữ liệu
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(44px, 5vw, 68px)',
              fontWeight: 900, lineHeight: 1.06,
              letterSpacing: '-0.02em',
              margin: '0 0 24px 0', color: '#fff',
            }}>
              Gán nhãn<br />dữ liệu<br />
              <span style={{
                background: 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 60%, #bfdbfe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                chính xác hơn
              </span>
            </h1>

            {/* Description */}
            <p style={{
              fontSize: '14px', color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.85, margin: '0 0 36px 0', maxWidth: '380px',
            }}>
              Quản lý, phân công và theo dõi tiến độ gán nhãn
              dữ liệu ngay trên một nền tảng. Được tin dùng
              bởi các nhóm ở mọi quy mô, cho dữ liệu ở mọi quy mô.
            </p>


          </div>

          {/* ════ RIGHT: Login card ════ */}
          <div style={{
            flex: '0 0 auto', width: '100%', maxWidth: '420px',
            animation: 'floatUp 6s ease-in-out infinite',
          }}>
            <div style={{
              background: 'rgba(8,20,70,0.70)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(96,165,250,0.22)',
              borderRadius: '20px',
              padding: '44px 40px 36px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.08) inset',
              position: 'relative', overflow: 'hidden',
            }}>

              {/* Card top shimmer line */}
              <div style={{
                position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.5), transparent)',
              }} />

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '32px', fontWeight: 900,
                  color: '#fff', letterSpacing: '-0.02em',
                  margin: '0 0 8px 0',
                }}>DataLabel</h2>
                <p style={{
                  fontSize: '9.5px', fontWeight: 700,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.38)', margin: 0,
                }}>
                  Hệ thống gán nhãn dữ liệu nội bộ
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Username */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{
                    fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                  }}>Tên đăng nhập</label>
                  <input
                    className="login-input"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      height: '50px', padding: '0 16px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(150,190,255,0.2)',
                      borderRadius: '10px',
                      color: '#fff', fontSize: '15px',
                      fontFamily: 'inherit', fontWeight: 500,
                      transition: 'all 0.2s', width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{
                    fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                  }}>Mật khẩu</label>
                  <input
                    className="login-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      height: '50px', padding: '0 16px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(150,190,255,0.2)',
                      borderRadius: '10px',
                      color: '#fff', fontSize: '15px',
                      fontFamily: 'inherit', fontWeight: 500,
                      transition: 'all 0.2s', width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Submit */}
                <button
                  className="login-btn"
                  type="submit"
                  disabled={isLoading}
                  style={{
                    marginTop: '6px',
                    height: '50px', width: '100%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#fff', fontWeight: 800,
                    fontSize: '12px', letterSpacing: '0.14em',
                    border: 'none', borderRadius: '10px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 24px rgba(37,99,235,0.5)',
                  }}
                >
                  {isLoading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP'}
                </button>
              </form>

              {/* Register */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/register"
                    style={{ color: '#93c5fd', fontWeight: 700, textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Đăng ký
                  </Link>
                </p>
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '24px', paddingTop: '18px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
              }}>
                <p style={{
                  fontSize: '9px', fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', margin: 0,
                }}>
                  <span style={{ width: '3px', height: '3px', background: '#60a5fa', borderRadius: '50%', display: 'inline-block' }} />
                  Truy cập hạn chế
                  <span style={{ width: '3px', height: '3px', background: '#60a5fa', borderRadius: '50%', display: 'inline-block' }} />
                  Chỉ nội bộ
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
