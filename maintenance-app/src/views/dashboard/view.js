/**
 * FleetOps — Dashboard View JS
 * Handles all dynamic rendering of the Dashboard section.
 * Uses ES6 modules. Imports notification UI for the Bell button.
 *
 * @module views/dashboard/view
 */

import { showNotificationPanel } from '../../utils/notification-ui.js';
// ─────────────────────────────────────────────────────────────────
// 1. DUMMY DATA
// ─────────────────────────────────────────────────────────────────

/** @type {Array<{id:string, value:number, label:string, sub:string, subColor:string, iconColor:string, iconSvg:string}>} */
const KPI_DATA = [
  {
    id: 'total-vehicles',
    value: 10,
    label: 'Total Vehicles',
    sub: null,
    iconColor: 'blue',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M1 17V11L5 4h14l4 7v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
      <path d="M1 17h3M21 17h1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'available',
    value: 6,
    label: 'Available',
    sub: 'Ready to dispatch',
    subColor: 'green',
    iconColor: 'green',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
      <path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'in-service',
    value: 2,
    label: 'In Service',
    sub: 'On route',
    subColor: 'blue',
    iconColor: 'teal',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M1 17V11L5 4h14l4 7v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
    </svg>`,
  },
  {
    id: 'out-of-service',
    value: 2,
    label: 'Out of Service',
    sub: 'Under repair',
    subColor: 'red',
    iconColor: 'red',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'open-work-orders',
    value: 5,
    label: 'Open Work Orders',
    sub: '1 emergency',
    subColor: 'red',
    iconColor: 'orange',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.8"/>
      <path d="M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'urgent-overdue',
    value: 3,
    label: 'Urgent / Overdue',
    sub: 'Needs attention',
    subColor: 'red',
    iconColor: 'amber',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
];

/** @type {Array<{id:string, text:string}>} */
const ALERTS_DATA = [
  { id: 'a1', text: 'EGY-1234 — Insurance expires in 24 days (2026-05-20)' },
  { id: 'a2', text: 'EGY-5678 — Insurance expires EXPIRED (2026-04-20)' },
  { id: 'a3', text: 'EGY-5678 — Annual inspection EXPIRED' },
  { id: 'a4', text: 'EGY-5678 — Retirement recommended: repair cost is 46% of market value' },
  { id: 'a5', text: 'EGY-7890 — Insurance expires EXPIRED (2026-04-25)' },
  { id: 'a6', text: 'EGY-7890 — Annual inspection EXPIRED' },
  { id: 'a7', text: 'EGY-7890 — Retirement recommended: repair cost is 41% of market value' },
  { id: 'a8', text: 'EGY-2345 — Service due at 55,000 km (currently 54,800 km)' },
  { id: 'a9', text: 'EGY-8901 — Insurance expires in 9 days (2026-05-05)' },
  { id: 'a10', text: '3 spare part(s) at or below minimum stock level' },
];

/** @type {Array<{id:string, vehicle:string, type:string, mechanic:string|null, status:string, updated:string}>} */
const WORK_ORDERS_DATA = [
  { id: 'WO-2035', vehicle: 'EGY-8901', type: 'emergency', mechanic: null,    status: 'open',        updated: '12d ago' },
  { id: 'WO-2038', vehicle: 'EGY-9012', type: 'routine',   mechanic: null,    status: 'open',        updated: '13d ago' },
  { id: 'WO-2041', vehicle: 'EGY-5678', type: 'breakdown', mechanic: 'Karim', status: 'in-progress', updated: '15d ago' },
  { id: 'WO-2040', vehicle: 'EGY-7890', type: 'breakdown', mechanic: 'Omar',  status: 'in-progress', updated: '16d ago' },
  { id: 'WO-2039', vehicle: 'EGY-1234', type: 'routine',   mechanic: 'Karim', status: 'resolved',    updated: '17d ago' },
  { id: 'WO-2037', vehicle: 'EGY-6789', type: 'routine',   mechanic: 'Ahmed', status: 'closed',      updated: '18d ago' },
  { id: 'WO-2036', vehicle: 'EGY-0123', type: 'routine',   mechanic: 'Omar',  status: 'assigned',    updated: '19d ago' },
  { id: 'WO-2034', vehicle: 'EGY-2345', type: 'routine',   mechanic: 'Ahmed', status: 'closed',      updated: '20d ago' },
  { id: 'WO-2033', vehicle: 'EGY-3456', type: 'routine',   mechanic: 'Karim', status: 'closed',      updated: '21d ago' },
  { id: 'WO-2032', vehicle: 'EGY-4567', type: 'routine',   mechanic: 'Omar',  status: 'closed',      updated: '22d ago' },
];

/** @type {Array<{id:string, status:string, sub:string|null}>} */
const VEHICLES_ATTENTION_DATA = [
  { id: 'EGY-1234', status: 'available',      sub: null },
  { id: 'EGY-5678', status: 'out-of-service', sub: 'Out of Service · ⚠ Retire recommended' },
  { id: 'EGY-7890', status: 'out-of-service', sub: 'Out of Service · ⚠ Retire recommended' },
  { id: 'EGY-2345', status: 'available',      sub: null },
  { id: 'EGY-8901', status: 'available',      sub: null },
];

/** @type {Array<{type:string, vehicleId:string, woId:string, status:string}>} */
const UPCOMING_MAINTENANCE_DATA = [
  { type: 'routine',   vehicleId: 'EGY-9012', woId: 'WO-2038', status: 'open' },
  { type: 'routine',   vehicleId: 'EGY-0123', woId: 'WO-2036', status: 'assigned' },
  { type: 'emergency', vehicleId: 'EGY-8901', woId: 'WO-2035', status: 'open' },
];

// ─────────────────────────────────────────────────────────────────
// 2. SVG HELPERS
// ─────────────────────────────────────────────────────────────────

const WARN_ICON_SVG = `
  <svg class="alert-icon" viewBox="0 0 24 24" fill="none">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;

const CLOSE_ICON_SVG = `
  <svg viewBox="0 0 14 14" fill="none">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;

const TRUCK_ICON_SVG = `
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M1 17V11L5 4h14l4 7v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
  </svg>`;

// ─────────────────────────────────────────────────────────────────
// 3. RENDER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Renders KPI cards into #kpi-grid.
 */
function renderKPICards() {
  const grid = document.getElementById('kpi-grid');
  if (!grid) return;

  grid.innerHTML = KPI_DATA.map(({ value, label, sub, subColor, iconColor, iconSvg }) => `
    <div class="kpi-card">
      <div class="kpi-icon ${iconColor}">${iconSvg}</div>
      <div class="kpi-body">
        <div class="kpi-value">${value}</div>
        <div class="kpi-label">${label}</div>
        ${sub ? `<div class="kpi-sub ${subColor}">${sub}</div>` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Renders alert banners into #alerts-section.
 * Dismissed alerts are tracked in a local Set.
 */
function renderAlerts() {
  const section = document.getElementById('alerts-section');
  if (!section) return;

  /** @type {Set<string>} */
  const dismissed = new Set();

  const redraw = () => {
    section.innerHTML = ALERTS_DATA
      .filter(a => !dismissed.has(a.id))
      .map(({ id, text }) => `
        <div class="alert-banner" data-alert-id="${id}">
          ${WARN_ICON_SVG}
          <span class="alert-text">${text}</span>
          <div class="alert-actions">
            <button class="alert-view-btn" data-alert-view="${id}">View Details →</button>
            <button class="alert-dismiss-btn" data-alert-dismiss="${id}" aria-label="Dismiss">
              ${CLOSE_ICON_SVG}
            </button>
          </div>
        </div>
      `).join('');

    // Dismiss button handlers
    section.querySelectorAll('[data-alert-dismiss]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.alertDismiss;
        dismissed.add(id);
        redraw();
      });
    });
  };

  redraw();
}

