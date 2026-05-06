// Signup.js — Vault DMS · Dark Edition
// Developed by Navin Kumar Singh · © 2026 Vault DMS

import React, { useState, useMemo } from 'react';
import { useNavigate, Link }         from 'react-router-dom';
import { toast }                     from 'react-toastify';
import { useAuth }                   from '../App';
import { authAPI }                   from '../api';

// ============================================================
// STYLES
// ============================================================
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── ROOT ── */
  .sp-root {
    min-height: 100vh;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    background: #080B10;
  }

  /* ═══════════════════════════════════════
     LEFT PANEL — branded visual
  ═══════════════════════════════════════ */
  .sp-left {
    flex: 0 0 48%;
    background: #080B10;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem 3.5rem;
    border-right: 1px solid rgba(255,255,255,0.045);
  }

  /* Mesh glows */
  .sp-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 55% at 10% 100%, rgba(99,102,241,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 90%  0%,  rgba(56,189,248,0.07) 0%, transparent 55%),
      radial-gradient(ellipse 70% 60% at 50% 50%,  rgba(14, 20, 35, 0.5)  0%, transparent 80%);
    pointer-events: none;
    z-index: 0;
  }

  /* Dot grid */
  .sp-left::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  .sp-left > * { position: relative; z-index: 1; }

  /* ── LOGO ── */
  .sp-brand {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .sp-brand-icon {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, #38BDF8 0%, #6366F1 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 18px rgba(56,189,248,0.35);
  }

  .sp-brand-icon svg { width: 18px; height: 18px; color: #fff; }

  .sp-brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem;
    color: #E8F0FF;
    letter-spacing: 0.01em;
  }

  /* ── HEADLINE ── */
  .sp-visual {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2.2rem;
  }

  .sp-headline {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 2.6vw, 2.6rem);
    line-height: 1.18;
    color: #E8F0FF;
    max-width: 360px;
  }

  .sp-headline em {
    font-style: italic;
    background: linear-gradient(90deg, #38BDF8, #818CF8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── FEATURE LIST ── */
  .sp-features {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sp-feature {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    padding: 14px 16px;
    background: rgba(15,22,38,0.7);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 14px;
    backdrop-filter: blur(8px);
    transition: border-color 0.2s, background 0.2s;
  }

  .sp-feature:hover {
    border-color: rgba(56,189,248,0.15);
    background: rgba(15,22,38,0.9);
  }

  .sp-feature-icon {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sp-feature-icon svg { width: 17px; height: 17px; }

  .sp-feature-icon--blue { background: rgba(56,189,248,0.12); color: #7DD3FC; border: 1px solid rgba(56,189,248,0.15); }
  .sp-feature-icon--violet { background: rgba(99,102,241,0.12); color: #A5B4FC; border: 1px solid rgba(99,102,241,0.15); }
  .sp-feature-icon--green { background: rgba(34,197,94,0.1); color: #86EFAC; border: 1px solid rgba(34,197,94,0.15); }

  .sp-feature-text h4 {
    font-size: 0.83rem;
    font-weight: 600;
    color: #CBD5E1;
    margin-bottom: 2px;
  }

  .sp-feature-text p {
    font-size: 0.73rem;
    color: #334155;
    line-height: 1.4;
  }

  /* ── STATS ── */
  .sp-stats {
    display: flex;
    gap: 2.2rem;
    padding-top: 1.1rem;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .sp-stat-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #334155;
    margin-bottom: 4px;
  }

  .sp-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    background: linear-gradient(90deg, #38BDF8, #818CF8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  /* ── TAGLINE ── */
  .sp-tagline {
    font-size: 0.72rem;
    color: #1E293B;
    letter-spacing: 0.03em;
  }

  /* ═══════════════════════════════════════
     RIGHT PANEL — signup form
  ═══════════════════════════════════════ */
  .sp-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2.5rem;
    background: #0D1117;
    position: relative;
    overflow-y: auto;
  }

  .sp-right::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(56,189,248,0.045) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .sp-form-wrap {
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
    animation: sp-slidein 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    padding: 1rem 0;
  }

  @keyframes sp-slidein {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── FORM HEADER ── */
  .sp-form-eyebrow {
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

  .sp-form-eyebrow::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 1.5px;
    background: #38BDF8;
    opacity: 0.6;
  }

  .sp-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    color: #E8F0FF;
    line-height: 1.15;
    margin-bottom: 0.45rem;
  }

  .sp-form-subtitle {
    font-size: 0.87rem;
    color: #475569;
    margin-bottom: 2rem;
  }

  .sp-form-subtitle a {
    color: #38BDF8;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.15s;
  }

  .sp-form-subtitle a:hover { color: #7DD3FC; }

  /* ── FIELD GRID ── */
  .sp-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.1rem;
  }

  @media (max-width: 500px) {
    .sp-form-row { grid-template-columns: 1fr; }
  }

  .sp-field { margin-bottom: 1.1rem; }

  .sp-field-label {
    display: block;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #475569;
    margin-bottom: 7px;
  }

  .sp-input-wrap { position: relative; }

  .sp-input {
    width: 100%;
    padding: 12px 15px;
    background: #0A0F1A;
    border: 1.5px solid #1E293B;
    border-radius: 11px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.93rem;
    color: #E2E8F0;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }

  .sp-input::placeholder { color: #1E293B; }

  .sp-input:focus {
    border-color: #38BDF8;
    box-shadow: 0 0 0 3px rgba(56,189,248,0.1);
  }

  .sp-input--error {
    border-color: #EF4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
  }

  .sp-input--success {
    border-color: #22C55E;
  }

  .sp-input--has-toggle { padding-right: 48px; }

  .sp-toggle-btn {
    position: absolute;
    right: 13px;
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

  .sp-toggle-btn:hover { color: #94A3B8; }
  .sp-toggle-btn svg { width: 17px; height: 17px; }

  .sp-field-error {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 6px;
    font-size: 0.76rem;
    color: #F87171;
  }

  .sp-field-hint {
    margin-top: 5px;
    font-size: 0.73rem;
    color: #1E293B;
  }

  /* ── PASSWORD STRENGTH ── */
  .sp-strength { margin-top: 8px; }

  .sp-strength-bars {
    display: flex;
    gap: 4px;
    margin-bottom: 5px;
  }

  .sp-strength-bar {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: #1E293B;
    transition: background 0.3s ease;
  }

  .sp-strength-label {
    font-size: 0.74rem;
    font-weight: 600;
    transition: color 0.3s;
  }

  /* ── MATCH INDICATOR ── */
  .sp-match {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: 0.76rem;
    font-weight: 500;
  }

  /* ── TERMS ── */
  .sp-terms {
    font-size: 0.74rem;
    color: #1E293B;
    text-align: center;
    line-height: 1.55;
    margin-bottom: 1.2rem;
  }

  .sp-terms span { color: #334155; }

  /* ── SUBMIT ── */
  .sp-submit-btn {
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

  .sp-submit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .sp-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(56,189,248,0.35);
  }

  .sp-submit-btn:hover:not(:disabled)::after { opacity: 1; }

  .sp-submit-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 16px rgba(56,189,248,0.2);
  }

  .sp-submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── SPINNER ── */
  .sp-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: sp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes sp-spin { to { transform: rotate(360deg); } }

  /* ── FOOTER ── */
  .sp-footer {
    text-align: center;
    font-size: 0.87rem;
    color: #334155;
    margin-top: 1.4rem;
  }

  .sp-footer a {
    color: #38BDF8;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.15s;
  }

  .sp-footer a:hover { color: #7DD3FC; }

  /* ── TRUST STRIP ── */
  .sp-trust {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1.6rem;
    padding-top: 1.2rem;
    border-top: 1px solid rgba(255,255,255,0.04);
    flex-wrap: wrap;
  }

  .sp-trust-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    color: #1E293B;
    font-weight: 500;
  }

  .sp-trust-item svg { width: 12px; height: 12px; color: #334155; }

  /* ═══════════════════════════════════════
     RESPONSIVE
  ═══════════════════════════════════════ */
  @media (max-width: 900px) {
    .sp-root { flex-direction: column; }

    .sp-left {
      flex: none;
      padding: 2rem 1.75rem;
      min-height: auto;
      border-right: none;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .sp-headline { font-size: 1.7rem; }
    .sp-features { display: none; }

    .sp-right { padding: 2.5rem 1.5rem; }
  }
`;

// ── Password strength ─────────────────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 6)           score++;
  if (password.length >= 10)          score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: '',           color: '#1E293B' },
    { label: 'Weak',       color: '#EF4444' },
    { label: 'Fair',       color: '#F59E0B' },
    { label: 'Good',       color: '#38BDF8' },
    { label: 'Strong',     color: '#22C55E' },
    { label: 'Very Strong',color: '#22C55E' },
  ];

  return { score, ...levels[Math.min(score, 5)] };
};

// ── Icons ─────────────────────────────────────────────────────
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

const IconAlert = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
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

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconCloud = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

// ============================================================
// SIGNUP COMPONENT
// ============================================================
function Signup() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [errors,          setErrors]          = useState({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------
  const validate = () => {
    const e = {};

    if (!username.trim()) {
      e.username = 'Username is required';
    } else if (username.trim().length < 3) {
      e.username = 'Must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      e.username = 'Letters, numbers and underscores only';
    }

    if (!email.trim()) {
      e.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address';
    }

    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 6) {
      e.password = 'Minimum 6 characters';
    }

    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearError = (field) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authAPI.signup(
        username.trim(),
        email.trim().toLowerCase(),
        password
      );

      const { access_token, user } = response.data;
      login(access_token, user);
      toast.success(`Welcome to Vault DMS, ${user.username}! Your vault is ready. 🔐`);
      navigate('/dashboard', { replace: true });

    } catch (err) {
      const message = err.response?.data?.error || 'Signup failed. Please try again.';
      toast.error(message);

      if (message.toLowerCase().includes('username')) {
        setErrors(prev => ({ ...prev, username: message }));
      } else if (message.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: message }));
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

      <div className="sp-root">

        {/* ═══════════════════════════════════════
            LEFT — brand / feature panel
        ═══════════════════════════════════════ */}
        <div className="sp-left">

          {/* Logo */}
          <div className="sp-brand">
            <div className="sp-brand-icon"><IconVault /></div>
            <span className="sp-brand-name">Vault DMS</span>
          </div>

          {/* Main visual */}
          <div className="sp-visual">
            <h2 className="sp-headline">
              One vault for<br />
              <em>all your files,<br />forever secure.</em>
            </h2>

            {/* Feature cards */}
            <div className="sp-features">
              <div className="sp-feature">
                <div className="sp-feature-icon sp-feature-icon--blue">
                  <IconCloud />
                </div>
                <div className="sp-feature-text">
                  <h4>Unlimited Cloud Storage</h4>
                  <p>Store PDFs, Word docs, spreadsheets and more — no size limits.</p>
                </div>
              </div>

              <div className="sp-feature">
                <div className="sp-feature-icon sp-feature-icon--violet">
                  <IconSearch />
                </div>
                <div className="sp-feature-text">
                  <h4>Instant Search</h4>
                  <p>Find any document in seconds with smart full-text search.</p>
                </div>
              </div>

              <div className="sp-feature">
                <div className="sp-feature-icon sp-feature-icon--green">
                  <IconShare />
                </div>
                <div className="sp-feature-text">
                  <h4>Easy Sharing & Permissions</h4>
                  <p>Share files with your team and control who can view or edit.</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="sp-stats">
              <div>
                <div className="sp-stat-label">Users</div>
                <div className="sp-stat-value">5k+</div>
              </div>
              <div>
                <div className="sp-stat-label">Documents</div>
                <div className="sp-stat-value">12k+</div>
              </div>
              <div>
                <div className="sp-stat-label">Encryption</div>
                <div className="sp-stat-value">AES‑256</div>
              </div>
            </div>
          </div>

          <p className="sp-tagline">
            © 2026 Vault DMS · Built by Navin Kumar Singh · Enterprise Document Management
          </p>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT — signup form
        ═══════════════════════════════════════ */}
        <div className="sp-right">
          <div className="sp-form-wrap">

            <p className="sp-form-eyebrow">Get started free</p>
            <h1 className="sp-form-title">Create your vault</h1>
            <p className="sp-form-subtitle">
              Already have an account?{' '}
              <Link to="/login">Sign in →</Link>
            </p>

            <form onSubmit={handleSubmit} noValidate>

              {/* Username + Email row */}
              <div className="sp-form-row">

                {/* Username */}
                <div>
                  <label className="sp-field-label" htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    className={`sp-input${
                      errors.username ? ' sp-input--error' :
                      username.length >= 3 ? ' sp-input--success' : ''
                    }`}
                    placeholder="john_doe"
                    value={username}
                    autoComplete="username"
                    autoFocus
                    onChange={(e) => { setUsername(e.target.value); clearError('username'); }}
                  />
                  {errors.username ? (
                    <span className="sp-field-error"><IconAlert /> {errors.username}</span>
                  ) : (
                    <span className="sp-field-hint">Letters, numbers, _</span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="sp-field-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`sp-input${errors.email ? ' sp-input--error' : ''}`}
                    placeholder="you@example.com"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  />
                  {errors.email && (
                    <span className="sp-field-error"><IconAlert /> {errors.email}</span>
                  )}
                </div>

              </div>

              {/* Password */}
              <div className="sp-field">
                <label className="sp-field-label" htmlFor="password">Password</label>
                <div className="sp-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`sp-input sp-input--has-toggle${errors.password ? ' sp-input--error' : ''}`}
                    placeholder="Min. 6 characters"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  />
                  <button
                    type="button"
                    className="sp-toggle-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>

                {password && (
                  <div className="sp-strength">
                    <div className="sp-strength-bars">
                      {[1,2,3,4,5].map(level => (
                        <div
                          key={level}
                          className="sp-strength-bar"
                          style={{ background: strength.score >= level ? strength.color : '#1E293B' }}
                        />
                      ))}
                    </div>
                    <span className="sp-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}

                {errors.password && (
                  <span className="sp-field-error"><IconAlert /> {errors.password}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="sp-field">
                <label className="sp-field-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="sp-input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    className={`sp-input sp-input--has-toggle${
                      errors.confirmPassword ? ' sp-input--error' :
                      confirmPassword && confirmPassword === password ? ' sp-input--success' : ''
                    }`}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                  />
                  <button
                    type="button"
                    className="sp-toggle-btn"
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>

                {confirmPassword && !errors.confirmPassword && (
                  <span className="sp-match" style={{ color: confirmPassword === password ? '#22C55E' : '#F87171' }}>
                    {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                )}

                {errors.confirmPassword && (
                  <span className="sp-field-error"><IconAlert /> {errors.confirmPassword}</span>
                )}
              </div>

              {/* Terms */}
              <p className="sp-terms">
                By creating an account you agree to our{' '}
                <span>Terms of Service</span> and <span>Privacy Policy</span>.
              </p>

              {/* Submit */}
              <button type="submit" className="sp-submit-btn" disabled={loading}>
                {loading ? (
                  <><div className="sp-spinner" /> Creating your vault…</>
                ) : (
                  'Create My Vault →'
                )}
              </button>

            </form>

            {/* Footer link */}
            <div className="sp-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in to your vault →</Link>
            </div>

            {/* Trust strip */}
            <div className="sp-trust">
              <div className="sp-trust-item"><IconShield /> End-to-end encrypted</div>
              <div className="sp-trust-item"><IconLock /> SOC 2 compliant</div>
              <div className="sp-trust-item"><IconCloud /> 99.9% uptime</div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}

export default Signup;