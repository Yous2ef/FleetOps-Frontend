// ════════════════════════════════════════════════════════════════════════
// src/router/router.js — FleetOps Customer Portal · SPA Router
//
// FIX LOG (audit 2026-04-25):
//   BUG-1  fetch() had no cache headers — browser returned stale HTML on
//          every SPA navigation after first load. Added { cache:'no-store' }
//          and a ?t= timestamp so the dev-server always serves fresh bytes.
//   BUG-2  dynamic import() shares the browser's module registry — once
//          view.js was imported it was frozen for the lifetime of the tab.
//          Appending ?t=<timestamp> to the specifier forces a new registry
//          entry, guaranteeing the latest code runs after every save.
//   BUG-3  CSS <link> href was a bare relative path ('src/views/…/view.css').
//          Relative hrefs on a <link> injected into <head> resolve against
//          the document URL — fine while all routes sit at depth-1, but
//          brittle and also unbusted. Changed to an absolute path with /
//          prefix + same ?t= stamp used for the other assets.
//   BUG-4  destroy() and init() were called directly on the ES-module
//          namespace object. Views that use "export default { init, destroy }"
//          (e.g. delivered/view.js) expose those functions under .default,
//          not at the top level — so both calls silently no-oped, leaking
//          event listeners and never wiring up the star-rating UI.
//          The helper resolveModule() now handles both export styles.
// ════════════════════════════════════════════════════════════════════════

import { normalizePath, notFoundRoute, routes } from "./routes.js";

// ── Internal helpers ────────────────────────────────────────────────────

/**
 * resolveModule(esModule)
 *
 * Normalises the two export conventions used across view files:
 *
 *   Style A — named exports  (arriving-alerts, order-confirmed, …)
 *     export function init(root) { … }
 *     export function destroy(root) { … }
 *     → routeModule.init / routeModule.destroy   ✓ found at top level
 *
 *   Style B — default-export object  (delivered/view.js)
 *     export default { init() { … }, destroy() { … } }
 *     → routeModule.default.init / routeModule.default.destroy
 *
 * Returns whichever object actually carries init/destroy.
 *
 * @param {object} esModule  The raw ES module namespace from import()
 * @returns {{ init?: Function, destroy?: Function }}
 */
function resolveModule(esModule) {
    if (typeof esModule?.init === "function") return esModule;
    if (typeof esModule?.default?.init === "function") return esModule.default;
    // Module has no recognised lifecycle — return empty object so callers
    // can check .init / .destroy safely without further null guards.
    return esModule?.default ?? esModule ?? {};
}

// ── Router factory ──────────────────────────────────────────────────────