/**
 * Maps a work-order type string to a badge HTML string.
 * @param {string} type
 * @returns {string}
 */
function typeBadge(type) {
  const labels = { emergency: 'Emergency', routine: 'Routine', breakdown: 'Breakdown' };
  return `<span class="type-badge ${type}">${labels[type] ?? type}</span>`;
}

/**
 * Maps a work-order status string to a badge HTML string.
 * @param {string} status
 * @returns {string}
 */
function statusBadge(status) {
  const labels = {
    open:        'Open',
    'in-progress': 'In Progress',
    resolved:    'Resolved',
    closed:      'Closed',
    assigned:    'Assigned',
  };
  return `<span class="status-badge ${status}">${labels[status] ?? status}</span>`;
}

/**
 * Renders work orders table rows into #wo-tbody.
 */
function renderWorkOrdersTable() {
  const tbody = document.getElementById('wo-tbody');
  if (!tbody) return;

  tbody.innerHTML = WORK_ORDERS_DATA.map(({ id, vehicle, type, mechanic, status, updated }) => `
    <tr>
      <td><span class="wo-id">${id}</span></td>
      <td>${vehicle}</td>
      <td>${typeBadge(type)}</td>
      <td>${mechanic
        ? `<span>${mechanic}</span>`
        : `<span class="mechanic-unassigned">Unassigned</span>`
      }</td>
      <td>${statusBadge(status)}</td>
      <td><span class="updated-text">${updated}</span></td>
    </tr>
  `).join('');
}

