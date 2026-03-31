import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(32px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-32px); }
  to   { opacity: 1; transform: translateX(0); }
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
.login-btn:active:not(:disabled) { transform: translateY(0); }

.register-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%) !important;
  box-shadow: 0 8px 32px rgba(109,40,217,0.65) !important;
  transform: translateY(-1px);
}
.register-btn:active:not(:disabled) { transform: translateY(0); }

.switch-link {
  color: #93c5fd; font-weight: 700; text-decoration: none; cursor: pointer;
  background: none; border: none; font-family: inherit; font-size: 13px;
}
.switch-link:hover { text-decoration: underline; }
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
      {[
        { top: -1, left: -1, borderTop: '2px solid #22c55e', borderLeft: '2px solid #22c55e', width: 8, height: 8 },
        { top: -1, right: -1, borderTop: '2px solid #22c55e', borderRight: '2px solid #22c55e', width: 8, height: 8 },
        { bottom: -1, left: -1, borderBottom: '2px solid #22c55e', borderLeft: '2px solid #22c55e', width: 8, height: 8 },
        { bottom: -1, right: -1, borderBottom: '2px solid #22c55e', borderRight: '2px solid #22c55e', width: 8, height: 8 },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', ...s }} />
      ))}
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

/* ─── Input field helper ─── */
function Field({ label, type = 'text', placeholder, value, onChange, error }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <label style={{
        fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.5)',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="login-input"
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            height: '46px', padding: isPassword ? '0 44px 0 16px' : '0 16px',
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${error ? 'rgba(248,113,113,0.7)' : 'rgba(150,190,255,0.2)'}`,
            borderRadius: '10px',
            color: '#fff', fontSize: '14px',
            fontFamily: 'inherit', fontWeight: 500,
            transition: 'all 0.2s', width: '100%',
            boxSizing: 'border-box',
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex',
          }}>
            {show
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: '11px', color: 'rgba(248,113,113,0.9)' }}>{error}</span>}
    </div>
  );
}

/* ─── Login Form ─── */
function LoginForm({ onSwitch }) {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth"]);
  const { login } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      addToast(t('auth:login.required'), 'error');
      return;
    }
    setIsLoading(true);
    try {
      const user = await login({ username, password });
      addToast(t('auth:login.success', { username: user.username }), 'success');
      const roleRoutes = {
        ANNOTATOR: '/annotator/tasks',
        REVIEWER: '/reviewer/queue',
        MANAGER: '/manager/dashboard',
        ADMIN: '/admin/dashboard',
      };
      navigate(roleRoutes[user.role] || '/');
    } catch (error) {
      addToast(error.message || t('auth:login.failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Field label={t('auth:login.fields.username.label')} placeholder={t('auth:login.fields.username.placeholder')} value={username} onChange={e => setUsername(e.target.value)} />
      <Field label={t('auth:login.fields.password.label')} type="password" placeholder={t('auth:login.fields.password.placeholder')} value={password} onChange={e => setPassword(e.target.value)} />

      <button
        className="login-btn"
        type="submit"
        disabled={isLoading}
        style={{
          marginTop: '6px', height: '50px', width: '100%',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#fff', fontWeight: 800, fontSize: '12px',
          letterSpacing: '0.14em', border: 'none', borderRadius: '10px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s',
          fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(37,99,235,0.5)',
        }}
      >
        {isLoading ? t('auth:login.authenticating') : t('auth:login.submit')}
      </button>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          {t('auth:login.newAccount')}{' '}
          <button type="button" className="switch-link" onClick={onSwitch}>{t('auth:login.switchToRegister')}</button>
        </p>
      </div>
    </form>
  );
}

/* ─── Register Form ─── */
function RegisterForm({ onSwitch }) {
  const { t } = useTranslation(["auth"]);
  const { register } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ username: '', fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim() || form.username.length < 3) errs.username = t('auth:register.validation.shortMin3');
    if (!form.fullName.trim()) errs.fullName = t('auth:register.validation.shortRequired');
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = t('auth:register.validation.emailInvalid');
    if (!form.password || form.password.length < 6) errs.password = t('auth:register.validation.shortMin6');
    if (form.password !== form.confirmPassword) errs.confirmPassword = t('auth:register.validation.passwordMismatch');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password, fullName: form.fullName });
      addToast(t('auth:register.success'), 'success');
      onSwitch();
    } catch (error) {
      addToast(error.message || t('auth:register.failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label={t('auth:register.fields.username.label')} placeholder={t('auth:register.fields.username.placeholder')} value={form.username} onChange={set('username')} error={errors.username} />
        <Field label={t('auth:register.fields.fullName.label')} placeholder={t('auth:register.fields.fullName.placeholder')} value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
      </div>
      <Field label={t('auth:register.fields.email.label')} type="email" placeholder={t('auth:register.fields.email.placeholder')} value={form.email} onChange={set('email')} error={errors.email} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label={t('auth:register.fields.password.label')} type="password" placeholder={t('auth:register.fields.password.placeholder')} value={form.password} onChange={set('password')} error={errors.password} />
        <Field label={t('auth:register.fields.confirmPassword.label')} type="password" placeholder={t('auth:register.fields.confirmPassword.placeholder')} value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
      </div>

      <button
        className="register-btn"
        type="submit"
        disabled={isLoading}
        style={{
          marginTop: '4px', height: '50px', width: '100%',
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          color: '#fff', fontWeight: 800, fontSize: '12px',
          letterSpacing: '0.14em', border: 'none', borderRadius: '10px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s',
          fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(109,40,217,0.5)',
        }}
      >
        {isLoading ? t('auth:register.creating') : t('auth:register.submit')}
      </button>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          {t('auth:register.hasAccount')}{' '}
          <button type="button" className="switch-link" onClick={onSwitch}>{t('auth:register.switchToLogin')}</button>
        </p>
      </div>
    </form>
  );
}

/* ─── Main Page ─── */
export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const { t } = useTranslation(["auth"]);

  const isRegister = mode === 'register';

  return (
    <>
      <style>{STYLES}</style>

      <div style={{
        position: 'relative', minHeight: '100vh', width: '100%',
        display: 'flex', alignItems: 'center',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        overflow: 'hidden',
      }}>

        {/* Background image */}
        <img src="/login-bg.jpg" alt="" style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 40%',
        }} />

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(110deg, rgba(3,10,40,0.68) 0%, rgba(5,18,65,0.58) 45%, rgba(8,22,75,0.45) 100%)',
        }} />

        {/* Scanning line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.0) 20%, rgba(96,165,250,0.6) 50%, rgba(96,165,250,0.0) 80%, transparent 100%)',
          animation: 'scanLine 6s linear infinite',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* AI Bounding Boxes */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          <BBox label="CAR" confidence="0.97" style={{ left: '22%', top: '52%', width: 80, height: 48, animationDelay: '0s' }} />
          <BBox label="CAR" confidence="0.94" style={{ left: '30%', top: '58%', width: 64, height: 40, animationDelay: '0.6s' }} />
          <BBox label="VEHICLE" confidence="0.89" style={{ left: '14%', top: '62%', width: 96, height: 52, animationDelay: '1.2s' }} />
          <BBox label="CAR" confidence="0.96" style={{ left: '38%', top: '55%', width: 56, height: 36, animationDelay: '0.3s' }} />
          <BBox label="TRUCK" confidence="0.91" style={{ left: '8%', top: '68%', width: 110, height: 58, animationDelay: '1.8s' }} />
        </div>

        {/* Grid dots */}
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

        {/* Main content */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '1280px',
          margin: '0 auto', padding: '0 5%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '40px',
        }}>

          {/* LEFT: Marketing text */}
          <div style={{ flex: '0 0 40%', color: '#fff', maxWidth: '480px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ width: '20px', height: '1.5px', background: 'rgba(96,165,250,0.7)' }} />
              <span style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}>
                {t('auth:marketing.eyebrow')}
              </span>
            </div>
            <h1 style={{
              fontSize: 'clamp(44px, 5vw, 68px)', fontWeight: 900,
              lineHeight: 1.06, letterSpacing: '-0.02em',
              margin: '0 0 24px 0', color: '#fff',
            }}>
              {t('auth:marketing.titleLine1')}<br />{t('auth:marketing.titleLine2')}<br />
              <span style={{
                background: 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 60%, #bfdbfe 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {t('auth:marketing.titleAccent')}
              </span>
            </h1>
            <p style={{
              fontSize: '14px', color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.85, margin: '0 0 36px 0', maxWidth: '380px',
            }}>
              {t('auth:marketing.description')}
            </p>
          </div>

          {/* RIGHT: Card */}
          <div style={{
            flex: '0 0 auto',
            width: '100%',
            maxWidth: isRegister ? '520px' : '420px',
            animation: 'floatUp 6s ease-in-out infinite',
            transition: 'max-width 0.4s ease',
          }}>
            <div style={{
              background: 'rgba(8,20,70,0.70)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: `1px solid ${isRegister ? 'rgba(167,139,250,0.25)' : 'rgba(96,165,250,0.22)'}`,
              borderRadius: '20px',
              padding: '40px 40px 32px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.08) inset',
              position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.4s ease',
            }}>

              {/* Card shimmer */}
              <div style={{
                position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                background: isRegister
                  ? 'linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(96,165,250,0.5), transparent)',
                transition: 'background 0.4s ease',
              }} />

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{
                  fontSize: '28px', fontWeight: 900,
                  color: '#fff', letterSpacing: '-0.02em', margin: '0 0 6px 0',
                }}>{t('common:appName')}</h2>
                <p style={{
                  fontSize: '9.5px', fontWeight: 700,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.38)', margin: 0,
                }}>
                  {isRegister ? t('auth:register.title') : t('auth:login.subtitle')}
                </p>
              </div>

              {/* Animated form area */}
              <div key={mode} style={{ animation: isRegister ? 'slideInRight 0.3s ease' : 'slideInLeft 0.3s ease' }}>
                {isRegister
                  ? <RegisterForm onSwitch={() => setMode('login')} />
                  : <LoginForm onSwitch={() => setMode('register')} />
                }
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '20px', paddingTop: '16px',
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
                  {t('auth:marketing.restricted')}
                  <span style={{ width: '3px', height: '3px', background: '#60a5fa', borderRadius: '50%', display: 'inline-block' }} />
                  {t('auth:marketing.internalOnly')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
