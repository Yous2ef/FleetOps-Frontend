import { initRouter } from './router/router.js';

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 1. Start SPA Router
  const router = initRouter({ outletId: 'app-content' });

  // 2. Live clock (topbar)
  const clockEl = document.getElementById('topbar-clock');
  if (clockEl) {
    const tick = () => {
      clockEl.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };
    tick();
    const clockInterval = setInterval(tick, 30_000);
    window.__clockInterval = clockInterval; // stash for HMR dev cleanup
  }

  // 3. Mobile sidebar toggle
  const sidebar     = document.getElementById('sidebar');
  const overlay     = document.getElementById('sidebar-overlay');
  const toggleBtn   = document.getElementById('sidebar-toggle');

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('visible');
    document.body.style.overflow = '';
  }

  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  overlay?.addEventListener('click', closeSidebar);

  // Close sidebar on navigation (mobile UX)
  window.addEventListener('route:changed', closeSidebar);

  // 4. Update topbar page title on route changes
  const pageTitleEl = document.getElementById('topbar-page-title');
  window.addEventListener('route:changed', (e) => {
    if (pageTitleEl && e.detail?.title) {
      pageTitleEl.textContent = e.detail.title;
    }
  });
});