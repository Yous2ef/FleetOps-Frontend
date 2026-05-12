// ─────────────────────────────────────────────────────────────────────────────
//  src/services/api/notification.js
//  Notification data layer — FleetOps Maintenance App.
//
//  All data is fetched from the Laravel backend (/api/v1/notifications/*).
//  Zero localStorage usage.
//
//  Exports named functions (matching what the existing codebase expects) plus
//  a default object for convenience.
// ─────────────────────────────────────────────────────────────────────────────

import api from "/shared/api-handler.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8000";
const PER_PAGE = 30;

api.setBaseURL(BASE_URL);

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} Notification
 * @property {string|number} id
 * @property {string}        type      - UI type key: 'breakdown'|'warning'|'resolved'
 * @property {string}        title
 * @property {string}        body
 * @property {string}        time      - Relative time string
 * @property {boolean}       read
 * @property {string}        eventType - Raw backend event_type
 * @property {string}        channel   - push|sms|email
 * @property {string}        status    - pending|sent|delivered|failed
 */

/** @type {Notification[]} */
let _cache = [];

/** @type {{ total: number, currentPage: number, lastPage: number }} */
let _pagination = { total: 0, currentPage: 1, lastPage: 1 };

// ─── Mapping Helpers ──────────────────────────────────────────────────────────

/**
 * Maps a backend event_type to a UI icon type.
 * @param {string} eventType
 * @returns {'breakdown'|'warning'|'resolved'|'work-order'|'inspection'|'stock'}
 */
function _mapType(eventType) {
    if (!eventType) return "resolved";
    if (eventType.includes("incident"))    return "breakdown";
    if (eventType.includes("stock"))       return "stock";
    if (eventType.includes("inspection"))  return "inspection";
    if (eventType.includes("work_order") || eventType.includes("shift") || eventType.includes("route")) return "work-order";
    if (eventType.includes("maintenance") || eventType.includes("delay")) return "warning";
    return "resolved";
}

/**
 * Maps a backend event_type to a human-readable label.
 * @param {string} eventType
 * @returns {string}
 */
function _mapLabel(eventType) {
    const labels = {
        incident_alert:                "Emergency",
        low_stock_alert:               "Low Stock",
        maintenance_alert:             "Maintenance",
        maintenance_alert_odometer:    "Odometer Alert",
        maintenance_alert_inspection:  "Inspection Due",
        proximity_alert:               "Proximity",
        delay_alert:                   "Delay",
        status_update:                 "Status Update",
        status_update_in_transit:      "In Transit",
        status_update_delivered:       "Delivered",
        status_update_returned:        "Returned",
        route_started:                 "Route Started",
        shift_transfer:                "Shift Transfer",
    };
    return labels[eventType] ?? "Notification";
}

/**
 * Converts an ISO timestamp to a relative "time ago" string.
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
 * Normalises a raw backend record into the UI shape.
 * @param {Object} raw
 * @returns {Notification}
 */
function _normalise(raw) {
    const payload = raw.payload || {};
    return {
        id:        raw.notification_id ?? raw.id,
        type:      _mapType(raw.event_type),
        label:     _mapLabel(raw.event_type),
        title:     payload.title ?? raw.title ?? _mapLabel(raw.event_type),
        body:      payload.body ?? payload.description ?? raw.message ?? "",
        time:      _timeAgo(raw.created_at),
        read:      raw.status === "delivered" || raw.read_at !== null,
        eventType: raw.event_type ?? "",
        channel:   raw.channel   ?? "",
        status:    raw.status    ?? "pending",
    };
}

// ─── Public Async API ─────────────────────────────────────────────────────────

/**
 * Fetches the latest notifications from the backend and updates the in-memory
 * cache. Returns the normalised list.
 *
 * @async
 * @param {number} [perPage]
 * @returns {Promise<Notification[]>}
 */
export async function fetchNotifications(perPage = PER_PAGE) {
    try {
        const response = await api.get("/api/v1/notifications", {
            params: { per_page: perPage },
        });

        if (response.ok && response.data?.success) {
            const payload = response.data.data;
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
            console.warn("[NotificationApi] fetchNotifications: non-success response", response.data);
        }
    } catch (err) {
        console.error("[NotificationApi] fetchNotifications failed:", err.message ?? err);
    }

    return [..._cache];
}

/**
 * Fetches a single notification by ID.
 *
 * @async
 * @param {string|number} id
 * @returns {Promise<Notification|null>}
 */
export async function fetchNotificationById(id) {
    try {
        const response = await api.get(`/api/v1/notifications/${id}`);
        if (response.ok && response.data?.success) {
            const item = _normalise(response.data.data);
            const idx  = _cache.findIndex((n) => n.id == id);
            if (idx !== -1) _cache[idx] = item;
            else _cache.unshift(item);
            return item;
        }
    } catch (err) {
        console.error(`[NotificationApi] fetchNotificationById(${id}) failed:`, err.message ?? err);
    }
    return null;
}

/**
 * Returns the count of unread notifications from the cache.
 *
 * @async
 * @returns {Promise<number>}
 */
export async function fetchUnreadCount() {
    // Cache must be populated by fetchNotifications() first.
    // Re-fetch only if cache is empty.
    if (_cache.length === 0) {
        await fetchNotifications();
    }
    return _cache.filter((n) => !n.read).length;
}

/**
 * Optimistically marks all cached notifications as read.
 * (The backend has no bulk-read endpoint; this is a local UI update.)
 *
 * @async
 * @returns {Promise<{success: boolean, updated: number}>}
 */
export async function markAllAsRead() {
    let updated = 0;
    _cache = _cache.map((n) => {
        if (!n.read) { updated++; return { ...n, read: true }; }
        return n;
    });
    return { success: true, updated };
}

/**
 * Optimistically marks a single notification as read.
 *
 * @async
 * @param {string|number} id
 * @returns {Promise<{success: boolean}>}
 */
export async function markAsRead(id) {
    const idx = _cache.findIndex((n) => n.id == id);
    if (idx !== -1) {
        _cache[idx] = { ..._cache[idx], read: true };
        return { success: true };
    }
    return { success: false };
}

/**
 * Fetches the user's notification preferences.
 *
 * @async
 * @returns {Promise<Object|null>}
 */
export async function fetchPreferences() {
    try {
        const response = await api.get("/api/v1/notifications/preferences");
        if (response.ok && response.data?.success) {
            return response.data.data;
        }
    } catch (err) {
        console.error("[NotificationApi] fetchPreferences failed:", err.message ?? err);
    }
    return null;
}

/**
 * Updates the user's notification preferences.
 *
 * @async
 * @param {Object} prefs - { push_enabled, sms_enabled, email_enabled,
 *                           quiet_hours_start, quiet_hours_end,
 *                           preferred_language }
 * @returns {Promise<{success: boolean, data?: Object}>}
 */
export async function updatePreferences(prefs) {
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
 * @async
 * @param {string} fcmToken
 * @returns {Promise<{success: boolean}>}
 */
export async function updateFcmToken(fcmToken) {
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

/**
 * Returns the current pagination metadata.
 * @returns {{ total: number, currentPage: number, lastPage: number }}
 */
export function getPagination() {
    return { ..._pagination };
}

// ─── Default Export ───────────────────────────────────────────────────────────

const NotificationApi = {
    fetchNotifications,
    fetchNotificationById,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    fetchPreferences,
    updatePreferences,
    updateFcmToken,
    getPagination,
};

export default NotificationApi;