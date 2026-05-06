// api.js - Axios API Helper / HTTP Client
// This is the SINGLE place where all API calls to Flask are made
// Every page and component imports functions from here
// Benefits: change the base URL once → updates everywhere

import axios from 'axios';

// ============================================================
// CREATE AXIOS INSTANCE
// Base URL points to our Flask backend
// The proxy in package.json handles this in development,
// but we set it explicitly here for clarity & production use
// ============================================================
const api = axios.create({
  baseURL: 'https://smart-dms-backend.onrender.com',   // Flask backend URL

  // Default headers sent with every request
  headers: {
    'Content-Type': 'application/json',
  },

  // Timeout after 15 seconds if no response
  timeout: 15000,
});


// ============================================================
// REQUEST INTERCEPTOR
// Runs BEFORE every request is sent
// Automatically attaches the JWT token to every API call
// so we don't have to manually add it in every component
// ============================================================
api.interceptors.request.use(
  (config) => {
    // Get the token stored in localStorage after login
    const token = localStorage.getItem('token');

    if (token) {
      // Attach token to the Authorization header
      // Flask's @jwt_required() reads this header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;  // must return config to continue the request
  },
  (error) => {
    // If something went wrong BEFORE sending (rare)
    return Promise.reject(error);
  }
);


// ============================================================
// RESPONSE INTERCEPTOR
// Runs AFTER every response is received
// Handles global errors like expired tokens
// ============================================================
api.interceptors.response.use(
  // ✅ Success: just pass the response through unchanged
  (response) => response,

  // ❌ Error: handle common HTTP errors globally
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid → force logout
      // Clear everything from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page (only if not already there)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Pass the error along so individual calls can still catch it
    return Promise.reject(error);
  }
);


// ============================================================
// AUTH API CALLS
// All functions related to login, signup, logout, user info
// ============================================================
export const authAPI = {

  // Register a new user
  // POST /api/auth/signup
  signup: (username, email, password) =>
    api.post('/api/auth/signup', { username, email, password }),

  // Log in and get JWT token
  // POST /api/auth/login
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),

  // Log out (tells backend; frontend deletes token)
  // POST /api/auth/logout
  logout: () =>
    api.post('/api/auth/logout'),

  // Get currently logged-in user's profile
  // GET /api/auth/me
  getMe: () =>
    api.get('/api/auth/me'),

  // Change password
  // PUT /api/auth/change-password
  changePassword: (currentPassword, newPassword) =>
    api.put('/api/auth/change-password', {
      current_password: currentPassword,
      new_password:     newPassword,
    }),
};


// ============================================================
// DOCUMENTS API CALLS
// All functions related to file upload, list, search, delete
// ============================================================
export const documentsAPI = {

  // Upload a file (multipart/form-data — not JSON!)
  // POST /api/documents/upload
  upload: (file, description = '') => {
    // FormData is required for file uploads
    const formData = new FormData();
    formData.append('file', file);               // the actual file binary
    formData.append('description', description); // optional text

    return api.post('/api/documents/upload', formData, {
      headers: {
        // Override Content-Type for file uploads
        // axios sets the correct multipart boundary automatically
        'Content-Type': 'multipart/form-data',
      },
      // Track upload progress (used to show progress bar)
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        // You can use this percent value in a progress bar component
        console.log(`Upload progress: ${percent}%`);
      },
    });
  },

  // Get all documents for the logged-in user
  // GET /api/documents/
  getAll: () =>
    api.get('/api/documents/'),

  // Search documents by name, description, or type
  // GET /api/documents/search?q=resume
  search: (query) =>
    api.get('/api/documents/search', { params: { q: query } }),

  // Get a single document's metadata
  // GET /api/documents/<id>
  getOne: (id) =>
    api.get(`/api/documents/${id}`),

  // Get download URL for a file (opens in browser)
  // GET /api/documents/<id>/download
  getDownloadUrl: (id, forceDownload = false) => {
    const token = localStorage.getItem('token');
    // Return the full URL with token as query param for direct browser access
    return `https://smart-dms-backend.onrender.com/api/documents/${id}/download${forceDownload ? '?download=true' : ''}`;
  },

  // Download a file (forces browser download)
  download: async (id, filename) => {
    const response = await api.get(
      `/api/documents/${id}/download?download=true`,
      { responseType: 'blob' }  // blob = binary data (for files)
    );

    // Create a temporary link and click it to trigger download
    const url  = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', filename);  // set the downloaded filename
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Delete a document by ID
  // DELETE /api/documents/<id>
  delete: (id) =>
    api.delete(`/api/documents/${id}`),

  // Update document description
  // PUT /api/documents/<id>
  update: (id, description) =>
    api.put(`/api/documents/${id}`, { description }),

  // Get storage stats (total files, sizes, types)
  // GET /api/documents/stats
  getStats: () =>
    api.get('/api/documents/stats'),
};


// ============================================================
// HELPER UTILITIES
// Small helper functions used across the app
// ============================================================

// Format file size from bytes to human readable
// formatFileSize(1024)       → "1.00 KB"
// formatFileSize(1048576)    → "1.00 MB"
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 1024)        return `${bytes} Bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Get a color based on file type (used for file type badges)
// getFileTypeColor('pdf') → '#ef4444' (red)
export const getFileTypeColor = (fileType) => {
  const colors = {
    pdf:  '#ef4444',   // red
    doc:  '#3b82f6',   // blue
    docx: '#3b82f6',   // blue
    txt:  '#6b7280',   // gray
    png:  '#10b981',   // green
    jpg:  '#10b981',   // green
    jpeg: '#10b981',   // green
    gif:  '#f59e0b',   // amber
    webp: '#8b5cf6',   // purple
  };
  return colors[fileType?.toLowerCase()] || '#6b7280';
};

// Get an emoji icon based on file type
// getFileIcon('pdf') → '📄'
export const getFileIcon = (fileType) => {
  const icons = {
    pdf:  '📄',
    doc:  '📝',
    docx: '📝',
    txt:  '📃',
    png:  '🖼️',
    jpg:  '🖼️',
    jpeg: '🖼️',
    gif:  '🎞️',
    webp: '🖼️',
  };
  return icons[fileType?.toLowerCase()] || '📁';
};

// Check if a file type is an image (used for preview)
// isImage('jpg') → true
// isImage('pdf') → false
export const isImage = (fileType) => {
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileType?.toLowerCase());
};

// Export the base axios instance as default
export default api;