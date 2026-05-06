// ProtectedRoute.js - Route Guard Component
// Wraps any page that requires the user to be logged in
// If user is NOT logged in → redirect to /login
// If user IS logged in     → show the requested page
//
// Usage in App.js:
//   <Route path="/dashboard" element={
//     <ProtectedRoute><Dashboard /></ProtectedRoute>
//   } />

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation }      from 'react-router-dom';
import { useAuth }                    from '../App';
import { authAPI }                    from '../api';

// ============================================================
// PROTECTED ROUTE COMPONENT
// ============================================================
function ProtectedRoute({ children }) {
  const { user, login, logout } = useAuth();
  const location                = useLocation(); // current URL path
  const [verifying, setVerifying] = useState(true);  // checking token validity
  const [verified,  setVerified]  = useState(false); // token is valid

  // ----------------------------------------------------------
  // VERIFY TOKEN ON EVERY PROTECTED PAGE LOAD
  // Even if we have a token in localStorage, it might be
  // expired or tampered with — verify it with the backend
  // ----------------------------------------------------------
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');

      // No token at all → not logged in
      if (!token) {
        setVerifying(false);
        setVerified(false);
        return;
      }

      try {
        // Call /api/auth/me — if token is valid, returns user data
        const response = await authAPI.getMe();
        const freshUser = response.data.user;

        // Update user data in context (in case it changed)
        login(token, freshUser);
        setVerified(true);

      } catch (err) {
        // Token is invalid or expired → force logout
        logout();
        setVerified(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once when the protected page mounts


  // ----------------------------------------------------------
  // WHILE VERIFYING TOKEN — show a loading screen
  // This prevents a flash of the login page while we check
  // ----------------------------------------------------------
  if (verifying) {
    return (
      <>
        <style>{`
          .verify-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #0f172a;
            gap: 20px;
          }

          .verify-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          }

          .verify-logo-icon {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.3rem;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
          }

          .verify-logo-text {
            font-family: 'Syne', sans-serif;
            font-size: 1.4rem;
            font-weight: 800;
            color: #f8fafc;
            letter-spacing: -0.02em;
          }

          .verify-logo-text span {
            color: #818cf8;
          }

          .verify-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid #1e293b;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: verifySpин 0.8s linear infinite;
          }

          @keyframes verifySpин {
            to { transform: rotate(360deg); }
          }

          .verify-text {
            font-family: 'Instrument Sans', sans-serif;
            font-size: 0.85rem;
            color: #475569;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .verify-dots {
            display: flex;
            gap: 6px;
          }

          .verify-dot {
            width: 6px;
            height: 6px;
            background: #6366f1;
            border-radius: 50%;
            animation: verifyBounce 1.2s ease-in-out infinite;
          }

          .verify-dot:nth-child(2) { animation-delay: 0.2s; }
          .verify-dot:nth-child(3) { animation-delay: 0.4s; }

          @keyframes verifyBounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40%            { transform: scale(1);   opacity: 1;   }
          }
        `}</style>

        <div className="verify-container">
          {/* Logo */}
          <div className="verify-logo">
            <div className="verify-logo-icon">📁</div>
            <div className="verify-logo-text">
              Smart<span>DMS</span>
            </div>
          </div>

          {/* Spinner */}
          <div className="verify-spinner" />

          {/* Text */}
          <p className="verify-text">Verifying session</p>

          {/* Bouncing dots */}
          <div className="verify-dots">
            <div className="verify-dot" />
            <div className="verify-dot" />
            <div className="verify-dot" />
          </div>
        </div>
      </>
    );
  }


  // ----------------------------------------------------------
  // TOKEN INVALID OR MISSING → redirect to login
  // We pass the current path in state so after login,
  // the user is redirected BACK to where they tried to go
  // ----------------------------------------------------------
  if (!verified && !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }} // remember where they were going
        replace                             // replace history (no back button loop)
      />
    );
  }


  // ----------------------------------------------------------
  // TOKEN VALID + USER LOGGED IN → render the protected page
  // ----------------------------------------------------------
  return (
    <>
      {children}
    </>
  );
}

export default ProtectedRoute;