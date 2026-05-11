// ════════════════════════════════════════════════════════════════════════
// src/views/delivered/view.js
//
// REFACTOR (real API, 2026-05-05):
//   init() now awaits CustomerPortalAPI.fetchOrder() which calls
//   GET /customer-portal/orders/{token} on the Laravel backend.
//   submitFeedback() posts to POST /customer-portal/orders/{token}/feedback.
// ════════════════════════════════════════════════════════════════════════

import { fetchOrder, submitFeedback } from '../../services/api/customer-portal.js';
import { NotificationService }         from '../../utils/notifications.js';

let _handleStarClick = null;
let _handlePillClick = null;
let _handleSubmit    = null;
let _starButtons     = [];
let _pillButtons     = [];
let _submitBtn       = null;
let _commentsArea    = null;
let _rating          = 0;
let _condition       = null;

// ── Helpers ──────────────────────────────────────────────────────────────

function validate() {
  if (!_submitBtn) return;
  if (_rating > 0) {
    _submitBtn.classList.add('dv-btn-active');
    _submitBtn.removeAttribute('disabled');
  } else {
    _submitBtn.classList.remove('dv-btn-active');
    _submitBtn.setAttribute('disabled', 'true');
  }
}

// ── Rendering helpers ─────────────────────────────────────────────────────

function renderDeliveryInfo(root, order) {
  // Hero timestamp
  const heroTime = root.querySelector('.dv-hero-time');
  if (heroTime) heroTime.textContent = order.deliveredAt;

  // Proof of delivery address
  const addressEl = root.querySelector('.dv-address');
  if (addressEl) addressEl.textContent = `Delivered at ${order.deliveredAddress}`;

  // Signed-by
  const signedByEl = root.querySelector('.dv-signed-by');
  if (signedByEl) signedByEl.textContent = `Signed by: ${order.signedBy}`;
}

function renderTimeline(root, order) {
  const timelineEl = root.querySelector('.dv-timeline');
  if (!timelineEl || !order.deliveryTimeline) return;

  const checkIcon = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;

  timelineEl.innerHTML = order.deliveryTimeline.map(step => `
    <div class="dv-tl-item">
      <div class="dv-tl-icon">${checkIcon}</div>
      <div class="dv-tl-content">
        <div class="dv-tl-title">${step.label}</div>
        <div class="dv-tl-time">${step.time}</div>
      </div>
    </div>
  `).join('');
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

export async function init(root) {
  _rating    = 0;
  _condition = null;

  // ── 1. Fetch order from the Laravel backend ──────────────────────────
  //    GET /customer-portal/orders/{token}
  const order = await fetchOrder();
  if (order) {
    renderDeliveryInfo(root, order);
    renderTimeline(root, order);
  }

  // ── 2. Wire up interactive elements ─────────────────────────────────
  _starButtons  = Array.from(root.querySelectorAll('#dv-stars button'));
  _pillButtons  = Array.from(root.querySelectorAll('.dv-pill'));
  _submitBtn    = root.querySelector('#dv-submit-btn');
  _commentsArea = root.querySelector('#dv-comments');

  if (!_submitBtn) {
    console.error('[delivered/view.js] #dv-submit-btn not found in rendered HTML.');
    return;
  }

  // ── 3. Star rating ───────────────────────────────────────────────────
  _handleStarClick = (e) => {
    const btn = e.currentTarget;
    _rating = parseInt(btn.dataset.value, 10);

    _starButtons.forEach((s, i) => {
      const active = i < _rating;
      s.classList.toggle('dv-star-active', active);
      s.querySelector('svg').setAttribute('fill', active ? 'currentColor' : 'none');
    });

    validate();
  };

  _starButtons.forEach(b => b.addEventListener('click', _handleStarClick));

  // ── 4. Condition pills ───────────────────────────────────────────────
  _handlePillClick = (e) => {
    const btn  = e.currentTarget;
    _condition = btn.dataset.condition;
    _pillButtons.forEach(p => p.classList.toggle('dv-pill-active', p === btn));
    validate();
  };

  _pillButtons.forEach(b => b.addEventListener('click', _handlePillClick));

  // ── 5. Submit button ─────────────────────────────────────────────────
  _handleSubmit = async () => {
    if (!_submitBtn.classList.contains('dv-btn-active')) return;

    const feedback = {
      rating:    _rating,
      condition: _condition,
      comments:  _commentsArea?.value?.trim() || '',
    };

    // POST feedback to the Laravel backend
    //    POST /customer-portal/orders/{token}/feedback
    await submitFeedback(feedback);

    _submitBtn.textContent = '✓ Feedback Submitted!';
    _submitBtn.classList.replace('dv-btn-active', 'dv-btn-success');
    _submitBtn.disabled = true;

    [..._starButtons, ..._pillButtons].forEach(el => { el.disabled = true; });
    if (_commentsArea) _commentsArea.disabled = true;

    // Fire notification + toast
    NotificationService.add({
      title:   'Feedback Received',
      message: 'Thank you! Your delivery feedback has been recorded.',
      type:    'success',
      icon:    'chat-square-heart-fill',
    });
  };

  _submitBtn.addEventListener('click', _handleSubmit);
}

export function destroy(root) {
  _starButtons.forEach(b => {
    if (_handleStarClick) b.removeEventListener('click', _handleStarClick);
  });
  _pillButtons.forEach(b => {
    if (_handlePillClick) b.removeEventListener('click', _handlePillClick);
  });
  if (_submitBtn && _handleSubmit) {
    _submitBtn.removeEventListener('click', _handleSubmit);
  }

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
