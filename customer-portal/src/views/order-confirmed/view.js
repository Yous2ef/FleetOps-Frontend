import { NotificationService } from '../../utils/notifications.js';

// ── Seeded demo notifications ────────────────────────────────────────
// Simulates real-world events that would arrive from a backend.
// Each call to add() stores a notification AND fires a toast — so we
// stagger them slightly to avoid visual collision on first load.
const DEMO_NOTIFICATIONS = [
  {
    title:   'Breakdown — EGY-5678',
    message: 'Driver Ahmed Mahmoud reported a breakdown on Ring Road. Transmission failure.',
    type:    'danger',
    icon:    'lightning-charge-fill',
  },
  {
    title:   'Insurance Expiry — EGY-5678',
    message: 'Vehicle EGY-5678 insurance expires in 10 days on April 25, 2026.',
    type:    'warning',
    icon:    'shield-exclamation',
  },
  {
    title:   'Low Stock — Transmission Fluid',
    message: 'Transmission Fluid is out of stock. Please reorder immediately.',
    type:    'warning',
    icon:    'droplet-half',
  },
  {
    title:   'WO-2039 Resolved',
    message: 'Karim Hassan resolved Work Order WO-2039 for EGY-1234. Ready for review.',
    type:    'info',
    icon:    'check-circle-fill',
  },
  {
    title:   'Inspection Expiry — EGY-5678',
    message: 'Annual inspection for EGY-5678 expired on March 1, 2026. Schedule immediately.',
    type:    'warning',
    icon:    'calendar-x-fill',
  },
];

let _demoSeeded = false;

export function init(root) {
  // Seed demo notifications once per app session so repeated visits
  // to this view don't duplicate entries in the history list.
  if (!_demoSeeded) {
    _demoSeeded = true;
    DEMO_NOTIFICATIONS.forEach((n, i) => {
      // Stagger toasts by 600 ms so they don't all pop at once
      setTimeout(() => NotificationService.add(n), i * 600);
    });
  }

  const notifyBtn = root.querySelector('#oc-notify-btn');
  if (notifyBtn) {
    notifyBtn.onclick = () => {
      notifyBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Notifications Enabled';
      notifyBtn.style.background = 'var(--status-success)';
      notifyBtn.disabled = true;
      syncPromoBtn();
    };
  }

  const promoBtn = root.querySelector('#oc-promo-notify-btn');
  if (promoBtn) {
    promoBtn.onclick = () => {
      promoBtn.textContent = 'Notifications On';
      promoBtn.disabled = true;
      syncMainBtn();
    };
  }

  function syncPromoBtn() {
    const pb = root.querySelector('#oc-promo-notify-btn');
    if (pb) {
      pb.textContent = 'Notifications On';
      pb.disabled = true;
    }
  }

  function syncMainBtn() {
    const mb = root.querySelector('#oc-notify-btn');
    if (mb) {
      mb.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Notifications Enabled';
      mb.style.background = 'var(--status-success)';
      mb.disabled = true;
    }
  }
}

export function destroy(root) {
  root.innerHTML = '';
}