/**
 * Maps a vehicle status to badge CSS class.
 * @param {string} status
 * @returns {string}
 */
function vehicleStatusBadge(status) {
  const labels = {
    'available':      'Available',
    'out-of-service': 'Out of Service',
    'in-service':     'In Service',
  };
  return `<span class="vstatus-badge ${status}">${labels[status] ?? status}</span>`;
}

/**
 * Renders vehicles needing attention list into #vehicles-attention-list.
 */
function renderVehiclesAttention() {
  const list = document.getElementById('vehicles-attention-list');
  if (!list) return;

  list.innerHTML = VEHICLES_ATTENTION_DATA.map(({ id, status, sub }) => `
    <li class="vehicle-item">
      <div class="vehicle-item-icon">${TRUCK_ICON_SVG}</div>
      <div class="vehicle-item-body">
        <span class="vehicle-item-id">${id}</span>
        ${sub ? `<span class="vehicle-item-sub">${sub}</span>` : ''}
      </div>
      ${vehicleStatusBadge(status)}
    </li>
  `).join('');

  // Update count badge
  const countEl = document.getElementById('vehicles-count');
  if (countEl) countEl.textContent = VEHICLES_ATTENTION_DATA.length;
}

/**
 * Renders upcoming maintenance list into #upcoming-maintenance-list.
 */
function renderUpcomingMaintenance() {
  const list = document.getElementById('upcoming-maintenance-list');
  if (!list) return;

  list.innerHTML = UPCOMING_MAINTENANCE_DATA.map(({ type, vehicleId, woId, status }) => `
    <li class="maint-item">
      <span class="maint-type-badge ${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
      <div class="maint-item-body">
        <span class="maint-vehicle-id">${vehicleId}</span>
        <span class="maint-wo-id">${woId}</span>
      </div>
      <span class="maint-status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </li>
  `).join('');
}

/**
 * Wires up the notification bell button.
 */
function initNotificationBell() {
  document.addEventListener('click', (e) => {
    const bellButton = e.target.closest('.notif-bell-btn, button:has(.notif-badge), button:has([class*="badge"])');
        if (bellButton) {
      e.preventDefault();
      showNotificationPanel();
    }
  });
}

// ─────────────────────────────────────────────────────────────────
// 4. INIT — called when this view is mounted
// ─────────────────────────────────────────────────────────────────

/**
 * Entry point. Call this after inserting view.html into the DOM.
 */
export function initDashboard() {
  renderKPICards();
  renderAlerts();
  renderWorkOrdersTable();
  renderVehiclesAttention();
  renderUpcomingMaintenance();
  initNotificationBell();
}
setTimeout(initDashboard, 100);