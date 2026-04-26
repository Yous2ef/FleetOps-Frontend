// ════════════════════════════════════════════════════════════════════════
// src/utils/notifications.js — FleetOps · Global Notification Service
//
// REFACTOR (data-driven, 2026-04-26):
//   Notifications are now persisted via StorageService so they survive
//   page refreshes and SPA navigation. The in-memory array is still
//   used as the live UI state — StorageService is the source of truth
//   that initialises it on boot() and syncs after every mutation.
//
//   When you swap StorageService for a real API:
//     - boot()  → GET /api/notifications
//     - add()   → POST /api/notifications  (then append to local array)
//     - markAllRead() → PATCH /api/notifications/read-all
//
// Two UI patterns:
//   1. Sidebar Panel  — persistent history drawer, toggled by bell icon
//   2. Toast Pop-ups  — temporary 3-second banners for live events
// ════════════════════════════════════════════════════════════════════════

import { StorageService } from './storage.js';

const ICON_MAP = {
  danger:  { icon: 'lightning-charge-fill', bg: 'var(--notif-danger-bg)',  color: 'var(--notif-danger-color)'  },
  warning: { icon: 'exclamation-triangle-fill', bg: 'var(--notif-warning-bg)', color: 'var(--notif-warning-color)' },
  info:    { icon: 'info-circle-fill',      bg: 'var(--notif-info-bg)',    color: 'var(--notif-info-color)'    },
  success: { icon: 'check-circle-fill',     bg: 'var(--notif-success-bg)', color: 'var(--notif-success-color)' },
};

// ── In-memory state (hydrated from StorageService on boot) ───────────────

let _notifications  = [];
let _nextId         = 1;
let _subscribers    = [];

// ── Internal helpers ─────────────────────────────────────────────────────

function _emit() {
  _subscribers.forEach(fn => fn([..._notifications]));
}

async function _persist() {
  try {
    await StorageService.save('notifications', _notifications);
  } catch (err) {
    console.error('[NotificationService] Failed to persist:', err);
  }
}

function _calcNextId() {
  if (_notifications.length === 0) return 1;
  return Math.max(..._notifications.map(n => n.id ?? 0)) + 1;
}

// ── Time Formatting ──────────────────────────────────────────────────────

function _timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60)       return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)       return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)         return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Toast Engine ─────────────────────────────────────────────────────────

function _showToast(notification) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const meta  = ICON_MAP[notification.type] || ICON_MAP.info;
  const toast = document.createElement('div');
  toast.className = `notif-toast notif-toast--${notification.type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="notif-toast__icon-wrap" style="background:${meta.bg}; color:${meta.color}">
      <i class="bi bi-${notification.icon || meta.icon}"></i>
    </span>
    <div class="notif-toast__body">
      <p class="notif-toast__title">${notification.title}</p>
      <p class="notif-toast__msg">${notification.message}</p>
    </div>
    <button class="notif-toast__close" aria-label="Dismiss">
      <i class="bi bi-x"></i>
    </button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('notif-toast--show')));

  const dismiss = () => {
    toast.classList.remove('notif-toast--show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  const autoTimer = setTimeout(dismiss, 3000);
  toast.querySelector('.notif-toast__close').addEventListener('click', () => {
    clearTimeout(autoTimer);
    dismiss();
  });
}

// ── Badge Updater ─────────────────────────────────────────────────────────

function _updateBadge() {
  const badge  = document.getElementById('notif-bell-badge');
  if (!badge) return;
  const unread = _notifications.filter(n => !n.read).length;
  badge.textContent = unread > 9 ? '9+' : unread;
  badge.hidden = unread === 0;
}

// ── Sidebar Renderer ──────────────────────────────────────────────────────

function _renderSidebar() {
  const list = document.getElementById('notif-list');
  if (!list) return;

  if (_notifications.length === 0) {
    list.innerHTML = `
      <div class="notif-empty">
        <i class="bi bi-bell-slash"></i>
        <p>No notifications yet</p>
      </div>`;
    return;
  }

  list.innerHTML = _notifications.map(n => {
    const meta = ICON_MAP[n.type] || ICON_MAP.info;
    return `
    <div class="notif-item ${n.read ? '' : 'notif-item--unread'}" data-id="${n.id}">
      ${!n.read ? '<span class="notif-item__dot" aria-label="Unread"></span>' : ''}
      <span class="notif-item__icon-wrap" style="background:${meta.bg}; color:${meta.color}">
        <i class="bi bi-${n.icon || meta.icon}"></i>
      </span>
      <div class="notif-item__body">
        <p class="notif-item__title">${n.title}</p>
        <p class="notif-item__msg">${n.message}</p>
        <p class="notif-item__time">${_timeAgo(n.timestamp)}</p>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', () => {
      const id    = parseInt(el.dataset.id, 10);
      const notif = _notifications.find(n => n.id === id);
      if (notif && !notif.read) {
        notif.read = true;
        el.classList.remove('notif-item--unread');
        el.querySelector('.notif-item__dot')?.remove();
        _updateBadge();
        _persist();
      }
    });
  });
}

