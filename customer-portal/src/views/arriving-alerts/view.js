// ════════════════════════════════════════════════════════════════════════
// src/views/arriving-alerts/view.js
//
// REFACTOR (real API, 2026-05-05):
//   init() now awaits CustomerPortalAPI.fetchOrder() and fetchTracking()
//   which call GET /customer-portal/orders/{token} and
//   GET /customer-portal/orders/{token}/tracking on the Laravel backend.
//   Customer preferences (delivery instructions) are embedded in the order.
//
// MAP (2026-05-12):
//   Leaflet map is initialised inside #aa-tracking-map (replaces the SVG
//   pin/ripple placeholder). invalidateSize() fires after 500 ms to prevent
//   the gray-tile bug in dynamically-injected SPA views.
// ════════════════════════════════════════════════════════════════════════

import { fetchOrder, fetchTracking } from '../../services/api/customer-portal.js';

let cleanups = [];

/** @type {import('leaflet').Map|null} */
let trackingMap = null;

// ── Leaflet loader ───────────────────────────────────────────────────────

/**
 * loadLeaflet()
 *
 * Dynamically injects the Leaflet.js script (if not already loaded).
 * Returns a Promise that resolves once `window.L` is available.
 *
 * @returns {Promise<void>}
 */
function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Leaflet.js'));
    document.head.appendChild(script);
  });
}

// ── Map initialiser ──────────────────────────────────────────────────────

/**
 * initMap(driverCoords, destCoords, driverName)
 *
 * Initialises a Leaflet map inside `#aa-tracking-map`.
 * Guards against "Map container is already initialized" by calling
 * .remove() on any existing instance first.
 *
 * invalidateSize() is called after 500 ms — this is the reliable fix
 * for the gray / blank tile bug when the container is inside a
 * dynamically-injected SPA view that hasn't fully painted yet.
 *
 * @param {[number,number]} driverCoords  [lat, lng] of the driver
 * @param {[number,number]} destCoords    [lat, lng] of the destination
 * @param {string}          driverName    Label shown in the driver popup
 * @returns {import('leaflet').Map}       The initialised map instance
 */
