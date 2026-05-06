// Login.js - Login Page
// Features:
//   - Email + password form with validation
//   - Show/hide password toggle
//   - Error messages
//   - Redirects to dashboard on success
//   - Link to signup page
//   - Fully responsive

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast }                          from 'react-toastify';
import { useAuth }                        from '../App';
import { authAPI }                        from '../api';

// ============================================================
// LOGIN COMPONENT
// ============================================================
function Login() {
  const navigate         = useNavigate();
  const location         = useLocation();
  const { login }        = useAuth();

  // Form field values
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});  // field-level errors

  // After login, go back to where user was trying to go (or dashboard)
  const from = location.state?.from || '/dashboard';


  // ----------------------------------------------------------
  // FORM VALIDATION
  // Returns true if valid, false if there are errors
  // ----------------------------------------------------------
  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true = no errors
  };


  // ----------------------------------------------------------
  // HANDLE FORM SUBMIT
  // ----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page refresh

    // Validate first
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await authAPI.login(email.trim(), password);
      const { access_token, user } = response.data;

      // Save token + user to localStorage and context
      login(access_token, user);

      toast.success(`Welcome back, ${user.username}! 👋`);

      // Redirect to dashboard (or original destination)
      navigate(from, { replace: true });

    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      toast.error(message);

      // Highlight the password field on auth errors
      if (err.response?.status === 401) {
        setErrors({ password: 'Invalid email or password' });
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
      <style>{`
        /* ---- PAGE LAYOUT ---- */
        .auth-page {
          min-height: 100vh;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        /* Decorative background blobs */
        .auth-page::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          top: -100px;
          right: -100px;
          border-radius: 50%;
          pointer-events: none;
        }

        .auth-page::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          border-radius: 50%;
          pointer-events: none;
        }

        /* ---- CARD ---- */
        .auth-card {
          width: 100%;
          max-width: 440px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          position: relative;
          z-index: 1;
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.05),
            0 20px 60px rgba(0,0,0,0.4),
            0 0 80px rgba(99,102,241,0.05);
          animation: authFadeIn 0.5s ease forwards;
        }

        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        /* ---- HEADER ---- */
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          margin: 0 auto 1.2rem;
          box-shadow: 0 0 24px rgba(99,102,241,0.4);
        }

        .auth-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.03em;
          margin-bottom: 0.4rem;
        }

        .auth-subtitle {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.9rem;
          color: #64748b;
        }

        /* ---- FORM ---- */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .form-input-wrap {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          color: #f8fafc;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        .form-input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
        }

        .form-input::placeholder {
          color: #334155;
        }

        /* Password toggle button */
        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          font-size: 1rem;
          padding: 4px;
          transition: color 0.2s;
          line-height: 1;
        }

        .password-toggle:hover {
          color: #94a3b8;
        }

        .form-input.has-toggle {
          padding-right: 44px;
        }

        /* Error message under input */
        .form-error {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.78rem;
          color: #f87171;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ---- SUBMIT BUTTON ---- */
        .auth-submit-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 0.4rem;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }

        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.45);
        }

        .auth-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* Button spinner */
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ---- DIVIDER ---- */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0.4rem 0;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: #1e293b;
        }

        .auth-divider-text {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.78rem;
          color: #334155;
          white-space: nowrap;
        }

        /* ---- FOOTER LINK ---- */
        .auth-footer {
          text-align: center;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.88rem;
          color: #475569;
          margin-top: 0.4rem;
        }

        .auth-footer a {
          color: #818cf8;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .auth-footer a:hover {
          color: #a5b4fc;
          text-decoration: underline;
        }

        /* ---- DEMO HINT ---- */
        .auth-demo-hint {
          background: rgba(99,102,241,0.07);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          padding: 10px 14px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.8rem;
          color: #64748b;
          text-align: center;
          line-height: 1.5;
        }

        /* ---- RESPONSIVE ---- */
        @media (max-width: 480px) {
          .auth-card {
            padding: 2rem 1.25rem;
            border-radius: 20px;
          }
          .auth-title {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-card">

          {/* ---- HEADER ---- */}
          <div className="auth-header">
            <div className="auth-logo">📁</div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your Smart DMS account</p>
          </div>

          {/* ---- FORM ---- */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Email field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="form-input-wrap">
                <input
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && (
                <span className="form-error">⚠ {errors.email}</span>
              )}
            </div>

            {/* Password field */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="form-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input has-toggle ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  autoComplete="current-password"
                />
                {/* Show/hide password toggle */}
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <span className="form-error">⚠ {errors.password}</span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner" />
                  Signing in...
                </>
              ) : (
                '→ Sign In'
              )}
            </button>

          </form>

          {/* ---- DIVIDER ---- */}
          <div className="auth-divider" style={{ margin: '1.5rem 0 1rem' }}>
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Don't have an account?</span>
            <div className="auth-divider-line" />
          </div>

          {/* ---- FOOTER LINK ---- */}
          <div className="auth-footer">
            <Link to="/signup">Create a free account →</Link>
          </div>

          {/* ---- DEMO HINT ---- */}
          <div className="auth-demo-hint" style={{ marginTop: '1.2rem' }}>
            💡 First time? <Link to="/signup" style={{
              color: '#818cf8', textDecoration: 'none', fontWeight: 600
            }}>Sign up</Link> to create your account and start uploading documents.
          </div>

        </div>
      </div>
    </>
  );
}

export default Login;