import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SOURCE_FILES } from '../../utils/sourceMeta';

/* ─── Custom animations (không thể thay bằng Tailwind built-in) ─── */
const CUSTOM_STYLES = `
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
.anim-scan     { animation: scanLine 6s linear infinite; }
.anim-bbox     { animation: bboxPulse 2.4s ease-in-out infinite; }
.anim-grid     { animation: gridFade 4s ease-in-out infinite; }
.anim-float    { animation: floatUp 6s ease-in-out infinite; }
.anim-slide-r  { animation: slideInRight 0.3s ease; }
.anim-slide-l  { animation: slideInLeft 0.3s ease; }

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

/* ─── AI Bounding Box ─── */
interface BBoxProps {
  style: React.CSSProperties;
  label: string;
  confidence: string;
}
function BBox({ style, label, confidence }: BBoxProps) {
  return (
    <div
      className="anim-bbox absolute border-[1.5px] border-green-500 rounded-[3px] pointer-events-none"
      style={style}
    >
      {/* Corner markers */}
      <div className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-green-500" />
      <div className="absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2 border-green-500" />
      <div className="absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2 border-green-500" />
      <div className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-green-500" />
      {/* Label */}
      <div className="absolute -top-[18px] -left-px bg-green-500 text-black text-[9px] font-bold px-[5px] py-px rounded-[2px] whitespace-nowrap tracking-[0.05em] font-mono">
        {label} {confidence}
      </div>
    </div>
  );
}

/* ─── Input field ─── */
interface FieldProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}
function Field({ label, type = 'text', placeholder, value, onChange, error }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="flex flex-col gap-[7px]">
      <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/50">
        {label}
      </label>
      <div className="relative">
        <input
          className={`login-input w-full h-[46px] bg-white/[0.08] rounded-[10px] text-white text-sm font-medium transition-all duration-200 ${isPassword ? 'pr-11 pl-4' : 'px-4'}`}
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{ border: `1px solid ${error ? 'rgba(248,113,113,0.7)' : 'rgba(150,190,255,0.2)'}` }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-white/40 p-0 flex"
          >
            {show
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
      {error && <span className="text-[11px] text-red-400/90">{error}</span>}
    </div>
  );
}

/* ─── Login Form ─── */
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth"]);
  const { login } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { addToast(t('auth:login.required'), 'error'); return; }
    setIsLoading(true);
    try {
      const user = await login({ username, password });
      addToast(t('auth:login.success', { username: user.username }), 'success');
      const roleRoutes: Record<string, string> = { ANNOTATOR: '/annotator/tasks', REVIEWER: '/reviewer/queue', MANAGER: '/manager/dashboard', ADMIN: '/admin/dashboard' };
      navigate(roleRoutes[user.role] || '/');
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast(error.message || t('auth:login.failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <Field label={t('auth:login.fields.username.label')} placeholder={t('auth:login.fields.username.placeholder')} value={username} onChange={e => setUsername(e.target.value)} error="" />
      <Field label={t('auth:login.fields.password.label')} type="password" placeholder={t('auth:login.fields.password.placeholder')} value={password} onChange={e => setPassword(e.target.value)} error="" />

      <button
        className="login-btn mt-1.5 h-[50px] w-full border-none rounded-[10px] text-white font-extrabold text-xs tracking-[0.14em] cursor-pointer transition-all duration-200 font-[inherit] disabled:cursor-not-allowed"
        type="submit"
        disabled={isLoading}
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          boxShadow: '0 4px 24px rgba(37,99,235,0.5)',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? t('auth:login.authenticating') : t('auth:login.submit')}
      </button>

      <div className="text-center">
        <p className="text-[13px] text-white/45 m-0">
          {t('auth:login.newAccount')}{' '}
          <button type="button" className="switch-link" onClick={onSwitch}>{t('auth:login.switchToRegister')}</button>
        </p>
      </div>
    </form>
  );
}

/* ─── Register Form ─── */
interface RegisterFormState {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { t } = useTranslation(["auth"]);
  const { register } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<RegisterFormState>({ username: '', fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<RegisterFormState>>({});

  const set = (field: keyof RegisterFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Partial<RegisterFormState> = {};
    if (!form.username.trim() || form.username.length < 3) errs.username = t('auth:register.validation.shortMin3');
    if (!form.fullName.trim()) errs.fullName = t('auth:register.validation.shortRequired');
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = t('auth:register.validation.emailInvalid');
    if (!form.password || form.password.length < 6) errs.password = t('auth:register.validation.shortMin6');
    if (form.password !== form.confirmPassword) errs.confirmPassword = t('auth:register.validation.passwordMismatch');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password, fullName: form.fullName });
      addToast(t('auth:register.success'), 'success');
      onSwitch();
    } catch (err: unknown) {
      const error = err as { message?: string };
      addToast(error.message || t('auth:register.failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-[13px]">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('auth:register.fields.username.label')} placeholder={t('auth:register.fields.username.placeholder')} value={form.username} onChange={set('username')} error={errors.username} />
        <Field label={t('auth:register.fields.fullName.label')} placeholder={t('auth:register.fields.fullName.placeholder')} value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
      </div>
      <Field label={t('auth:register.fields.email.label')} type="email" placeholder={t('auth:register.fields.email.placeholder')} value={form.email} onChange={set('email')} error={errors.email} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('auth:register.fields.password.label')} type="password" placeholder={t('auth:register.fields.password.placeholder')} value={form.password} onChange={set('password')} error={errors.password} />
        <Field label={t('auth:register.fields.confirmPassword.label')} type="password" placeholder={t('auth:register.fields.confirmPassword.placeholder')} value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
      </div>

      <button
        className="register-btn mt-1 h-[50px] w-full border-none rounded-[10px] text-white font-extrabold text-xs tracking-[0.14em] cursor-pointer transition-all duration-200 font-[inherit] disabled:cursor-not-allowed"
        type="submit"
        disabled={isLoading}
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          boxShadow: '0 4px 24px rgba(109,40,217,0.5)',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? t('auth:register.creating') : t('auth:register.submit')}
      </button>

      <div className="text-center">
        <p className="text-[13px] text-white/45 m-0">
          {t('auth:register.hasAccount')}{' '}
          <button type="button" className="switch-link" onClick={onSwitch}>{t('auth:register.switchToLogin')}</button>
        </p>
      </div>
    </form>
  );
}

/* ─── Main Page ─── */
export default function Login() {
  const [mode, setMode] = useState('login');
  const { t } = useTranslation(["auth"]);
  const isRegister = mode === 'register';

  return (
    <>
      <style>{CUSTOM_STYLES}</style>

      <div
        className="relative min-h-screen w-full flex items-center font-[Inter,'Segoe_UI',system-ui,sans-serif] overflow-hidden"
        data-source-file={SOURCE_FILES.loginPage}
      data-source-label="section:login-page"
      >

        {/* Background image */}
        <img src="/login-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_40%]" />

        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(110deg, rgba(3,10,40,0.68) 0%, rgba(5,18,65,0.58) 45%, rgba(8,22,75,0.45) 100%)' }}
        />

        {/* Scanning line */}
        <div
          className="anim-scan absolute left-0 right-0 h-[2px] z-[2] pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.0) 20%, rgba(96,165,250,0.6) 50%, rgba(96,165,250,0.0) 80%, transparent 100%)' }}
        />

        {/* AI Bounding Boxes */}
        <div className="absolute inset-0 z-[3] pointer-events-none">
          <BBox label="CAR"     confidence="0.97" style={{ left: '22%', top: '52%', width: 80,  height: 48, animationDelay: '0s'   }} />
          <BBox label="CAR"     confidence="0.94" style={{ left: '30%', top: '58%', width: 64,  height: 40, animationDelay: '0.6s' }} />
          <BBox label="VEHICLE" confidence="0.89" style={{ left: '14%', top: '62%', width: 96,  height: 52, animationDelay: '1.2s' }} />
          <BBox label="CAR"     confidence="0.96" style={{ left: '38%', top: '55%', width: 56,  height: 36, animationDelay: '0.3s' }} />
          <BBox label="TRUCK"   confidence="0.91" style={{ left: '8%',  top: '68%', width: 110, height: 58, animationDelay: '1.8s' }} />
        </div>

        {/* Grid dots */}
        <div
          className="anim-grid absolute bottom-0 left-0 w-[320px] h-[220px] z-[2] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(96,165,250,0.35) 1.5px, transparent 1.5px)',
            backgroundSize: '22px 22px',
            maskImage: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, transparent 70%)',
            WebkitMaskImage: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, transparent 70%)',
          }}
        />

        {/* Main content */}
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-[5%] flex items-center justify-between gap-10">

          {/* LEFT: Marketing */}
          <div className="flex-[0_0_40%] text-white max-w-[480px]">
            <div className="inline-flex items-center gap-2 mb-5">
              <div className="w-5 h-[1.5px] bg-blue-400/70" />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/55">
                {t('auth:marketing.eyebrow')}
              </span>
            </div>
            <h1
              className="font-black leading-[1.06] tracking-[-0.02em] mb-6 text-white m-0"
              style={{ fontSize: 'clamp(44px, 5vw, 68px)' }}
            >
              {t('auth:marketing.titleLine1')}<br />
              {t('auth:marketing.titleLine2')}<br />
              <span style={{
                background: 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 60%, #bfdbfe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {t('auth:marketing.titleAccent')}
              </span>
            </h1>
            <p className="text-sm text-white/55 leading-[1.85] mb-9 max-w-[380px]">
              {t('auth:marketing.description')}
            </p>
          </div>

          {/* RIGHT: Card */}
          <div
            className="anim-float flex-none w-full transition-[max-width] duration-[400ms] ease-in-out"
            style={{ maxWidth: isRegister ? 520 : 420 }}
          >
            <div
              className="relative overflow-hidden rounded-[20px] px-10 pt-10 pb-8 transition-[border-color] duration-[400ms] ease-in-out"
              style={{
                background: 'rgba(8,20,70,0.70)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: `1px solid ${isRegister ? 'rgba(167,139,250,0.25)' : 'rgba(96,165,250,0.22)'}`,
                boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.08) inset',
              }}
            >
              {/* Card shimmer */}
              <div
                className="absolute top-0 left-[10%] right-[10%] h-px transition-all duration-[400ms] ease-in-out"
                style={{
                  background: isRegister
                    ? 'linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(96,165,250,0.5), transparent)',
                }}
              />

              {/* Title */}
              <div className="text-center mb-7">
                <h2 className="text-[28px] font-black text-white tracking-[-0.02em] m-0 mb-1.5">
                  {t('common:appName')}
                </h2>
                <p className="text-[9.5px] font-bold tracking-[0.22em] uppercase text-white/38 m-0">
                  {isRegister ? t('auth:register.title') : t('auth:login.subtitle')}
                </p>
              </div>

              {/* Animated form */}
              <div key={mode} className={isRegister ? 'anim-slide-r' : 'anim-slide-l'}>
                {isRegister
                  ? <RegisterForm onSwitch={() => setMode('login')} />
                  : <LoginForm onSwitch={() => setMode('register')} />
                }
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] flex items-center justify-center gap-2 m-0">
                  <span className="w-[3px] h-[3px] bg-blue-400 rounded-full inline-block" />
                  {t('auth:marketing.restricted')}
                  <span className="w-[3px] h-[3px] bg-blue-400 rounded-full inline-block" />
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