function initMap(driverCoords, destCoords, driverName) {
  const container = document.getElementById('aa-tracking-map');
  if (!container) return null;

  // ── Destroy any previous instance
  if (trackingMap !== null) {
    trackingMap.remove();
    trackingMap = null;
  }

  // ── Create map
  trackingMap = L.map('aa-tracking-map', {
    zoomControl: false,
    attributionControl: false,
  });
  window.trackingMap = trackingMap;

  // ── OSM tile layer — must be added to the map instance
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(trackingMap);

  setTimeout(() => { 
     if (window.trackingMap) { 
         window.trackingMap.invalidateSize(); 
     } 
  }, 500);

  // ── Driver marker (truck emoji DivIcon)
  const driverIcon = L.divIcon({
    className: '',
    html: `<div class="it-lf-driver-icon">🚚</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  L.marker(driverCoords, { icon: driverIcon })
    .addTo(trackingMap)
    .bindPopup(`<strong>${driverName}</strong><br>Driver location`);

  // ── Destination marker (pin emoji DivIcon)
  const destIcon = L.divIcon({
    className: '',
    html: `<div class="it-lf-dest-icon">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

  L.marker(destCoords, { icon: destIcon })
    .addTo(trackingMap)
    .bindPopup('<strong>Your location</strong><br>Delivery destination');

  // ── Dashed route polyline
  const routeLine = L.polyline([driverCoords, destCoords], {
    color: '#0d9488',
    weight: 3,
    dashArray: '8, 8',
    opacity: 0.85,
  }).addTo(trackingMap);

  // ── Fit both markers
  trackingMap.fitBounds(routeLine.getBounds(), { padding: [30, 30] });

  return trackingMap;
}

// ── Lifecycle: init ──────────────────────────────────────────────────────

export async function init(root) {
  cleanups = [];

  // ── 1. Fetch order & live tracking from the Laravel backend ────────────
  //    GET /customer-portal/orders/{token}
  //    GET /customer-portal/orders/{token}/tracking
  //    Preferences (delivery notes) are embedded in the order payload.
  const [order, tracking] = await Promise.all([
    fetchOrder(),
    fetchTracking(),
  ]);

  // Merge live tracking into the order (driver fields may differ)
  const orderData = tracking
    ? { ...order, driver: { ...order?.driver, ...tracking?.driver }, ...tracking }
    : order;

  if (!orderData) {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  height:100%;padding:32px;text-align:center;gap:16px;">
        <h2 style="font-size:1.1rem;font-weight:700;color:#1e293b;">Missing Tracking Code</h2>
        <p style="font-size:0.9rem;color:#64748b;max-width:280px;">
          Please use the tracking link provided in your SMS/Email
        </p>
      </div>
    `;
    return;
  }

  // Preferences are embedded in the order by the backend
  const preferences = orderData?.preferences ?? null;


  if (orderData) {
    const { driver, amountDue, amountCurrency } = orderData;

    // Distance badge
    const distanceBadge = root.querySelector('.aa-distance-badge');
    if (distanceBadge) {
      distanceBadge.innerHTML = `
        <span class="aa-distance-dot"></span>
        ${driver.distanceAway} AWAY
      `;
    }

    // Payment amount
    const amountEl = root.querySelector('.aa-payment-amount');
    if (amountEl) amountEl.textContent = `${amountCurrency} ${amountDue}`;

    // Driver card
    const driverNameEl = root.querySelector('.aa-driver-details strong');
    if (driverNameEl) driverNameEl.textContent = driver.name;

    const driverMetaEl = root.querySelector('.aa-driver-details span');
    if (driverMetaEl) driverMetaEl.innerHTML = `
      <svg width="11" height="11" viewBox="0 0 24 24"
           fill="var(--status-warning)" stroke="var(--status-warning)" stroke-width="0">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      ${driver.rating} &bull; ${driver.vehicle}
    `;

    // Call driver button
    const callBtn = root.querySelector('.aa-driver-actions a[aria-label="Call driver"]');
    if (callBtn && driver.phone) callBtn.href = `tel:${driver.phone}`;
  }

  // ── 2. Render delivery instructions from preferences ─────────────────
  if (preferences) {
    const instructionsEl = root.querySelector('.aa-instructions-text');
    if (instructionsEl && preferences.notes) {
      instructionsEl.textContent = `"${preferences.notes}"`;
    }
  }

  // ── 3. "I'm Ready" button ────────────────────────────────────────────
  const readyBtn = root.querySelector('#aa-ready-btn');
  if (readyBtn) {
    const handleReady = () => {
      readyBtn.disabled = true;
      readyBtn.innerHTML = `
        <svg class="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Notifying driver...
      `;
      setTimeout(() => {
        if (!document.body.contains(root)) return;
        readyBtn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Driver notified — Stand by!
        `;
        readyBtn.style.opacity = '0.75';
      }, 1500);
    };
    readyBtn.addEventListener('click', handleReady);
    cleanups.push(() => readyBtn.removeEventListener('click', handleReady));
  }

  // ── 4. Message Driver button ─────────────────────────────────────────
  const msgBtn = root.querySelector('#aa-msg-btn');
  if (msgBtn) {
    const handleMsg = () => console.log('[ArrivingAlerts] Message driver triggered');
    msgBtn.addEventListener('click', handleMsg);
    cleanups.push(() => msgBtn.removeEventListener('click', handleMsg));
  }

  // ── 5. Leaflet map ───────────────────────────────────────────────────
  //    Driver coords from API, fall back to mock Cairo coordinates.
  const driverLat  = orderData?.driver?.lat    ?? 30.0626;
  const driverLng  = orderData?.driver?.lng    ?? 31.2497;
  const destLat    = orderData?.destinationLat ?? 30.0444;
  const destLng    = orderData?.destinationLng ?? 31.2357;
  const driverName = orderData?.driver?.name   ?? 'Driver';

  try {
    await loadLeaflet();
    initMap([driverLat, driverLng], [destLat, destLng], driverName);
  } catch (err) {
    console.warn('[ArrivingAlerts] Leaflet failed to load — map will be hidden.', err);
    const mapCard = root.querySelector('.aa-map-card');
    if (mapCard) mapCard.style.display = 'none';
  }

  // ── 6. Re-center button ──────────────────────────────────────────────
  const recenterBtn = root.querySelector('.aa-map-recenter');
  if (recenterBtn) {
    const handleRecenter = () => {
      recenterBtn.style.transform = 'scale(0.88) rotate(360deg)';
      setTimeout(() => {
        if (!document.body.contains(root)) return;
        recenterBtn.style.transform = '';
      }, 300);

      // Re-center the live Leaflet map on the driver's position
      if (trackingMap) {
        trackingMap.setView([driverLat, driverLng], trackingMap.getZoom());
      }
    };
    recenterBtn.addEventListener('click', handleRecenter);
    cleanups.push(() => recenterBtn.removeEventListener('click', handleRecenter));
  }
}

export function destroy(root) {
  cleanups.forEach(fn => fn());
  cleanups = [];

  // Remove the Leaflet instance to prevent "container already initialized"
  // error if the user returns to this view in the same session.
  if (trackingMap !== null) {
    trackingMap.remove();
    trackingMap = null;
  }

  root.innerHTML = '';
}
