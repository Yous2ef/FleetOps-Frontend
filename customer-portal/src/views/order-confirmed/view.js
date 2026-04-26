// ════════════════════════════════════════════════════════════════════════
// src/views/order-confirmed/view.js
//
// REFACTOR (data-driven, 2026-04-26):
//   init() now awaits StorageService.get('order') and dynamically
//   renders: delivery address, expected arrival, order items,
//   item count badge, order total, and the progress timeline.
//
//   To swap in a real API, replace StorageService with:
//     const order = await fetch('/api/orders/current').then(r => r.json());
// ════════════════════════════════════════════════════════════════════════

import { StorageService }     from '../../utils/storage.js';
import { NotificationService } from '../../utils/notifications.js';

// ── Rendering helpers ────────────────────────────────────────────────────

/**
 * renderItems(root, order)
 * Replaces the static order-items list with data-driven markup.
 */
function renderItems(root, order) {
  const container = root.querySelector('.oc-items-card');
  if (!container || !order.items) return;

  const itemsHTML = order.items.map(item => `
    <div class="oc-item">
      <div class="oc-item__img ${item.imgClass}" aria-hidden="true"></div>
      <div class="oc-item__info">
        <strong>${item.name}</strong>
        <span>Qty: ${item.qty} &bull; ${item.detail}</span>
      </div>
      <span class="oc-item__price">${order.currencySymbol}${item.price.toFixed(2)}</span>
    </div>
    <div class="oc-item-divider"></div>
  `).join('');

  container.innerHTML = `
    <div class="oc-items-header">
      <h3 class="oc-card-heading">Order Contents</h3>
      <span class="badge badge--neutral">${order.items.length} Items Total</span>
    </div>
    ${itemsHTML}
    <div class="oc-items-total">
      <span class="text-secondary text-sm">Order Total</span>
      <strong class="oc-items-total__value">${order.currencySymbol}${order.total.toFixed(2)}</strong>
    </div>
  `;
}

/**
 * renderTimeline(root, order)
 * Populates the progress timeline with data-driven step states.
 */
function renderTimeline(root, order) {
  const container = root.querySelector('.oc-timeline');
  if (!container || !order.timeline) return;

  const steps = order.timeline;
  container.innerHTML = steps.map((step, i) => {
    const isLast    = i === steps.length - 1;
    const isDone    = step.done;
    const itemClass = isDone ? 'oc-tl-item--done' : (isLast ? 'oc-tl-item--last' : 'oc-tl-item--pending');
    const dotClass  = isDone ? 'oc-tl-dot--done'  : 'oc-tl-dot--pending';
    const bodyClass = isDone ? ''                  : 'oc-tl-body--muted';

    const checkIcon = isDone ? `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>` : '';

    return `
      <div class="oc-tl-item ${itemClass}" role="listitem">
        <div class="oc-tl-dot ${dotClass}">${checkIcon}</div>
        <div class="oc-tl-body ${bodyClass}">
          <strong>${step.label}</strong>
          <span>${step.time}</span>
        </div>
      </div>`;
  }).join('');
}

/**
 * renderOrderMeta(root, order)
 * Fills in address, expected arrival, and order ID from storage data.
 */
function renderOrderMeta(root, order) {
  // Delivery address card
  const addressEl = root.querySelector('.oc-info-card--address .oc-info-value');
  if (addressEl) addressEl.textContent = order.deliveryAddress;

  // Expected arrival card
  const arrivalEl = root.querySelector('.oc-info-card--arrival .oc-info-value');
  if (arrivalEl) arrivalEl.textContent = order.expectedArrival;

  // Header order number (in the shell — not in root, but we can update it)
  const headerOrder = document.querySelector('.header-order');
  if (headerOrder) headerOrder.textContent = `#${order.id}`;
}

// ── Lifecycle ────────────────────────────────────────────────────────────

export async function init(root) {
  // ── 1. Fetch order data ──────────────────────────────────────────────
  //    Replace this line with a real fetch() call when the backend is ready:
  //    const order = await fetch('/api/orders/current').then(r => r.json());
  const order = await StorageService.get('order');

  if (!order) {
    console.error('[order-confirmed] No order data found in storage.');
    return;
  }

  // ── 2. Render dynamic sections ───────────────────────────────────────
  renderOrderMeta(root, order);
  renderTimeline(root, order);
  renderItems(root, order);

  // ── 3. Wire up interaction buttons ───────────────────────────────────
  const notifyBtn = root.querySelector('#oc-notify-btn');
  if (notifyBtn) {
    notifyBtn.onclick = () => {
      notifyBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg> Notifications Enabled`;
      notifyBtn.style.background = 'var(--status-success)';
      notifyBtn.disabled = true;
      syncPromoBtn();

      // Persist the user's notification preference
      StorageService.update('order', { notificationsEnabled: true });
    };
  }

  const promoBtn = root.querySelector('#oc-promo-notify-btn');
  if (promoBtn) {
    promoBtn.onclick = () => {
      promoBtn.textContent = 'Notifications On';
      promoBtn.disabled = true;
      syncMainBtn();
      StorageService.update('order', { notificationsEnabled: true });
    };
  }

  // Sync both notification buttons so they stay consistent
  function syncPromoBtn() {
    const pb = root.querySelector('#oc-promo-notify-btn');
    if (pb) { pb.textContent = 'Notifications On'; pb.disabled = true; }
  }
  function syncMainBtn() {
    const mb = root.querySelector('#oc-notify-btn');
    if (mb) {
      mb.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg> Notifications Enabled`;
      mb.style.background = 'var(--status-success)';
      mb.disabled = true;
    }
  }

  // Reflect persisted notification preference across page loads
  if (order.notificationsEnabled) {
    syncMainBtn();
    syncPromoBtn();
  }
}

export function destroy(root) {
  root.innerHTML = '';
}
