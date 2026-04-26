// ════════════════════════════════════════════════════════════════════════
// src/views/in-transit/view.js
//
// REFACTOR (data-driven, 2026-04-26):
//   init() awaits StorageService.get('order') and dynamically renders:
//   driver name, vehicle, ETA, stop count, and delivery address.
// ════════════════════════════════════════════════════════════════════════

import { StorageService } from '../../utils/storage.js';

let itCleanups = [];

export async function init(root) {
  itCleanups = [];

  // ── 1. Fetch order data ──────────────────────────────────────────────
  const order = await StorageService.get('order');

  if (order) {
    const { driver, deliveryAddress } = order;

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

    // Map bubble label
    const driverBubble = root.querySelector('.it-driver-bubble span');
    if (driverBubble) driverBubble.textContent = driver.fullName;

    // Delivery address in accordion
    const addressEl = root.querySelector('.it-accordion-content p');
    if (addressEl) addressEl.textContent = deliveryAddress;

    // Header order number
    const orderIdEl = root.querySelector('.it-order-id');
    if (orderIdEl) orderIdEl.textContent = `#${order.id}`;
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

  if (callBtn && order?.driver?.phone) {
    callBtn.onclick = () => { window.location.href = `tel:${order.driver.phone}`; };
  }
  if (chatBtn) {
    chatBtn.onclick = () => console.log('[InTransit] Chat with driver triggered');
  }
}

export function destroy(root) {
  itCleanups.forEach(fn => fn());
  itCleanups = [];
  root.innerHTML = '';
}
