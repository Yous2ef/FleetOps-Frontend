# FleetOps Customer Portal — Developer Guide

**Version:** 2.0  
**Stack:** Vanilla JS ES Modules · Custom SPA Router · CSS Custom Properties  
**OS Target:** Fedora Linux (case-sensitive filesystem — rules are strict)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Routing Mechanism](#2-routing-mechanism)
3. [Component Lifecycle](#3-component-lifecycle)
4. [Styling Architecture](#4-styling-architecture)
5. [File System Rules](#5-file-system-rules)
6. [Adding a New View — Step-by-Step](#6-adding-a-new-view--step-by-step)
7. [Navigation & Links](#7-navigation--links)
8. [Core Prohibitions](#8-core-prohibitions)
9. [Delivery Journey Flow](#9-delivery-journey-flow)

---

## 1. Project Structure

```
customer-portal/
├── index.html                        ← App shell (single HTML page)
├── src/
│   ├── main.js                       ← Entry point: initialises router + shell UI
│   ├── styles/
│   │   └── main.css                  ← Global design system (tokens + utilities)
│   ├── router/
│   │   ├── router.js                 ← SPA router engine
│   │   └── routes.js                 ← Route manifest (all paths declared here)
│   ├── services/
│   │   ├── api/
│   │   │   ├── shipments.js
│   │   │   └── users.js
│   │   └── storage/
│   │       ├── shipments.js
│   │       └── users.js
│   └── views/
│       ├── order-confirmed/          ← kebab-case folder, always
│       │   ├── view.html             ← DOM fragment (no <html>/<head>/<body>)
│       │   ├── view.css              ← Scoped styles for this view only
│       │   └── view.js               ← Lifecycle module (mount / unmount)
│       ├── in-transit/
│       ├── arriving-alerts/
│       ├── delivered/
│       ├── delivery-failed/
│       ├── link-expired/
│       ├── deliver-preferences/
│       └── not-found/
```

---

## 2. Routing Mechanism

### How it works end-to-end

The SPA never performs a full page reload. Instead, `router.js` intercepts all navigation, fetches view assets dynamically, and swaps content into `#app-content`.

### Boot sequence (`main.js` → `router.js`)

```
DOMContentLoaded
  └── initRouter({ outletId: 'app-content' })
        └── renderCurrentRoute()          ← renders initial URL on page load
```

### `renderCurrentRoute()` — the render pipeline

```
1. normalizePath(window.location.pathname)
      ↓ normalised path string (e.g. '/in-transit')
2. routes.find(r => r.path === currentPath) ?? notFoundRoute
      ↓ matched route object { path, title, view: { html, css, js } }
3. currentRouteModule?.unmount(outlet)    ← teardown previous view
4. fetch(view.html)                        ← load HTML fragment
5. inject HTML → outlet.innerHTML
6. <link rel="stylesheet" href="view.css"> ← inject scoped CSS into <head>
7. import(view.js)                         ← dynamic ES module import
8. routeModule.mount(outlet)               ← activate view logic
9. setActiveLink(path)                     ← highlight sidebar nav link
10. dispatchEvent('route:changed', path)  ← topbar title update (main.js)
```

### Link interception (`data-link`)

The router listens at the **document level** with a single delegated click handler:

```javascript
// router.js — simplified
document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');
    if (!link) return;                          // not a router link — ignore
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http')) return; // external — let browser handle
    event.preventDefault();
    navigateTo(href);                           // push to History API & re-render
});
```

**Rule:** Every internal `<a>` tag **must** carry `data-link`. Without it, the browser performs a full page reload.

### `navigateTo(path)`

```javascript
function navigateTo(path) {
    const target  = normalizePath(path);
    const current = normalizePath(window.location.pathname);
    if (target === current) return;             // no-op: already on this page
    window.history.pushState({}, '', target);
    renderCurrentRoute();
}
```

### Back / forward navigation

`window.addEventListener('popstate', renderCurrentRoute)` — the router handles browser history natively.

### `normalizePath(pathname)`

| Input | Output |
|---|---|
| `/` | `/order-confirmed` (via `defaultRedirect`) |
| `/index.html` | `/order-confirmed` |
| `/delivered/` | `/delivered` (trailing slash stripped) |
| `/delivered` | `/delivered` |

---

## 3. Component Lifecycle

Every `view.js` module must export exactly **two named functions**:

```javascript
export async function mount(root) { ... }
export function unmount(root) { ... }
```

### `mount(root: HTMLElement): Promise<void>`

Called **after** the HTML has been injected into `root` (`#app-content`).  
`root` is a live reference to the router outlet — the real DOM node.

Responsibilities:
- Attach event listeners
- Fetch data from APIs
- Start timers / intervals
- Animate elements in
- Register all cleanups into a local `cleanups[]` array

**Guard pattern for async operations:**

```javascript
export async function mount(root) {
    const data = await fetchSomeData();

    // Guard: the user may have navigated away during the await
    if (!document.body.contains(root)) return;

    // Safe to mutate DOM now
    root.querySelector('.my-el').textContent = data.value;
}
```

### `unmount(root: HTMLElement): void`

Called **before** the router clears `root.innerHTML` for the next view.

Responsibilities:
- Remove all event listeners registered in `mount`
- Clear all timers (`clearInterval`, `clearTimeout`)
- Reset module-level state to initial values
- Set `root.innerHTML = ''` as the final step

**Canonical pattern:**

```javascript
// Module-level: survives between renders if cached, so must be reset in unmount
let cleanups = [];
let myInterval = null;

export async function mount(root) {
    cleanups.length = 0;            // always reset first

    const btn = root.querySelector('#my-btn');
    const handleClick = () => { /* ... */ };

    btn.addEventListener('click', handleClick);
    cleanups.push(() => btn.removeEventListener('click', handleClick));

    myInterval = setInterval(tick, 1000);
    cleanups.push(() => clearInterval(myInterval));
}

export function unmount(root) {
    cleanups.forEach(fn => fn());
    cleanups = [];
    myInterval = null;
    root.innerHTML = '';             // always last
}
```

### Why `root.innerHTML = ''` in `unmount`?

The router calls `unmount` before setting `outlet.innerHTML = newHtml`.  
If `unmount` forgets to clear, the old and new HTML will overlap briefly.  
Clearing inside `unmount` guarantees a clean handoff regardless of router timing.

---

## 4. Styling Architecture

### The single source of truth: `:root` in `main.css`

All visual tokens are declared once in `src/styles/main.css`:

```css
:root {
  --accent-primary:  #10B981;
  --accent-hover:    #059669;
  --text-primary:    #4B5563;
  --text-secondary:  #6B7280;
  --text-inverse:    #FFFFFF;
  --bg-base:         #F9FAFB;
  --bg-surface:      #FFFFFF;
  --bg-hover:        #F3F4F6;
  --border-subtle:   #E5E7EB;
  --status-success:  #10B981;
  --status-warning:  #F59E0B;
  --status-danger:   #EF4444;
  --font-display:    'Manrope', sans-serif;
  --font-body:       'Inter', sans-serif;
  --radius-sm:       8px;
  --radius-md:       12px;
  --radius-lg:       24px;
  --radius-pill:     9999px;
  --shadow-card:     0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);
  --shadow-sm:       0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md:       0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.04);
  --transition:      200ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}
```

### How view CSS is loaded

The router injects a `<link>` tag for each view's `view.css` on navigation:

```javascript
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = activeRoute.view.css;
document.head.appendChild(stylesheet);
```

The previous view's stylesheet is **removed** first:
```javascript
if (currentRouteStylesheet) currentRouteStylesheet.remove();
```

This means `view.css` files are **not** all loaded at once — only the active route's CSS is in the DOM.

### CSS naming conventions

Use a **2–3 letter view prefix** for all classes to prevent collisions:

| View | Prefix | Example class |
|---|---|---|
| `order-confirmed` | `oc-` | `.oc-hero-card` |
| `in-transit` | `it-` | `.it-map-card` |
| `arriving-alerts` | `aa-` | `.aa-alert-banner` |
| `delivered` | `dv-` | `.dv-feedback-card` |
| `delivery-failed` | `df-` | `.df-timeline-card` |
| `link-expired` | `le-` | `.le-icon-core` |
| `deliver-preferences` | `dp-` | `.dp-pref-card` |

### The `color-mix()` pattern (no raw hex codes)

Derive tints and shades from tokens using CSS `color-mix()`:

```css
/* ✅ Correct — derives from a token */
background-color: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-surface));
border-color:     color-mix(in srgb, var(--status-danger) 22%, var(--border-subtle));

/* ❌ Forbidden — raw hex */
background-color: #d1fae5;
```

### Global utility classes (from `main.css`)

`main.css` provides a utility layer. Use these in `view.html` before writing custom CSS:

**Layout:** `.stack`, `.stack--gap-16`, `.cluster`, `.cluster--between`, `.grid-2`, `.grid-3`, `.center`, `.flex-1`  
**Typography:** `.text-sm`, `.text-lg`, `.font-bold`, `.text-secondary`, `.text-accent`, `.uppercase`, `.tracking-wide`  
**Components:** `.card`, `.card--flat`, `.card--soft`, `.btn`, `.btn--primary`, `.btn--outlined`, `.badge`, `.badge--in_transit`, `.form-input`, `.table`  
**Animations:** `.animate-spin`, `.skeleton`

### Global animations (from `main.css`)

| Keyframe name | Usage |
|---|---|
| `view-rise` | Standard view entrance (`animation: view-rise 0.45s ...`) |
| `view-fade` | Fade-only entrance |
| `view-scale-in` | Scale + fade entrance |
| `pulse-ring` | Pulsing dot indicators |
| `bounce-in` | Icon/element pop-in |
| `spin` | Loading spinners (`.animate-spin`) |
| `shimmer` | Skeleton loading shimmer (`.skeleton`) |
| `ripple-out` | Expanding ring effects |

---

## 5. File System Rules

### ⚠️ Critical: Fedora Linux is case-sensitive

The filesystem treats `MyView` and `myview` and `my-view` as **three different folders**. The server will return 404 if the case is wrong.

### Mandatory naming rules

| Item | Rule | ✅ Correct | ❌ Wrong |
|---|---|---|---|
| View folders | strict kebab-case | `delivery-failed/` | `DeliveryFailed/` |
| View files | always lowercase | `view.html` | `View.HTML` |
| CSS class names | kebab-case | `.oc-hero-card` | `.ocHeroCard` |
| Route paths | lowercase with hyphens | `/arriving-alerts` | `/ArrivingAlerts` |
| JS variables | camelCase | `const myView` | `const my_view` |
| Imports | must match exact path | `'../../views/order-confirmed/view.js'` | `'../../views/OrderConfirmed/view.js'` |

### File triplet rule

Every view **must** have exactly three files. The router will throw an error if any is missing:

```
src/views/my-new-view/
├── view.html    ← required: DOM fragment
├── view.css     ← required: scoped styles
└── view.js      ← required: exports mount() and unmount()
```

### Route registration is mandatory

A view folder with files does **nothing** until it is added to `routes.js`:

```javascript
// src/router/routes.js
{
    path: '/my-new-view',
    title: 'My New View | FleetOps',
    view: {
        html: '/src/views/my-new-view/view.html',
        css:  '/src/views/my-new-view/view.css',
        js:   '/src/views/my-new-view/view.js',
    },
},
```

---

## 6. Adding a New View — Step-by-Step

Follow these steps **in order**:

### Step 1 — Create the folder

```bash
mkdir -p src/views/my-new-view
```

### Step 2 — Create `view.html` (DOM fragment only)

```html
<!-- src/views/my-new-view/view.html -->
<!-- NO <!DOCTYPE>, <html>, <head>, or <body> tags -->
<div class="mn-view">
  <div class="card">
    <h2>My New View</h2>
    <p class="text-secondary">Content goes here.</p>
    <a href="/order-confirmed" data-link class="btn btn--primary">Go Home</a>
  </div>
</div>
```

### Step 3 — Create `view.css`

```css
/* src/views/my-new-view/view.css */
/* Use the mn- prefix for all classes in this view */

.mn-view {
  animation: view-rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* All colour values MUST use CSS custom properties */
/* ✅ var(--accent-primary)          */
/* ✅ color-mix(in srgb, ...)        */
/* ❌ #10B981  ← raw hex: FORBIDDEN  */
```

### Step 4 — Create `view.js`

```javascript
// src/views/my-new-view/view.js

let cleanups = [];

export async function mount(root) {
    cleanups.length = 0;

    // 1. Query elements
    const btn = root.querySelector('#my-btn');

    // 2. Define handlers
    const handleClick = () => console.log('clicked');

    // 3. Attach + register cleanup
    if (btn) {
        btn.addEventListener('click', handleClick);
        cleanups.push(() => btn.removeEventListener('click', handleClick));
    }

    // 4. Async guard pattern
    // const data = await fetchData();
    // if (!document.body.contains(root)) return;
}

export function unmount(root) {
    cleanups.forEach(fn => fn());
    cleanups = [];
    root.innerHTML = '';
}
```

### Step 5 — Register in `routes.js`

```javascript
// src/router/routes.js
{
    path: '/my-new-view',
    title: 'My New View | FleetOps',
    view: {
        html: '/src/views/my-new-view/view.html',
        css:  '/src/views/my-new-view/view.css',
        js:   '/src/views/my-new-view/view.js',
    },
},
```

### Step 6 — Add nav link in `index.html`

```html
<li>
  <a href="/my-new-view" class="nav-link" data-link data-route="/my-new-view">
    <!-- SVG icon here -->
    My New View
  </a>
</li>
```

---

## 7. Navigation & Links

### Internal SPA navigation

Always use `<a>` with both `data-link` and `href`:

```html
<!-- ✅ Correct internal link -->
<a href="/delivered" data-link class="btn btn--primary">View Delivery</a>

<!-- ❌ Missing data-link — triggers full page reload -->
<a href="/delivered" class="btn btn--primary">View Delivery</a>
```

For sidebar links, also add `data-route` so the router can highlight the active link:

```html
<a href="/in-transit" class="nav-link" data-link data-route="/in-transit">
  In Transit
</a>
```

### Programmatic navigation (from view.js)

Import the router instance, or use the browser History API directly:

```javascript
// Option A: dispatch a custom event the router's navigateTo can handle
window.history.pushState({}, '', '/delivered');
window.dispatchEvent(new PopStateEvent('popstate'));

// Option B: use the router's navigateTo (if you have access to the router instance)
// router.navigateTo('/delivered');
```

### External links

External links do **not** need `data-link` — the router will pass them through:

```html
<a href="https://help.fleetops.delivery" target="_blank" rel="noopener noreferrer">
  Help Center
</a>
```

---

## 8. Core Prohibitions

These rules are **non-negotiable** for all contributors:

| # | Rule | Reason |
|---|---|---|
| 1 | **No raw hex codes in CSS** | All colours must come from `var(--*)` tokens or `color-mix()`. Hex codes scatter the design system and break theme consistency. |
| 2 | **No `<html>`, `<head>`, or `<body>` in `view.html`** | The router uses `innerHTML` injection. A full HTML document inside `innerHTML` produces broken, unparseable markup. |
| 3 | **No internal `<a>` without `data-link`** | Missing `data-link` bypasses the router, causing full page reloads and losing application state. |
| 4 | **No PascalCase or UPPERCASE folder names** | Fedora Linux is case-sensitive. `MyView/` and `my-view/` are different directories. `my-view/` is the only valid form. |
| 5 | **No global CSS in `view.css`** | Selectors like `body { }` or `h1 { }` in a view's CSS will bleed into every other view because the `<link>` tag is not removed immediately. Always scope to the view root (e.g., `.oc-view h1 { }`). |
| 6 | **No unregistered routes** | Creating view files without adding them to `routes.js` makes them unreachable. The router has no file-system scanner. |
| 7 | **No event listeners without cleanup** | Every `addEventListener` in `mount` must have a corresponding `removeEventListener` pushed into `cleanups[]`, called in `unmount`. Forgotten listeners accumulate across navigations and cause memory leaks. |
| 8 | **No DOM mutation after async without guard** | After any `await`, check `if (!document.body.contains(root)) return` before touching the DOM. The user may have navigated away. |

---

## 9. Delivery Journey Flow

The views model a linear customer-facing delivery lifecycle:

```
/order-confirmed
       │
       ▼
/in-transit
       │
       ▼
/arriving-alerts
       │
       ▼
/delivered
       
       ─── Exception paths ───

/in-transit or /arriving-alerts
       │
       ▼ (failed attempt)
/delivery-failed
       │
       ├── /deliver-preferences  (reschedule / update instructions)
       │
       └── (link becomes invalid after N days)
              ▼
       /link-expired
```

### Route manifest summary

| Path | Title | Description |
|---|---|---|
| `/order-confirmed` | Order Confirmed | Package accepted, awaiting dispatch |
| `/in-transit` | In Transit | Driver en route, live ETA |
| `/arriving-alerts` | Driver Arriving | Driver < 5 minutes away, ready CTA |
| `/delivered` | Delivered | Success state + feedback form |
| `/delivery-failed` | Delivery Failed | Missed delivery, reschedule options |
| `/deliver-preferences` | Preferences | Update delivery instructions |
| `/link-expired` | Link Expired | Tracking token invalidated |
| `/404` | Not Found | Catch-all for unrecognised paths |