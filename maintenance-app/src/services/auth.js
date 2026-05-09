/**
 * auth.js — token storage and login/logout helpers.
 * All API files import this to get/set the Bearer token.
 */

const TOKEN_KEY = "maintenance-app:token";
const USER_KEY  = "maintenance-app:user";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
        return null;
    }
}

export function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
    return Boolean(getToken());
}

/** Redirect to login, preserving the intended path */
export function redirectToLogin() {
    const intended = window.location.pathname + window.location.search;
    if (intended !== "/login") {
        sessionStorage.setItem("maintenance-app:intended", intended);
    }
    window.history.replaceState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
}

export function getIntendedPath() {
    return sessionStorage.getItem("maintenance-app:intended") || "/";
}

export function clearIntendedPath() {
    sessionStorage.removeItem("maintenance-app:intended");
}
