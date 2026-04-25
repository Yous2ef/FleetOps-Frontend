// ════════════════════════════════════════════════════════════════════════
// src/views/delivered/view.js — Delivered View
//
// NOTIFICATION INTEGRATION (2026-04-25):
//   Fires a 'success' notification + toast when the user submits feedback.
//
// FIX LOG (audit 2026-04-25):
//   BUG-4  This file previously used "export default { init, destroy }".
//          The router's resolveModule() now handles both styles, but to
//          keep consistency with every other view in this project (named
//          exports) this file has been converted to named exports.
//
//   BONUS  All querySelector/querySelectorAll calls now scope to `root`
//          (the outlet element) instead of `document`. This prevents
//          stale-selector collisions if a previous render left any
//          orphaned DOM nodes in memory, and mirrors the pattern used
//          by in-transit, order-confirmed, and all other views.
// ════════════════════════════════════════════════════════════════════════

// Handler references kept at module scope so destroy() can remove them
// even though this module is re-imported fresh on each navigation
// (thanks to the ?t= cache-bust in router.js).

import { NotificationService } from '../../utils/notifications.js';

let _handleStarClick = null;
let _handlePillClick = null;
let _handleSubmit    = null;

let _starButtons = [];
let _pillButtons = [];
let _submitBtn   = null;
let _commentsArea = null;

let _rating    = 0;
let _condition = null;

// ── Helpers ─────────────────────────────────────────────────────────────

function validate() {
    if (!_submitBtn) return;
    if (_rating > 0) {
        _submitBtn.classList.add("dv-btn-active");
        _submitBtn.removeAttribute("disabled");
    } else {
        _submitBtn.classList.remove("dv-btn-active");
        _submitBtn.setAttribute("disabled", "true");
    }
}

// ── Lifecycle ────────────────────────────────────────────────────────────

/**
 * init(root)
 * Called by the router after view HTML has been injected into `root`.
 *
 * @param {HTMLElement} root  The #app-content outlet element.
 */
export function init(root) {
    _rating    = 0;
    _condition = null;

    _starButtons  = Array.from(root.querySelectorAll("#dv-stars button"));
    _pillButtons  = Array.from(root.querySelectorAll(".dv-pill"));
    _submitBtn    = root.querySelector("#dv-submit-btn");
    _commentsArea = root.querySelector("#dv-comments");

    // Guard: if any required element is missing the HTML is mismatched —
    // log clearly instead of throwing a cryptic TypeError.
    if (!_submitBtn) {
        console.error(
            "[delivered/view.js] #dv-submit-btn not found in the rendered HTML. " +
            "The router may have injected a stale cached version of view.html. " +
            "Check that router.js is fetching with cache:'no-store'."
        );
        return;
    }

    // ── Star rating ───────────────────────────────────────────────────
    _handleStarClick = (e) => {
        const btn = e.currentTarget;
        _rating = parseInt(btn.dataset.value, 10);

        _starButtons.forEach((s, i) => {
            const active = i < _rating;
            s.classList.toggle("dv-star-active", active);
            s.querySelector("svg").setAttribute(
                "fill",
                active ? "currentColor" : "none"
            );
        });

        validate();
    };

    _starButtons.forEach((b) => b.addEventListener("click", _handleStarClick));

    // ── Condition pills ───────────────────────────────────────────────
    _handlePillClick = (e) => {
        const btn = e.currentTarget;
        _condition = btn.dataset.condition;
        _pillButtons.forEach((p) =>
            p.classList.toggle("dv-pill-active", p === btn)
        );
        validate();
    };

    _pillButtons.forEach((b) => b.addEventListener("click", _handlePillClick));

    // ── Submit button ─────────────────────────────────────────────────
    _handleSubmit = () => {
        if (!_submitBtn.classList.contains("dv-btn-active")) return;

        _submitBtn.textContent = "✓ Feedback Submitted!";
        _submitBtn.classList.replace("dv-btn-active", "dv-btn-success");
        _submitBtn.disabled = true;

        [..._starButtons, ..._pillButtons].forEach((el) => {
            el.disabled = true;
        });
        if (_commentsArea) _commentsArea.disabled = true;

        // ── Fire notification + toast ─────────────────────────────────
        NotificationService.add({
            title:   'Feedback Received',
            message: 'Thank you! Your delivery feedback has been recorded.',
            type:    'success',
            icon:    'chat-square-heart-fill',
        });
    };

    _submitBtn.addEventListener("click", _handleSubmit);
}

/**
 * destroy(root)
 * Called by the router before navigating away from this view.
 * Removes all event listeners to prevent memory leaks.
 *
 * @param {HTMLElement} root  The #app-content outlet element.
 */
export function destroy(root) {
    _starButtons.forEach((b) => {
        if (_handleStarClick) b.removeEventListener("click", _handleStarClick);
    });

    _pillButtons.forEach((b) => {
        if (_handlePillClick) b.removeEventListener("click", _handlePillClick);
    });

    if (_submitBtn && _handleSubmit) {
        _submitBtn.removeEventListener("click", _handleSubmit);
    }

    // Reset all module-scope state
    _handleStarClick = null;
    _handlePillClick = null;
    _handleSubmit    = null;
    _starButtons     = [];
    _pillButtons     = [];
    _submitBtn       = null;
    _commentsArea    = null;
    _rating          = 0;
    _condition       = null;
}