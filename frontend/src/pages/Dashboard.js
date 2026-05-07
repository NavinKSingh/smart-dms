// Dashboard.js — Vault DMS · Dark Edition v2.0
// Developed by Navin Kumar Singh · © 2026 Vault DMS
// Two-page layout: Page 1 = Upload + Browse, Page 2 = File Content Viewer
// Sidebar: Recent, Favourites, Shared, Folders, Bin
// LeetCode-style navbar with profile dropdown
// Auto-slideshow triggers at 4+ images
// Single-file, no external imports beyond original

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import { useDropzone }  from 'react-dropzone';
import { toast }        from 'react-toastify';
import { format }       from 'date-fns';
import { useAuth }      from '../App';
import {
  documentsAPI,
  formatFileSize,
  getFileTypeColor,
  isImage,
} from '../api';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const FOLDER_DEFS = [
  { id:'images',  label:'Photos & Images', emoji:'🌅', glow:'#38BDF8', gradient:'linear-gradient(135deg,#0EA5E9,#6366F1)', types:['jpg','jpeg','png','gif','webp','svg','bmp'], desc:'All visual memories' },
  { id:'pdf',     label:'PDF Files',       emoji:'📕', glow:'#F87171', gradient:'linear-gradient(135deg,#EF4444,#F97316)', types:['pdf'],                                        desc:'Portable documents' },
  { id:'docs',    label:'Word Docs',       emoji:'📘', glow:'#60A5FA', gradient:'linear-gradient(135deg,#3B82F6,#6366F1)', types:['doc','docx'],                                 desc:'Editable documents' },
  { id:'sheets',  label:'Spreadsheets',    emoji:'📗', glow:'#34D399', gradient:'linear-gradient(135deg,#10B981,#06B6D4)', types:['xls','xlsx','csv'],                           desc:'Numbers & tables'  },
  { id:'text',    label:'Text Files',      emoji:'📄', glow:'#A78BFA', gradient:'linear-gradient(135deg,#8B5CF6,#EC4899)', types:['txt','md','rtf'],                             desc:'Plain & rich text' },
  { id:'other',   label:'Other Files',     emoji:'📦', glow:'#FBBF24', gradient:'linear-gradient(135deg,#F59E0B,#EF4444)', types:[],                                             desc:'Everything else'   },
];

const API_BASE = 'http://localhost:5000';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=60',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400&q=60',
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400&q=60',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=60',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=60',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=60',
];

// Always pick 4 random placeholders once (stable across re-renders via module-level selection)
const SLIDESHOW_IMAGES = (() => {
  const shuffled = [...PLACEHOLDER_IMAGES].sort(() => Math.random() - 0.5).slice(0, 4);
  // Duplicate for seamless infinite scroll
  return [...shuffled, ...shuffled];
})();

function getFolderForType(ft) {
  const f = (ft||'').toLowerCase();
  for (const fd of FOLDER_DEFS) if (fd.types.includes(f)) return fd.id;
  return 'other';
}
function detectTypeFromMime(mime='') {
  if (mime.startsWith('image/')) return mime.split('/')[1];
  if (mime==='application/pdf') return 'pdf';
  if (mime.includes('wordprocessingml')||mime.includes('msword')) return 'docx';
  if (mime.includes('spreadsheetml')||mime.includes('excel')) return 'xlsx';
  if (mime==='text/plain') return 'txt';
  if (mime==='text/csv') return 'csv';
  return 'file';
}
function typeLabel(ft) { return (ft||'FILE').toUpperCase(); }
function typeColor(ft)  { return getFileTypeColor ? getFileTypeColor(ft) : '#38BDF8'; }
function buildDownloadUrl(id) { return `${API_BASE}/api/documents/${id}/download`; }

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* ══ ROOT ══ */
.vd-app{
  min-height:100vh;
  background:#080B10;
  color:#E2E8F0;
  font-family:'DM Sans',sans-serif;
  display:flex;
  flex-direction:column;
}

