// Signup.js - Registration Page
// Features:
//   - Username, email, password, confirm password fields
//   - Real-time password strength meter
//   - Field-level validation
//   - Show/hide password toggle
//   - Auto login after successful signup
//   - Link back to login page

import React, { useState, useMemo } from 'react';
import { useNavigate, Link }         from 'react-router-dom';
import { toast }                     from 'react-toastify';
import { useAuth }                   from '../App';
import { authAPI }                   from '../api';

// ============================================================
// PASSWORD STRENGTH CALCULATOR
// Returns score 0-4 and a label
// ============================================================
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 6)                        score++; // min length
  if (password.length >= 10)                       score++; // good length
  if (/[A-Z]/.test(password))                      score++; // has uppercase
  if (/[0-9]/.test(password))                      score++; // has number
  if (/[^A-Za-z0-9]/.test(password))              score++; // has special char

  const levels = [
    { label: '',          color: '#1e293b' },  // 0 - empty
    { label: 'Weak',      color: '#ef4444' },  // 1 - red
    { label: 'Fair',      color: '#f59e0b' },  // 2 - amber
    { label: 'Good',      color: '#3b82f6' },  // 3 - blue
    { label: 'Strong',    color: '#10b981' },  // 4 - green
    { label: 'Very Strong', color: '#10b981' },// 5 - green
  ];

  return { score, ...levels[Math.min(score, 5)] };
};

// ============================================================
// SIGNUP COMPONENT
// ============================================================
function Signup() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  // Form fields
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading,             setLoading]             = useState(false);
  const [errors,              setErrors]              = useState({});

  // Password strength (computed from password value)
  const strength = useMemo(() => getPasswordStrength(password), [password]);


  // ----------------------------------------------------------
  // FORM VALIDATION
  // ----------------------------------------------------------
  const validate = () => {
    const newErrors = {};

    // Username
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // ----------------------------------------------------------
  // CLEAR A SINGLE FIELD ERROR WHEN USER TYPES
  // ----------------------------------------------------------
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  // ----------------------------------------------------------
  // HANDLE FORM SUBMIT
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

      // Auto login after signup
      login(access_token, user);

      toast.success(`Account created! Welcome, ${user.username}! 🎉`);
      navigate('/dashboard', { replace: true });

    } catch (err) {
      const message = err.response?.data?.error || 'Signup failed. Please try again.';
      toast.error(message);

      // Highlight specific field if backend returns a known conflict
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
      <style>{`
        /* Reuse same base styles as Login page */
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

        .auth-page::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%);
          top: -120px;
          left: -120px;
          border-radius: 50%;
          pointer-events: none;
        }

        .auth-page::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
          bottom: -80px;
          right: -80px;
          border-radius: 50%;
          pointer-events: none;
        }

        .auth-card {
          width: 100%;
          max-width: 460px;
          background: rgba(15, 23, 42, 0.95);
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
          to   { opacity: 1; transform: translateY(0); }
        }

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

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        /* Two columns side by side on wider screens */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
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

        .form-input.success {
          border-color: #10b981;
        }

        .form-input::placeholder {
          color: #334155;
        }

        .form-input.has-toggle {
          padding-right: 44px;
        }

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

        .form-error {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.78rem;
          color: #f87171;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .form-hint {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.75rem;
          color: #475569;
        }

        /* ---- PASSWORD STRENGTH METER ---- */
        .strength-meter {
          margin-top: 6px;
        }

        .strength-bars {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
        }

        .strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: #1e293b;
          transition: background 0.3s ease;
        }

        .strength-label {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          transition: color 0.3s ease;
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

        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

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

        /* ---- TERMS NOTE ---- */
        .auth-terms {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.75rem;
          color: #334155;
          text-align: center;
          line-height: 1.5;
        }

        /* ---- FOOTER ---- */
        .auth-footer {
          text-align: center;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.88rem;
          color: #475569;
          margin-top: 1rem;
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
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">
              Join Smart DMS — your secure document hub
            </p>
          </div>

          {/* ---- FORM ---- */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Username + Email side by side */}
            <div className="form-row">

              {/* Username */}
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className={`form-input ${
                    errors.username ? 'error' :
                    username.length >= 3 ? 'success' : ''
                  }`}
                  placeholder="john_doe"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError('username');
                  }}
                  autoComplete="username"
                  autoFocus
                />
                {errors.username ? (
                  <span className="form-error">⚠ {errors.username}</span>
                ) : (
                  <span className="form-hint">Letters, numbers, _</span>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError('email');
                  }}
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="form-error">⚠ {errors.email}</span>
                )}
              </div>

            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="form-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input has-toggle ${errors.password ? 'error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError('password');
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="strength-meter">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className="strength-bar"
                        style={{
                          background: strength.score >= level
                            ? strength.color
                            : '#1e293b',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="strength-label"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}

              {errors.password && (
                <span className="form-error">⚠ {errors.password}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="form-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input has-toggle ${
                    errors.confirmPassword ? 'error' :
                    confirmPassword && confirmPassword === password ? 'success' : ''
                  }`}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError('confirmPassword');
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Live match indicator */}
              {confirmPassword && !errors.confirmPassword && (
                <span style={{
                  fontSize: '0.78rem',
                  color: confirmPassword === password ? '#10b981' : '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                </span>
              )}

              {errors.confirmPassword && (
                <span className="form-error">⚠ {errors.confirmPassword}</span>
              )}
            </div>

            {/* Terms note */}
            <p className="auth-terms">
              By creating an account you agree to our{' '}
              <span style={{ color: '#475569' }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ color: '#475569' }}>Privacy Policy</span>.
            </p>

            {/* Submit button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner" />
                  Creating account...
                </>
              ) : (
                '→ Create Account'
              )}
            </button>

          </form>

          {/* ---- FOOTER LINK ---- */}
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in →</Link>
          </div>

        </div>
      </div>
    </>
  );
}

export default Signup;