// ════════════════════════════════════════════════════════════════════════
// src/views/in-transit/view.js
// ════════════════════════════════════════════════════════════════════════

import { fetchOrder, fetchTracking } from '../../services/api/customer-portal.js';
import TrackingStore from '../../services/tracking-store.js';

let itCleanups = [];

/** @type {import('leaflet').Map|null} — holds the Leaflet map instance */
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
 * Initialises a Leaflet map inside `#tracking-map`.
 * Guards against the "Map container is already initialized" error by
 * calling .remove() on any existing instance first.
 *
 * @param {[number,number]} driverCoords  [lat, lng] of the driver
 * @param {[number,number]} destCoords    [lat, lng] of the destination
 * @param {string}          driverName    Label shown inside the driver marker popup
 */
function initMap(driverCoords, destCoords, driverName) {
  const container = document.getElementById('tracking-map');
  if (!container) return;

  setTimeout(() => {
    // 1. Initialize Map
    if (window.trackingMap) { window.trackingMap.remove(); }
    window.trackingMap = L.map('tracking-map').setView(driverCoords, 13);
    
    // 2. Add Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(window.trackingMap);

    // ── Driver marker (teal circular icon using DivIcon)
    const driverIcon = L.divIcon({
      className: '',
      html: `<div class="it-lf-driver-icon">🚚</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const driverMarker = L.marker(driverCoords, { icon: driverIcon })
      .addTo(window.trackingMap)
      .bindPopup(`<strong>${driverName}</strong><br>Driver location`);

    // ── Destination marker (red pin using DivIcon)
    const destIcon = L.divIcon({
      className: '',
      html: `<div class="it-lf-dest-icon">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    L.marker(destCoords, { icon: destIcon })
      .addTo(window.trackingMap)
      .bindPopup('<strong>Your location</strong><br>Delivery destination');

    // ── Dashed polyline connecting driver → destination (simulated route)
    const routeLine = L.polyline([driverCoords, destCoords], {
      color: '#0d9488',
      weight: 3,
      dashArray: '8, 8',
      opacity: 0.85,
    }).addTo(window.trackingMap);

    // ── Auto-zoom to fit both markers with padding
    window.trackingMap.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

    // 3. THE FIX: Force resize after 500ms
    setTimeout(() => {
        if (window.trackingMap) {
            window.trackingMap.invalidateSize(true);
            console.log("Map forced to re-render.");
        }
    }, 500);
  }, 100);
}

// ── Lifecycle: init ──────────────────────────────────────────────────────

export async function init(root, preloadedData = null) {
  itCleanups = [];

  // ── 1. Use data passed by the orchestrator (avoids a duplicate fetch) ────
  //    Falls back to individual API calls if this view is reached directly
  //    (e.g. user navigates to /in-transit without going through /track).
  let orderData = preloadedData ?? TrackingStore.get();

  if (!orderData) {
    // Fallback: try direct API calls (e.g. user bookmarked /in-transit)
    try {
      const [order, tracking] = await Promise.all([
        fetchOrder(),
        fetchTracking(),
      ]);
      orderData = tracking
        ? { ...order, driver: { ...order?.driver, ...tracking?.driver }, ...tracking }
        : order;
    } catch (err) {
      console.warn('[InTransit] Direct fetch failed:', err.message);
    }
  }

  // ── Missing token guard ───────────────────────────────────────────
  if (!orderData) {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  height:100%;padding:32px;text-align:center;gap:16px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
             stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2 style="font-size:1.1rem;font-weight:700;color:#1e293b;">Missing Tracking Code</h2>
        <p style="font-size:0.9rem;color:#64748b;max-width:280px;">
          Please use the tracking link provided in your SMS/Email
        </p>
      </div>
    `;
    return;
  }

  if (orderData) {
    const { driver, deliveryAddress } = orderData;

    // ETA card
    const etaText = root.querySelector('.it-eta-text');
    if (etaText) etaText.textContent = `Arriving in ~${driver.etaMinutes} minutes`;

    const expectedEl = root.querySelector('.it-expected');
    if (expectedEl) expectedEl.textContent = `Expected at ${driver.expectedAt}`;

    const stopBadge = root.querySelector('.it-stop-badge');
    if (stopBadge) stopBadge.textContent = `STOP ${driver.currentStop} OF ${driver.totalStops}`;

    // Driver card
    const driverImg = root.querySelector('.it-driver-img');
    if (driverImg) {
      driverImg.src = driver.avatarUrl;
      driverImg.alt = driver.fullName;
    }

    const driverName = root.querySelector('.it-driver-name');
    if (driverName) driverName.textContent = driver.fullName;

    const driverDesc = root.querySelector('.it-driver-desc');
    if (driverDesc) driverDesc.textContent = driver.vehicleType;

    // Delivery address in accordion
    const addressEl = root.querySelector('.it-accordion-content p');
    if (addressEl) addressEl.textContent = deliveryAddress;

    // Header order number
    const orderIdEl = root.querySelector('.it-order-id');
    if (orderIdEl) orderIdEl.textContent = `#${orderData.id}`;
  }

  // ── 2. Order Summary accordion ───────────────────────────────────────
  const summaryAcc = root.querySelector('#it-summary-accordion');
  if (summaryAcc) {
    const header = summaryAcc.querySelector('.it-accordion-header');
    const handleToggle = () => summaryAcc.classList.toggle('open');
    header.addEventListener('click', handleToggle);
    itCleanups.push(() => header.removeEventListener('click', handleToggle));
  }

  // ── 3. Driver action buttons ─────────────────────────────────────────
  const callBtn = root.querySelector('#it-btn-call');
  const chatBtn = root.querySelector('#it-btn-chat');

  if (callBtn && orderData?.driver?.phone) {
    callBtn.onclick = () => { window.location.href = `tel:${orderData.driver.phone}`; };
  }
  if (chatBtn) {
    chatBtn.onclick = () => console.log('[InTransit] Chat with driver triggered');
  }

  // ── 4. Initialise Leaflet map ─────────────────────────────────────────
  //    Driver coords: from API if available, otherwise mock Cairo coordinates.
  //    Destination coords: from API if available, otherwise mock destination.
  //    Guard: orderData may be null if token is unavailable — map is skipped.
  if (orderData) {
    const driverLat  = orderData?.driver?.lat     ?? 30.0626;
    const driverLng  = orderData?.driver?.lng     ?? 31.2497;
    const destLat    = orderData?.destinationLat  ?? 30.0444;
    const destLng    = orderData?.destinationLng  ?? 31.2357;
    const driverName = orderData?.driver?.fullName ?? 'Driver';

    try {
      await loadLeaflet();
      initMap([driverLat, driverLng], [destLat, destLng], driverName);
    } catch (err) {
      console.warn('[InTransit] Leaflet failed to load — map will be hidden.', err);
      const mapWrapper = root.querySelector('.it-map-wrapper');
      if (mapWrapper) mapWrapper.style.display = 'none';
    }
  }
}

// ── Lifecycle: destroy ───────────────────────────────────────────────────

export function destroy(root) {
  itCleanups.forEach(fn => fn());
  itCleanups = [];

  // Remove the Leaflet map instance to prevent "container already initialized"
  // error on re-entry to this view.
  if (trackingMap !== null) {
    trackingMap.remove();
    trackingMap = null;
  }

  root.innerHTML = '';
}
