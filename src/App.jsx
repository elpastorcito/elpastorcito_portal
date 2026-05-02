import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, adminApi } from './supabase.js'

// ============================================
// UTILIDADES
// ============================================
const fmtPrice = (n) => `$${Number(n).toLocaleString("es-AR")}`

const fmtDate = (d) => new Date(d).toLocaleDateString("es-AR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit"
})

const fmtDateShort = (d) => new Date(d).toLocaleDateString("es-AR", {
  day: "2-digit", month: "2-digit"
})

const genSlug = () => Math.random().toString(36).slice(2, 10)

const getFirstName = (name) => name.trim().split(' ')[0]

function exportCSV(clients) {
  const header = "Nombre,Teléfono,Email,Fecha de registro"
  const rows = clients.map(c => 
    `"${c.name}","${c.phone}","${c.email || ''}","${fmtDate(c.created_at)}"`
  )
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `clientes_pastorcito_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================
// ESTILOS DINÁMICOS
// ============================================
function buildStyles(cfg) {
  const p = cfg.color_primary || "#E85D04"
  const s = cfg.color_secondary || "#FAA307"
  const smoke = "#2D1B0E"
  const ash = "#4A2E1A"
  const cream = "#FFF8F0"
  const light = "#FDEBD0"

  return `
    :root {
      --p: ${p};
      --s: ${s};
      --smoke: ${smoke};
      --ash: ${ash};
      --cream: ${cream};
      --light: ${light};
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Nunito', sans-serif;
      background: ${smoke};
      color: ${cream};
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Animaciones */
    @keyframes flicker {
      0%, 100% { opacity: 1; transform: scaleY(1); }
      50% { opacity: 0.7; transform: scaleY(0.9); }
      25% { opacity: 0.9; transform: scaleY(1.1); }
      75% { opacity: 0.6; transform: scaleY(0.95); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.5); }
      70% { transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .anim-slide-up {
      animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .anim-pop-in {
      animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .anim-bounce {
      animation: bounce 1s ease infinite;
    }

    /* Layout */
    .app-container {
      min-height: 100vh;
      width: 100%;
    }

    /* Portal */
    .portal-bg {
      background: linear-gradient(180deg, ${smoke} 0%, ${ash} 100%);
      min-height: 100vh;
      position: relative;
    }

    .flames-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 120px;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }

    .flame {
      width: 8px;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      background: linear-gradient(to top, ${p}, ${s}, #FFD700);
      opacity: 0.8;
      animation: flicker var(--dur, 2s) ease-in-out infinite;
      animation-delay: var(--del, 0s);
    }

    .portal-content {
      position: relative;
      z-index: 2;
      padding: 140px 20px 40px;
      max-width: 480px;
      margin: 0 auto;
    }

    .logo-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(140deg, ${p}, ${s});
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 50px;
      margin: 0 auto 20px;
      box-shadow: 0 8px 32px rgba(232, 93, 4, 0.4);
      overflow: hidden;
    }

    .logo-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .business-name {
      font-family: 'Lobster', cursive;
      font-size: 2.2rem;
      text-align: center;
      background: linear-gradient(140deg, ${p}, ${s});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }

    .slogan {
      text-align: center;
      color: ${light};
      font-size: 0.95rem;
      margin-bottom: 24px;
      opacity: 0.9;
    }

    .wifi-badge {
      background: linear-gradient(140deg, ${p}, ${s});
      color: white;
      padding: 12px 20px;
      border-radius: 50px;
      text-align: center;
      font-weight: 700;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(232, 93, 4, 0.3);
      font-size: 0.95rem;
    }

    .card {
      background: ${cream};
      color: ${smoke};
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 6px;
      color: ${ash};
    }

    .form-input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid ${light};
      border-radius: 16px;
      font-size: 1rem;
      font-family: 'Nunito', sans-serif;
      transition: border-color 0.2s;
      background: white;
    }

    .form-input:focus {
      outline: none;
      border-color: ${p};
    }

    .form-input.error {
      border-color: #e74c3c;
    }

    .error-text {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 4px;
      font-weight: 600;
    }

    .checkbox-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 16px 0;
    }

    .checkbox-row input {
      width: 20px;
      height: 20px;
      accent-color: ${p};
      margin-top: 2px;
    }

    .checkbox-row label {
      font-size: 0.85rem;
      color: ${ash};
      line-height: 1.4;
    }

    .checkbox-row a {
      color: ${p};
      text-decoration: underline;
      cursor: pointer;
      font-weight: 700;
    }

    .btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 16px;
      font-size: 1.1rem;
      font-weight: 800;
      font-family: 'Nunito', sans-serif;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn:active {
      transform: scale(0.98);
    }

    .btn-primary {
      background: linear-gradient(140deg, ${p}, ${s});
      color: white;
      box-shadow: 0 6px 20px rgba(232, 93, 4, 0.4);
    }

    .btn-primary:hover {
      box-shadow: 0 8px 28px rgba(232, 93, 4, 0.5);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: ${ash};
      color: ${cream};
    }

    .btn-danger {
      background: #c0392b;
      color: white;
    }

    .btn-sm {
      padding: 8px 14px;
      font-size: 0.85rem;
      width: auto;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 1000;
      animation: slideUp 0.3s ease;
    }

    .modal-content {
      background: ${cream};
      color: ${smoke};
      border-radius: 24px;
      padding: 28px;
      max-width: 420px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .modal-title {
      font-family: 'Lobster', cursive;
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: ${p};
    }

    .modal-text {
      font-size: 0.9rem;
      line-height: 1.6;
      color: ${ash};
      margin-bottom: 20px;
    }

    /* Success screen */
    .success-container {
      text-align: center;
      padding: 40px 20px;
    }

    .success-emoji {
      font-size: 80px;
      margin-bottom: 20px;
      display: inline-block;
    }

    .success-title {
      font-family: 'Lobster', cursive;
      font-size: 2rem;
      margin-bottom: 12px;
      background: linear-gradient(140deg, ${p}, ${s});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .success-desc {
      color: ${light};
      margin-bottom: 24px;
      font-size: 1rem;
    }

    .wifi-info {
      background: rgba(255,255,255,0.1);
      border: 2px dashed ${s};
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 28px;
      backdrop-filter: blur(10px);
    }

    .wifi-info-title {
      font-weight: 800;
      color: ${s};
      margin-bottom: 8px;
    }

    .menu-scroll {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding: 8px 4px 24px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }

    .menu-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .menu-scroll::-webkit-scrollbar-thumb {
      background: ${p};
      border-radius: 3px;
    }

    .menu-card {
      flex: 0 0 160px;
      background: ${cream};
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      scroll-snap-align: start;
    }

    .menu-card-img {
      width: 160px;
      height: 120px;
      object-fit: cover;
      background: ${light};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }

    .menu-card-body {
      padding: 12px;
    }

    .menu-card-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: ${smoke};
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-card-price {
      font-weight: 900;
      color: ${p};
      font-size: 1.1rem;
    }

    .socials-row {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 20px;
    }

    .social-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 50px;
      color: white;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      transition: transform 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .social-btn:hover {
      transform: translateY(-2px);
    }

    /* Admin */
    .admin-bg {
      background: linear-gradient(180deg, #1a0800 0%, ${smoke} 100%);
      min-height: 100vh;
    }

    .admin-header {
      background: linear-gradient(140deg, ${p}, ${s});
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .admin-header-title {
      font-family: 'Lobster', cursive;
      font-size: 1.3rem;
      color: white;
    }

    .admin-logout {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Nunito', sans-serif;
    }

    .admin-tabs {
      display: flex;
      gap: 8px;
      padding: 16px 20px;
      overflow-x: auto;
      border-bottom: 1px solid ${ash};
      -webkit-overflow-scrolling: touch;
    }

    .admin-tab {
      flex: 0 0 auto;
      padding: 10px 18px;
      border-radius: 14px;
      border: none;
      background: ${ash};
      color: ${light};
      font-weight: 700;
      cursor: pointer;
      font-family: 'Nunito', sans-serif;
      font-size: 0.9rem;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .admin-tab.active {
      background: linear-gradient(140deg, ${p}, ${s});
      color: white;
      box-shadow: 0 4px 12px rgba(232, 93, 4, 0.3);
    }

    .admin-content {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    .admin-card {
      background: ${cream};
      color: ${smoke};
      border-radius: 24px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }

    .admin-card-title {
      font-family: 'Lobster', cursive;
      font-size: 1.3rem;
      margin-bottom: 16px;
      color: ${p};
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    @media (min-width: 500px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .stat-card {
      background: linear-gradient(140deg, ${p}, ${s});
      color: white;
      padding: 16px;
      border-radius: 20px;
      text-align: center;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 900;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.75rem;
      opacity: 0.9;
      font-weight: 600;
    }

    .search-box {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid ${light};
      border-radius: 14px;
      font-size: 1rem;
      margin-bottom: 16px;
      font-family: 'Nunito', sans-serif;
    }

    .search-box:focus {
      outline: none;
      border-color: ${p};
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .data-table th {
      text-align: left;
      padding: 10px;
      color: ${ash};
      font-weight: 700;
      border-bottom: 2px solid ${light};
    }

    .data-table td {
      padding: 10px;
      border-bottom: 1px solid ${light};
    }

    .data-table tr:hover {
      background: rgba(232, 93, 4, 0.05);
    }

    /* Chart */
    .chart-container {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 140px;
      padding: 20px 0;
      gap: 8px;
    }

    .chart-bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .chart-bar {
      width: 100%;
      max-width: 40px;
      border-radius: 8px 8px 0 0;
      background: linear-gradient(to top, ${p}, ${s});
      transition: height 0.5s ease;
      min-height: 4px;
    }

    .chart-count {
      font-weight: 800;
      color: ${p};
      font-size: 0.8rem;
    }

    .chart-date {
      font-size: 0.7rem;
      color: ${ash};
      font-weight: 600;
    }

    /* Menu grid */
    .menu-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 500px) {
      .menu-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .menu-admin-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .menu-admin-img {
      width: 100%;
      height: 160px;
      object-fit: cover;
      background: ${light};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 50px;
    }

    .menu-admin-body {
      padding: 16px;
    }

    .menu-admin-name {
      font-weight: 800;
      font-size: 1.1rem;
      margin-bottom: 4px;
    }

    .menu-admin-desc {
      font-size: 0.85rem;
      color: ${ash};
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .menu-admin-price {
      font-weight: 900;
      color: ${p};
      font-size: 1.2rem;
      margin-bottom: 12px;
    }

    .menu-admin-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge-green {
      background: #d4edda;
      color: #155724;
    }

    .badge-red {
      background: #f8d7da;
      color: #721c24;
    }

    /* Toggle switch */
    .toggle-switch {
      position: relative;
      width: 50px;
      height: 28px;
      background: #ccc;
      border-radius: 14px;
      cursor: pointer;
      transition: background 0.3s;
      flex-shrink: 0;
    }

    .toggle-switch.active {
      background: ${p};
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 22px;
      height: 22px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .toggle-switch.active::after {
      transform: translateX(22px);
    }

    /* Upload area */
    .upload-area {
      border: 3px dashed ${light};
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s;
      background: rgba(255,255,255,0.5);
    }

    .upload-area:hover {
      border-color: ${p};
    }

    .upload-preview {
      max-width: 100%;
      max-height: 200px;
      border-radius: 16px;
      margin-top: 12px;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: ${smoke};
      color: ${cream};
      padding: 14px 28px;
      border-radius: 50px;
      font-weight: 700;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 2000;
      animation: slideUp 0.3s ease;
      border: 2px solid ${p};
    }

    /* Login */
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(180deg, #1a0800 0%, ${smoke} 100%);
    }

    .login-card {
      background: ${cream};
      color: ${smoke};
      border-radius: 28px;
      padding: 40px 32px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      text-align: center;
    }

    .login-emoji {
      font-size: 60px;
      margin-bottom: 16px;
    }

    .login-title {
      font-family: 'Lobster', cursive;
      font-size: 1.8rem;
      margin-bottom: 24px;
      color: ${p};
    }

    .login-hint {
      font-size: 0.8rem;
      color: ${ash};
      margin-top: 16px;
      opacity: 0.7;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    /* Two column grid */
    .two-col {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 600px) {
      .two-col {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Color preview */
    .color-preview {
      height: 60px;
      border-radius: 16px;
      margin-top: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: ${ash};
      font-style: italic;
    }
  `
}

// ============================================
// ICONOS SVG
// ============================================
function SocialIcon({ id, size = 20 }) {
  const icons = {
    fb: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    ig: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
    tt: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    wa: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
  }
  return icons[id] || null
}

// ============================================
// HOOKS
// ============================================
function useConfig() {
  const [cfg, setCfg] = useState({
    business_name: 'El Pastorcito Parripollo',
    slogan: '🔥 Pollos a la parrilla · Empanadas · Platos',
    logo_url: '',
    color_primary: '#E85D04',
    color_secondary: '#FAA307'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    let el = document.getElementById("dynamic-styles")
    if (!el) {
      el = document.createElement("style")
      el.id = "dynamic-styles"
      document.head.appendChild(el)
    }
    el.textContent = buildStyles(cfg)
  }, [cfg])

  async function loadConfig() {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('key, value')
        .in('key', ['business_name', 'slogan', 'logo_url', 'color_primary', 'color_secondary'])

      if (error) throw error

      const newCfg = { ...cfg }
      data.forEach(row => { newCfg[row.key] = row.value })
      setCfg(newCfg)
    } catch (e) {
      // Silencioso: usa config por defecto si no hay datos
    } finally {
      setLoading(false)
    }
  }

  return { cfg, setCfg, loading }
}

function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2700)
  }, [])

  return { toast, showToast }
}

// ============================================
// COMPONENTE: LLAMAS ANIMADAS
// ============================================
function Flames() {
  const flames = Array.from({ length: 15 }, (_, i) => ({
    height: 30 + Math.random() * 60,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 1.5,
    opacity: 0.4 + Math.random() * 0.4
  }))

  return (
    <div className="flames-container">
      {flames.map((f, i) => (
        <div
          key={i}
          className="flame"
          style={{
            height: f.height,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            opacity: f.opacity
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// COMPONENTE: MODAL TÉRMINOS
// ============================================
function TermsModal({ businessName, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Términos y Condiciones</div>
        <div className="modal-text">
          <p><strong>1. Aceptación</strong></p>
          <p>Al conectarte a la red WiFi de {businessName}, aceptás estos términos y condiciones de uso.</p>
          <br/>
          <p><strong>2. Uso adecuado</strong></p>
          <p>El servicio de WiFi es gratuito para clientes del local. Está prohibido el uso indebido de la red, incluyendo actividades ilegales o que afecten el funcionamiento del servicio.</p>
          <br/>
          <p><strong>3. Datos personales</strong></p>
          <p>Los datos solicitados (nombre, teléfono, email) se utilizan únicamente para mejorar nuestro servicio y mantenerte informado sobre novedades. No compartimos tu información con terceros.</p>
          <br/>
          <p><strong>4. Limitación de responsabilidad</strong></p>
          <p>{businessName} no se responsabiliza por problemas técnicos en la conexión ni por la seguridad de los dispositivos conectados a la red.</p>
          <br/>
          <p><strong>5. Modificaciones</strong></p>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento.</p>
        </div>
        <button className="btn btn-primary" onClick={onClose}>
          Entendido ✓
        </button>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE: PORTAL (Registro)
// ============================================
function Portal({ cfg, onRegister }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', terms: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Ingresá tu nombre'
    if (!/^\d{8,15}$/.test(form.phone.replace(/\s/g, ''))) {
      errs.phone = 'Teléfono inválido (solo números, 8-15 dígitos)'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email inválido'
    }
    if (!form.terms) errs.terms = 'Debés aceptar los términos'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setLoading(true)
    try {
      const { error } = await supabase.from('clients').insert({
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        email: form.email.trim() || null,
        accepted_terms: true
      })

      if (error) throw error
      onRegister(form.name.trim())
    } catch (err) {
      setSubmitError('Error al registrarse. Intentá de nuevo.')
      // Error ya manejado en UI
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-bg">
      <Flames />
      <div className="portal-content anim-slide-up">
        <div className="logo-circle">
          {cfg.logo_url ? (
            <img src={cfg.logo_url} alt="Logo" />
          ) : (
            <span>🐓</span>
          )}
        </div>

        <h1 className="business-name">{cfg.business_name}</h1>
        <p className="slogan">{cfg.slogan}</p>

        <div className="wifi-badge">
          📶 Conectate gratis al WiFi del local
        </div>

        <div className="card">
          {submitError && (
            <div className="error-text" style={{ marginBottom: 16, textAlign: 'center' }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Tu nombre"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono *</label>
              <input
                type="tel"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="Ej: 1123456789"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
              />
              {errors.phone && <div className="error-text">{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="tu@email.com (opcional)"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
              {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            <div className="checkbox-row">
              <input
                type="checkbox"
                id="terms"
                checked={form.terms}
                onChange={e => setForm({...form, terms: e.target.checked})}
              />
              <label htmlFor="terms">
                Acepto los <a onClick={() => setShowTerms(true)}>Términos y Condiciones</a> de uso del WiFi
              </label>
            </div>
            {errors.terms && <div className="error-text" style={{ marginTop: -8, marginBottom: 12 }}>{errors.terms}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner" /> Registrando...</>
              ) : (
                <>🔥 ¡Conectarme al WiFi!</>
              )}
            </button>
          </form>
        </div>
      </div>

      {showTerms && (
        <TermsModal businessName={cfg.business_name} onClose={() => setShowTerms(false)} />
      )}
    </div>
  )
}

// ============================================
// COMPONENTE: SUCCESS SCREEN
// ============================================
function SuccessScreen({ name, cfg }) {
  const [menu, setMenu] = useState([])
  const [socials, setSocials] = useState([])
  const firstName = getFirstName(name)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [{ data: menuData }, { data: socialsData }] = await Promise.all([
        supabase.from('menu_items').select('*').eq('available', true).order('created_at', { ascending: false }),
        supabase.from('social_networks').select('*').eq('active', true).neq('url', '').order('sort_order')
      ])
      if (menuData) setMenu(menuData)
      if (socialsData) setSocials(socialsData)
    } catch (e) {
      // Error silencioso en pantalla de éxito
    }
  }

  return (
    <div className="portal-bg">
      <Flames />
      <div className="portal-content">
        <div className="success-container anim-pop-in">
          <div className="success-emoji anim-bounce">🎉</div>
          <h1 className="success-title">¡Bienvenido, {firstName}!</h1>
          <p className="success-desc">
            Ya estás conectado al WiFi de <strong>{cfg.business_name}</strong>.<br/>
            ¡Disfrutá de tu estadía!
          </p>

          <div className="wifi-info">
            <div className="wifi-info-title">📶 Conexión exitosa</div>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Podés navegar libremente por internet.
            </p>
          </div>

          {menu.length > 0 && (
            <>
              <h3 style={{ marginBottom: 12, color: 'var(--light)' }}>
                🍗 Nuestro menú
              </h3>
              <div className="menu-scroll">
                {menu.map(item => (
                  <div key={item.id} className="menu-card anim-slide-up">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="menu-card-img" />
                    ) : (
                      <div className="menu-card-img">🍗</div>
                    )}
                    <div className="menu-card-body">
                      <div className="menu-card-name">{item.name}</div>
                      <div className="menu-card-price">{fmtPrice(item.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {socials.length > 0 && (
            <div className="socials-row">
              {socials.map(s => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{ background: s.color }}
                >
                  <SocialIcon id={s.id} size={18} />
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE: ADMIN LOGIN
// ============================================
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validar email
      if (!email || !email.includes('@')) {
        setError('Ingresá un email válido')
        setLoading(false)
        return
      }

      // Validar password
      if (!password || password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        setLoading(false)
        return
      }

      const result = await adminApi.login(email, password)
      
      if (result.success) {
        onLogin(result.user, result.token)
      } else {
        setError(result.error || 'Email o contraseña incorrectos')
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu configuración.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card anim-slide-up">
        <div className="login-emoji">🔐</div>
        <h1 className="login-title">Panel de Administración</h1>

        {error && (
          <div className="error-text" style={{ marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '50px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px',
                  opacity: 0.6,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.6'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" /> Verificando...</> : 'Ingresar'}
          </button>
        </form>

        <p className="login-hint">
          ¿Olvidaste tu contraseña? Contactá al administrador para resetearla desde Supabase Auth
        </p>
      </div>
    </div>
  )
}

// ============================================
// TAB: CLIENTES
// ============================================
function ClientsTab() {
  const [clients, setClients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast, showToast } = useToast()

  useEffect(() => { loadClients() }, [])
  useEffect(() => {
    const term = search.toLowerCase().trim()
    setFiltered(clients.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    ))
  }, [search, clients])

  async function loadClients() {
    try {
      const data = await adminApi.getClients()
      setClients(data)
      setFiltered(data)
    } catch (e) {
      showToast('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const todayClients = clients.filter(c => {
    const d = new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return d === today
  })

  const stats = {
    total: clients.length,
    today: todayClients.length,
    withEmail: clients.filter(c => c.email).length,
    avgPerDay: clients.length > 0 ? (clients.length / Math.max(1, new Set(clients.map(c => c.created_at.slice(0,10))).size)).toFixed(1) : 0
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.today}</div>
          <div className="stat-label">Hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.withEmail}</div>
          <div className="stat-label">Con email</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgPerDay}</div>
          <div className="stat-label">Prom/día</div>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="search-box"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(filtered)}>
            📥 Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No se encontraron clientes</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.email || '-'}</td>
                    <td>{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================
// TAB: ESTADÍSTICAS
// ============================================
function StatsTab() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const data = await adminApi.getClients()
      setClients(data)
    } catch (e) {
      showToast('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  // Agrupar por fecha (últimos 7 días)
  const grouped = {}
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    grouped[key] = 0
  }

  clients.forEach(c => {
    const key = c.created_at.slice(0, 10)
    if (grouped.hasOwnProperty(key)) grouped[key]++
  })

  const chartData = Object.entries(grouped).map(([date, count]) => ({
    date,
    count,
    label: fmtDateShort(date)
  }))

  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const daysWithVisits = Object.values(grouped).filter(c => c > 0).length
  const maxInDay = Math.max(...Object.values(grouped))

  const stats = {
    total: clients.length,
    withEmail: clients.filter(c => c.email).length,
    daysWithVisits,
    maxInDay
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Clientes totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.withEmail}</div>
          <div className="stat-label">Con email</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.daysWithVisits}</div>
          <div className="stat-label">Días con visitas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.maxInDay}</div>
          <div className="stat-label">Máx. en un día</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">📊 Visitas últimos 7 días</div>
        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">Sin datos aún — los clientes aparecerán aquí</div>
        ) : (
          <div className="chart-container">
            {chartData.map(d => (
              <div key={d.date} className="chart-bar-wrapper">
                <div className="chart-count">{d.count}</div>
                <div 
                  className="chart-bar" 
                  style={{ height: `${(d.count / maxCount) * 90}px` }}
                />
                <div className="chart-date">{d.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// TAB: MENÚ
// ============================================
function MenuTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [uploading, setUploading] = useState(false)
  const { toast, showToast } = useToast()

  const emptyItem = {
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    available: true
  }

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    try {
      const data = await adminApi.getMenuAll()
      setItems(data)
    } catch (e) {
      showToast('Error al cargar menú')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAvailable(item) {
    try {
      await adminApi.toggleMenuItem(item.id, !item.available)
      setItems(items.map(i => i.id === item.id ? { ...i, available: !i.available } : i))
      showToast(item.available ? 'Item pausado' : 'Item activado')
    } catch (e) {
      showToast('Error al actualizar')
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`¿Estás seguro que querés eliminar "${item.name}"?\n\nEsta acción no se puede deshacer.`)) return
    try {
      await adminApi.deleteMenuItem(item.id)
      setItems(items.filter(i => i.id !== item.id))
      showToast('Item eliminado correctamente')
    } catch (e) {
      showToast('Error al eliminar el item. Intentá de nuevo.')
    }
  }

  async function handleImageUpload(e, setItem) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `menu/${genSlug()}.${ext}`
      const result = await adminApi.uploadImage(path, file)
      setItem(prev => ({ ...prev, image_url: result.url }))
      showToast('Imagen subida')
    } catch (err) {
      showToast('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  async function saveItem(item) {
    if (!item.name.trim() || !item.price) {
      showToast('Nombre y precio son obligatorios')
      return
    }
    try {
      await adminApi.saveMenuItem({
        ...item,
        price: Number(item.price)
      })
      await loadItems()
      setModalOpen(false)
      setEditingItem(null)
      showToast('Item guardado')
    } catch (e) {
      showToast('Error al guardar')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Lobster', color: 'var(--p)' }}>🍗 Menú</h2>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => { setEditingItem({ ...emptyItem }); setModalOpen(true) }}
        >
          + Agregar
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No hay items en el menú</div>
      ) : (
        <div className="menu-grid">
          {items.map(item => (
            <div key={item.id} className="menu-admin-card anim-slide-up">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="menu-admin-img" />
              ) : (
                <div className="menu-admin-img">🍗</div>
              )}
              <div className="menu-admin-body">
                <div className="menu-admin-name">{item.name}</div>
                <div className="menu-admin-desc">{item.description || 'Sin descripción'}</div>
                <div className="menu-admin-price">{fmtPrice(item.price)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className={`badge ${item.available ? 'badge-green' : 'badge-red'}`}>
                    {item.available ? 'Disponible' : 'No disponible'}
                  </span>
                  {item.category && <span className="badge" style={{ background: 'var(--light)', color: 'var(--ash)' }}>{item.category}</span>}
                </div>
                <div className="menu-admin-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditingItem({ ...item }); setModalOpen(true) }}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-sm" style={{ background: item.available ? '#f39c12' : '#27ae60', color: 'white' }} onClick={() => toggleAvailable(item)}>
                    {item.available ? '⏸ Pausar' : '▶ Activar'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item)}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => { setModalOpen(false); setEditingItem(null) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-title">{editingItem?.id ? 'Editar item' : 'Nuevo item'}</div>

            <div className="form-group">
              <div className="upload-area" onClick={() => document.getElementById('menu-img-input').click()}>
                {editingItem?.image_url ? (
                  <img src={editingItem.image_url} alt="Preview" className="upload-preview" />
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                    <div>Click para subir imagen</div>
                  </div>
                )}
              </div>
              <input 
                id="menu-img-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={e => handleImageUpload(e, setEditingItem)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input 
                className="form-input" 
                value={editingItem?.name || ''} 
                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Precio (ARS) *</label>
              <input 
                type="number" 
                className="form-input" 
                value={editingItem?.price || ''} 
                onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría</label>
              <input 
                className="form-input" 
                placeholder="Ej: Parrilla, Bebidas, Postres"
                value={editingItem?.category || ''} 
                onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea 
                className="form-input" 
                rows={3}
                value={editingItem?.description || ''} 
                onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="checkbox-row">
              <input 
                type="checkbox" 
                id="available"
                checked={editingItem?.available !== false}
                onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })}
              />
              <label htmlFor="available">Disponible actualmente</label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => { setModalOpen(false); setEditingItem(null) }}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => saveItem(editingItem)}
                disabled={uploading}
              >
                {uploading ? <><span className="spinner" /> Subiendo...</> : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================
// TAB: REDES SOCIALES
// ============================================
function SocialsTab() {
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => { loadSocials() }, [])

  async function loadSocials() {
    try {
      const data = await adminApi.getSocialsAll()
      setNetworks(data)
    } catch (e) {
      showToast('Error al cargar redes')
    } finally {
      setLoading(false)
    }
  }

  async function saveSocials() {
    setSaving(true)
    try {
      await adminApi.saveSocials(networks)
      showToast('Redes guardadas')
    } catch (e) {
      showToast('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateNetwork = (id, field, value) => {
    setNetworks(networks.map(n => n.id === id ? { ...n, [field]: value } : n))
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-title">📱 Redes Sociales</div>
        <p style={{ fontSize: '0.9rem', color: 'var(--ash)', marginBottom: 20 }}>
          Activá las redes que ya tengas. Podés cambiarlas en cualquier momento: el portal se actualiza automáticamente.
        </p>

        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {networks.map(n => (
              <div key={n.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16, 
                padding: 16, 
                background: 'white', 
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <div style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 12, 
                  background: n.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <SocialIcon id={n.id} size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>{n.name}</div>
                  <input
                    className="form-input"
                    placeholder={`URL de ${n.name}`}
                    value={n.url}
                    onChange={e => updateNetwork(n.id, 'url', e.target.value)}
                    style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                  />
                </div>
                <div 
                  className={`toggle-switch ${n.active ? 'active' : ''}`}
                  onClick={() => updateNetwork(n.id, 'active', !n.active)}
                />
              </div>
            ))}
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ marginTop: 24 }}
          onClick={saveSocials}
          disabled={saving}
        >
          {saving ? <><span className="spinner" /> Guardando...</> : '💾 Guardar cambios'}
        </button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================
// TAB: APARIENCIA
// ============================================
function AppearanceTab({ cfg, onCfgUpdated }) {
  const [form, setForm] = useState({
    business_name: cfg.business_name,
    slogan: cfg.slogan,
    logo_url: cfg.logo_url,
    color_primary: cfg.color_primary,
    color_secondary: cfg.color_secondary
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => {
    setForm({
      business_name: cfg.business_name,
      slogan: cfg.slogan,
      logo_url: cfg.logo_url,
      color_primary: cfg.color_primary,
      color_secondary: cfg.color_secondary
    })
  }, [cfg])

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `logo/logo_principal.${ext}`
      const result = await adminApi.uploadImage(path, file)
      const urlWithCache = `${result.url}?v=${Date.now()}`
      setForm({ ...form, logo_url: urlWithCache })
      showToast('Logo subido')
    } catch (err) {
      showToast('Error al subir logo')
    } finally {
      setUploading(false)
    }
  }

  async function saveAppearance() {
    setSaving(true)
    try {
      const items = [
        { key: 'business_name', value: form.business_name },
        { key: 'slogan', value: form.slogan },
        { key: 'logo_url', value: form.logo_url },
        { key: 'color_primary', value: form.color_primary },
        { key: 'color_secondary', value: form.color_secondary }
      ]
      await adminApi.saveConfig(items)
      onCfgUpdated({ ...form })
      showToast('Apariencia guardada — se actualizará en el próximo acceso')
    } catch (e) {
      showToast('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="two-col">
      <div className="admin-card">
        <div className="admin-card-title">🖼️ Logo del local</div>

        <div style={{ 
          height: 140, 
          background: 'var(--light)', 
          borderRadius: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 16,
          overflow: 'hidden'
        }}>
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 60 }}>🐓</span>
          )}
        </div>

        <div className="upload-area" onClick={() => document.getElementById('logo-input').click()}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
          <div style={{ fontWeight: 700, color: 'var(--ash)' }}>
            {uploading ? 'Subiendo...' : 'Click para cambiar logo'}
          </div>
        </div>
        <input 
          id="logo-input" 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }}
          onChange={handleLogoUpload}
        />

        {form.logo_url && (
          <button 
            className="btn btn-danger btn-sm" 
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => setForm({ ...form, logo_url: '' })}
          >
            🗑 Quitar logo (usar emoji)
          </button>
        )}
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🎨 Nombre, slogan y colores</div>

        <div className="form-group">
          <label className="form-label">Nombre del local</label>
          <input 
            className="form-input" 
            value={form.business_name}
            onChange={e => setForm({ ...form, business_name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Slogan / subtítulo</label>
          <input 
            className="form-input" 
            value={form.slogan}
            onChange={e => setForm({ ...form, slogan: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color primario</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="color" 
              value={form.color_primary}
              onChange={e => setForm({ ...form, color_primary: e.target.value })}
              style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{form.color_primary}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Color secundario</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="color" 
              value={form.color_secondary}
              onChange={e => setForm({ ...form, color_secondary: e.target.value })}
              style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{form.color_secondary}</span>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ash)', marginBottom: 4 }}>Vista previa del gradiente</div>
          <div 
            className="color-preview" 
            style={{ background: `linear-gradient(90deg, ${form.color_primary}, ${form.color_secondary})` }}
          />
        </div>

        <button 
          className="btn btn-primary" 
          style={{ marginTop: 20 }}
          onClick={saveAppearance}
          disabled={saving}
        >
          {saving ? <><span className="spinner" /> Guardando...</> : '💾 Guardar apariencia'}
        </button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================
// TAB: CONFIGURACIÓN
// ============================================
function ConfigTab() {
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  async function handleLogoutEverywhere() {
    if (!confirm('¿Estás seguro de cerrar sesión en todos los dispositivos?')) return
    
    setSaving(true)
    try {
      // Limpiar token local
      adminApi.logout()
      // En una implementación completa, aquí se invalidaría el token en el backend
      showToast('Sesión cerrada correctamente')
      window.location.reload()
    } catch (e) {
      showToast('Error al cerrar sesión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="two-col">
      <div className="admin-card">
        <div className="admin-card-title">🔐 Seguridad de la sesión</div>

        <p style={{ fontSize: '0.9rem', color: 'var(--ash)', marginBottom: 16 }}>
          Tu sesión está protegida con autenticación de Supabase. El token se guarda temporalmente en tu navegador.
        </p>

        <button 
          className="btn btn-danger" 
          onClick={handleLogoutEverywhere}
          disabled={saving}
        >
          {saving ? <><span className="spinner" /> Cerrando...</> : '🚪 Cerrar sesión'}
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">ℹ️ Información del sistema</div>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--ash)' }}>
          <p><strong>Proyecto Supabase:</strong></p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--light)', padding: 8, borderRadius: 8, marginTop: 4 }}>
            {import.meta.env.VITE_SUPABASE_URL || 'No configurado'}
          </p>
          <p style={{ marginTop: 16 }}>
            <strong>Autenticación:</strong> Supabase Auth con email/password
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8rem' }}>
            Para cambiar tu contraseña o email, andá a Supabase Dashboard → Authentication → Users
          </p>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================
// COMPONENTE: ADMIN PANEL
// ============================================
function AdminPanel({ cfg, onCfgUpdated, onLogout, user }) {
  const [activeTab, setActiveTab] = useState('clients')

  const tabs = [
    { id: 'clients', label: '👥 Clientes' },
    { id: 'stats', label: '📊 Stats' },
    { id: 'menu', label: '🍗 Menú' },
    { id: 'socials', label: '📱 Redes' },
    { id: 'appearance', label: '🎨 Apariencia' },
    { id: 'config', label: '⚙️ Config' }
  ]

  const renderTab = () => {
    switch (activeTab) {
      case 'clients': return <ClientsTab />
      case 'stats': return <StatsTab />
      case 'menu': return <MenuTab />
      case 'socials': return <SocialsTab />
      case 'appearance': return <AppearanceTab cfg={cfg} onCfgUpdated={onCfgUpdated} />
      case 'config': return <ConfigTab />
      default: return <ClientsTab />
    }
  }

  return (
    <div className="admin-bg">
      <div className="admin-header">
        <div>
          <div className="admin-header-title">{cfg.business_name}</div>
          {user && (
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 4 }}>
              👤 {user.email}
            </div>
          )}
        </div>
        <button className="admin-logout" onClick={onLogout}>
          Salir
        </button>
      </div>

      <div className="admin-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderTab()}
      </div>
    </div>
  )
}

// ============================================
// APP ROOT
// ============================================
export default function App() {
  const [view, setView] = useState('portal')
  const [registeredName, setRegisteredName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const { cfg, setCfg, loading: cfgLoading } = useConfig()

  useEffect(() => {
    // Verificar si hay token guardado al cargar
    const token = adminApi.getToken()
    if (token) {
      setAdminLoggedIn(true)
      setView('admin')
    }
    
    const adminParam = window.location.search.includes('admin')
    setIsAdmin(adminParam)
    if (adminParam && !token) {
      setView('admin-login')
    }
  }, [])

  const handleRegister = (name) => {
    setRegisteredName(name)
    setView('success')
  }

  const handleAdminLogin = (user, token) => {
    setCurrentUser(user)
    setAdminLoggedIn(true)
    setView('admin')
  }

  const handleLogout = () => {
    adminApi.logout()
    setCurrentUser(null)
    setAdminLoggedIn(false)
    setView('admin-login')
  }

  const handleCfgUpdated = (newCfg) => {
    setCfg(newCfg)
  }

  if (cfgLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--smoke)',
        color: 'var(--cream)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🐓</div>
          <div style={{ fontFamily: 'Lobster', fontSize: '1.5rem' }}>Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {view === 'portal' && <Portal cfg={cfg} onRegister={handleRegister} />}
      {view === 'success' && <SuccessScreen name={registeredName} cfg={cfg} />}
      {view === 'admin-login' && <AdminLogin onLogin={handleAdminLogin} />}
      {view === 'admin' && (
        <AdminPanel 
          cfg={cfg} 
          onCfgUpdated={handleCfgUpdated}
          onLogout={handleLogout}
          user={currentUser}
        />
      )}
    </div>
  )
}
