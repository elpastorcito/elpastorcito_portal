// ============================================
// ESTILOS DINÁMICOS
// ============================================
export function buildStyles(cfg) {
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
    }

    .stat-label {
      font-size: 0.75rem;
      opacity: 0.9;
      margin-top: 4px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .data-table th {
      text-align: left;
      padding: 12px 8px;
      border-bottom: 2px solid ${ash};
      color: ${ash};
      font-weight: 700;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .data-table td {
      padding: 12px 8px;
      border-bottom: 1px solid ${light};
    }

    .search-box {
      padding: 12px 16px;
      border: 2px solid ${light};
      border-radius: 14px;
      font-size: 0.95rem;
      font-family: 'Nunito', sans-serif;
      background: white;
      transition: border-color 0.2s;
    }

    .search-box:focus {
      outline: none;
      border-color: ${p};
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: ${ash};
      font-size: 0.95rem;
    }

    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${ash};
      color: ${cream};
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 2000;
      animation: slideUp 0.3s ease;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
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
      padding: 32px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    .login-emoji {
      font-size: 60px;
      text-align: center;
      margin-bottom: 16px;
    }

    .login-title {
      font-family: 'Lobster', cursive;
      font-size: 1.6rem;
      text-align: center;
      margin-bottom: 24px;
      color: ${p};
    }

    .login-hint {
      text-align: center;
      font-size: 0.8rem;
      color: ${ash};
      margin-top: 16px;
      line-height: 1.5;
    }

    /* Menu item form */
    .menu-form-grid {
      display: grid;
      gap: 16px;
    }

    .image-upload-container {
      border: 2px dashed ${light};
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s;
      background: white;
    }

    .image-upload-container:hover {
      border-color: ${p};
    }

    .image-preview {
      max-width: 100%;
      max-height: 200px;
      border-radius: 12px;
      margin-top: 12px;
      object-fit: cover;
    }

    .color-picker-row {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .color-picker-input {
      width: 60px;
      height: 40px;
      border: 2px solid ${light};
      border-radius: 12px;
      cursor: pointer;
      background: none;
      padding: 0;
    }

    /* Redes sociales */
    .social-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 14px;
      margin-bottom: 12px;
    }

    .social-drag-handle {
      cursor: grab;
      font-size: 1.2rem;
      opacity: 0.5;
    }

    .social-input {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid ${light};
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: 'Nunito', sans-serif;
    }

    .social-input:focus {
      outline: none;
      border-color: ${p};
    }

    .toggle-switch {
      width: 50px;
      height: 28px;
      background: ${ash};
      border-radius: 14px;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-switch.active {
      background: ${p};
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch.active::after {
      transform: translateX(22px);
    }
  `
}