/* ══ ANIMATIONS ══ */
@keyframes vd-up   {from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes vd-in   {from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes vd-spin {to{transform:rotate(360deg)}}
@keyframes vd-shimmer{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes vd-slide-x{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes vd-pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.75)}}
@keyframes lp-slidein{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes vd-dropdown{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

/* ══ NAVBAR ══ */
.vd-navbar{
  height:56px;
  background:#0D1117;
  border-bottom:1px solid #1E293B;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 1.5rem;
  position:sticky;
  top:0;
  z-index:200;
  flex-shrink:0;
}

/* FIX #2: Brand is static, no dropdown, no cursor pointer */
.vd-navbar-brand{
  display:flex;align-items:center;gap:10px;
  cursor:default;
  position:relative;
  user-select:none;
}
.vd-navbar-brand-icon{
  width:36px;height:36px;
  background:linear-gradient(135deg,#38BDF8,#6366F1);
  border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 18px rgba(56,189,248,.35);
  flex-shrink:0;
}
.vd-navbar-brand-icon svg{width:16px;height:16px;color:#fff;}
.vd-navbar-brand-name{
  font-family:'Playfair Display',serif;
  font-size:1.1rem;color:#E8F0FF;
  letter-spacing:.01em;
}

/* FIX #3: Profile dropdown styles (moved to avatar) */
.vd-avatar-wrap{
  position:relative;
}
.vd-avatar-dropdown{
  position:absolute;
  top:calc(100% + 10px);
  right:0;
  background:#0D1117;
  border:1px solid #1E293B;
  border-radius:14px;
  padding:.5rem;
  min-width:200px;
  box-shadow:0 16px 48px rgba(0,0,0,.6);
  animation:vd-dropdown .2s both;
  z-index:300;
}
.vd-avatar-dropdown-header{
  padding:.6rem .9rem .5rem;
  border-bottom:1px solid #1E293B;
  margin-bottom:.4rem;
}
.vd-avatar-dropdown-user{
  font-size:.85rem;font-weight:600;color:#CBD5E1;
}
.vd-avatar-dropdown-email{font-size:.73rem;color:#334155;margin-top:2px;}
.vd-dropdown-item{
  display:flex;align-items:center;gap:10px;
  padding:.65rem .9rem;border-radius:9px;
  cursor:pointer;font-size:.85rem;color:#64748B;
  transition:background .15s,color .15s;
}
.vd-dropdown-item:hover{background:#161C2A;color:#CBD5E1;}
.vd-dropdown-item.danger:hover{background:rgba(239,68,68,.08);color:#F87171;}
.vd-dropdown-item svg{width:15px;height:15px;flex-shrink:0;}

/* FIX #4: Search moved left with more gap, wider */
.vd-navbar-right{display:flex;align-items:center;gap:16px;}
.vd-navbar-search{
  display:flex;align-items:center;gap:8px;
  background:#161C2A;
  border:1px solid #1E293B;
  border-radius:10px;
  padding:6px 14px;
  cursor:pointer;
  transition:border-color .2s,background .2s;
  font-size:.82rem;color:#475569;
  width:260px;
}
.vd-navbar-search:hover{border-color:#334155;background:#1E293B;}
.vd-navbar-search svg{width:14px;height:14px;flex-shrink:0;}
.vd-navbar-search-text{flex:1;}
.vd-navbar-search-kbd{
  background:#1E293B;
  border-radius:4px;
  padding:1px 6px;
  font-size:.68rem;
  color:#334155;
  font-family:monospace;
  border:1px solid #263346;
  flex-shrink:0;
}
.vd-avatar{
  width:32px;height:32px;border-radius:50%;
  background:linear-gradient(135deg,#0EA5E9,#6366F1);
  display:flex;align-items:center;justify-content:center;
  font-size:.82rem;font-weight:700;color:#fff;
  cursor:pointer;flex-shrink:0;
  overflow:hidden;
  border:2px solid #1E293B;
  transition:border-color .2s;
}
.vd-avatar:hover{border-color:#38BDF8;}
.vd-avatar img{width:100%;height:100%;object-fit:cover;}

/* ══ LAYOUT ══ */
.vd-layout{
  display:flex;
  flex:1;
  min-height:0;
}

/* ══ SIDEBAR ══ */
.vd-sidebar{
  width:230px;
  flex-shrink:0;
  background:#0D1117;
  border-right:1px solid #1E293B;
  display:flex;
  flex-direction:column;
  padding:1rem 0;
  overflow-y:auto;
  height:calc(100vh - 56px);
  position:sticky;
  top:56px;
}
.vd-sidebar-section{
  padding:0 .75rem;
  margin-bottom:.3rem;
}
.vd-sidebar-section-label{
  font-size:.63rem;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;
  color:#1E293B;
  padding:.7rem .5rem .4rem;
}
.vd-sidebar-item{
  display:flex;align-items:center;gap:10px;
  padding:.55rem .75rem;
  border-radius:9px;
  cursor:pointer;
  font-size:.83rem;color:#475569;
  transition:background .15s,color .15s;
  position:relative;
}
.vd-sidebar-item:hover{background:#161C2A;color:#94A3B8;}
.vd-sidebar-item.active{
  background:rgba(56,189,248,.08);
  color:#38BDF8;
}
.vd-sidebar-item.active .vd-sidebar-item-icon{color:#38BDF8;}
.vd-sidebar-item-icon{
  width:28px;height:28px;
  border-radius:7px;
  display:flex;align-items:center;justify-content:center;
  font-size:1rem;flex-shrink:0;
}
.vd-sidebar-item-count{
  margin-left:auto;
  font-size:.68rem;font-weight:700;
  background:#1E293B;
  color:#475569;
  border-radius:12px;
  padding:1px 7px;
  min-width:20px;
  text-align:center;
}
.vd-sidebar-item.active .vd-sidebar-item-count{
  background:rgba(56,189,248,.15);color:#38BDF8;
}
.vd-sidebar-divider{
  height:1px;background:#1E293B;
  margin:.6rem .75rem;
}
.vd-sidebar-folder-dot{
  width:8px;height:8px;border-radius:50%;
  flex-shrink:0;
}

/* ══ MAIN CONTENT ══ */
.vd-main{
  flex:1;
  min-width:0;
  overflow-y:auto;
  height:calc(100vh - 56px);
}
.vd-wrap{
  max-width:1100px;
  margin:0 auto;
  padding:2rem 2rem 4rem;
}

/* ══ SEARCH MODAL (full-screen overlay) ══ */
.vd-search-overlay{
  position:fixed;inset:0;
  background:rgba(0,0,0,.75);
  backdrop-filter:blur(8px);
  z-index:500;
  display:flex;
  align-items:flex-start;
  justify-content:center;
  padding-top:100px;
  animation:vd-in .15s both;
}
.vd-search-modal{
  width:100%;max-width:600px;
  background:#0D1117;
  border:1px solid #1E293B;
  border-radius:18px;
  overflow:hidden;
  box-shadow:0 24px 80px rgba(0,0,0,.7);
  animation:vd-up .2s both;
}
.vd-search-modal-input-wrap{
  display:flex;align-items:center;gap:12px;
  padding:1rem 1.3rem;
  border-bottom:1px solid #1E293B;
}
.vd-search-modal-input-wrap svg{color:#475569;flex-shrink:0;width:18px;height:18px;}
.vd-search-modal-input{
  flex:1;background:none;border:none;outline:none;
  font-family:'DM Sans',sans-serif;font-size:1rem;color:#E2E8F0;
}
.vd-search-modal-input::placeholder{color:#334155;}
.vd-search-modal-esc{
  font-size:.68rem;color:#334155;background:#1E293B;
  border-radius:4px;padding:2px 7px;font-family:monospace;
  border:1px solid #263346;flex-shrink:0;cursor:pointer;
}
.vd-search-result-item{
  display:flex;align-items:center;gap:12px;
  padding:11px 1.3rem;cursor:pointer;
  transition:background .15s;
  border-bottom:1px solid rgba(255,255,255,.03);
}
.vd-search-result-item:last-child{border-bottom:none;}
.vd-search-result-item:hover{background:#161C2A;}
.vd-search-result-icon{
  width:36px;height:36px;border-radius:9px;
  display:flex;align-items:center;justify-content:center;
  font-size:.73rem;font-weight:800;flex-shrink:0;
}
.vd-search-result-name{font-size:.87rem;font-weight:500;color:#CBD5E1;}
.vd-search-result-meta{font-size:.72rem;color:#334155;margin-top:2px;}
.vd-search-empty{padding:2rem;text-align:center;color:#334155;font-size:.85rem;}

/* ══ SECTION LABEL ══ */
.vd-section-label{
  font-size:.68rem;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;
  color:#334155;margin-bottom:.9rem;
  display:flex;align-items:center;gap:8px;
}
.vd-section-label::before{
  content:'';display:inline-block;
  width:18px;height:1.5px;
  background:linear-gradient(90deg,#38BDF8,#6366F1);
}

/* ══ PAGE HEADER ══ */
.vd-page-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:2rem;animation:vd-up .4s both;
}
.vd-page-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(1.4rem,2.5vw,2rem);
  color:#E8F0FF;line-height:1.15;
}
.vd-page-title em{
  font-style:italic;
  background:linear-gradient(90deg,#38BDF8,#818CF8);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.vd-page-sub{font-size:.83rem;color:#334155;margin-top:.2rem;}

/* ══ STATS ROW ══ */
.vd-stats{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
  gap:.85rem;margin-bottom:2.5rem;animation:vd-up .5s .06s both;
}
.vd-stat{
  background:#0D1117;border:1px solid #1E293B;border-radius:16px;
  padding:1.1rem 1.3rem;position:relative;overflow:hidden;
  transition:border-color .2s,transform .2s;
}
.vd-stat::after{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:var(--glow,#38BDF8);opacity:.7;
}
.vd-stat:hover{border-color:#334155;transform:translateY(-2px);}
.vd-stat-icon{font-size:1.3rem;margin-bottom:.45rem;}
.vd-stat-val{
  font-family:'Playfair Display',serif;font-size:1.5rem;
  color:#E8F0FF;line-height:1;margin-bottom:.2rem;
  background:var(--glow,#38BDF8);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.vd-stat-lbl{font-size:.7rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#334155;}

/* ══ SLIDESHOW ══ */
.vd-slideshow-wrap{margin-bottom:2.5rem;animation:vd-up .5s .1s both;}
.vd-slideshow{
  position:relative;border-radius:20px;overflow:hidden;
  height:200px;border:1px solid #1E293B;background:#0A0F1A;
}
.vd-slideshow-track{
  display:flex;height:100%;
  animation:vd-slide-x 30s linear infinite;
  width:max-content;
}
.vd-slideshow-track:hover{animation-play-state:paused;}
.vd-slideshow-img{
  height:100%;width:280px;object-fit:cover;
  flex-shrink:0;margin-right:8px;border-radius:12px;
  cursor:pointer;transition:opacity .2s;
  background:#0D1117;
}
.vd-slideshow-img:hover{opacity:.85;}
.vd-slideshow-empty{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;height:100%;gap:.5rem;color:#1E293B;
}
.vd-slideshow-empty .ico{font-size:2.2rem;}
.vd-slideshow-empty p{font-size:.8rem;}
.vd-slideshow-badge{
  position:absolute;top:12px;left:12px;
  background:rgba(8,11,16,.75);backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.07);border-radius:20px;
  padding:4px 11px;font-size:.7rem;font-weight:600;
  letter-spacing:.06em;text-transform:uppercase;color:#38BDF8;
  display:flex;align-items:center;gap:6px;
}
.vd-slideshow-dot{width:6px;height:6px;border-radius:50%;background:#38BDF8;animation:vd-pulse-dot 1.5s ease-in-out infinite;}
.vd-slideshow-overlay{
  position:absolute;inset:0;
  background:linear-gradient(90deg,rgba(8,11,16,.55) 0%,transparent 20%,transparent 80%,rgba(8,11,16,.55) 100%);
  pointer-events:none;
}

/* ══ UPLOAD ZONE ══ */
.vd-upload-wrap{margin-bottom:2.5rem;animation:vd-up .5s .14s both;}
.vd-dropzone{
  border:2px dashed #1E293B;border-radius:20px;
  padding:2.2rem 2rem;text-align:center;cursor:pointer;
  background:rgba(56,189,248,.015);
  transition:all .3s ease;position:relative;
}
.vd-dropzone:hover,.vd-dropzone.active{
  border-color:#38BDF8;background:rgba(56,189,248,.05);
  box-shadow:0 0 0 4px rgba(56,189,248,.07);
}
.vd-dropzone.reject{border-color:#EF4444;background:rgba(239,68,68,.04);}
.vd-dropzone.disabled{cursor:not-allowed;opacity:.55;}
.vd-dz-icon{font-size:2.8rem;margin-bottom:.9rem;display:block;transition:transform .35s cubic-bezier(.22,1,.36,1);}
.vd-dropzone:hover .vd-dz-icon,.vd-dropzone.active .vd-dz-icon{transform:translateY(-6px) scale(1.1);}
.vd-dz-title{font-family:'Playfair Display',serif;font-size:1.2rem;color:#E8F0FF;margin-bottom:.3rem;}
.vd-dz-sub{font-size:.83rem;color:#475569;margin-bottom:1.1rem;}
.vd-dz-sub strong{color:#38BDF8;}
.vd-dz-types{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;}
.vd-type-chip{padding:2px 9px;border-radius:20px;font-size:.65rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:1px solid;}

/* ── File detected ── */
.vd-file-detected{
  background:#0D1117;border:1.5px solid #1E293B;
  border-radius:16px;padding:1.3rem 1.5rem;
  display:flex;flex-direction:column;gap:.9rem;
}
.vd-file-detected-top{display:flex;align-items:center;gap:13px;}
.vd-file-type-badge{
  width:50px;height:50px;border-radius:13px;
  display:flex;align-items:center;justify-content:center;
  font-size:.8rem;font-weight:800;letter-spacing:.04em;flex-shrink:0;
}
.vd-file-detected-info{flex:1;min-width:0;text-align:left;}
.vd-file-detected-original{font-size:.81rem;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vd-file-detected-size{font-size:.72rem;color:#334155;margin-top:2px;}
.vd-name-field-label{
  display:block;font-size:.7rem;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;
  color:#475569;margin-bottom:5px;text-align:left;
}
.vd-name-input{
  width:100%;padding:11px 14px;
  background:#0A0F1A;border:1.5px solid #1E293B;border-radius:10px;
  font-family:'DM Sans',sans-serif;font-size:.91rem;color:#E2E8F0;
  outline:none;transition:border-color .2s,box-shadow .2s;
}
.vd-name-input::placeholder{color:#1E293B;}
.vd-name-input:focus{border-color:#38BDF8;box-shadow:0 0 0 3px rgba(56,189,248,.1);}
.vd-name-input.err{border-color:#EF4444;}
.vd-name-hint{margin-top:4px;font-size:.71rem;color:#EF4444;text-align:left;}
.vd-upload-actions{display:flex;gap:.75rem;}
.vd-upload-btn{
  flex:1;padding:11px;border:none;border-radius:10px;
  font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:600;
  cursor:pointer;transition:all .2s;
  display:flex;align-items:center;justify-content:center;gap:7px;
}
.vd-upload-btn.primary{
  background:linear-gradient(135deg,#0EA5E9,#6366F1);color:#fff;
  box-shadow:0 4px 18px rgba(56,189,248,.22);
}
.vd-upload-btn.primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(56,189,248,.35);}
.vd-upload-btn.primary:disabled{opacity:.5;cursor:not-allowed;}
.vd-upload-btn.secondary{background:#1E293B;color:#94A3B8;border:1.5px solid #1E293B;}
.vd-upload-btn.secondary:hover{background:#263346;color:#CBD5E1;}
.vd-progress-bar-wrap{height:4px;background:#1E293B;border-radius:3px;overflow:hidden;margin-top:.3rem;}
.vd-progress-bar{height:100%;background:linear-gradient(90deg,#38BDF8,#6366F1);border-radius:3px;transition:width .3s;}
.vd-progress-txt{font-size:.72rem;color:#475569;margin-top:4px;text-align:left;}

/* ══ RECENT CARDS (sidebar-driven view) ══ */
.vd-recent-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
  gap:.85rem;
}
.vd-recent-card{
  background:#0D1117;border:1px solid #1E293B;border-radius:14px;
  padding:.9rem 1rem;cursor:pointer;
  transition:border-color .2s,transform .2s,box-shadow .2s;
  animation:vd-in .4s both;display:flex;align-items:center;gap:10px;
}
.vd-recent-card:hover{border-color:#334155;transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.35);}
.vd-recent-card-icon{
  width:38px;height:38px;border-radius:9px;
  display:flex;align-items:center;justify-content:center;
  font-size:.73rem;font-weight:800;flex-shrink:0;
}
.vd-recent-card-name{font-size:.8rem;font-weight:500;color:#CBD5E1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vd-recent-card-meta{font-size:.68rem;color:#334155;margin-top:2px;}

/* ══ FOLDERS GRID ══ */
.vd-folders-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:.9rem;
}
.vd-folder{
  border-radius:18px;padding:1.3rem 1.2rem;
  cursor:pointer;position:relative;overflow:hidden;
  border:1px solid transparent;
  transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s,border-color .25s;
  animation:vd-in .4s both;background:#0D1117;
}
.vd-folder::before{
  content:'';position:absolute;inset:0;border-radius:18px;
  background:var(--grad);opacity:.08;transition:opacity .25s;
}
.vd-folder:hover::before{opacity:.15;}
.vd-folder:hover{
  transform:translateY(-4px) scale(1.02);
  box-shadow:0 12px 36px rgba(0,0,0,.45),0 0 0 1px var(--glow-col);
  border-color:var(--glow-col);
}
.vd-folder-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.8rem;}
.vd-folder-emoji{
  font-size:1.8rem;width:46px;height:46px;
  display:flex;align-items:center;justify-content:center;
  border-radius:12px;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.05);position:relative;z-index:1;
}
.vd-folder-count{
  font-family:'Playfair Display',serif;font-size:1.4rem;
  position:relative;z-index:1;
  background:var(--grad);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.vd-folder-label{font-family:'Playfair Display',serif;font-size:.95rem;font-weight:600;color:#CBD5E1;margin-bottom:.15rem;position:relative;z-index:1;}
.vd-folder-desc{font-size:.7rem;color:#334155;position:relative;z-index:1;}
.vd-folder-bar{margin-top:.8rem;height:3px;border-radius:2px;background:#1E293B;overflow:hidden;position:relative;z-index:1;}
.vd-folder-bar-fill{height:100%;border-radius:2px;background:var(--grad);}

/* ══ DOCS GRID ══ */
.vd-docs-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
  gap:1rem;
}
.vd-doc-card{
  background:#0D1117;border:1px solid #1E293B;border-radius:15px;
  padding:1rem;position:relative;overflow:hidden;
  transition:border-color .2s,transform .2s,box-shadow .2s;
  animation:vd-in .35s both;
}
.vd-doc-card:hover{border-color:#334155;transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,.4);}
.vd-doc-thumb{
  width:100%;height:120px;object-fit:cover;
  border-radius:9px;margin-bottom:.8rem;cursor:pointer;
  border:1px solid #1E293B;transition:opacity .2s;
}
.vd-doc-thumb:hover{opacity:.82;}
.vd-doc-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:.75rem;}
.vd-doc-icon-box{
  width:40px;height:40px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  font-size:.72rem;font-weight:800;flex-shrink:0;cursor:pointer;
}
.vd-doc-info{flex:1;min-width:0;}
.vd-doc-name{
  font-weight:600;font-size:.85rem;color:#CBD5E1;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  cursor:pointer;transition:color .15s;margin-bottom:3px;
}
.vd-doc-name:hover{color:#38BDF8;}
.vd-doc-badges{display:flex;flex-wrap:wrap;gap:4px;align-items:center;}
.vd-doc-type-chip{
  padding:1px 7px;border-radius:20px;font-size:.62rem;
  font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:1px solid;
}
.vd-doc-size{font-size:.7rem;color:#334155;}
.vd-doc-date{font-size:.67rem;color:#1E293B;margin-top:2px;}
.vd-doc-actions{display:flex;gap:5px;flex-wrap:wrap;}
.vd-doc-btn{
  flex:1;padding:6px 5px;border-radius:7px;
  border:1px solid #1E293B;background:transparent;
  font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:500;
  cursor:pointer;color:#475569;min-width:0;
  transition:all .18s;display:flex;align-items:center;justify-content:center;gap:3px;
}
.vd-doc-btn:hover{background:#1E293B;color:#CBD5E1;}
.vd-doc-btn.prev:hover{border-color:#38BDF8;color:#7DD3FC;}
.vd-doc-btn.fav{transition:all .18s;}
.vd-doc-btn.fav.active{border-color:#F59E0B;color:#FCD34D;background:rgba(245,158,11,.08);}
.vd-doc-btn.fav:hover{border-color:#F59E0B;color:#FCD34D;}
.vd-doc-btn.dl:hover{border-color:#22C55E;color:#86EFAC;}
.vd-doc-btn.shr:hover{border-color:#A78BFA;color:#C4B5FD;}
.vd-doc-btn.del:hover{border-color:#EF4444;color:#F87171;}
.vd-doc-btn:disabled{opacity:.35;cursor:not-allowed;}

/* ══ EMPTY STATE ══ */
.vd-empty{
  grid-column:1/-1;text-align:center;
  padding:3.5rem 2rem;color:#1E293B;
}
.vd-empty-ico{font-size:3rem;margin-bottom:.9rem;display:block;}
.vd-empty-title{font-family:'Playfair Display',serif;font-size:1rem;color:#334155;margin-bottom:.3rem;}
.vd-empty-sub{font-size:.8rem;color:#1E293B;}

/* ══ SKELETON ══ */
.vd-skeleton-card{background:#0D1117;border:1px solid #1E293B;border-radius:15px;padding:1rem;animation:vd-shimmer 1.6s infinite;}

/* ══ BIN SECTION ══ */
.vd-bin-empty{text-align:center;padding:4rem 2rem;color:#1E293B;}
.vd-bin-item{
  display:flex;align-items:center;gap:12px;
  background:#0D1117;border:1px solid #1E293B;border-radius:12px;
  padding:.85rem 1rem;margin-bottom:.6rem;
  animation:vd-in .3s both;
}
.vd-bin-item-info{flex:1;min-width:0;}
.vd-bin-item-name{font-size:.85rem;font-weight:500;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vd-bin-item-meta{font-size:.72rem;color:#1E293B;margin-top:2px;}
.vd-bin-btn{
  padding:5px 11px;border-radius:7px;border:1px solid;
  background:transparent;font-family:'DM Sans',sans-serif;
  font-size:.75rem;font-weight:600;cursor:pointer;transition:all .18s;
}
.vd-bin-btn.restore{border-color:#334155;color:#475569;}
.vd-bin-btn.restore:hover{border-color:#38BDF8;color:#7DD3FC;background:rgba(56,189,248,.06);}
.vd-bin-btn.purge{border-color:rgba(239,68,68,.3);color:#F87171;}
.vd-bin-btn.purge:hover{background:rgba(239,68,68,.08);border-color:#EF4444;}

/* ══ FILE VIEWER PAGE (Page 2) ══ */
.vd-viewer{
  display:flex;flex-direction:column;
  min-height:calc(100vh - 56px);
  animation:vd-up .3s both;
}
.vd-viewer-topbar{
  display:flex;align-items:center;gap:12px;
  padding:1rem 2rem;
  border-bottom:1px solid #1E293B;
  background:#0D1117;
  position:sticky;top:0;z-index:10;
  flex-shrink:0;
}
.vd-viewer-back{
  display:flex;align-items:center;gap:6px;
  font-size:.82rem;color:#475569;cursor:pointer;
  padding:5px 10px;border-radius:8px;
  transition:background .15s,color .15s;
  border:1px solid #1E293B;background:transparent;
  font-family:'DM Sans',sans-serif;
}
.vd-viewer-back:hover{background:#1E293B;color:#CBD5E1;}
.vd-viewer-back svg{width:14px;height:14px;}
.vd-viewer-title{
  font-family:'Playfair Display',serif;
  font-size:1rem;color:#E8F0FF;
  flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.vd-viewer-actions{display:flex;gap:7px;flex-shrink:0;}
.vd-viewer-btn{
  display:flex;align-items:center;gap:5px;
  padding:6px 13px;border-radius:8px;
  border:1px solid #1E293B;background:transparent;
  font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:500;
  cursor:pointer;color:#64748B;transition:all .2s;
}
.vd-viewer-btn:hover{background:#1E293B;color:#CBD5E1;}
.vd-viewer-btn.primary{
  background:linear-gradient(135deg,#0EA5E9,#6366F1);
  border-color:transparent;color:#fff;
}
.vd-viewer-btn.primary:hover{box-shadow:0 4px 16px rgba(56,189,248,.3);}
.vd-viewer-btn.fav.active{border-color:#F59E0B;color:#FCD34D;background:rgba(245,158,11,.08);}
.vd-viewer-btn.fav:hover{border-color:#F59E0B;color:#FCD34D;}
.vd-viewer-btn.del{border-color:rgba(239,68,68,.25);color:#F87171;}
.vd-viewer-btn.del:hover{background:rgba(239,68,68,.08);border-color:#EF4444;}

.vd-viewer-body{flex:1;padding:2rem;display:flex;gap:1.5rem;flex-wrap:wrap;}

.vd-viewer-preview{
  flex:1;min-width:300px;
  background:#0A0F1A;border:1px solid #1E293B;
  border-radius:16px;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  min-height:500px;position:relative;
}

.vd-viewer-img{
  max-width:100%;
  max-height:70vh;
  object-fit:contain;
  border-radius:8px;
  display:block;
}

.vd-viewer-pdf{
  width:100%;
  height:70vh;
  min-height:500px;
  border:none;
  background:#060D19;
  display:block;
}

.vd-viewer-text-content{
  width:100%;
  height:70vh;
  overflow:auto;
  padding:1.5rem;
  font-family:'DM Mono','Fira Code',monospace;
  font-size:.82rem;
  line-height:1.7;
  color:#94A3B8;
  white-space:pre-wrap;
  word-break:break-word;
  background:#060D19;
  border-radius:0;
}

.vd-viewer-no-preview{
  text-align:center;padding:3rem;
  display:flex;flex-direction:column;align-items:center;gap:1rem;
}
.vd-viewer-no-preview .ico{font-size:3.5rem;display:block;}
.vd-viewer-no-preview-type{font-weight:700;font-size:1.1rem;margin-bottom:.3rem;}
.vd-viewer-no-preview-hint{font-size:.83rem;color:#475569;}

.vd-viewer-loading{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:.8rem;color:#334155;font-size:.82rem;
  width:100%;height:100%;min-height:300px;
}

.vd-viewer-sidebar{
  width:280px;flex-shrink:0;
  display:flex;flex-direction:column;gap:1rem;
}
.vd-viewer-meta-card{
  background:#0D1117;border:1px solid #1E293B;
  border-radius:14px;padding:1.1rem;
}
.vd-viewer-meta-title{
  font-size:.68rem;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:#334155;margin-bottom:.8rem;
}
.vd-viewer-meta-row{
  display:flex;justify-content:space-between;align-items:baseline;
  padding:.45rem 0;border-bottom:1px solid rgba(255,255,255,.03);
}
.vd-viewer-meta-row:last-child{border-bottom:none;}
.vd-viewer-meta-label{font-size:.73rem;color:#334155;}
.vd-viewer-meta-value{font-size:.8rem;color:#94A3B8;font-weight:500;text-align:right;max-width:160px;word-break:break-all;}

/* ══ PROFILE EDIT MODAL ══ */
.vd-modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.82);
  z-index:400;display:flex;align-items:center;justify-content:center;
  padding:1rem;backdrop-filter:blur(6px);animation:vd-in .2s both;
}
.vd-modal{
  background:#0D1117;border:1px solid #1E293B;
  border-radius:20px;max-width:460px;width:100%;
  box-shadow:0 24px 80px rgba(0,0,0,.7);animation:vd-up .3s both;
}
.vd-modal-hdr{
  display:flex;align-items:center;justify-content:space-between;
  padding:1rem 1.3rem;border-bottom:1px solid #1E293B;
}
.vd-modal-title{font-family:'Playfair Display',serif;font-size:1rem;color:#E8F0FF;}
.vd-modal-close{
  width:30px;height:30px;background:#1E293B;border:none;
  border-radius:7px;color:#64748B;cursor:pointer;font-size:1rem;
  display:flex;align-items:center;justify-content:center;transition:all .2s;
}
.vd-modal-close:hover{background:#263346;color:#E2E8F0;}
.vd-modal-body{padding:1.3rem;}
.vd-profile-avatar-row{
  display:flex;align-items:center;gap:1rem;margin-bottom:1.3rem;
}
.vd-profile-avatar-big{
  width:64px;height:64px;border-radius:50%;
  background:linear-gradient(135deg,#0EA5E9,#6366F1);
  display:flex;align-items:center;justify-content:center;
  font-size:1.4rem;font-weight:700;color:#fff;
  overflow:hidden;flex-shrink:0;
  border:2px solid #1E293B;cursor:pointer;position:relative;
}
.vd-profile-avatar-big img{width:100%;height:100%;object-fit:cover;}
.vd-profile-avatar-big-overlay{
  position:absolute;inset:0;background:rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;
  opacity:0;transition:opacity .2s;border-radius:50%;
  font-size:.7rem;color:#fff;text-align:center;
}
.vd-profile-avatar-big:hover .vd-profile-avatar-big-overlay{opacity:1;}
.vd-profile-avatar-hint{font-size:.75rem;color:#334155;}
.vd-profile-field{margin-bottom:1rem;}
.vd-profile-field-label{
  display:block;font-size:.7rem;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;
  color:#475569;margin-bottom:5px;
}
.vd-profile-input{
  width:100%;padding:10px 13px;
  background:#0A0F1A;border:1.5px solid #1E293B;border-radius:10px;
  font-family:'DM Sans',sans-serif;font-size:.9rem;color:#E2E8F0;
  outline:none;transition:border-color .2s,box-shadow .2s;
}
.vd-profile-input::placeholder{color:#1E293B;}
.vd-profile-input:focus{border-color:#38BDF8;box-shadow:0 0 0 3px rgba(56,189,248,.1);}
.vd-modal-footer{display:flex;gap:.7rem;padding:1rem 1.3rem;border-top:1px solid #1E293B;}
.vd-modal-btn{
  flex:1;padding:10px;border-radius:10px;border:none;
  font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:600;
  cursor:pointer;transition:all .2s;
}
.vd-modal-btn.primary{background:linear-gradient(135deg,#0EA5E9,#6366F1);color:#fff;box-shadow:0 4px 16px rgba(56,189,248,.2);}
.vd-modal-btn.primary:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(56,189,248,.3);}
.vd-modal-btn.secondary{background:#1E293B;color:#94A3B8;}
.vd-modal-btn.secondary:hover{background:#263346;color:#CBD5E1;}

/* ══ SPINNER ══ */
.vd-spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:vd-spin .7s linear infinite;flex-shrink:0;}
.vd-spinner-dark{width:14px;height:14px;border:2px solid #1E293B;border-top-color:#38BDF8;border-radius:50%;animation:vd-spin .7s linear infinite;flex-shrink:0;}

/* ══ RESPONSIVE ══ */
@media(max-width:900px){
  .vd-sidebar{display:none;}
  .vd-viewer-sidebar{width:100%;}
}
@media(max-width:640px){
  .vd-wrap{padding:1.5rem 1rem 3rem;}
  .vd-stats{grid-template-columns:repeat(2,1fr);}
  .vd-viewer-body{flex-direction:column;}
  .vd-viewer-topbar{padding:.8rem 1rem;}
  .vd-navbar-search{width:160px;}
}
`;

// ─────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────
const IcoVault    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M12 9V7M12 17v-2M9 12H7M17 12h-2"/></svg>;
const IcoSearch   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoBack     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoShare    = () => <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IcoUser     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoLogout   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoStar     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoStarFill = () => <svg viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoShare2   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IcoTrash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcoDownload = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoCamera   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;

// ─────────────────────────────────────────────────────────────
// FILE CONTENT VIEWER COMPONENT
// All hooks declared at top — no hooks after any return
// PDF: authenticated fetch → blob → object URL
// ─────────────────────────────────────────────────────────────
function FilePreview({ doc }) {
  // ── ALL HOOKS FIRST — before any conditional return ──────
  const [pdfUrl,      setPdfUrl]      = useState(null);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [pdfError,    setPdfError]    = useState(false);
  const [textContent, setTextContent] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [imgError,    setImgError]    = useState(false);

  const ft      = (doc.file_type || '').toLowerCase();
  const isImg   = isImage(ft);
  const isPdf   = ft === 'pdf';
  const isText  = ['txt', 'md', 'rtf', 'csv'].includes(ft);
  const prevUrl = buildDownloadUrl(doc.id);

  // Authenticated PDF fetch → blob object URL
  useEffect(() => {
    if (!isPdf) return;
    let objectUrl = null;
    setPdfLoading(true);
    setPdfError(false);
    setPdfUrl(null);

    const token = localStorage.getItem('token');
    fetch(prevUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setPdfLoading(false);
      })
      .catch(() => {
        setPdfError(true);
        setPdfLoading(false);
      });

    // Revoke the blob URL when component unmounts or doc changes
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [prevUrl, isPdf]);

  // Text file fetch
  useEffect(() => {
    if (!isText) return;
    setLoadingText(true);
    const token = localStorage.getItem('token');
    fetch(prevUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.text())
      .then((t) => { setTextContent(t); setLoadingText(false); })
      .catch(() => { setTextContent(null); setLoadingText(false); });
  }, [prevUrl, isText]);

  // ── CONDITIONAL RENDERS (hooks already declared above) ───

  if (isImg) {
    return imgError ? (
      <div className="vd-viewer-no-preview">
        <span className="ico">🖼️</span>
        <div className="vd-viewer-no-preview-type" style={{ color: typeColor(ft) }}>Image</div>
        <div className="vd-viewer-no-preview-hint">
          Could not load image preview.<br />Try downloading the file.
        </div>
      </div>
    ) : (
      <img
        src={prevUrl}
        alt={doc.original_name}
        className="vd-viewer-img"
        onError={() => setImgError(true)}
      />
    );
  }

  if (isPdf) {
    if (pdfLoading) {
      return (
        <div className="vd-viewer-loading">
          <div className="vd-spinner-dark" style={{ width: 24, height: 24, borderWidth: 3 }} />
          <span>Loading PDF…</span>
        </div>
      );
    }
    if (pdfError) {
      return (
        <div className="vd-viewer-no-preview">
          <span className="ico">📕</span>
          <div className="vd-viewer-no-preview-type" style={{ color: typeColor(ft) }}>PDF</div>
          <div className="vd-viewer-no-preview-hint">
            Could not load PDF preview.<br />
            Use the <strong style={{ color: '#38BDF8' }}>Download</strong> button to open it.
          </div>
        </div>
      );
    }
    return pdfUrl ? (
      <iframe
        src={pdfUrl}
        className="vd-viewer-pdf"
        title={doc.original_name}
        allow="fullscreen"
      />
    ) : (
      <div className="vd-viewer-loading">
        <div className="vd-spinner-dark" style={{ width: 24, height: 24, borderWidth: 3 }} />
        <span>Loading PDF…</span>
      </div>
    );
  }

  if (isText) {
    if (loadingText) {
      return (
        <div className="vd-viewer-loading">
          <div className="vd-spinner-dark" style={{ width: 24, height: 24, borderWidth: 3 }} />
          <span>Loading file…</span>
        </div>
      );
    }
    if (textContent !== null) {
      return <pre className="vd-viewer-text-content">{textContent}</pre>;
    }
  }

  // Unsupported — show fallback with download nudge
  return (
    <div className="vd-viewer-no-preview">
      <span className="ico">📄</span>
      <div className="vd-viewer-no-preview-type" style={{ color: typeColor(ft) }}>{typeLabel(ft)} File</div>
      <div className="vd-viewer-no-preview-hint">
        In-browser preview not available for this file type.<br />
        Use the <strong style={{ color: '#38BDF8' }}>Download</strong> button to open it on your device.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
function Dashboard() {
  const { user, logout } = useAuth();

  const [documents,     setDocuments]     = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);

  // Upload
  const [pendingFile,   setPendingFile]   = useState(null);
  const [docName,       setDocName]       = useState('');
  const [nameErr,       setNameErr]       = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadPct,     setUploadPct]     = useState(0);

  // Navigation
  const [sidebarActive, setSidebarActive] = useState('upload');
  const [viewerDoc,     setViewerDoc]     = useState(null);

  // Search overlay
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout   = useRef(null);

  const [avatarOpen,    setAvatarOpen]    = useState(false);
  const avatarRef       = useRef(null);

  // Profile edit modal
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [profileName,   setProfileName]   = useState(user?.username || '');
  const [profilePhone,  setProfilePhone]  = useState('');
  const [profileImg,    setProfileImg]    = useState(null);
  const profileImgRef   = useRef(null);

  // Bin (local soft-delete simulation)
  const [binItems,      setBinItems]      = useState([]);

  // Favourites (local)
  const [favourites,    setFavourites]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('vd-favs') || '[]'); } catch { return []; }
  });

  const [deletingId,    setDeletingId]    = useState(null);

  // ── Keyboard shortcut for search ────────────────────────
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(v => !v); }
      if (e.key === 'Escape') { setSearchOpen(false); setAvatarOpen(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Sync favs to localStorage ───────────────────────────
  useEffect(() => {
    localStorage.setItem('vd-favs', JSON.stringify(favourites));
  }, [favourites]);

  // ── Fetch ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [docsRes, statsRes] = await Promise.all([
        documentsAPI.getAll(),
        documentsAPI.getStats(),
      ]);
      setDocuments(docsRes.data.documents);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load documents'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Search ───────────────────────────────────────────────
  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults(null); setSearchLoading(false); return; }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await documentsAPI.search(q.trim());
        setSearchResults(res.data.documents);
      } catch { toast.error('Search failed'); }
      finally  { setSearchLoading(false); }
    }, 400);
  };

  // ── Dropzone ─────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    if (!accepted.length) return;
    const file = accepted[0];
    if (file.size > 16 * 1024 * 1024) { toast.error('File too large — max 16 MB'); return; }
    const ext      = file.name.split('.').pop().toLowerCase();
    const detected = ext || detectTypeFromMime(file.type);
    setPendingFile({ file, detectedType: detected });
    setDocName(file.name.replace(/\.[^/.]+$/, ''));
    setNameErr(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, maxFiles:1, disabled: uploading || !!pendingFile,
    accept: {
      'application/pdf':['.pdf'],
      'application/msword':['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx'],
      'application/vnd.ms-excel':['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'],
      'text/plain':['.txt'],'text/csv':['.csv'],
      'image/png':['.png'],'image/jpeg':['.jpg','.jpeg'],
      'image/gif':['.gif'],'image/webp':['.webp'],
    },
  });

  // ── Upload ───────────────────────────────────────────────
  const handleUpload = async () => {
    if (!docName.trim()) { setNameErr(true); return; }
    setUploading(true); setUploadPct(0);
    const iv = setInterval(() => {
      setUploadPct(p => { if (p >= 85) { clearInterval(iv); return p; } return p + Math.random() * 14; });
    }, 200);
    try {
      await documentsAPI.upload(pendingFile.file, docName.trim());
      clearInterval(iv); setUploadPct(100);
      toast.success(`"${docName.trim()}" uploaded to your vault! 🔐`);
      setPendingFile(null); setDocName('');
      await fetchData();
      setTimeout(() => { setUploadPct(0); setUploading(false); }, 700);
    } catch (err) {
      clearInterval(iv); setUploading(false); setUploadPct(0);
      toast.error(err.response?.data?.error || 'Upload failed');
    }
  };

  // ── Soft delete → bin ────────────────────────────────────
  const handleSoftDelete = (doc) => {
    setBinItems(prev => [...prev, { ...doc, deletedAt: new Date().toISOString() }]);
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
    if (viewerDoc?.id === doc.id) setViewerDoc(null);
    toast.success(`"${doc.original_name}" moved to Bin`);
  };

  // ── Restore from bin ─────────────────────────────────────
  const handleRestore = (doc) => {
    setBinItems(prev => prev.filter(d => d.id !== doc.id));
    setDocuments(prev => [...prev, doc]);
    toast.success(`"${doc.original_name}" restored`);
  };

  // ── Permanent delete from bin ────────────────────────────
  const handlePurge = async (doc) => {
    if (!window.confirm(`Permanently delete "${doc.original_name}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await documentsAPI.delete(doc.id);
      setBinItems(prev => prev.filter(d => d.id !== doc.id));
      toast.success(`"${doc.original_name}" permanently deleted`);
    } catch { toast.error('Delete failed'); }
    finally { setDeletingId(null); }
  };

  // ── Download ─────────────────────────────────────────────
  const handleDownload = async (doc) => {
    try {
      await documentsAPI.download(doc.id, doc.original_name);
      toast.success(`Downloading "${doc.original_name}"`);
    } catch { toast.error('Download failed'); }
  };

  // ── Share ────────────────────────────────────────────────
  const handleShare = (doc) => {
    const url = buildDownloadUrl(doc.id);
    if (navigator.clipboard) { navigator.clipboard.writeText(url); toast.success('Share link copied! 🔗'); }
    else window.open(url, '_blank');
  };

  // ── Favourite ────────────────────────────────────────────
  const toggleFav = (docId) => {
    setFavourites(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // ── Profile save ─────────────────────────────────────────
  const handleProfileSave = () => {
    toast.success('Profile updated successfully!');
    setProfileOpen(false);
  };

  const handleProfileImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfileImg(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Derived data ─────────────────────────────────────────
  const imageDocs  = useMemo(() => documents.filter(d => isImage(d.file_type)), [documents]);
  const recentDocs = useMemo(() => [...documents].sort((a,b) => new Date(b.uploaded_at)-new Date(a.uploaded_at)).slice(0,8), [documents]);
  const favDocs    = useMemo(() => documents.filter(d => favourites.includes(d.id)), [documents, favourites]);
  const sharedDocs = useMemo(() => documents.slice(0, Math.min(4, documents.length)), [documents]);

  const folderCounts = useMemo(() => {
    const c = {};
    FOLDER_DEFS.forEach(f => { c[f.id] = 0; });
    documents.forEach(d => { const fid = getFolderForType(d.file_type); c[fid] = (c[fid]||0)+1; });
    return c;
  }, [documents]);

  const initials = (profileName || user?.username || 'U').slice(0,2).toUpperCase();

  // ── Which docs to show in main area ──────────────────────
  const currentFolder = FOLDER_DEFS.find(f => f.id === sidebarActive);
  let mainDocs = [];
  let mainTitle = '';
  if (currentFolder) {
    mainDocs  = documents.filter(d => getFolderForType(d.file_type) === sidebarActive);
    mainTitle = currentFolder.label;
  } else if (sidebarActive === 'recent')     { mainDocs = recentDocs;  mainTitle = 'Recent Files'; }
  else if (sidebarActive === 'favourites')   { mainDocs = favDocs;     mainTitle = 'Favourites'; }
  else if (sidebarActive === 'shared')       { mainDocs = sharedDocs;  mainTitle = 'Shared Files'; }

  // ─────────────────────────────────────────────────────────
  // ── PAGE 2 — FILE VIEWER ─────────────────────────────────
  // ─────────────────────────────────────────────────────────
  if (viewerDoc) {
    const doc   = viewerDoc;
    const tc    = typeColor(doc.file_type);
    const isFav = favourites.includes(doc.id);
    const date  = (() => { try { return format(new Date(doc.uploaded_at), 'MMM d, yyyy · h:mm a'); } catch { return ''; } })();

    return (
      <>
        <style>{STYLES}</style>
        <div className="vd-app">
          <NavbarShell
            user={user} profileImg={profileImg} initials={initials}
            avatarOpen={avatarOpen} setAvatarOpen={setAvatarOpen} avatarRef={avatarRef}
            onSearch={() => setSearchOpen(true)}
            onEditProfile={() => { setAvatarOpen(false); setProfileOpen(true); }}
            onLogout={() => { setAvatarOpen(false); logout?.(); }}
          />

          <div className="vd-viewer">
            <div className="vd-viewer-topbar">
              <button className="vd-viewer-back" onClick={() => setViewerDoc(null)}>
                <IcoBack /> Back
              </button>
              <div className="vd-viewer-title">{doc.original_name}</div>
              <div className="vd-viewer-actions">
                <button className={`vd-viewer-btn fav${isFav?' active':''}`} onClick={() => toggleFav(doc.id)}>
                  {isFav ? <IcoStarFill /> : <IcoStar />} {isFav ? 'Saved' : 'Favourite'}
                </button>
                <button className="vd-viewer-btn" onClick={() => handleShare(doc)}>
                  <IcoShare2 /> Share
                </button>
                <button className="vd-viewer-btn primary" onClick={() => handleDownload(doc)}>
                  <IcoDownload /> Download
                </button>
                <button className="vd-viewer-btn del" onClick={() => { handleSoftDelete(doc); }} disabled={deletingId===doc.id}>
                  {deletingId===doc.id ? <div className="vd-spinner" /> : <IcoTrash />}
                </button>
              </div>
            </div>

            <div className="vd-viewer-body">
              <div className="vd-viewer-preview">
                <FilePreview doc={doc} />
              </div>

              <div className="vd-viewer-sidebar">
                <div className="vd-viewer-meta-card">
                  <div className="vd-viewer-meta-title">File Details</div>
                  {[
                    ['Name',     doc.original_name],
                    ['Type',     typeLabel(doc.file_type)],
                    ['Size',     formatFileSize(doc.file_size)],
                    ['Uploaded', date],
                    doc.description ? ['Description', doc.description] : null,
                  ].filter(Boolean).map(([l,v]) => (
                    <div className="vd-viewer-meta-row" key={l}>
                      <span className="vd-viewer-meta-label">{l}</span>
                      <span className="vd-viewer-meta-value" style={l==='Type'?{color:tc}:{}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {profileOpen && (
          <ProfileModal
            initials={initials} profileImg={profileImg} profileImgRef={profileImgRef}
            profileName={profileName} setProfileName={setProfileName}
            profilePhone={profilePhone} setProfilePhone={setProfilePhone}
            handleProfileImgChange={handleProfileImgChange}
            onSave={handleProfileSave} onClose={() => setProfileOpen(false)}
          />
        )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ── PAGE 1 — MAIN DASHBOARD ──────────────────────────────
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      <div className="vd-app">
        {/* ── NAVBAR ── */}
        <NavbarShell
          user={user} profileImg={profileImg} initials={initials}
          avatarOpen={avatarOpen} setAvatarOpen={setAvatarOpen} avatarRef={avatarRef}
          onSearch={() => setSearchOpen(true)}
          onEditProfile={() => { setAvatarOpen(false); setProfileOpen(true); }}
          onLogout={() => { setAvatarOpen(false); logout?.(); }}
        />

        {/* ── LAYOUT ── */}
        <div className="vd-layout">

          {/* ── SIDEBAR ── */}
          <div className="vd-sidebar">
            <div className="vd-sidebar-section">
              <div className="vd-sidebar-section-label">Quick Access</div>

              <SidebarItem id="upload" label="Upload" emoji="☁️" active={sidebarActive==='upload'} onClick={setSidebarActive} />
              <SidebarItem id="recent" label="Recent Files" emoji="🕐" count={recentDocs.length} active={sidebarActive==='recent'} onClick={setSidebarActive} />
              <SidebarItem id="favourites" label="Favourites" emoji="⭐" count={favDocs.length} active={sidebarActive==='favourites'} onClick={setSidebarActive} />
              <SidebarItem id="shared" label="Shared" emoji="🔗" count={sharedDocs.length} active={sidebarActive==='shared'} onClick={setSidebarActive} />
            </div>

            <div className="vd-sidebar-divider" />

            <div className="vd-sidebar-section">
              <div className="vd-sidebar-section-label">Folders</div>
              {FOLDER_DEFS.map(f => (
                <SidebarItem
                  key={f.id} id={f.id}
                  label={f.label} emoji={f.emoji}
                  count={folderCounts[f.id]||0}
                  active={sidebarActive===f.id}
                  onClick={setSidebarActive}
                  dotColor={f.glow}
                />
              ))}
            </div>

            <div className="vd-sidebar-divider" />

            <div className="vd-sidebar-section">
              <SidebarItem id="bin" label="Bin" emoji="🗑" count={binItems.length} active={sidebarActive==='bin'} onClick={setSidebarActive} />
            </div>
          </div>

          {/* ── MAIN ── */}
          <div className="vd-main">
            <div className="vd-wrap">

              {/* ════ UPLOAD PAGE ════ */}
              {sidebarActive === 'upload' && (
                <>
                  <div className="vd-page-header">
                    <div>
                      <h1 className="vd-page-title">Welcome back, <em>{profileName || user?.username}</em></h1>
                      <p className="vd-page-sub">Your documents are safe, organised and always within reach.</p>
                    </div>
                  </div>

                  <div className="vd-stats">
                    <StatCard icon="📂" val={stats?.total_files??'—'} lbl="Total Files" glow="linear-gradient(90deg,#38BDF8,#6366F1)" />
                    <StatCard icon="💾" val={stats?`${stats.total_size_mb} MB`:'—'} lbl="Storage Used" glow="linear-gradient(90deg,#10B981,#06B6D4)" />
                    <StatCard icon="🌅" val={imageDocs.length} lbl="Images" glow="linear-gradient(90deg,#F59E0B,#EF4444)" />
                    <StatCard icon="⭐" val={favDocs.length} lbl="Favourites" glow="linear-gradient(90deg,#8B5CF6,#EC4899)" />
                  </div>

                  {/* ── SLIDESHOW — always 4 random Unsplash images, never user gallery ── */}
                  <div className="vd-slideshow-wrap">
                    <div className="vd-section-label">Memory Gallery</div>
                    <div className="vd-slideshow">
                      <div className="vd-slideshow-overlay" />
                      <div className="vd-slideshow-track">
                        {SLIDESHOW_IMAGES.map((url, i) => (
                          <img
                            key={`slide-${i}`}
                            src={url}
                            alt="gallery"
                            className="vd-slideshow-img"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ))}
                      </div>
                      <div className="vd-slideshow-badge">
                        <div className="vd-slideshow-dot" />
                        Gallery
                      </div>
                    </div>
                  </div>

                  {/* Upload zone */}
                  <div className="vd-upload-wrap">
                    <div className="vd-section-label">Upload to Vault</div>
                    {!pendingFile ? (
                      <div {...getRootProps()} className={`vd-dropzone${isDragActive?' active':''}${isDragReject?' reject':''}`}>
                        <input {...getInputProps()} />
                        <span className="vd-dz-icon">{isDragReject?'🚫':isDragActive?'📂':'☁️'}</span>
                        <div className="vd-dz-title">{isDragReject?'Unsupported file type':isDragActive?'Release to analyse…':'Drop your document here'}</div>
                        <p className="vd-dz-sub">or <strong>click to browse</strong> · max 16 MB</p>
                        <div className="vd-dz-types">
                          {['PDF','DOC','DOCX','XLS','XLSX','TXT','PNG','JPG','GIF','WEBP'].map(t => {
                            const c = typeColor(t.toLowerCase());
                            return <span key={t} className="vd-type-chip" style={{color:c,borderColor:`${c}55`,background:`${c}12`}}>{t}</span>;
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="vd-file-detected">
                        <div className="vd-file-detected-top">
                          <div className="vd-file-type-badge" style={{background:`${typeColor(pendingFile.detectedType)}18`,color:typeColor(pendingFile.detectedType),border:`1px solid ${typeColor(pendingFile.detectedType)}40`}}>
                            {typeLabel(pendingFile.detectedType)}
                          </div>
                          <div className="vd-file-detected-info">
                            <div style={{fontWeight:600,color:'#CBD5E1',fontSize:'.9rem',marginBottom:'2px'}}>{typeLabel(pendingFile.detectedType)} file detected ✓</div>
                            <div className="vd-file-detected-original">{pendingFile.file.name}</div>
                            <div className="vd-file-detected-size">{formatFileSize(pendingFile.file.size)}</div>
                          </div>
                        </div>
                        <div>
                          <label className="vd-name-field-label">Document Name <span style={{color:'#EF4444'}}>*</span></label>
                          <input className={`vd-name-input${nameErr?' err':''}`} placeholder="Enter a name for this document…"
                            value={docName} onChange={e=>{setDocName(e.target.value);setNameErr(false);}} autoFocus />
                          {nameErr && <div className="vd-name-hint">⚠ Document name is required</div>}
                        </div>
                        {uploading && (
                          <div>
                            <div className="vd-progress-bar-wrap"><div className="vd-progress-bar" style={{width:`${Math.min(uploadPct,100)}%`}} /></div>
                            <div className="vd-progress-txt">{uploadPct<100?`Uploading… ${Math.round(uploadPct)}%`:'✓ Upload complete!'}</div>
                          </div>
                        )}
                        <div className="vd-upload-actions">
                          <button className="vd-upload-btn primary" onClick={handleUpload} disabled={uploading}>
                            {uploading?<><div className="vd-spinner"/>Uploading…</>:'🔐 Upload to Vault'}
                          </button>
                          <button className="vd-upload-btn secondary" onClick={()=>{setPendingFile(null);setDocName('');setNameErr(false);}} disabled={uploading}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent uploads strip */}
                  {recentDocs.length > 0 && (
                    <div style={{marginBottom:'2rem',animation:'vd-up .5s .18s both'}}>
                      <div className="vd-section-label">Recent Uploads</div>
                      <div className="vd-recent-grid">
                        {recentDocs.slice(0,6).map((doc,i) => {
                          const tc = typeColor(doc.file_type);
                          return (
                            <div key={doc.id} className="vd-recent-card" style={{animationDelay:`${i*.05}s`}} onClick={()=>setViewerDoc(doc)}>
                              <div className="vd-recent-card-icon" style={{background:`${tc}18`,color:tc}}>{typeLabel(doc.file_type)}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div className="vd-recent-card-name">{doc.original_name}</div>
                                <div className="vd-recent-card-meta">
                                  {formatFileSize(doc.file_size)} · {(()=>{try{return format(new Date(doc.uploaded_at),'MMM d');}catch{return '';}})()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Folder overview */}
                  <div>
                    <div className="vd-section-label">All Folders</div>
                    {loading ? (
                      <div className="vd-folders-grid">{FOLDER_DEFS.map((_,i)=><div key={i} className="vd-skeleton-card" style={{height:140,animationDelay:`${i*.07}s`}}/>)}</div>
                    ) : (
                      <div className="vd-folders-grid">
                        {FOLDER_DEFS.map((folder,i) => {
                          const count = folderCounts[folder.id]||0;
                          const pct   = Math.min((count/Math.max(documents.length,1))*100,100);
                          return (
                            <div key={folder.id} className="vd-folder"
                              style={{'--grad':folder.gradient,'--glow-col':folder.glow+'55',animationDelay:`${i*.07}s`}}
                              onClick={()=>setSidebarActive(folder.id)}>
                              <div className="vd-folder-top">
                                <div className="vd-folder-emoji">{folder.emoji}</div>
                                <div className="vd-folder-count">{count}</div>
                              </div>
                              <div className="vd-folder-label">{folder.label}</div>
                              <div className="vd-folder-desc">{folder.desc}</div>
                              <div className="vd-folder-bar"><div className="vd-folder-bar-fill" style={{width:`${pct}%`}}/></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ════ BIN PAGE ════ */}
              {sidebarActive === 'bin' && (
                <>
                  <div className="vd-page-header">
                    <div>
                      <h1 className="vd-page-title">Bin</h1>
                      <p className="vd-page-sub">Files here are soft-deleted. Restore or purge permanently.</p>
                    </div>
                    {binItems.length > 0 && (
                      <button className="vd-upload-btn secondary" style={{flex:'none',width:'auto',padding:'8px 16px'}}
                        onClick={()=>{if(window.confirm('Permanently delete ALL bin items?')){binItems.forEach(d=>documentsAPI.delete(d.id).catch(()=>{}));setBinItems([]);toast.success('Bin emptied');}}}
                      >🗑 Empty Bin</button>
                    )}
                  </div>
                  {binItems.length === 0 ? (
                    <div className="vd-bin-empty">
                      <div style={{fontSize:'3rem',marginBottom:'.8rem'}}>🗑</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:'1rem',color:'#334155',marginBottom:'.3rem'}}>Bin is empty</div>
                      <div style={{fontSize:'.8rem'}}>Deleted files will appear here</div>
                    </div>
                  ) : binItems.map((doc,i) => {
                    const tc = typeColor(doc.file_type);
                    return (
                      <div key={doc.id} className="vd-bin-item" style={{animationDelay:`${i*.05}s`}}>
                        <div style={{width:38,height:38,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:`${tc}18`,color:tc,fontSize:'.72rem',fontWeight:800,flexShrink:0}}>{typeLabel(doc.file_type)}</div>
                        <div className="vd-bin-item-info">
                          <div className="vd-bin-item-name">{doc.original_name}</div>
                          <div className="vd-bin-item-meta">{formatFileSize(doc.file_size)} · Deleted {(()=>{try{return format(new Date(doc.deletedAt),'MMM d, yyyy');}catch{return '';}})()}</div>
                        </div>
                        <button className="vd-bin-btn restore" onClick={()=>handleRestore(doc)}>↩ Restore</button>
                        <button className="vd-bin-btn purge" onClick={()=>handlePurge(doc)} disabled={deletingId===doc.id}>
                          {deletingId===doc.id ? <div className="vd-spinner-dark"/> : '✕ Delete'}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {/* ════ FOLDER / RECENT / FAV / SHARED PAGES ════ */}
              {(currentFolder || ['recent','favourites','shared'].includes(sidebarActive)) && (
                <>
                  <div className="vd-page-header">
                    <div>
                      <h1 className="vd-page-title">
                        {currentFolder ? currentFolder.emoji + ' ' : ''}{mainTitle}
                      </h1>
                      <p className="vd-page-sub">{mainDocs.length} file{mainDocs.length!==1?'s':''}</p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="vd-docs-grid">{[1,2,3,4].map(i=><div key={i} className="vd-skeleton-card" style={{height:160,animationDelay:`${i*.07}s`}}/>)}</div>
                  ) : mainDocs.length === 0 ? (
                    <div className="vd-docs-grid">
                      <div className="vd-empty">
                        <span className="vd-empty-ico">📭</span>
                        <div className="vd-empty-title">No files here yet</div>
                        <div className="vd-empty-sub">Upload a file and it'll appear here automatically</div>
                      </div>
                    </div>
                  ) : (
                    <div className="vd-docs-grid">
                      {mainDocs.map((doc,idx) => (
                        <DocCard key={doc.id} doc={doc} idx={idx}
                          isFav={favourites.includes(doc.id)}
                          deletingId={deletingId}
                          onPreview={()=>setViewerDoc(doc)}
                          onFav={()=>toggleFav(doc.id)}
                          onDownload={()=>handleDownload(doc)}
                          onShare={()=>handleShare(doc)}
                          onDelete={()=>handleSoftDelete(doc)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH OVERLAY ── */}
      {searchOpen && (
        <div className="vd-search-overlay" onClick={e=>{if(e.target===e.currentTarget){setSearchOpen(false);setSearchQuery('');setSearchResults(null);}}}>
          <div className="vd-search-modal">
            <div className="vd-search-modal-input-wrap">
              <IcoSearch />
              <input className="vd-search-modal-input" placeholder="Search documents by name or type…"
                autoFocus value={searchQuery}
                onChange={e=>handleSearch(e.target.value)} />
              <span className="vd-search-modal-esc" onClick={()=>{setSearchOpen(false);setSearchQuery('');setSearchResults(null);}}>ESC</span>
            </div>
            {searchLoading && <div style={{padding:'1.2rem',display:'flex',justifyContent:'center'}}><div className="vd-spinner-dark"/></div>}
            {!searchLoading && searchResults && searchResults.length === 0 && (
              <div className="vd-search-empty">No results for "{searchQuery}"</div>
            )}
            {!searchLoading && searchResults && searchResults.length > 0 && (
              searchResults.slice(0,8).map(doc => {
                const tc = typeColor(doc.file_type);
                return (
                  <div key={doc.id} className="vd-search-result-item" onClick={()=>{setViewerDoc(doc);setSearchOpen(false);setSearchQuery('');setSearchResults(null);}}>
                    <div className="vd-search-result-icon" style={{background:`${tc}18`,color:tc}}>{typeLabel(doc.file_type)}</div>
                    <div>
                      <div className="vd-search-result-name">{doc.original_name}</div>
                      <div className="vd-search-result-meta">{formatFileSize(doc.file_size)} · {doc.file_type?.toUpperCase()}</div>
                    </div>
                  </div>
                );
              })
            )}
            {!searchLoading && !searchResults && (
              <div className="vd-search-empty">Start typing to search your vault…</div>
            )}
          </div>
        </div>
      )}

      {/* ── PROFILE EDIT MODAL ── */}
      {profileOpen && (
        <ProfileModal
          initials={initials} profileImg={profileImg} profileImgRef={profileImgRef}
          profileName={profileName} setProfileName={setProfileName}
          profilePhone={profilePhone} setProfilePhone={setProfilePhone}
          handleProfileImgChange={handleProfileImgChange}
          onSave={handleProfileSave} onClose={()=>setProfileOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// NAVBAR SHELL
// ─────────────────────────────────────────────────────────────
function NavbarShell({ user, profileImg, initials, avatarOpen, setAvatarOpen, avatarRef, onSearch, onEditProfile, onLogout }) {
  return (
    <nav className="vd-navbar">
      <div className="vd-navbar-brand">
        <div className="vd-navbar-brand-icon"><IcoVault /></div>
        <span className="vd-navbar-brand-name">Vault DMS</span>
      </div>

      <div className="vd-navbar-right">
        <div className="vd-navbar-search" onClick={onSearch}>
          <IcoSearch />
          <span className="vd-navbar-search-text">Search documents…</span>
          <span className="vd-navbar-search-kbd">Ctrl K</span>
        </div>

        <div className="vd-avatar-wrap" ref={avatarRef}>
          <div className="vd-avatar" onClick={() => setAvatarOpen(v => !v)}>
            {profileImg ? <img src={profileImg} alt="avatar" /> : initials}
          </div>

          {avatarOpen && (
            <div className="vd-avatar-dropdown" onClick={e => e.stopPropagation()}>
              <div className="vd-avatar-dropdown-header">
                <div className="vd-avatar-dropdown-user">{user?.username}</div>
                <div className="vd-avatar-dropdown-email">{user?.email}</div>
              </div>
              <div className="vd-dropdown-item" onClick={onEditProfile}>
                <IcoUser /> Edit Profile
              </div>
              <div className="vd-dropdown-item danger" onClick={onLogout}>
                <IcoLogout /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR ITEM
// ─────────────────────────────────────────────────────────────
function SidebarItem({ id, label, emoji, count, active, onClick, dotColor }) {
  return (
    <div className={`vd-sidebar-item${active?' active':''}`} onClick={()=>onClick(id)}>
      <div className="vd-sidebar-item-icon">{emoji}</div>
      <span style={{flex:1}}>{label}</span>
      {count != null && count > 0 && <span className="vd-sidebar-item-count">{count}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ icon, val, lbl, glow }) {
  return (
    <div className="vd-stat" style={{'--glow':glow}}>
      <div className="vd-stat-icon">{icon}</div>
      <div className="vd-stat-val" style={{background:glow,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>{val}</div>
      <div className="vd-stat-lbl">{lbl}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DOC CARD
// ─────────────────────────────────────────────────────────────
function DocCard({ doc, idx, isFav, deletingId, onPreview, onFav, onDownload, onShare, onDelete }) {
  const tc       = typeColor(doc.file_type);
  const imgFlag  = isImage(doc.file_type);
  const isDeleting = deletingId === doc.id;
  const date     = (() => { try { return format(new Date(doc.uploaded_at), 'MMM d, yyyy'); } catch { return ''; } })();

  return (
    <div className="vd-doc-card" style={{animationDelay:`${idx*.05}s`}}>
      {imgFlag && (
        <img src={buildDownloadUrl(doc.id)} alt={doc.original_name}
          className="vd-doc-thumb" onClick={onPreview}
          onError={e=>{e.target.style.display='none';}} />
      )}
      <div className="vd-doc-top">
        <div className="vd-doc-icon-box" style={{background:`${tc}18`,color:tc}} onClick={onPreview}>
          {typeLabel(doc.file_type)}
        </div>
        <div className="vd-doc-info">
          <div className="vd-doc-name" title={doc.original_name} onClick={onPreview}>{doc.original_name}</div>
          <div className="vd-doc-badges">
            <span className="vd-doc-type-chip" style={{color:tc,borderColor:`${tc}50`,background:`${tc}10`}}>{typeLabel(doc.file_type)}</span>
            <span className="vd-doc-size">{formatFileSize(doc.file_size)}</span>
          </div>
          <div className="vd-doc-date">{date}</div>
        </div>
      </div>
      <div className="vd-doc-actions">
        <button className="vd-doc-btn prev" onClick={onPreview}>👁</button>
        <button className={`vd-doc-btn fav${isFav?' active':''}`} onClick={onFav}>{isFav?'⭐':'☆'}</button>
        <button className="vd-doc-btn dl" onClick={onDownload}>⬇</button>
        <button className="vd-doc-btn shr" onClick={onShare}><IcoShare /></button>
        <button className="vd-doc-btn del" onClick={onDelete} disabled={isDeleting}>
          {isDeleting ? <div className="vd-spinner-dark"/> : '🗑'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE MODAL
// ─────────────────────────────────────────────────────────────
function ProfileModal({ initials, profileImg, profileImgRef, profileName, setProfileName, profilePhone, setProfilePhone, handleProfileImgChange, onSave, onClose }) {
  return (
    <div className="vd-modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="vd-modal">
        <div className="vd-modal-hdr">
          <div className="vd-modal-title">Edit Profile</div>
          <button className="vd-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="vd-modal-body">
          <div className="vd-profile-avatar-row">
            <div className="vd-profile-avatar-big" onClick={()=>profileImgRef.current?.click()}>
              {profileImg ? <img src={profileImg} alt="avatar"/> : initials}
              <div className="vd-profile-avatar-big-overlay"><IcoCamera /><span style={{fontSize:'.65rem',marginTop:4}}>Change</span></div>
            </div>
            <input type="file" accept="image/*" ref={profileImgRef} style={{display:'none'}} onChange={handleProfileImgChange} />
            <div className="vd-profile-avatar-hint">Click avatar to upload<br/>a profile photo</div>
          </div>
          <div className="vd-profile-field">
            <label className="vd-profile-field-label">Display Name</label>
            <input className="vd-profile-input" placeholder="Your name" value={profileName} onChange={e=>setProfileName(e.target.value)} />
          </div>
          <div className="vd-profile-field">
            <label className="vd-profile-field-label">Phone Number</label>
            <input className="vd-profile-input" placeholder="+91 98765 43210" value={profilePhone} onChange={e=>setProfilePhone(e.target.value)} type="tel" />
          </div>
        </div>
        <div className="vd-modal-footer">
          <button className="vd-modal-btn secondary" onClick={onClose}>Cancel</button>
          <button className="vd-modal-btn primary" onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
