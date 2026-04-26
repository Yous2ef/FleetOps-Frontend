// ─────────────────────────────────────────────────────────────────────────────
//  src/api/notification.js
//  Notification data layer.
//  Reads from / writes to localStorage.  Falls back to seeded dummy data so
//  the panel works immediately without a backend.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fleetops-operations:notifications";

// ─── Seed Data ───────────────────────────────────────────────────────────────
// Mirrors the design screenshot exactly (Image 1).

/** @type {NotificationItem[]} */
const SEED_NOTIFICATIONS = [
    {
        id: "notif-001",
        type: "breakdown",       // renders a danger/red icon
        title: "Breakdown — EGY-5678",
        body: "Driver Ahmed Mahmoud reported a breakdown on Ring Road. Transmission failure.",
        timeAgo: "13d ago",
        read: false,
    },
    {
        id: "notif-002",
        type: "warning",         // renders a yellow triangle
        title: "Insurance Expiry — EGY-5678",
        body: "Vehicle EGY-5678 insurance expires in 10 days on April 25, 2026.",
        timeAgo: "8d ago",
        read: false,
    },
    {
        id: "notif-003",
        type: "warning",
        title: "Low Stock — Transmission Fluid",
        body: "Transmission Fluid is out of stock. Please reorder immediately.",
        timeAgo: "9d ago",
        read: false,
    },
    {
        id: "notif-004",
        type: "resolved",        // renders a neutral/grey info icon
        title: "WO-2039 Resolved",
        body: "Karim Hassan resolved Work Order WO-2039 for EGY-1234. Ready for review.",
        timeAgo: "14d ago",
        read: true,
    },
    {
        id: "notif-005",
        type: "warning",
        title: "Inspection Expiry — EGY-5678",
        body: "Annual inspection for EGY-5678 expired on March 1, 2026. Schedule immediately.",
        timeAgo: "9d ago",
        read: false,
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Load notifications from localStorage.
 * If the key does not exist the seed data is persisted and returned so the
 * panel is never empty on first load.
 * @returns {NotificationItem[]}
 */
function getNotifications() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (_) {
        // Corrupted storage — fall through to seed.
    }

    _persist(SEED_NOTIFICATIONS);
    return [...SEED_NOTIFICATIONS];
}

/**
 * Mark every notification as read and flush to localStorage.
 * @returns {NotificationItem[]} Updated list.
 */
function markAllRead() {
    const updated = getNotifications().map((n) => ({ ...n, read: true }));
    _persist(updated);
    return updated;
}

/**
 * Mark a single notification as read.
 * @param {string} id
 * @returns {NotificationItem[]} Updated list.
 */
function markRead(id) {
    const updated = getNotifications().map((n) =>
        n.id === id ? { ...n, read: true } : n
    );
    _persist(updated);
    return updated;
}

/**
 * Returns the number of unread notifications.
 * @returns {number}
 */
function getUnreadCount() {
    return getNotifications().filter((n) => !n.read).length;
}

// ─── Private ─────────────────────────────────────────────────────────────────

function _persist(notifications) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (_) {
        // Storage quota exceeded — silently ignore.
    }
}

// ─── Export ───────────────────────────────────────────────────────────────────

const NotificationApi = {
    getNotifications,
    markAllRead,
    markRead,
    getUnreadCount,
};

export default NotificationApi;