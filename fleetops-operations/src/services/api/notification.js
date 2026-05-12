// ─────────────────────────────────────────────────────────────────────────────
//  src/services/api/notification.js
//  Notification data layer — FleetOps Operations Dashboard.
//
//  All data is fetched from the Laravel backend (/api/v1/notifications/*).
//  Zero localStorage usage.
//
//  Strategy:
//   • Every async method hits the backend and updates an in-memory cache.
//   • The synchronous helpers (getNotifications, getUnreadCount) read from
//     that cache, so the existing notification-ui.js panel works without
//     requiring a full rewrite.
//   • Call NotificationApi.refresh() on panel open to always show fresh data.
// ─────────────────────────────────────────────────────────────────────────────

import api from "/shared/api-handler.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL  = "http://localhost:8000";
const PER_PAGE  = 30;

api.setBaseURL(BASE_URL);

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} NotificationItem
 * @property {string|number} id
 * @property {string}        type      - Maps from event_type → UI type key
 * @property {string}        title
 * @property {string}        body
 * @property {string}        timeAgo   - Relative time string
 * @property {boolean}       read      - True when status is 'delivered'
 */

/** @type {NotificationItem[]} */
let _cache = [];

/** @type {{ total: number, currentPage: number, lastPage: number }} */
let _pagination = { total: 0, currentPage: 1, lastPage: 1 };

// ─── Mapping Helpers ──────────────────────────────────────────────────────────

/**
 * Maps a backend event_type string to a UI icon type.
 * @param {string} eventType
 * @returns {'breakdown'|'warning'|'resolved'}
 */
function _mapType(eventType) {
    const dangerTypes = ["incident_alert", "breakdown"];
    const warningTypes = [
        "maintenance_alert",
        "maintenance_alert_odometer",
        "maintenance_alert_inspection",
        "low_stock_alert",
        "delay_alert",
    ];
    if (dangerTypes.some((t) => eventType?.includes(t))) return "breakdown";
    if (warningTypes.some((t) => eventType?.includes(t))) return "warning";
    return "resolved";
}

/**
 * Converts a backend ISO timestamp to a relative "time ago" string.
 * @param {string|null} isoString
 * @returns {string}
 */
function _timeAgo(isoString) {
    if (!isoString) return "—";
    const diff = Date.now() - new Date(isoString).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins  < 1)  return "Just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

/**
 * Normalises a raw backend notification record into the UI shape.
 * @param {Object} raw
 * @returns {NotificationItem}
 */
function _normalise(raw) {
    const payload = raw.payload || {};
    return {
        id:      raw.notification_id ?? raw.id,
        type:    _mapType(raw.event_type),
        title:   payload.title ?? raw.title ?? raw.event_type ?? "Notification",
        body:    payload.body ?? payload.description ?? raw.message ?? "",
        timeAgo: _timeAgo(raw.created_at),
        read:    raw.status === "delivered" || raw.read_at !== null,
    };
}

// ─── Async Methods (hit the backend) ─────────────────────────────────────────

/**
 * Fetches the latest notifications from the backend and updates the cache.
 * Always call this before showing the panel for fresh data.
 *
 * @param {number} [perPage]
 * @returns {Promise<NotificationItem[]>}
 */
async function refresh(perPage = PER_PAGE) {
    try {
        const response = await api.get("/api/v1/notifications", {
            params: { per_page: perPage },
        });

        if (response.ok && response.data?.success) {
            const payload = response.data.data;
            // Backend returns a Laravel paginator: { data: [...], total, current_page, last_page }
            const raw = Array.isArray(payload) ? payload : (payload?.data ?? []);
            _cache = raw.map(_normalise);

            if (payload?.total !== undefined) {
                _pagination = {
                    total:       payload.total,
                    currentPage: payload.current_page,
                    lastPage:    payload.last_page,
                };
            }
        } else {
            console.warn("[NotificationApi] refresh: non-success response", response.data);
        }
    } catch (err) {
        console.error("[NotificationApi] refresh failed:", err.message ?? err);
    }

    return [..._cache];
}

