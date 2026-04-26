// ════════════════════════════════════════════════════════════════════════
// src/views/arriving-alerts/view.js
//
// REFACTOR (data-driven, 2026-04-26):
//   init() awaits StorageService.get('order') for driver/payment data
//   and StorageService.get('preferences') for delivery instructions.
// ════════════════════════════════════════════════════════════════════════

import { StorageService } from '../../utils/storage.js';

let cleanups = [];

export async function init(root) {
  cleanups = [];

  // ── 1. Fetch data in parallel ────────────────────────────────────────
  const [order, preferences] = await Promise.all([
    StorageService.get('order'),
    StorageService.get('preferences'),
  ]);

  if (order) {
    const { driver, amountDue, amountCurrency } = order;

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

  // ── 5. Re-center button ──────────────────────────────────────────────
  const recenterBtn = root.querySelector('.aa-map-recenter');
  if (recenterBtn) {
    const handleRecenter = () => {
      recenterBtn.style.transform = 'scale(0.88) rotate(360deg)';
      setTimeout(() => {
        if (!document.body.contains(root)) return;
        recenterBtn.style.transform = '';
      }, 300);
    };
    recenterBtn.addEventListener('click', handleRecenter);
    cleanups.push(() => recenterBtn.removeEventListener('click', handleRecenter));
  }
}

export function destroy(root) {
  cleanups.forEach(fn => fn());
  cleanups = [];
  root.innerHTML = '';
}
