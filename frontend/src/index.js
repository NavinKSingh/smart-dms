// index.js - React Application Entry Point
// This is the FIRST file React runs
// It mounts the entire <App /> component into the #root div in index.html

import React from 'react';
import ReactDOM from 'react-dom/client';

// Global styles — imported here so they apply to the ENTIRE app
import './styles/global.css';

// Toast notification styles (react-toastify)
// Must be imported once at the root level
import 'react-toastify/dist/ReactToastify.css';

// The main App component — contains all routing and pages
import App from './App';


// ============================================================
// FIND THE ROOT DOM NODE
// This grabs the <div id="root"> from index.html
// React will render everything INSIDE this div
// ============================================================
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    '❌ Could not find #root element in index.html. ' +
    'Make sure <div id="root"></div> exists in public/index.html'
  );
}


// ============================================================
// CREATE REACT ROOT & RENDER APP
// ReactDOM.createRoot() is the modern React 18 way to mount
// (replaces the old ReactDOM.render() from React 17)
// ============================================================
const root = ReactDOM.createRoot(rootElement);

root.render(
  // StrictMode helps catch bugs during development
  // It renders components TWICE in dev mode to detect side effects
  // Has NO effect in production builds
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// ============================================================
// HIDE THE INITIAL LOADER (from index.html)
// Once React has mounted, remove the static HTML spinner
// ============================================================
const initialLoader = document.getElementById('initial-loader');
if (initialLoader) {
  initialLoader.style.transition = 'opacity 0.4s ease';
  initialLoader.style.opacity    = '0';
  setTimeout(() => {
    if (initialLoader.parentNode) {
      initialLoader.parentNode.removeChild(initialLoader);
    }
  }, 400);
}