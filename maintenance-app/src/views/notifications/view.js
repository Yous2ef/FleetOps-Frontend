/**
 * @file notifications/view.js
 * @description Notifications page — Maintenance App.
 *
 * Fetches live notification data from the backend via NotificationApi and
 * renders them into the .notifications-cards container, replacing the
 * static HTML placeholders in view.html.
 */

import {
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
} from "../../services/api/notification.js";

// ─── State ────────────────────────────────────────────────────────────────────

let _root        = null;
let _activeFilter = "all"; // "all" | "unread" | "breakdown" | "warning" | "resolved"

// ─── Type → CSS modifier map ──────────────────────────────────────────────────

const TYPE_CLASS = {
    breakdown:  "notification-card--alert",
    warning:    "notification-card--warning",
    "work-order": "notification-card--info",
    inspection: "notification-card--warning",
    stock:      "notification-card--warning",
    resolved:   "notification-card--info",
};

// ─── Render Helpers ───────────────────────────────────────────────────────────

/**
 * Renders the loading skeleton while data is being fetched.
 * @param {HTMLElement} container
 */
function _renderSkeleton(container) {
    container.innerHTML = Array.from({ length: 3 }, () => `
        <article class="card notification-card" style="opacity:0.5;pointer-events:none;">
            <span class="notification-card__label" style="background:#e2e8f0;color:transparent;border-radius:999px;">Loading</span>
            <h2 class="notification-card__title" style="background:#e2e8f0;color:transparent;border-radius:6px;">Loading title...</h2>
            <p class="notification-card__body" style="background:#e2e8f0;color:transparent;border-radius:6px;">Loading body content...</p>
            <div class="notification-card__meta">
                <span style="background:#e2e8f0;color:transparent;border-radius:4px;">Just now</span>
            </div>
        </article>
    `).join("");
}

/**
 * Renders an empty-state message.
 * @param {HTMLElement} container
 */
function _renderEmpty(container) {
    container.innerHTML = `
        <div style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 64px 24px;
            color: var(--color-text-muted);
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"
                style="margin: 0 auto 16px; display: block; opacity: 0.4;">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            <p style="margin:0;font-size:1rem;font-weight:600;">No notifications</p>
            <p style="margin:8px 0 0;font-size:0.9rem;">You're all caught up.</p>
        </div>
    `;
}

/**
 * Renders an error state.
 * @param {HTMLElement} container
 */
function _renderError(container) {
    container.innerHTML = `
        <div style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 64px 24px;
            color: var(--color-text-muted);
        ">
            <p style="margin:0;font-size:1rem;font-weight:600;color:var(--color-danger);">
                Failed to load notifications
            </p>
            <p style="margin:8px 0 0;font-size:0.9rem;">
                Check your connection and try refreshing.
            </p>
        </div>
    `;
}

/**
 * Renders a single notification card.
 * @param {import("../../services/api/notification.js").Notification} n
 * @returns {string} HTML string
 */
