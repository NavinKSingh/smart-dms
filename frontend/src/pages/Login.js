// Login.js — Vault DMS · Dark Edition
// Developed by Navin Kumar Singh · © 2026 Vault DMS

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast }                          from 'react-toastify';
import { useAuth }                        from '../App';
import { authAPI }                        from '../api';

// ============================================================
// STYLES
// ============================================================
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── ROOT ── */
  .lp-root {
    min-height: 100vh;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    background: #080B10;
  }

  /* ═══════════════════════════════════════
     LEFT PANEL — branded visual
  ═══════════════════════════════════════ */
  .lp-left {
    flex: 0 0 52%;
    background: #080B10;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem 3.5rem;
    border-right: 1px solid rgba(255,255,255,0.045);
  }

  /* Mesh gradient glows */
  .lp-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 65% 55% at 15% 105%, rgba(56, 189, 248, 0.07) 0%, transparent 55%),
      radial-gradient(ellipse 45% 40% at 85% -5%,  rgba(99, 102, 241, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse 60% 50% at 50% 50%,  rgba(14,  20,  35, 0.6)  0%, transparent 80%);
    pointer-events: none;
    z-index: 0;
  }

  /* Dot-grid texture */
  .lp-left::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  .lp-left > * { position: relative; z-index: 1; }

  /* ── LOGO ── */
  .lp-brand {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .lp-brand-icon {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, #38BDF8 0%, #6366F1 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 18px rgba(56,189,248,0.35);
  }

  .lp-brand-icon svg {
    width: 18px;
    height: 18px;
    color: #fff;
  }

  .lp-brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem;
    color: #E8F0FF;
    letter-spacing: 0.01em;
  }

  /* ── VISUAL MIDDLE ── */
  .lp-visual {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2.5rem;
  }

  .lp-headline {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 3vw, 2.9rem);
    line-height: 1.18;
    color: #E8F0FF;
    max-width: 390px;
  }

  .lp-headline em {
    font-style: italic;
    background: linear-gradient(90deg, #38BDF8, #818CF8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── DOCUMENT STACK ── */
  .lp-doc-stack {
    position: relative;
    height: 230px;
    max-width: 420px;
  }

  .lp-doc-card {
    position: absolute;
    background: rgba(15, 22, 38, 0.85);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 16px 18px;
    display: flex;
    align-items: flex-start;
    gap: 13px;
    width: 350px;
    backdrop-filter: blur(10px);
    transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s;
  }

  .lp-doc-card:hover { transform: translateY(-4px) !important; }

  .lp-doc-card--a {
    bottom: 0; left: 0;
    transform: rotate(-5deg);
    opacity: 0.38;
    z-index: 1;
  }

  .lp-doc-card--b {
    bottom: 30px; left: 20px;
    transform: rotate(-1.8deg);
    opacity: 0.65;
    z-index: 2;
  }

  .lp-doc-card--c {
    bottom: 60px; left: 40px;
    transform: rotate(0.6deg);
    opacity: 1;
    z-index: 3;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.1);
  }

  .lp-doc-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .lp-doc-icon--pdf  { background: rgba(239,68,68,0.15);  color: #FCA5A5; border: 1px solid rgba(239,68,68,0.2); }
  .lp-doc-icon--xls  { background: rgba(34,197,94,0.12);  color: #86EFAC; border: 1px solid rgba(34,197,94,0.2); }
  .lp-doc-icon--doc  { background: rgba(56,189,248,0.12); color: #7DD3FC; border: 1px solid rgba(56,189,248,0.2); }

  .lp-doc-meta { flex: 1; min-width: 0; }

  .lp-doc-name {
    font-size: 0.83rem;
    font-weight: 500;
    color: #CBD5E1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 5px;
  }

  .lp-doc-info {
    font-size: 0.73rem;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lp-doc-badge {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 20px;
  }

  .lp-doc-badge--new {
    background: rgba(34,197,94,0.1);
    color: #86EFAC;
    border: 1px solid rgba(34,197,94,0.2);
  }

  .lp-doc-badge--shared {
    background: rgba(56,189,248,0.1);
    color: #7DD3FC;
    border: 1px solid rgba(56,189,248,0.2);
  }

  /* ── STATS STRIP ── */
  .lp-stats {
    display: flex;
    gap: 2.5rem;
    padding-top: 1.2rem;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .lp-stat-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #334155;
    margin-bottom: 5px;
  }

  .lp-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem;
    background: linear-gradient(90deg, #38BDF8, #818CF8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  /* ── FOOTER TAGLINE ── */
  .lp-tagline {
    font-size: 0.73rem;
    color: #1E293B;
    letter-spacing: 0.03em;
  }

  /* ═══════════════════════════════════════
     RIGHT PANEL — login form
  ═══════════════════════════════════════ */
  .lp-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2.5rem;
    background: #0D1117;
    position: relative;
  }

  /* Subtle right-panel glow */
  .lp-right::before {
    content: '';
    position: absolute;
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .lp-form-wrap {
    width: 100%;
    max-width: 400px;
    position: relative;
    z-index: 1;
    animation: lp-slidein 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes lp-slidein {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  /* ── FORM HEADER ── */
  .lp-form-eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #38BDF8;
    margin-bottom: 0.6rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lp-form-eyebrow::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 1.5px;
    background: #38BDF8;
    opacity: 0.6;
  }

  .lp-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.05rem;
    color: #E8F0FF;
    line-height: 1.15;
    margin-bottom: 0.5rem;
  }

  .lp-form-subtitle {
    font-size: 0.87rem;
    color: #475569;
    margin-bottom: 2.2rem;
  }

  .lp-form-subtitle a {
    color: #38BDF8;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.15s;
  }

  .lp-form-subtitle a:hover { color: #7DD3FC; }

  /* ── FIELDS ── */
  .lp-field { margin-bottom: 1.3rem; }

  .lp-field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #475569;
    margin-bottom: 8px;
  }

  .lp-input-wrap { position: relative; }

  .lp-input {
    width: 100%;
    padding: 13px 16px;
    background: #0A0F1A;
    border: 1.5px solid #1E293B;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    color: #E2E8F0;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    -webkit-appearance: none;
  }

  .lp-input::placeholder { color: #1E293B; }

  .lp-input:focus {
    border-color: #38BDF8;
    box-shadow: 0 0 0 3px rgba(56,189,248,0.1);
  }

  .lp-input--error {
    border-color: #EF4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
  }

  .lp-input--has-toggle { padding-right: 50px; }

  .lp-toggle-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #334155;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
    line-height: 1;
  }

  .lp-toggle-btn:hover { color: #94A3B8; }
  .lp-toggle-btn svg { width: 18px; height: 18px; }

  .lp-field-error {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 7px;
    font-size: 0.77rem;
    color: #F87171;
  }

  /* ── FORGOT ── */
  .lp-forgot {
    text-align: right;
    margin-top: -0.5rem;
    margin-bottom: 1.6rem;
  }

  .lp-forgot a {
    font-size: 0.8rem;
    color: #334155;
    text-decoration: none;
    transition: color 0.15s;
  }

  .lp-forgot a:hover { color: #94A3B8; }

  /* ── SUBMIT BUTTON ── */
  .lp-submit-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.97rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    letter-spacing: 0.02em;
    box-shadow: 0 4px 22px rgba(56,189,248,0.22);
    position: relative;
    overflow: hidden;
  }

  .lp-submit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .lp-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(56,189,248,0.35);
  }

  .lp-submit-btn:hover:not(:disabled)::after { opacity: 1; }

  .lp-submit-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 16px rgba(56,189,248,0.2);
  }

  .lp-submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── SPINNER ── */
  .lp-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes lp-spin { to { transform: rotate(360deg); } }

  /* ── TRUST STRIP ── */
  .lp-trust {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 2rem;
    padding-top: 1.4rem;
    border-top: 1px solid rgba(255,255,255,0.04);
    flex-wrap: wrap;
  }

  .lp-trust-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.71rem;
    color: #1E293B;
    font-weight: 500;
  }

  .lp-trust-item svg { width: 13px; height: 13px; color: #334155; }

  /* ── DIVIDER ── */
  .lp-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 1.6rem 0 1.2rem;
  }

  .lp-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }

  .lp-divider-text {
    font-size: 0.73rem;
    color: #1E293B;
    white-space: nowrap;
  }

  /* ═══════════════════════════════════════
     RESPONSIVE
  ═══════════════════════════════════════ */
  @media (max-width: 860px) {
    .lp-root { flex-direction: column; }

    .lp-left {
      flex: none;
      padding: 2rem 1.75rem;
      min-height: 270px;
      border-right: none;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .lp-headline { font-size: 1.75rem; }
    .lp-doc-stack { display: none; }
    .lp-stats { gap: 1.5rem; }

    .lp-right { padding: 2.5rem 1.5rem; }
  }
`;

// ── Icons (inline SVG) ────────────────────────────────────────
const IconVault = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 9V7M12 17v-2M9 12H7M17 12h-2"/>
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconCloud = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ============================================================
// LOGIN COMPONENT
// ============================================================
function Login() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const { login }     = useAuth();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});

  const from = location.state?.from || '/dashboard';

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------
  const validate = () => {
    const e = {};

    if (!email.trim()) {
      e.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Please enter a valid email address';
    }

    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 6) {
      e.password = 'Password must be at least 6 characters';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authAPI.login(email.trim(), password);
      const { access_token, user } = response.data;

      login(access_token, user);
      toast.success(`Welcome back, ${user.username}! Your vault is ready.`);
      navigate(from, { replace: true });

    } catch (err) {
      const message = err.response?.data?.error || 'Sign in failed. Please try again.';
      toast.error(message);
      if (err.response?.status === 401) {
        setErrors({ password: 'Incorrect email or password' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <style>{STYLES}</style>

      <div className="lp-root">

        {/* ═══════════════════════════════════════
            LEFT — brand / visual panel
        ═══════════════════════════════════════ */}
        <div className="lp-left">

          {/* Logo */}
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <IconVault />
            </div>
            <span className="lp-brand-name">Vault DMS</span>
          </div>

          {/* Main visual */}
          <div className="lp-visual">
            <h2 className="lp-headline">
              Your documents,<br />
              <em>stored safely.<br />Accessed instantly.</em>
            </h2>

            {/* Stacked document cards */}
            <div className="lp-doc-stack">
              {/* Card A — back */}
              <div className="lp-doc-card lp-doc-card--a">
                <div className="lp-doc-icon lp-doc-icon--xls">XLS</div>
                <div className="lp-doc-meta">
                  <div className="lp-doc-name">Q2_Financial_Report.xlsx</div>
                  <div className="lp-doc-info"><span>Modified 3 days ago</span></div>
                </div>
              </div>

              {/* Card B — middle */}
              <div className="lp-doc-card lp-doc-card--b">
                <div className="lp-doc-icon lp-doc-icon--pdf">PDF</div>
                <div className="lp-doc-meta">
                  <div className="lp-doc-name">NDA_Template_v3.pdf</div>
                  <div className="lp-doc-info">
                    <span>Shared with 4 users</span>
                    <span className="lp-doc-badge lp-doc-badge--shared">Shared</span>
                  </div>
                </div>
              </div>

              {/* Card C — front */}
              <div className="lp-doc-card lp-doc-card--c">
                <div className="lp-doc-icon lp-doc-icon--doc">DOC</div>
                <div className="lp-doc-meta">
                  <div className="lp-doc-name">Project_Brief_2026.docx</div>
                  <div className="lp-doc-info">
                    <span>Uploaded just now</span>
                    <span className="lp-doc-badge lp-doc-badge--new">New</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="lp-stats">
              <div>
                <div className="lp-stat-label">Documents</div>
                <div className="lp-stat-value">12k+</div>
              </div>
              <div>
                <div className="lp-stat-label">Uptime</div>
                <div className="lp-stat-value">99.9%</div>
              </div>
              <div>
                <div className="lp-stat-label">Encryption</div>
                <div className="lp-stat-value">AES‑256</div>
              </div>
            </div>
          </div>

          <p className="lp-tagline">
            © 2026 Vault DMS · Built by Navin Kumar Singh · Enterprise Document Management
          </p>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT — login form
        ═══════════════════════════════════════ */}
        <div className="lp-right">
          <div className="lp-form-wrap">

            <p className="lp-form-eyebrow">Secure access</p>
            <h1 className="lp-form-title">Open your vault</h1>
            <p className="lp-form-subtitle">
              New here?{' '}
              <Link to="/signup">Create a free account →</Link>
            </p>

            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div className="lp-field">
                <label className="lp-field-label" htmlFor="email">Email address</label>
                <div className="lp-input-wrap">
                  <input
                    id="email"
                    type="email"
                    className={`lp-input${errors.email ? ' lp-input--error' : ''}`}
                    placeholder="you@company.com"
                    value={email}
                    autoComplete="email"
                    autoFocus
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                  />
                </div>
                {errors.email && (
                  <span className="lp-field-error">
                    <IconAlert /> {errors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="lp-field">
                <label className="lp-field-label" htmlFor="password">Password</label>
                <div className="lp-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`lp-input lp-input--has-toggle${errors.password ? ' lp-input--error' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                  />
                  <button
                    type="button"
                    className="lp-toggle-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {errors.password && (
                  <span className="lp-field-error">
                    <IconAlert /> {errors.password}
                  </span>
                )}
              </div>

              {/* Forgot */}
              <div className="lp-forgot">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              {/* Submit */}
              <button type="submit" className="lp-submit-btn" disabled={loading}>
                {loading ? (
                  <><div className="lp-spinner" /> Unlocking vault…</>
                ) : (
                  'Unlock My Vault →'
                )}
              </button>

            </form>

            {/* Trust strip */}
            <div className="lp-trust">
              <div className="lp-trust-item"><IconShield /> End-to-end encrypted</div>
              <div className="lp-trust-item"><IconLock /> SOC 2 compliant</div>
              <div className="lp-trust-item"><IconCloud /> 99.9% uptime</div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}

export default Login;