/**
 * Fetches a single notification by ID from the backend.
 *
 * @param {string|number} id
 * @returns {Promise<NotificationItem|null>}
 */
async function fetchById(id) {
    try {
        const response = await api.get(`/api/v1/notifications/${id}`);
        if (response.ok && response.data?.success) {
            const item = _normalise(response.data.data);
            // Update cache entry if it exists
            const idx = _cache.findIndex((n) => n.id == id);
            if (idx !== -1) _cache[idx] = item;
            else _cache.unshift(item);
            return item;
        }
    } catch (err) {
        console.error(`[NotificationApi] fetchById(${id}) failed:`, err.message ?? err);
    }
    return null;
}

/**
 * Fetches the user's notification preferences from the backend.
 *
 * @returns {Promise<Object|null>}
 */
async function getPreferences() {
    try {
        const response = await api.get("/api/v1/notifications/preferences");
        if (response.ok && response.data?.success) {
            return response.data.data;
        }
    } catch (err) {
        console.error("[NotificationApi] getPreferences failed:", err.message ?? err);
    }
    return null;
}

/**
 * Updates the user's notification preferences on the backend.
 *
 * @param {Object} prefs  - { push_enabled, sms_enabled, email_enabled,
 *                            quiet_hours_start, quiet_hours_end,
 *                            preferred_language }
 * @returns {Promise<{success: boolean, data?: Object}>}
 */
async function updatePreferences(prefs) {
    try {
        const response = await api.put("/api/v1/notifications/preferences", prefs);
        if (response.ok && response.data?.success) {
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (err) {
        console.error("[NotificationApi] updatePreferences failed:", err.message ?? err);
        return { success: false };
    }
}

/**
 * Registers an FCM token for push notifications.
 *
 * @param {string} fcmToken
 * @returns {Promise<{success: boolean}>}
 */
async function updateFcmToken(fcmToken) {
    try {
        const response = await api.post("/api/v1/notifications/fcm-token", {
            fcm_token: fcmToken,
        });
        return { success: response.ok };
    } catch (err) {
        console.error("[NotificationApi] updateFcmToken failed:", err.message ?? err);
        return { success: false };
    }
}

// ─── Synchronous Cache Readers (used by notification-ui.js) ──────────────────

/**
 * Returns the current cached notification list.
 * Call refresh() first to ensure the cache is populated.
 *
 * @returns {NotificationItem[]}
 */
function getNotifications() {
    return [..._cache];
}

/**
 * Returns the count of unread notifications from cache.
 *
 * @returns {number}
 */
function getUnreadCount() {
    return _cache.filter((n) => !n.read).length;
}

/**
 * Optimistically marks all cached items as read.
 * The backend has no bulk-read endpoint; this is a local UI update only.
 *
 * @returns {NotificationItem[]}
 */
function markAllRead() {
    _cache = _cache.map((n) => ({ ...n, read: true }));
    return [..._cache];
}

/**
 * Optimistically marks a single cached item as read by its ID.
 *
 * @param {string|number} id
 * @returns {NotificationItem[]}
 */
function markRead(id) {
    _cache = _cache.map((n) => (n.id == id ? { ...n, read: true } : n));
    return [..._cache];
}

/**
 * Returns current pagination metadata.
 *
 * @returns {{ total: number, currentPage: number, lastPage: number }}
 */
function getPagination() {
    return { ..._pagination };
}

// ─── Export ───────────────────────────────────────────────────────────────────

const NotificationApi = {
    // Async — backend calls
    refresh,
    fetchById,
    getPreferences,
    updatePreferences,
    updateFcmToken,
    // Sync — cache reads (compatible with existing notification-ui.js)
    getNotifications,
    getUnreadCount,
    markAllRead,
    markRead,
    getPagination,
};

export default NotificationApi;