// Navbar.js - Top Navigation Bar
// Shows: Logo, username, and logout button
// Appears on all protected pages (Dashboard, etc.)
// Fully responsive — collapses on mobile screens

import React, { useState } from 'react';
import { useNavigate }      from 'react-router-dom';
import { toast }            from 'react-toastify';
import { useAuth }          from '../App';
import { authAPI }          from '../api';

// ============================================================
// NAVBAR COMPONENT
// ============================================================
function Navbar() {
  const { user, logout }    = useAuth();       // get user info + logout fn
  const navigate            = useNavigate();   // for redirecting after logout
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu toggle
  const [loggingOut, setLoggingOut] = useState(false);

  // ----------------------------------------------------------
  // HANDLE LOGOUT
  // 1. Call API to notify backend
  // 2. Clear local auth state
  // 3. Redirect to login
  // ----------------------------------------------------------
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authAPI.logout();
    } catch (err) {
      // Even if API call fails, we still log out on frontend
    } finally {
      logout();
      toast.success('Logged out successfully!');
      navigate('/login');
    }
  };

  // Get first letter of username for avatar
  const avatarLetter = user?.username?.charAt(0).toUpperCase() || '?';

  return (
    <>
      {/* ====================================================
          NAVBAR STYLES
          Injected as a <style> tag — scoped with class names
          ==================================================== */}
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* ---------- LOGO ---------- */
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
        }

        .navbar-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
          flex-shrink: 0;
        }

        .navbar-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }

        .navbar-logo-text span {
          color: #818cf8;
        }

        /* ---------- RIGHT SIDE ---------- */
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* ---------- USER INFO ---------- */
        .navbar-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .navbar-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #fff;
          flex-shrink: 0;
          border: 2px solid rgba(99, 102, 241, 0.4);
        }

        .navbar-username {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: #cbd5e1;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .navbar-email {
          font-size: 0.75rem;
          color: #475569;
        }

        /* ---------- LOGOUT BUTTON ---------- */
        .navbar-logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #f87171;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .navbar-logout-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.6);
          color: #fca5a5;
          transform: translateY(-1px);
        }

        .navbar-logout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ---------- DIVIDER ---------- */
        .navbar-divider {
          width: 1px;
          height: 28px;
          background: rgba(51, 65, 85, 0.8);
        }

        /* ---------- MOBILE HAMBURGER ---------- */
        .navbar-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
          background: none;
          border: none;
        }

        .navbar-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #94a3b8;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        /* ---------- MOBILE MENU DROPDOWN ---------- */
        .navbar-mobile-menu {
          display: none;
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
          padding: 1rem 1.5rem;
          flex-direction: column;
          gap: 12px;
          z-index: 99;
        }

        .navbar-mobile-menu.open {
          display: flex;
        }

        .navbar-mobile-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid #1e293b;
        }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 600px) {
          .navbar-right {
            display: none;
          }
          .navbar-hamburger {
            display: flex;
          }
          .navbar {
            position: relative;
          }
        }

        @media (max-width: 400px) {
          .navbar-logo-text {
            font-size: 1rem;
          }
        }
      `}</style>

      {/* ====================================================
          NAVBAR BAR
          ==================================================== */}
      <nav className="navbar">

        {/* ---------- LOGO ---------- */}
        <div className="navbar-logo" onClick={() => navigate('/dashboard')}>
          <div className="navbar-logo-icon">📁</div>
          <div className="navbar-logo-text">
            Smart<span>DMS</span>
          </div>
        </div>

        {/* ---------- RIGHT SIDE (desktop) ---------- */}
        <div className="navbar-right">

          {/* User info */}
          <div className="navbar-user">
            <div className="navbar-avatar">{avatarLetter}</div>
            <div>
              <div className="navbar-username">{user?.username}</div>
              <div className="navbar-email">{user?.email}</div>
            </div>
          </div>

          <div className="navbar-divider" />

          {/* Logout button */}
          <button
            className="navbar-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <>
                <span style={{
                  width: '12px', height: '12px',
                  border: '2px solid #f87171',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.6s linear infinite'
                }} />
                Logging out...
              </>
            ) : (
              <> 🚪 Logout </>
            )}
          </button>
        </div>

        {/* ---------- HAMBURGER (mobile only) ---------- */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>

      </nav>

      {/* ====================================================
          MOBILE DROPDOWN MENU
          ==================================================== */}
      <div className={`navbar-mobile-menu ${menuOpen ? 'open' : ''}`}>

        {/* User info row */}
        <div className="navbar-mobile-user">
          <div className="navbar-avatar">{avatarLetter}</div>
          <div>
            <div className="navbar-username" style={{ maxWidth: '100%' }}>
              {user?.username}
            </div>
            <div className="navbar-email">{user?.email}</div>
          </div>
        </div>

        {/* Logout button */}
        <button
          className="navbar-logout-btn"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => { setMenuOpen(false); handleLogout(); }}
          disabled={loggingOut}
        >
          🚪 {loggingOut ? 'Logging out...' : 'Logout'}
        </button>

      </div>
    </>
  );
}

export default Navbar;