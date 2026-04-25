// ════════════════════════════════════════════════════════════════════════
// src/utils/notifications.js — FleetOps · Global Notification Service
//
// Two UI patterns:
//   1. Sidebar Panel  — persistent history drawer, toggled by bell icon
//   2. Toast Pop-ups  — temporary 3-second banners for live events
//
// Usage from any view:
//   import { NotificationService } from '../../utils/notifications.js';
//   NotificationService.add({
//     title:   'Breakdown — EGY-5678',
//     message: 'Transmission failure reported on Ring Road.',
//     type:    'danger',     // 'danger' | 'warning' | 'info' | 'success'
//     icon:    'lightning-charge',   // any Bootstrap Icons name
//   });
// ════════════════════════════════════════════════════════════════════════

const ICON_MAP = {
  danger:  { icon: 'lightning-charge-fill', bg: 'var(--notif-danger-bg)',  color: 'var(--notif-danger-color)'  },
  warning: { icon: 'exclamation-triangle-fill', bg: 'var(--notif-warning-bg)', color: 'var(--notif-warning-color)' },
  info:    { icon: 'info-circle-fill',      bg: 'var(--notif-info-bg)',    color: 'var(--notif-info-color)'    },
  success: { icon: 'check-circle-fill',     bg: 'var(--notif-success-bg)', color: 'var(--notif-success-color)' },
};

// ── Singleton store ──────────────────────────────────────────────────────

let _notifications  = [];
let _nextId         = 1;
let _subscribers    = [];

function _emit() {
  _subscribers.forEach(fn => fn([..._notifications]));
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

  const meta = ICON_MAP[notification.type] || ICON_MAP.info;

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

  // Animate in (next frame to allow CSS transition)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('notif-toast--show'));
  });

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
  const badge = document.getElementById('notif-bell-badge');
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

  // Mark as read on click
  list.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.dataset.id, 10);
      const notif = _notifications.find(n => n.id === id);
      if (notif && !notif.read) {
        notif.read = true;
        el.classList.remove('notif-item--unread');
        el.querySelector('.notif-item__dot')?.remove();
        _updateBadge();
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
   * Adds a notification to history and fires a toast.
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

    // Prepend so newest is always at top
    _notifications.unshift(notification);
    _emit();
    _updateBadge();
    _renderSidebar();
    _showToast(notification);

    return notification;
  },

  /**
   * markAllRead()
   * Marks every notification as read and refreshes UI.
   */
  markAllRead() {
    _notifications.forEach(n => (n.read = true));
    _emit();
    _updateBadge();
    _renderSidebar();
  },

  /**
   * clear()
   * Removes all notifications.
   */
  clear() {
    _notifications = [];
    _nextId = 1;
    _emit();
    _updateBadge();
    _renderSidebar();
  },

  /**
   * subscribe(fn)
   * Called whenever notifications change. Returns unsubscribe fn.
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
   * Wires up bell button, overlay, and "Mark all read" link.
   * Call once from main.js after DOMContentLoaded.
   */
  boot() {
    const bellBtn   = document.getElementById('notif-bell-btn');
    const overlay   = document.getElementById('notif-overlay');
    const closeBtn  = document.getElementById('notif-close-btn');
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