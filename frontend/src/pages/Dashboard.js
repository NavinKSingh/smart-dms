// Dashboard.js - Main Application Page
// Features:
//   - Stats cards (total files, storage used, file types)
//   - Drag & drop file upload with progress
//   - Document list with search
//   - File preview (images inline, others via link)
//   - Download & Delete actions
//   - Fully responsive grid layout

import React, {
  useState, useEffect, useCallback, useRef
} from 'react';
import { useDropzone }  from 'react-dropzone';
import { toast }        from 'react-toastify';
import { format }       from 'date-fns';
import { useAuth }      from '../App';
import Navbar           from '../components/Navbar';
import {
  documentsAPI,
  formatFileSize,
  getFileTypeColor,
  getFileIcon,
  isImage,
} from '../api';

// ============================================================
// DASHBOARD COMPONENT
// ============================================================
function Dashboard() {
  const { user } = useAuth();

  // --- Data state ---
  const [documents,    setDocuments]    = useState([]);
  const [stats,        setStats]        = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchResults,setSearchResults]= useState(null); // null = not searching

  // --- UI state ---
  const [loading,       setLoading]       = useState(true);
  const [uploading,     setUploading]     = useState(false);
  const [uploadProgress,setUploadProgress]= useState(0);
  const [deletingId,    setDeletingId]    = useState(null);
  const [previewDoc,    setPreviewDoc]    = useState(null); // document being previewed
  const [description,   setDescription]  = useState('');   // upload description
  const [activeTab,     setActiveTab]     = useState('all'); // all | images | docs | other
  const [searchLoading, setSearchLoading] = useState(false);

  const searchTimeout = useRef(null); // for debouncing search


  // ----------------------------------------------------------
  // FETCH DOCUMENTS + STATS on mount
  // ----------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [docsRes, statsRes] = await Promise.all([
        documentsAPI.getAll(),
        documentsAPI.getStats(),
      ]);
      setDocuments(docsRes.data.documents);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);


  // ----------------------------------------------------------
  // SEARCH — debounced (waits 500ms after user stops typing)
  // ----------------------------------------------------------
  const handleSearch = (query) => {
    setSearchQuery(query);
    clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      setSearchResults(null); // clear search, show all
      return;
    }

    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await documentsAPI.search(query.trim());
        setSearchResults(res.data.documents);
      } catch (err) {
        toast.error('Search failed');
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };


  // ----------------------------------------------------------
  // FILTER DOCUMENTS by active tab
  // ----------------------------------------------------------
  const getFilteredDocs = () => {
    const source = searchResults !== null ? searchResults : documents;

    switch (activeTab) {
      case 'images':
        return source.filter(d => isImage(d.file_type));
      case 'docs':
        return source.filter(d =>
          ['pdf','doc','docx','txt'].includes(d.file_type)
        );
      case 'other':
        return source.filter(d =>
          !isImage(d.file_type) &&
          !['pdf','doc','docx','txt'].includes(d.file_type)
        );
      default:
        return source;
    }
  };

  const filteredDocs = getFilteredDocs();


  // ----------------------------------------------------------
  // FILE UPLOAD via react-dropzone
  // ----------------------------------------------------------
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0]; // upload one at a time

    // Check file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 16MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return prev; }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      await documentsAPI.upload(file, description);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(`"${file.name}" uploaded successfully! 🎉`);
      setDescription('');

      // Refresh document list and stats
      await fetchData();

      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 800);

    } catch (err) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      const msg = err.response?.data?.error || 'Upload failed';
      toast.error(msg);
    }
  }, [description, fetchData]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      accept: {
        'application/pdf':          ['.pdf'],
        'application/msword':       ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'text/plain':               ['.txt'],
        'image/png':                ['.png'],
        'image/jpeg':               ['.jpg', '.jpeg'],
        'image/gif':                ['.gif'],
        'image/webp':               ['.webp'],
      },
      disabled: uploading,
    });


  // ----------------------------------------------------------
  // DELETE DOCUMENT
  // ----------------------------------------------------------
  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.original_name}"? This cannot be undone.`)) return;

    setDeletingId(doc.id);
    try {
      await documentsAPI.delete(doc.id);
      toast.success(`"${doc.original_name}" deleted`);
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };


  // ----------------------------------------------------------
  // DOWNLOAD DOCUMENT
  // ----------------------------------------------------------
  const handleDownload = async (doc) => {
    try {
      await documentsAPI.download(doc.id, doc.original_name);
      toast.success(`Downloading "${doc.original_name}"`);
    } catch (err) {
      toast.error('Download failed');
    }
  };


  // ----------------------------------------------------------
  // PREVIEW DOCUMENT
  // ----------------------------------------------------------
  const handlePreview = (doc) => {
    setPreviewDoc(doc);
  };


  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      {/* ====================================================
          ALL STYLES
          ==================================================== */}
      <style>{`
        /* ---- PAGE ---- */
        .dash-page {
          min-height: 100vh;
          background: #0f172a;
          color: #f8fafc;
          font-family: 'Instrument Sans', sans-serif;
        }

        .dash-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        /* ---- PAGE HEADER ---- */
        .dash-header {
          margin-bottom: 2rem;
          animation: fadeUp 0.5s ease forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dash-greeting {
          font-family: 'Syne', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.03em;
          margin-bottom: 0.3rem;
        }

        .dash-greeting span {
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dash-subtext {
          color: #475569;
          font-size: 0.9rem;
        }

        /* ---- STATS CARDS ---- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
          animation: fadeUp 0.5s ease 0.1s both;
        }

        .stat-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 1.2rem 1.4rem;
          transition: border-color 0.2s, transform 0.2s;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--accent, linear-gradient(90deg, #6366f1, #8b5cf6));
          opacity: 0.8;
        }

        .stat-card:hover {
          border-color: #334155;
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 0.6rem;
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.2rem;
        }

        .stat-label {
          font-size: 0.78rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ---- UPLOAD ZONE ---- */
        .upload-section {
          margin-bottom: 2rem;
          animation: fadeUp 0.5s ease 0.15s both;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.8rem;
        }

        .dropzone {
          border: 2px dashed #1e293b;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(99,102,241,0.02);
          position: relative;
        }

        .dropzone:hover,
        .dropzone.active {
          border-color: #6366f1;
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.08);
        }

        .dropzone.reject {
          border-color: #ef4444;
          background: rgba(239,68,68,0.05);
        }

        .dropzone.disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .dropzone-icon {
          font-size: 2.5rem;
          margin-bottom: 0.8rem;
          display: block;
          transition: transform 0.3s ease;
        }

        .dropzone:hover .dropzone-icon,
        .dropzone.active .dropzone-icon {
          transform: scale(1.1) translateY(-4px);
        }

        .dropzone-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 0.3rem;
        }

        .dropzone-subtitle {
          font-size: 0.82rem;
          color: #475569;
          margin-bottom: 1rem;
        }

        .dropzone-types {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          margin-bottom: 1rem;
        }

        .type-badge {
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid;
          opacity: 0.8;
        }

        /* ---- DESCRIPTION INPUT ---- */
        .desc-input {
          width: 100%;
          max-width: 420px;
          padding: 10px 14px;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 10px;
          color: #f8fafc;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 0.5rem;
        }

        .desc-input:focus {
          border-color: #6366f1;
        }

        .desc-input::placeholder { color: #334155; }

        /* ---- UPLOAD PROGRESS ---- */
        .upload-progress {
          margin-top: 1rem;
        }

        .progress-bar-wrap {
          height: 6px;
          background: #1e293b;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.8rem;
          color: #64748b;
        }

        /* ---- TOOLBAR (search + tabs) ---- */
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 1.2rem;
          animation: fadeUp 0.5s ease 0.2s both;
        }

        .search-wrap {
          flex: 1;
          min-width: 200px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.95rem;
          color: #475569;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          color: #f8fafc;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .search-input::placeholder { color: #334155; }

        /* Clear search button */
        .search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          font-size: 1rem;
          padding: 2px;
          line-height: 1;
        }

        .search-clear:hover { color: #94a3b8; }

        /* ---- TABS ---- */
        .tabs {
          display: flex;
          gap: 4px;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 4px;
        }

        .tab-btn {
          padding: 6px 14px;
          border: none;
          border-radius: 7px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: #475569;
          white-space: nowrap;
        }

        .tab-btn.active {
          background: #1e293b;
          color: #e2e8f0;
        }

        .tab-btn:hover:not(.active) {
          color: #94a3b8;
        }

        /* ---- RESULTS COUNT ---- */
        .results-count {
          font-size: 0.82rem;
          color: #475569;
          margin-bottom: 1rem;
        }

        /* ---- DOCUMENT GRID ---- */
        .docs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          animation: fadeUp 0.5s ease 0.25s both;
        }

        /* ---- DOCUMENT CARD ---- */
        .doc-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 1.2rem;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          animation: cardIn 0.4s ease both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }

        .doc-card:hover {
          border-color: #334155;
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }

        .doc-card-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 0.9rem;
        }

        /* File type icon box */
        .doc-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .doc-info {
          flex: 1;
          min-width: 0; /* allows text to truncate */
        }

        .doc-name {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.92rem;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .doc-name:hover { color: #818cf8; }

        .doc-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .doc-type-badge {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border: 1px solid;
        }

        .doc-size {
          font-size: 0.75rem;
          color: #475569;
        }

        .doc-date {
          font-size: 0.73rem;
          color: #334155;
          margin-top: 4px;
        }

        /* Description text */
        .doc-desc {
          font-size: 0.8rem;
          color: #475569;
          margin-bottom: 0.8rem;
          font-style: italic;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Thumbnail for images */
        .doc-thumbnail {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 10px;
          margin-bottom: 0.8rem;
          cursor: pointer;
          transition: opacity 0.2s;
          border: 1px solid #1e293b;
        }

        .doc-thumbnail:hover { opacity: 0.85; }

        /* ---- CARD ACTIONS ---- */
        .doc-actions {
          display: flex;
          gap: 8px;
        }

        .doc-action-btn {
          flex: 1;
          padding: 7px 10px;
          border-radius: 9px;
          border: 1px solid #1e293b;
          background: transparent;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: #64748b;
        }

        .doc-action-btn:hover {
          background: #1e293b;
          color: #e2e8f0;
        }

        .doc-action-btn.preview:hover  { border-color: #6366f1; color: #818cf8; }
        .doc-action-btn.download:hover { border-color: #10b981; color: #34d399; }
        .doc-action-btn.delete:hover   { border-color: #ef4444; color: #f87171; }
        .doc-action-btn:disabled       { opacity: 0.4; cursor: not-allowed; }

        /* ---- EMPTY STATE ---- */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #334155;
          grid-column: 1 / -1;
        }

        .empty-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          display: block;
        }

        .empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          color: #475569;
          margin-bottom: 0.4rem;
        }

        .empty-text {
          font-size: 0.85rem;
          color: #334155;
        }

        /* ---- LOADING SKELETON ---- */
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .skeleton-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 1.2rem;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        .skeleton-line {
          background: #1e293b;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        /* ---- PREVIEW MODAL ---- */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(4px);
          animation: overlayIn 0.2s ease;
        }

        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .modal-box {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 20px;
          max-width: 680px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalIn 0.3s ease;
        }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.2rem 1.5rem;
          border-bottom: 1px solid #1e293b;
        }

        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #e2e8f0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 1rem;
        }

        .modal-close {
          background: #1e293b;
          border: none;
          color: #94a3b8;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #334155;
          color: #f8fafc;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-preview-img {
          width: 100%;
          max-height: 420px;
          object-fit: contain;
          border-radius: 12px;
          border: 1px solid #1e293b;
          background: #060d19;
          margin-bottom: 1rem;
        }

        .modal-no-preview {
          text-align: center;
          padding: 2.5rem;
          background: #060d19;
          border-radius: 12px;
          border: 1px solid #1e293b;
          margin-bottom: 1rem;
        }

        .modal-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 1rem;
        }

        .modal-meta-item {
          background: #060d19;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 10px 14px;
        }

        .modal-meta-label {
          font-size: 0.72rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }

        .modal-meta-value {
          font-size: 0.9rem;
          color: #e2e8f0;
          font-weight: 500;
          word-break: break-all;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .modal-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #1e293b;
          background: transparent;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #64748b;
        }

        .modal-btn.download {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
          color: #fff;
        }

        .modal-btn.download:hover {
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
          transform: translateY(-1px);
        }

        .modal-btn.delete {
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
        }

        .modal-btn.delete:hover {
          background: rgba(239,68,68,0.1);
          border-color: #ef4444;
        }

        /* ---- RESPONSIVE ---- */
        @media (max-width: 768px) {
          .dash-container { padding: 1.5rem 1rem; }
          .dash-greeting  { font-size: 1.4rem; }
          .stats-grid     { grid-template-columns: repeat(2, 1fr); }
          .toolbar        { flex-direction: column; align-items: stretch; }
          .tabs           { overflow-x: auto; }
          .modal-meta-grid{ grid-template-columns: 1fr; }
          .modal-actions  { flex-direction: column; }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .docs-grid  { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ====================================================
          PAGE
          ==================================================== */}
      <div className="dash-page">

        {/* Navbar */}
        <Navbar />

        <div className="dash-container">

          {/* ---- GREETING ---- */}
          <div className="dash-header">
            <h1 className="dash-greeting">
              Hey, <span>{user?.username}</span> 👋
            </h1>
            <p className="dash-subtext">
              Manage and organise all your documents in one place.
            </p>
          </div>

          {/* ---- STATS CARDS ---- */}
          <div className="stats-grid">
            <StatCard
              icon="📄"
              value={stats?.total_files ?? '—'}
              label="Total Files"
              accent="linear-gradient(90deg,#6366f1,#8b5cf6)"
            />
            <StatCard
              icon="💾"
              value={stats ? `${stats.total_size_mb} MB` : '—'}
              label="Storage Used"
              accent="linear-gradient(90deg,#10b981,#06b6d4)"
            />
            <StatCard
              icon="🖼️"
              value={stats?.by_type
                ? Object.values(stats.by_type)
                    .filter((_, i) =>
                      isImage(Object.keys(stats.by_type)[i])
                    )
                    .reduce((a, b) => a + b, 0)
                : '—'
              }
              label="Images"
              accent="linear-gradient(90deg,#f59e0b,#ef4444)"
            />
            <StatCard
              icon="📝"
              value={stats?.by_type
                ? (stats.by_type['pdf'] || 0) +
                  (stats.by_type['doc'] || 0) +
                  (stats.by_type['docx'] || 0) +
                  (stats.by_type['txt'] || 0)
                : '—'
              }
              label="Documents"
              accent="linear-gradient(90deg,#3b82f6,#6366f1)"
            />
          </div>

          {/* ---- UPLOAD SECTION ---- */}
          <div className="upload-section">
            <div className="section-title">Upload File</div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${uploading ? 'disabled' : ''}`}
            >
              <input {...getInputProps()} />

              <span className="dropzone-icon">
                {isDragReject ? '🚫' : isDragActive ? '📂' : '☁️'}
              </span>

              <div className="dropzone-title">
                {isDragReject
                  ? 'File type not supported'
                  : isDragActive
                  ? 'Drop it here!'
                  : 'Drag & drop a file here'}
              </div>

              <div className="dropzone-subtitle">
                or <strong style={{ color: '#818cf8' }}>click to browse</strong>
                {' '}— max 16 MB
              </div>

              {/* Supported type badges */}
              <div className="dropzone-types">
                {['PDF','DOC','DOCX','TXT','PNG','JPG','GIF','WEBP'].map(type => (
                  <span
                    key={type}
                    className="type-badge"
                    style={{
                      color:       getFileTypeColor(type.toLowerCase()),
                      borderColor: getFileTypeColor(type.toLowerCase()),
                      background:  `${getFileTypeColor(type.toLowerCase())}15`,
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>

              {/* Optional description input */}
              <div onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  className="desc-input"
                  placeholder="Add a description (optional)..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={200}
                />
              </div>

            </div>

            {/* Upload progress bar */}
            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar-wrap">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  />
                </div>
                <span className="progress-text">
                  {uploadProgress < 100
                    ? `Uploading... ${Math.round(uploadProgress)}%`
                    : '✓ Upload complete!'}
                </span>
              </div>
            )}
          </div>

          {/* ---- TOOLBAR (search + tabs) ---- */}
          <div className="toolbar">
            {/* Search input */}
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, type, or description..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => handleSearch('')}
                >×</button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="tabs">
              {['all','images','docs','other'].map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'all'    ? '📁 All'     :
                   tab === 'images' ? '🖼️ Images'  :
                   tab === 'docs'   ? '📝 Docs'    :
                                      '📦 Other'}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {!loading && (
            <div className="results-count">
              {searchQuery
                ? `${filteredDocs.length} result${filteredDocs.length !== 1 ? 's' : ''} for "${searchQuery}"`
                : `${filteredDocs.length} file${filteredDocs.length !== 1 ? 's' : ''}`}
              {searchLoading && ' — searching...'}
            </div>
          )}

          {/* ---- DOCUMENT GRID ---- */}
          {loading ? (
            /* Skeleton loader */
            <div className="skeleton-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-line" style={{ height: 44, width: 44, borderRadius: 12, marginBottom: 12 }} />
                  <div className="skeleton-line" style={{ height: 14, width: '70%' }} />
                  <div className="skeleton-line" style={{ height: 12, width: '40%' }} />
                  <div className="skeleton-line" style={{ height: 36, marginTop: 16 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="docs-grid">
              {filteredDocs.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    {searchQuery ? '🔍' : '📭'}
                  </span>
                  <div className="empty-title">
                    {searchQuery
                      ? `No results for "${searchQuery}"`
                      : 'No files yet'}
                  </div>
                  <div className="empty-text">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Upload your first document using the zone above'}
                  </div>
                </div>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    idx={idx}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                  />
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* ---- PREVIEW MODAL ---- */}
      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={handleDownload}
          onDelete={(doc) => {
            handleDelete(doc);
            setPreviewDoc(null);
          }}
        />
      )}
    </>
  );
}


// ============================================================
// STAT CARD SUB-COMPONENT
// ============================================================
function StatCard({ icon, value, label, accent }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}


// ============================================================
// DOCUMENT CARD SUB-COMPONENT
// ============================================================
function DocumentCard({ doc, idx, onPreview, onDownload, onDelete, deletingId }) {
  const typeColor = getFileTypeColor(doc.file_type);
  const fileIcon  = getFileIcon(doc.file_type);
  const isImg     = isImage(doc.file_type);
  const isDeleting= deletingId === doc.id;

  // Format the upload date
  const uploadDate = (() => {
    try { return format(new Date(doc.uploaded_at), 'MMM d, yyyy'); }
    catch { return doc.uploaded_at; }
  })();

  // Build preview URL for images
  const previewUrl = isImg
    ? `http://localhost:5000/api/documents/${doc.id}/download`
    : null;

  return (
    <div
      className="doc-card"
      style={{ animationDelay: `${idx * 0.05}s` }}
    >
      {/* Image thumbnail (for image files) */}
      {isImg && (
        <img
          src={previewUrl}
          alt={doc.original_name}
          className="doc-thumbnail"
          onClick={() => onPreview(doc)}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Card top: icon + name + meta */}
      <div className="doc-card-top">
        {/* File type icon box */}
        <div
          className="doc-icon-box"
          style={{ background: `${typeColor}18`, cursor: 'pointer' }}
          onClick={() => onPreview(doc)}
        >
          {fileIcon}
        </div>

        {/* File info */}
        <div className="doc-info">
          <div
            className="doc-name"
            title={doc.original_name}
            onClick={() => onPreview(doc)}
          >
            {doc.original_name}
          </div>
          <div className="doc-meta">
            {/* File type badge */}
            <span
              className="doc-type-badge"
              style={{
                color:       typeColor,
                borderColor: `${typeColor}50`,
                background:  `${typeColor}12`,
              }}
            >
              {doc.file_type}
            </span>
            <span className="doc-size">
              {formatFileSize(doc.file_size)}
            </span>
          </div>
          <div className="doc-date">{uploadDate}</div>
        </div>
      </div>

      {/* Description (if any) */}
      {doc.description && (
        <div className="doc-desc" title={doc.description}>
          "{doc.description}"
        </div>
      )}

      {/* Action buttons */}
      <div className="doc-actions">
        <button
          className="doc-action-btn preview"
          onClick={() => onPreview(doc)}
        >
          👁 Preview
        </button>
        <button
          className="doc-action-btn download"
          onClick={() => onDownload(doc)}
        >
          ⬇ Save
        </button>
        <button
          className="doc-action-btn delete"
          onClick={() => onDelete(doc)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <span style={{
              width: '10px', height: '10px',
              border: '2px solid #f87171',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }} />
          ) : '🗑'}
        </button>
      </div>
    </div>
  );
}


// ============================================================
// PREVIEW MODAL SUB-COMPONENT
// ============================================================
function PreviewModal({ doc, onClose, onDownload, onDelete }) {
  const isImg    = isImage(doc.file_type);
  const typeColor= getFileTypeColor(doc.file_type);
  const fileIcon = getFileIcon(doc.file_type);

  const uploadDate = (() => {
    try { return format(new Date(doc.uploaded_at), 'MMM d, yyyy · h:mm a'); }
    catch { return doc.uploaded_at; }
  })();

  // Close modal when clicking the overlay backdrop
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close modal on Escape key
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" title={doc.original_name}>
            {getFileIcon(doc.file_type)} {doc.original_name}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Image preview */}
          {isImg ? (
            <img
              src={`http://localhost:5000/api/documents/${doc.id}/download`}
              alt={doc.original_name}
              className="modal-preview-img"
            />
          ) : (
            /* Non-image: show icon + message */
            <div className="modal-no-preview">
              <div style={{ fontSize: '3.5rem', marginBottom: '0.8rem' }}>
                {fileIcon}
              </div>
              <div style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                Preview not available for {doc.file_type.toUpperCase()} files
              </div>
              <div style={{ color: '#334155', fontSize: '0.8rem' }}>
                Download the file to view it on your device
              </div>
            </div>
          )}

          {/* File metadata grid */}
          <div className="modal-meta-grid">
            <div className="modal-meta-item">
              <div className="modal-meta-label">File Name</div>
              <div className="modal-meta-value">{doc.original_name}</div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">File Type</div>
              <div className="modal-meta-value" style={{ color: typeColor }}>
                {doc.file_type.toUpperCase()}
              </div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">File Size</div>
              <div className="modal-meta-value">{formatFileSize(doc.file_size)}</div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">Uploaded</div>
              <div className="modal-meta-value">{uploadDate}</div>
            </div>
            {doc.description && (
              <div className="modal-meta-item" style={{ gridColumn: '1 / -1' }}>
                <div className="modal-meta-label">Description</div>
                <div className="modal-meta-value">{doc.description}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              className="modal-btn download"
              onClick={() => onDownload(doc)}
            >
              ⬇ Download File
            </button>
            <button
              className="modal-btn delete"
              onClick={() => onDelete(doc)}
            >
              🗑 Delete
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}


export default Dashboard;