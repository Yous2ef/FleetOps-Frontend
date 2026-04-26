// ════════════════════════════════════════════════════════════════════════
// src/main.js — FleetOps Customer Portal · Application Entry Point
//
// BOOT SEQUENCE (order matters):
//   1. seedIfEmpty()            — populate localStorage if first visit
//   2. NotificationService.boot() — hydrate notifications from storage
//   3. initRouter()             — render the initial route
//   4. Listen for route changes — update bottom nav
// ════════════════════════════════════════════════════════════════════════

import { initRouter }         from './router/router.js';
import { NotificationService } from './utils/notifications.js';
import { seedIfEmpty }         from './utils/seeder.js';

// ── Bottom Nav Allowlist ─────────────────────────────────────────────────

const SHOW_NAV_ROUTES = new Set([
  '/order-confirmed',
  '/arriving-alerts',
  '/delivered',
  '/link-expired',
]);

// ── Bottom Nav Controller ────────────────────────────────────────────────

function updateBottomNav(path) {
  const bottomNav = document.getElementById('bottom-nav');
  if (!bottomNav) return;

  const navItems = bottomNav.querySelectorAll('.nav-item');

  if (SHOW_NAV_ROUTES.has(path)) {
    bottomNav.classList.remove('hidden');
    navItems.forEach((item) => {
      const isActive = item.getAttribute('href') === path;
      item.classList.toggle('active', isActive);
    });
  } else {
    bottomNav.classList.add('hidden');
    navItems.forEach((item) => item.classList.remove('active'));
  }
}

// ── App Initialisation ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

  // 1. Seed initial data into localStorage on first visit.
  //    This must complete before the router renders any view, otherwise
  //    views that await StorageService.get() may find empty keys.
  await seedIfEmpty();

  // 2. Boot the notification service.
  //    boot() is now async — it hydrates from storage before wiring DOM.
  await NotificationService.boot();

  // 3. Boot the router. Renders the initial route immediately.
  initRouter({ outletId: 'app-content' });

  // 4. Keep the bottom nav in sync with every route change.
  window.addEventListener('route:changed', (e) => {
    updateBottomNav(e.detail.path);
  });

});