function _renderCard(n) {
    const modifier   = TYPE_CLASS[n.type] ?? "notification-card--info";
    const unreadDot  = !n.read
        ? `<span style="
            display:inline-block;width:8px;height:8px;border-radius:50%;
            background:var(--color-primary,#3da69a);margin-left:8px;
            vertical-align:middle;" title="Unread"></span>`
        : "";

    return `
        <article
            class="card notification-card ${modifier} ${!n.read ? "is-unread" : ""}"
            data-notif-id="${n.id}"
            style="cursor:pointer;${!n.read ? "border-left:3px solid var(--color-primary,#3da69a);" : ""}"
            aria-label="${_esc(n.title)}"
        >
            <span class="notification-card__label">${_esc(n.label ?? n.type)}</span>
            <h2 class="notification-card__title">
                ${_esc(n.title)}${unreadDot}
            </h2>
            <p class="notification-card__body">${_esc(n.body)}</p>
            <div class="notification-card__meta">
                <span>${_esc(n.time)}</span>
                <span style="
                    font-size:0.8rem;
                    padding:3px 8px;
                    border-radius:999px;
                    background:rgba(15,23,42,0.06);
                    color:var(--color-text-muted);
                    text-transform:capitalize;
                ">${_esc(n.channel || "system")}</span>
            </div>
        </article>
    `;
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

/**
 * Injects a filter toolbar above the cards grid if it doesn't already exist.
 */
function _ensureFilterBar() {
    if (_root.querySelector(".notif-filter-bar")) return;

    const header = _root.querySelector(".notifications-header");
    if (!header) return;

    const bar = document.createElement("div");
    bar.className = "notif-filter-bar";
    bar.style.cssText = `
        display:flex;gap:8px;flex-wrap:wrap;align-items:center;
        justify-content:space-between;
    `;
    bar.innerHTML = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${["all","unread","breakdown","warning","resolved"].map((f) => `
                <button
                    class="notif-filter-btn ${_activeFilter === f ? "is-active" : ""}"
                    data-filter="${f}"
                    style="
                        padding:6px 14px;border-radius:999px;border:1px solid var(--color-border,rgba(15,23,42,0.14));
                        background:${_activeFilter === f ? "var(--color-primary,#3da69a)" : "var(--color-surface)"};
                        color:${_activeFilter === f ? "#fff" : "var(--color-text-body)"};
                        font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.15s;
                    "
                >${f.charAt(0).toUpperCase() + f.slice(1)}</button>
            `).join("")}
        </div>
        <button
            id="notif-mark-all-btn"
            style="
                padding:6px 14px;border-radius:999px;
                border:1px solid var(--color-primary,#3da69a);
                background:transparent;color:var(--color-primary,#3da69a);
                font-size:0.82rem;font-weight:600;cursor:pointer;
            "
        >Mark all as read</button>
    `;

    header.insertAdjacentElement("afterend", bar);
}

/**
 * Updates the active state of filter buttons without re-fetching.
 */
function _syncFilterButtons() {
    _root.querySelectorAll(".notif-filter-btn").forEach((btn) => {
        const active = btn.dataset.filter === _activeFilter;
        btn.style.background = active ? "var(--color-primary,#3da69a)" : "var(--color-surface)";
        btn.style.color       = active ? "#fff" : "var(--color-text-body)";
    });
}

// ─── Main Render ──────────────────────────────────────────────────────────────

/**
 * Fetches notifications from the backend and renders them.
 * @param {boolean} [showSkeleton=true]
 */
async function _load(showSkeleton = true) {
    const container = _root?.querySelector(".notifications-cards");
    if (!container) return;

    if (showSkeleton) _renderSkeleton(container);

    let items;
    try {
        items = await fetchNotifications();
    } catch {
        _renderError(container);
        return;
    }

    // Apply active filter
    const filtered = items.filter((n) => {
        if (_activeFilter === "all")    return true;
        if (_activeFilter === "unread") return !n.read;
        return n.type === _activeFilter;
    });

    if (filtered.length === 0) {
        _renderEmpty(container);
        return;
    }

    container.innerHTML = filtered.map(_renderCard).join("");
}

// ─── Event Handling ───────────────────────────────────────────────────────────

/**
 * Handles all clicks within the page root via delegation.
 * @param {MouseEvent} e
 */
async function _handleClick(e) {
    // Filter buttons
    const filterBtn = e.target.closest(".notif-filter-btn");
    if (filterBtn) {
        _activeFilter = filterBtn.dataset.filter;
        _syncFilterButtons();
        await _load(false);
        return;
    }

    // Mark all as read
    const markAllBtn = e.target.closest("#notif-mark-all-btn");
    if (markAllBtn) {
        await markAllAsRead();
        await _load(false);
        return;
    }

    // Click on a notification card → mark as read
    const card = e.target.closest("[data-notif-id]");
    if (card) {
        const id = card.dataset.notifId;
        await markAsRead(id);
        card.classList.remove("is-unread");
        card.style.borderLeft = "";
        const dot = card.querySelector("[title='Unread']");
        if (dot) dot.remove();
    }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export async function mount(rootElement) {
    _root = rootElement || document;

    _ensureFilterBar();

    _root.addEventListener("click", _handleClick);

    await _load();
}

export function unmount() {
    if (_root) {
        _root.removeEventListener("click", _handleClick);
    }
    _root = null;
    _activeFilter = "all";
}

// ─── Tiny escape helper ───────────────────────────────────────────────────────

function _esc(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