// ── Sidebar Toggle ────────────────────────────────────────────────────────

function _openSidebar() {
  const overlay = document.getElementById('notif-overlay');
  const sidebar = document.getElementById('notif-sidebar');
  if (!overlay || !sidebar) return;
  overlay.classList.add('notif-overlay--visible');
  sidebar.classList.add('notif-sidebar--open');
  _renderSidebar();
}

function _closeSidebar() {
  const overlay = document.getElementById('notif-overlay');
  const sidebar = document.getElementById('notif-sidebar');
  overlay?.classList.remove('notif-overlay--visible');
  sidebar?.classList.remove('notif-sidebar--open');
}

// ── Public API ────────────────────────────────────────────────────────────

export const NotificationService = {

  /**
   * add({ title, message, type, icon })
   * Stores, displays, and persists a new notification.
   */
  add({ title, message, type = 'info', icon = null } = {}) {
    const notification = {
      id:        _nextId++,
      title,
      message,
      type,
      icon,
      read:      false,
      timestamp: Date.now(),
    };

    _notifications.unshift(notification);
    _emit();
    _updateBadge();
    _renderSidebar();
    _showToast(notification);
    _persist();

    return notification;
  },

  /**
   * markAllRead()
   * Marks every notification as read and persists.
   */
  markAllRead() {
    _notifications.forEach(n => (n.read = true));
    _emit();
    _updateBadge();
    _renderSidebar();
    _persist();
  },

  /**
   * clear()
   * Removes all notifications from memory and storage.
   */
  clear() {
    _notifications = [];
    _nextId = 1;
    _emit();
    _updateBadge();
    _renderSidebar();
    _persist();
  },

  /**
   * subscribe(fn)
   * Subscribe to notification changes. Returns unsubscribe fn.
   */
  subscribe(fn) {
    _subscribers.push(fn);
    return () => { _subscribers = _subscribers.filter(s => s !== fn); };
  },

  /**
   * getAll()
   * Returns a shallow copy of the notifications array.
   */
  getAll() {
    return [..._notifications];
  },

  /**
   * boot()
   * Hydrates in-memory state from StorageService, then wires up the UI.
   * Must be called AFTER seedIfEmpty() so seed data is guaranteed present.
   *
   * @returns {Promise<void>}
   */
  async boot() {
    // Hydrate from storage (seeder has already populated this by now)
    const stored = await StorageService.get('notifications');
    if (Array.isArray(stored) && stored.length > 0) {
      _notifications = stored;
      _nextId        = _calcNextId();
    }

    // Wire up UI toggle elements
    const bellBtn    = document.getElementById('notif-bell-btn');
    const overlay    = document.getElementById('notif-overlay');
    const closeBtn   = document.getElementById('notif-close-btn');
    const markAllBtn = document.getElementById('notif-mark-all-btn');

    bellBtn?.addEventListener('click',   _openSidebar);
    closeBtn?.addEventListener('click',  _closeSidebar);
    overlay?.addEventListener('click',   _closeSidebar);
    markAllBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.markAllRead();
    });

    _updateBadge();
  },
};
