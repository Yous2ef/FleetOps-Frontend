/**
 * api-client.js — configured api instance for the maintenance app.
 * Injects the Bearer token on every request and redirects to /login on 401.
 */

import api from "/shared/api-handler.js";
import { getToken, redirectToLogin } from "./auth.js";

api.setBaseURL("http://localhost:8000");

/**
 * Wraps api.get/post/patch/put/delete to:
 *  1. Inject Authorization header from stored token
 *  2. Redirect to /login on 401
 */
function withAuth(method) {
    return async function (url, options = {}) {
        const token = getToken();
        const headers = {
            ...(options.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        try {
            return await api[method](url, { ...options, headers });
        } catch (err) {
            if (err?.status === 401) {
                redirectToLogin();
            }
            throw err;
        }
    };
}

/**
 * For POST/PUT/PATCH the body is the second positional arg.
 */
function withAuthBody(method) {
    return async function (url, body, options = {}) {
        const token = getToken();
        const headers = {
            ...(options.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        try {
            return await api[method](url, body, { ...options, headers });
        } catch (err) {
            if (err?.status === 401) {
                redirectToLogin();
            }
            throw err;
        }
    };
}

/** Unwrap Laravel response envelope and pagination.
 *
 * Backend always wraps in { success, data: ... }
 * Paginated endpoints wrap further: { success, data: { current_page, data: [...] } }
 */
export function unwrap(response) {
    if (!response) return [];

    // Step 1: peel off the { success, data } envelope
    let inner = response;
    if (response.success !== undefined && "data" in response) {
        inner = response.data;
    }

    if (!inner) return [];

    // Step 2: peel off Laravel pagination { current_page, data: [...] }
    if (inner.current_page !== undefined && Array.isArray(inner.data)) {
        return inner.data;
    }

    // Step 3: plain array
    if (Array.isArray(inner)) return inner;

    // Step 4: single object (show endpoint)
    return inner;
}

const client = {
    get:    withAuth("get"),
    post:   withAuthBody("post"),
    put:    withAuthBody("put"),
    patch:  withAuthBody("patch"),
    delete: withAuth("delete"),
};

export default client;
