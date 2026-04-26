/**
 * FleetOps — Notification API
 * Handles all notification data logic: fetching, marking read,
 * and persisting state to localStorage.
 *
 * All functions are async to mimic real API call patterns.
 *
 * @module api/notification
 */

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'fleetops_notifications';

// ─────────────────────────────────────────────────────────────────
// SEED DATA
// Fallback data used the first time (no localStorage entry exists).
// ─────────────────────────────────────────────────────────────────

/**
 * @typedef {'breakdown'|'insurance'|'stock'|'work-order'|'inspection'} NotifType
 *
 * @typedef {Object} Notification
 * @property {string}      id        - Unique identifier
 * @property {NotifType}   type      - Category, drives icon rendering
 * @property {string}      title     - Bold heading shown in the panel
 * @property {string}      body      - Supporting detail text
 * @property {string}      time      - Human-readable relative time string
 * @property {boolean}     read      - Whether the user has seen it
 */

/** @type {Notification[]} */
const SEED_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'breakdown',
    title: 'Breakdown — EGY-5678',
    body: 'Driver Ahmed Mahmoud reported a breakdown on Ring Road. Transmission failure.',
    time: '13d ago',
    read: false,
  },
  {
    id: 'n2',
    type: 'insurance',
    title: 'Insurance Expiry — EGY-5678',
    body: 'Vehicle EGY-5678 insurance expires in 10 days on April 25, 2026.',
    time: '8d ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'stock',
    title: 'Low Stock — Transmission Fluid',
    body: 'Transmission Fluid is out of stock. Please reorder immediately.',
    time: '9d ago',
    read: false,
  },
  {
    id: 'n4',
    type: 'work-order',
    title: 'WO-2039 Resolved',
    body: 'Karim Hassan resolved Work Order WO-2039 for EGY-1234. Ready for review.',
    time: '14d ago',
    read: true,
  },
  {
    id: 'n5',
    type: 'inspection',
    title: 'Inspection Expiry — EGY-5678',
    body: 'Annual inspection for EGY-5678 expired on March 1, 2026. Schedule immediately.',
    time: '9d ago',
    read: true,
  },
];

// ─────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Loads the current notification list from localStorage.
 * Falls back to seed data if nothing is stored yet.
 *
 * @returns {Notification[]}
 */
function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Malformed JSON — reset to seed
  }
  return SEED_NOTIFICATIONS.map(n => ({ ...n })); // shallow copy
}

/**
 * Persists the notification list to localStorage.
 *
 * @param {Notification[]} notifications
 */
function _save(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.warn('[NotificationAPI] Could not write to localStorage:', err);
  }
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

/**
 * Returns all notifications, most-recent first.
 *
 * @async
 * @returns {Promise<Notification[]>}
 */
export async function fetchNotifications() {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 60));
  return _load();
}

/**
 * Returns the count of unread notifications.
 *
 * @async
 * @returns {Promise<number>}
 */
export async function fetchUnreadCount() {
  await new Promise(r => setTimeout(r, 30));
  return _load().filter(n => !n.read).length;
}

/**
 * Marks a single notification as read by its ID.
 *
 * @async
 * @param {string} id
 * @returns {Promise<{success: boolean}>}
 */
export async function markAsRead(id) {
  await new Promise(r => setTimeout(r, 40));
  const list = _load();
  const target = list.find(n => n.id === id);
  if (target) {
    target.read = true;
    _save(list);
  }
  return { success: !!target };
}

/**
 * Marks ALL notifications as read.
 *
 * @async
 * @returns {Promise<{success: boolean, updated: number}>}
 */
export async function markAllAsRead() {
  await new Promise(r => setTimeout(r, 50));
  const list = _load();
  let updated = 0;
  list.forEach(n => {
    if (!n.read) { n.read = true; updated++; }
  });
  _save(list);
  return { success: true, updated };
}

/**
 * Clears all stored notifications, resetting to seed data.
 * Useful for dev/testing.
 *
 * @async
 * @returns {Promise<void>}
 */
export async function resetNotifications() {
  await new Promise(r => setTimeout(r, 30));
  localStorage.removeItem(STORAGE_KEY);
}