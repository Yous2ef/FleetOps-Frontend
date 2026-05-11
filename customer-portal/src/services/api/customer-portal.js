// ════════════════════════════════════════════════════════════════════════
// src/services/api/customer-portal.js — FleetOps Customer Portal API
//
// Replaces the localStorage-based StorageService with real HTTP calls
// to the Laravel backend running at http://127.0.0.1:8000/api.
//
// ENDPOINTS (mirrors Laravel routes):
//   GET  /customer-portal/support
//   POST /customer-portal/validate-token
//   GET  /customer-portal/orders/{token}
//   GET  /customer-portal/orders/{token}/tracking
//   POST /customer-portal/orders/{token}/preferences
//   POST /customer-portal/orders/{token}/feedback
//   POST /customer-portal/orders/{token}/ready
// ════════════════════════════════════════════════════════════════════════

const BASE_URL = "http://127.0.0.1:8000/api";

const api = {
    async get(endpoint) {
        const res = await fetch(BASE_URL + endpoint, {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return { data: await res.json() };
    },
    async post(endpoint, bodyData) {
        const res = await fetch(BASE_URL + endpoint, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData || {})
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return { data: await res.json() };
    },
    async put(endpoint, bodyData) {
        const res = await fetch(BASE_URL + endpoint, {
            method: 'PUT',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData || {})
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return { data: await res.json() };
    }
};

// ─── Token helper ─────────────────────────────────────────────────────────────

/**
 * Retrieves the customer's tracking token from the URL hash or query string.
 * The Laravel backend embeds it in the magic link: /track?token=<uuid>
 * Falls back to a token stored in sessionStorage by the entry view.
 *
 * @returns {string|null}
 */
function getTrackingToken() {
    const params = new URLSearchParams(window.location.search);
    const tokenFromURL = params.get('token');
    if (tokenFromURL) {
        sessionStorage.setItem('cp_token', tokenFromURL);
        return tokenFromURL;
    }
    return sessionStorage.getItem('cp_token');
}

// ─── API Methods ──────────────────────────────────────────────────────────────

/**
 * fetchSupportInfo()
 * GET /customer-portal/support
 *
 * Returns support contact details (phone, email, hours) shown on
 * the link-expired and delivery-failed views.
 *
 * @returns {Promise<object>}  { phone, email, workingHours, ... }
 */
async function fetchSupportInfo() {
    const { data } = await api.get('/customer-portal/support');
    return data;
}

/**
 * validateToken(token)
 * POST /customer-portal/validate-token
 *
 * Validates the tracking token from the magic link.
 * Called on entry before rendering any view.
 *
 * @param {string} token  The UUID token from the magic link.
 * @returns {Promise<{ valid: boolean, orderId?: string, status?: string }>}
 */
async function validateToken(token) {
    const { data } = await api.post('/customer-portal/validate-token', { token });
    return data;
}

/**
 * fetchOrder(token?)
 * GET /customer-portal/orders/{token}
 *
 * Fetches the full order object for this customer's tracking session.
 * Response shape mirrors the SEED_ORDER schema used by all views.
 *
 * @param {string} [token]  Tracking token (auto-resolved if omitted).
 * @returns {Promise<object|null>}  Order object, or null on failure.
 */
async function fetchOrder(token) {
    const t = token ?? getTrackingToken();
    if (!t) {
        console.error('[CustomerPortalAPI] No tracking token available.');
        return null;
    }
    const { data } = await api.get(`/customer-portal/orders/${t}`);
    return data;
}

/**
 * fetchTracking(token?)
 * GET /customer-portal/orders/{token}/tracking
 *
 * Returns live tracking data: driver location, ETA, stop count, status.
 * Consumed by the in-transit and arriving-alerts views.
 *
 * @param {string} [token]  Tracking token (auto-resolved if omitted).
 * @returns {Promise<object|null>}  Tracking payload, or null on failure.
 */
async function fetchTracking(token) {
    const t = token ?? getTrackingToken();
    if (!t) {
        console.error('[CustomerPortalAPI] No tracking token available.');
        return null;
    }
    const { data } = await api.get(`/customer-portal/orders/${t}/tracking`);
    return data;
}

/**
 * savePreferences(preferences, token?)
 * POST /customer-portal/orders/{token}/preferences
 *
 * Persists the customer's delivery preferences (door/lobby/etc + notes).
 * Called from the deliver-preferences view on save.
 *
 * @param {{ option: string, label: string, notes: string }} preferences
 * @param {string} [token]  Tracking token (auto-resolved if omitted).
 * @returns {Promise<object>}  Server confirmation payload.
 */
async function savePreferences(preferences, token) {
    const t = token ?? getTrackingToken();
    const { data } = await api.post(
        `/customer-portal/orders/${t}/preferences`,
        { ...preferences, savedAt: new Date().toISOString() },
    );
    return data;
}

/**
 * submitFeedback(feedback, token?)
 * POST /customer-portal/orders/{token}/feedback
 *
 * Submits the post-delivery rating + condition + comments from the
 * delivered view.
 *
 * @param {{ rating: number, condition: string|null, comments: string }} feedback
 * @param {string} [token]  Tracking token (auto-resolved if omitted).
 * @returns {Promise<object>}  Server confirmation payload.
 */
async function submitFeedback(feedback, token) {
    const t = token ?? getTrackingToken();
    const { data } = await api.post(
        `/customer-portal/orders/${t}/feedback`,
        { ...feedback, submittedAt: new Date().toISOString() },
    );
    return data;
}

/**
 * notifyDriverReady(token?)
 * POST /customer-portal/orders/{token}/ready
 *
 * Tells the backend (and driver) that the customer is ready to receive.
 * Triggered by the "I'm Ready" button in the arriving-alerts view.
 *
 * @param {string} [token]  Tracking token (auto-resolved if omitted).
 * @returns {Promise<object>}  Server acknowledgement payload.
 */
async function notifyDriverReady(token) {
    const t = token ?? getTrackingToken();
    const { data } = await api.post(`/customer-portal/orders/${t}/ready`, {});
    return data;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

const CustomerPortalAPI = {
    getTrackingToken,
    fetchSupportInfo,
    validateToken,
    fetchOrder,
    fetchTracking,
    savePreferences,
    submitFeedback,
    notifyDriverReady,
};

export {
    getTrackingToken,
    fetchSupportInfo,
    validateToken,
    fetchOrder,
    fetchTracking,
    savePreferences,
    submitFeedback,
    notifyDriverReady,
};

export default CustomerPortalAPI;
