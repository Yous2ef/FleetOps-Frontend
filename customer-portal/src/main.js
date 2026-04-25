// ════════════════════════════════════════════════════════════════════════
// src/main.js — FleetOps Customer Portal · Application Entry Point
//
// Responsibilities:
//   1. Boot the SPA router.
//   2. Listen for 'route:changed' events (dispatched by router.js after
//      every successful render, including the initial page load).
//   3. Show / hide the bottom nav based on a strict route allowlist.
//   4. Mark the correct .nav-item as .active when the nav is visible.
//
// ⚠  Do NOT import or reference router.js directly for navigation —
//    use <a href="…" data-link> in HTML or the router's navigateTo()
//    method returned by initRouter().
// ════════════════════════════════════════════════════════════════════════

import { initRouter } from './router/router.js';
import { NotificationService } from './utils/notifications.js';

// ── Bottom Nav Allowlist ─────────────────────────────────────────────────
//
// ONLY the routes listed here will have the bottom nav visible.
// Every other route (e.g. /delivery-preferences, /delivery-failed,
// /in-transit) will have it completely hidden.
//
// This Set mirrors the four nav links defined in index.html:
//   STATUS   href="/order-confirmed"
//   TRACKING href="/arriving-alerts"
//   DETAILS  href="/delivered"
//   SUPPORT  href="/link-expired"
//
const SHOW_NAV_ROUTES = new Set([
    '/order-confirmed',
    '/arriving-alerts',
    '/delivered',
    '/link-expired',
]);

// ── Bottom Nav Controller ────────────────────────────────────────────────

/**
 * updateBottomNav(path)
 *
 * Called on every 'route:changed' event.
 * - Shows the nav only when `path` is in SHOW_NAV_ROUTES.
 * - Marks the matching .nav-item as .active; clears all others.
 * - Hides the nav (and clears active states) for every other route.
 *
 * @param {string} path  Normalised route path, e.g. '/order-confirmed'
 */
function updateBottomNav(path) {
    const bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) return;

    const navItems = bottomNav.querySelectorAll('.nav-item');

    if (SHOW_NAV_ROUTES.has(path)) {
        // ── Show the nav bar ─────────────────────────────────────────
        bottomNav.classList.remove('hidden');

        // Activate the item whose href exactly matches the current path.
        // All other items are deactivated to avoid stale highlights.
        navItems.forEach((item) => {
            const isActive = item.getAttribute('href') === path;
            item.classList.toggle('active', isActive);
        });

    } else {
        // ── Hide the nav bar (every non-allowlisted route) ───────────
        bottomNav.classList.add('hidden');

        // Clear any stale .active class so it is clean on next show.
        navItems.forEach((item) => item.classList.remove('active'));
    }
}

// ── App Initialisation ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // 1. Boot the notification service — wires bell, overlay, sidebar.
    NotificationService.boot();

    // 2. Boot the router.
    //    outletId must match <main id="app-content"> in index.html.
    //    router.js will render the initial route immediately and then
    //    dispatch 'route:changed', so updateBottomNav runs for free
    //    on first load — no separate call needed.
    initRouter({ outletId: 'app-content' });

    // 3. Subscribe to every subsequent route change.
    //    router.js dispatches: new CustomEvent('route:changed', { detail: { path } })
    window.addEventListener('route:changed', (e) => {
        updateBottomNav(e.detail.path);
    });

});