export function initRouter({ outletId }) {
    const outlet = document.getElementById(outletId);

    if (!outlet) {
        throw new Error(`Router outlet #${outletId} was not found.`);
    }

    /**
     * Resolved lifecycle object from the current view module.
     * Held so destroy() can be called before each navigation.
     * @type {{ init?: Function, destroy?: Function } | null}
     */
    let currentViewModule = null;

    /** The <link> element injected for the current view's CSS. */
    let currentRouteStylesheet = null;

    // ── Core render function ──────────────────────────────────────────

    async function renderCurrentRoute() {
        const currentPath = normalizePath(window.location.pathname);
        const activeRoute =
            routes.find((r) => r.path === currentPath) ?? notFoundRoute;

        // ── 1. Teardown previous view ─────────────────────────────────
        if (currentViewModule?.destroy) {
            currentViewModule.destroy(outlet);
        }

        // ── 2. Fetch HTML — BUG-1 FIX ────────────────────────────────
        //   • cache: 'no-store'  → skip reading from / writing to the
        //     HTTP cache entirely; the browser always goes to the network.
        //   • ?t=<timestamp>     → secondary defence; some proxies and
        //     VS Code Live Server edge cases still honour ETags even when
        //     Cache-Control says no-store. The timestamp makes the URL
        //     unique per render, guaranteeing a fresh response.
        const ts = Date.now();
        const htmlUrl = `/${activeRoute.view.html}?t=${ts}`;
        const htmlResponse = await fetch(htmlUrl, { cache: "no-store" });

        if (!htmlResponse.ok) {
            throw new Error(
                `Failed to load HTML view: ${activeRoute.view.html} ` +
                `(HTTP ${htmlResponse.status})`
            );
        }

        const html = await htmlResponse.text();

        // ── 3. Swap CSS — BUG-3 FIX ──────────────────────────────────
        //   Old stylesheet removed before the new one is appended so there
        //   is never a flash of un-styled content from a lingering rule.
        //   Absolute path (/ prefix) + same timestamp bust the CSS cache.
        if (currentRouteStylesheet) {
            currentRouteStylesheet.remove();
        }

        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = `/${activeRoute.view.css}?t=${ts}`;   // BUG-3 FIX
        stylesheet.dataset.routeStyle = activeRoute.path;
        document.head.appendChild(stylesheet);
        currentRouteStylesheet = stylesheet;

        // ── 4. Render HTML into the outlet ───────────────────────────
        document.title = activeRoute.title;
        outlet.innerHTML = html;

        // ── 5. Import view module — BUG-2 FIX ────────────────────────
        //   Appending ?t=<timestamp> creates a distinct module specifier
        //   on every navigation, bypassing the browser's module registry
        //   cache. The server (Live Server) ignores query strings on JS
        //   files and always serves the file from disk.
        //
        //   Same `ts` value used for HTML/CSS keeps all three assets from
        //   the same "snapshot", which helps during rapid file saves.
        const jsUrl = `/${activeRoute.view.js}?t=${ts}`;        // BUG-2 FIX
        const rawModule = await import(/* @vite-ignore */ jsUrl);

        // ── 6. Resolve module shape — BUG-4 FIX ──────────────────────
        const viewModule = resolveModule(rawModule);
        currentViewModule = viewModule;

        if (viewModule.init) {
            viewModule.init(outlet);
        }

        // ── 7. Update nav active state & notify listeners ─────────────
        setActiveLink(activeRoute.path);

        window.dispatchEvent(
            new CustomEvent("route:changed", {
                detail: { path: activeRoute.path },
            })
        );
    }

    // ── Navigation helpers ────────────────────────────────────────────

    function navigateTo(path) {
        const targetPath = normalizePath(path);
        const currentPath = normalizePath(window.location.pathname);

        if (targetPath === currentPath) return;

        window.history.pushState({}, "", targetPath);
        renderCurrentRoute().catch(handleRenderError);
    }

    function handleLinkNavigation(event) {
        const link = event.target.closest("a[data-link]");
        if (!link) return;

        const href = link.getAttribute("href");
        if (!href || href.startsWith("http")) return;

        event.preventDefault();
        navigateTo(href);
    }

    function setActiveLink(pathname) {
        document
            .querySelectorAll(".navbar__link[data-route]")
            .forEach((link) => {
                link.classList.toggle(
                    "is-active",
                    link.getAttribute("data-route") === pathname
                );
            });
    }

    function handleRenderError(error) {
        console.error("[Router] Render error:", error);
        outlet.innerHTML = `
            <section class="view-page stack">
                <h1 class="heading-lg">Unexpected Error</h1>
                <p>Could not render this page. Please retry.</p>
                <pre style="font-size:0.75rem;color:var(--status-danger);margin-top:8px;white-space:pre-wrap">${error?.message ?? error}</pre>
            </section>
        `;
    }

    // ── Event listeners ───────────────────────────────────────────────

    const handlePopState = () => renderCurrentRoute().catch(handleRenderError);

    document.addEventListener("click", handleLinkNavigation);
    window.addEventListener("popstate", handlePopState);

    // Initial render
    renderCurrentRoute().catch(handleRenderError);

    // ── Public API ────────────────────────────────────────────────────

    return {
        navigateTo,
        destroy() {
            document.removeEventListener("click", handleLinkNavigation);
            window.removeEventListener("popstate", handlePopState);

            if (currentViewModule?.destroy) {
                currentViewModule.destroy(outlet);
            }
            if (currentRouteStylesheet) {
                currentRouteStylesheet.remove();
            }
        },
    };
}