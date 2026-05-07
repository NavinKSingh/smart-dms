// App.js - Main Application Component
// This is the ROOT component that wraps everything
// It sets up:
//   1. React Router (client-side navigation between pages)
//   2. Toast notifications (global popup messages)
//   3. Auth context (share login state across all pages)
//   4. Route protection (redirect to login if not authenticated)

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BrowserRouter as Router,  // wraps app with routing capability
  Routes,                    // container for all <Route> definitions
  Route,                     // maps a URL path to a component
  Navigate,                  // programmatic redirect component
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // global toast popup container

// Pages
import Login     from './pages/Login';
import Signup    from './pages/Signup';
import Dashboard from './pages/Dashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';


// ============================================================
// AUTH CONTEXT
// React Context lets us share the "logged in user" state
// across ALL components without passing props manually
//
// Think of it like a global variable that any component can read
// ============================================================
export const AuthContext = createContext(null);

// Custom hook — any component can call useAuth() to get auth state
// Usage: const { user, login, logout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
};


// ============================================================
// AUTH PROVIDER COMPONENT
// Wraps the entire app and provides auth state to all children
// ============================================================
function AuthProvider({ children }) {
  // user = null means "not logged in"
  // user = { id, username, email } means "logged in"
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while checking localStorage

  // ----------------------------------------------------------
  // On app load: check if user was already logged in
  // (token + user info saved in localStorage from previous session)
  // ----------------------------------------------------------
  useEffect(() => {
    const token       = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Parse the stored user JSON back into an object
        setUser(JSON.parse(storedUser));
      } catch (err) {
        // If parsing fails (corrupted data), clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // Done checking — app can now render the right page
    setLoading(false);
  }, []);


  // ----------------------------------------------------------
  // LOGIN function
  // Called by Login.js and Signup.js after successful API call
  // Saves token + user to localStorage and updates state
  // ----------------------------------------------------------
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user',  JSON.stringify(userData));
    setUser(userData);
  };


  // ----------------------------------------------------------
  // LOGOUT function
  // Clears everything and redirects to login
  // ----------------------------------------------------------
  const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  setUser(null);

  window.location.href = '/login';
  };


  // ----------------------------------------------------------
  // UPDATE USER function
  // Updates stored user info (e.g., after profile change)
  // ----------------------------------------------------------
  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };


  // ----------------------------------------------------------
  // While checking localStorage, show a loading screen
  // This prevents a "flash" where the login page briefly
  // appears before realizing the user was already logged in
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '100vh',
        background:     '#0f172a',
        gap:            '16px',
      }}>
        {/* Spinner */}
        <div style={{
          width:        '40px',
          height:       '40px',
          border:       '3px solid #1e293b',
          borderTop:    '3px solid #6366f1',
          borderRadius: '50%',
          animation:    'spin 0.8s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          color:      '#475569',
          fontSize:   '0.9rem',
          letterSpacing: '0.05em',
        }}>
          Loading Smart DMS...
        </p>
      </div>
    );
  }

  // Provide auth state and functions to all child components
  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}


// ============================================================
// MAIN APP COMPONENT
// Sets up routing and wraps everything in AuthProvider
// ============================================================
function App() {
  return (
    // AuthProvider wraps everything so all pages get auth state
    <AuthProvider>

      {/* Router enables URL-based navigation */}
      <Router>
        <Routes>

          {/* ------------------------------------------------ */}
          {/* PUBLIC ROUTES — accessible without login         */}
          {/* ------------------------------------------------ */}

          {/* Root URL → redirect to dashboard (or login if not auth'd) */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Login page */}
          <Route
            path="/login"
            element={<PublicRoute><Login /></PublicRoute>}
          />

          {/* Signup page */}
          <Route
            path="/signup"
            element={<PublicRoute><Signup /></PublicRoute>}
          />


          {/* ------------------------------------------------ */}
          {/* PROTECTED ROUTES — require login                 */}
          {/* ------------------------------------------------ */}

          {/* Dashboard — main app page */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ------------------------------------------------ */}
          {/* 404 CATCH-ALL — unknown URLs                     */}
          {/* ------------------------------------------------ */}
          <Route
            path="*"
            element={
              <div style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                minHeight:      '100vh',
                background:     '#0f172a',
                color:          '#f8fafc',
                gap:            '16px',
                fontFamily:     "'Syne', sans-serif",
              }}>
                <div style={{ fontSize: '5rem' }}>404</div>
                <h2 style={{ fontSize: '1.5rem', color: '#94a3b8' }}>
                  Page not found
                </h2>
                <a
                  href="/dashboard"
                  style={{
                    color:          '#6366f1',
                    textDecoration: 'none',
                    fontSize:       '0.95rem',
                    padding:        '8px 20px',
                    border:         '1px solid #6366f1',
                    borderRadius:   '8px',
                    marginTop:      '8px',
                  }}
                >
                  ← Back to Dashboard
                </a>
              </div>
            }
          />

        </Routes>
      </Router>

      {/* ---------------------------------------------------- */}
      {/* TOAST CONTAINER                                       */}
      {/* Renders toast notifications anywhere in the app      */}
      {/* toast.success("File uploaded!") works from any page  */}
      {/* ---------------------------------------------------- */}
      <ToastContainer
        position="top-right"       // where toasts appear
        autoClose={3000}           // disappear after 3 seconds
        hideProgressBar={false}    // show countdown bar
        newestOnTop={true}         // newest toast appears on top
        closeOnClick={true}        // click to dismiss
        pauseOnHover={true}        // pause timer on mouse hover
        draggable={true}           // drag to dismiss
        theme="dark"               // dark theme to match app
        toastStyle={{
          background:   '#1e293b',
          color:        '#f8fafc',
          borderRadius: '12px',
          border:       '1px solid #334155',
          fontFamily:   "'Instrument Sans', sans-serif",
          fontSize:     '0.9rem',
        }}
      />

    </AuthProvider>
  );
}


// ============================================================
// PUBLIC ROUTE WRAPPER
// If user IS logged in and tries to visit /login or /signup,
// redirect them to /dashboard instead
// (no point showing login page to already-logged-in users)
// ============================================================
function PublicRoute({ children }) {
  const { user } = useAuth();

  // If already logged in → go to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not logged in → show the public page (Login or Signup)
  return children;
}


export default App;