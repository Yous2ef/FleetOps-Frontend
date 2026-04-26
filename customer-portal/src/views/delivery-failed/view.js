// ════════════════════════════════════════════════════════════════════════
// src/views/delivery-failed/view.js
//
// REFACTOR (data-driven, 2026-04-26):
//   init() awaits StorageService.get('order') and dynamically renders:
//   attempt time, failure reason, support phone, and the tracking timeline.
// ════════════════════════════════════════════════════════════════════════

import { StorageService } from '../../utils/storage.js';

let cleanups = [];

// ── Rendering helpers ─────────────────────────────────────────────────────

function renderBanner(root, order) {
  const metaEl = root.querySelector('.df-banner__meta');
  if (metaEl) metaEl.textContent = `Attempted today at ${order.failedAt}`;
}

function renderSupportBox(root, order) {
  const phoneEl = root.querySelector('.df-support-phone');
  if (phoneEl) phoneEl.textContent = order.supportPhone;

  const callBtn = root.querySelector('#df-call-btn');
  if (callBtn && order.supportPhone) {
    const handleCall = () => {
      window.location.href = `tel:${order.supportPhone.replace(/\s/g, '')}`;
    };
    callBtn.addEventListener('click', handleCall);
    cleanups.push(() => callBtn.removeEventListener('click', handleCall));
  }
}

function renderTimeline(root, order) {
  const timelineEl = root.querySelector('.df-timeline');
  if (!timelineEl || !order.failedTimeline) return;

  const steps = order.failedTimeline;

  timelineEl.innerHTML = steps.map((step, i) => {
    const isLast   = i === steps.length - 1;
    const isFailed = step.status === 'failed';

    // Each non-last item has a connector line to the next
    const linkClass = isLast
      ? ''
      : isFailed
        ? 'df-tl-link--danger'
        : 'df-tl-link--success';

    const dotClass = isFailed ? 'df-tl-dot--danger' : 'df-tl-dot--success';

    const dotIcon = isFailed
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
           <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
         </svg>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
           <polyline points="20 6 9 17 4 12"/>
         </svg>`;

    const titleClass = isFailed ? 'df-tl-title--danger' : '';

    return `
      <div class="df-tl-item ${linkClass}" role="listitem">
        <div class="df-tl-dot ${dotClass}">${dotIcon}</div>
        <div class="df-tl-body">
          <strong class="${titleClass}">${step.label}</strong>
          <span>${step.time}</span>
        </div>
      </div>`;
  }).join('');
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

export async function init(root) {
  cleanups = [];

  // ── 1. Fetch order data ──────────────────────────────────────────────
  const order = await StorageService.get('order');

  if (order) {
    renderBanner(root, order);
    renderSupportBox(root, order);
    renderTimeline(root, order);
  }

  // ── 2. Staggered card entrance animations ────────────────────────────
  const cards = root.querySelectorAll('.card');
  cards.forEach((card, i) => {
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(12px)';
    card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    card.style.transitionDelay = `${i * 80}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.style.opacity   = '1';
      card.style.transform = 'translateY(0)';
    }));
  });
}

export function destroy(root) {
  cleanups.forEach(fn => fn());
  cleanups = [];
  root.innerHTML = '';
}
