// ════════════════════════════════════════════════════════════════════════
// src/utils/seeder.js — FleetOps · Initial Data Seeder
//
// Seeds localStorage with realistic dummy data when the app first loads
// on a fresh browser (i.e. when none of the keys already exist).
//
// This acts as the "database migration" step for the mock backend.
// When you replace StorageService with real fetch() calls, this file
// becomes unnecessary — the API server provides its own data.
//
// SEED SCHEMA:
//   'order'         → A single active order object (the customer's current shipment)
//   'notifications' → Array of notification objects (persisted history)
//   'preferences'   → Delivery instructions/preferences object
//
// ════════════════════════════════════════════════════════════════════════

import { StorageService } from './storage.js';

// ── Seed Data ─────────────────────────────────────────────────────────────

/**
 * The active order for this tracking session.
 *
 * Shape mirrors what a real GET /api/orders/{token} would return.
 * Fields are consumed by: order-confirmed, in-transit, arriving-alerts,
 * delivered, and delivery-failed views.
 */
const SEED_ORDER = {
  id: 'ORD-88421',

  // Determines which status view is "current" (informational — the router
  // controls which view is shown, but views can read this to highlight state).
  status: 'order-confirmed', // 'order-confirmed' | 'in-transit' | 'arriving' | 'delivered' | 'failed'

  paymentMethod: 'PREPAID',
  confirmedAt:   'Today at 08:45 AM',

  // ── Delivery address ─────────────────────────────────────────────────
  deliveryAddress: '742 Evergreen Terrace, Springfield, IL 62704',
  expectedArrival: '10 AM – 12 PM, Today',

  // Cash-on-delivery amount (used by arriving-alerts)
  amountDue: 450,
  amountCurrency: 'EGP',

  // ── Driver ───────────────────────────────────────────────────────────
  driver: {
    name:        'Ahmed K.',
    fullName:    'Ahmed',
    vehicle:     'White Toyota Hiace',
    vehicleType: 'Light delivery van',
    rating:      4.9,
    phone:       '+20123456789',
    avatarUrl:   'https://i.pravatar.cc/150?u=ahmed',
    // In-transit live data
    etaMinutes:  18,
    expectedAt:  '10:42 AM',
    currentStop: 4,
    totalStops:  14,
    // Arriving-alerts data
    distanceAway: '500M',
  },

  // ── Order items ───────────────────────────────────────────────────────
  items: [
    {
      id:       'PRO-990',
      name:     'FleetOps Pro Sensor',
      qty:      1,
      detail:   'SKU: PRO-990',
      price:    129.00,
      imgClass: 'oc-item__img--1',
    },
    {
      id:       'SHOE-105',
      name:     'Velo-Stride Sneakers',
      qty:      1,
      detail:   'Size: 10.5',
      price:    85.00,
      imgClass: 'oc-item__img--2',
    },
    {
      id:       'BAG-SL',
      name:     'Urban Backpack v2',
      qty:      1,
      detail:   'Color: Slate',
      price:    59.00,
      imgClass: 'oc-item__img--3',
    },
  ],
  total:          273.00,
  currencySymbol: '$',

  // ── Progress timeline (order-confirmed view) ──────────────────────────
  timeline: [
    { label: 'Order Confirmed',   time: 'Confirmed today at 08:45 AM', done: true  },
    { label: 'Driver Dispatched', time: 'Pending assignment',           done: false },
    { label: 'Out for Delivery',  time: 'Est. 10:30 AM',               done: false },
    { label: 'Delivered',         time: 'Est. 12:00 PM',               done: false },
  ],

  // ── Delivered view data ───────────────────────────────────────────────
  deliveredAt:      '10:47 AM, Oct 24',
  deliveredAddress: '124 Fleet Way, Suite 402',
  signedBy:         'John Doe',
  deliveryTimeline: [
    { label: 'Order Received',   time: 'Oct 22, 09:15 AM' },
    { label: 'In Transit',       time: 'Oct 23, 02:40 PM' },
    { label: 'Out for Delivery', time: 'Oct 24, 08:30 AM' },
    { label: 'Delivered',        time: 'Oct 24, 10:47 AM' },
  ],

  // ── Delivery-failed view data ─────────────────────────────────────────
  failedAt:     '2:45 PM',
  failedDate:   'Oct 24',
  failedReason: 'Recipient not available',
  supportPhone: '+20 123 456 789',
  failedTimeline: [
    { label: 'Order Confirmed',     time: 'Oct 24 · 09:00 AM', status: 'success' },
    { label: 'Driver Dispatched',   time: 'Oct 24 · 11:30 AM', status: 'success' },
    { label: 'Out for Delivery',    time: 'Oct 24 · 01:15 PM', status: 'success' },
    { label: 'Delivery Attempted',  time: 'Oct 24 · 02:45 PM · Recipient not available', status: 'failed' },
  ],
};

/**
 * Initial notification events — simulates server-pushed alerts that
 * would arrive via WebSocket or SSE in a real backend.
 *
 * Shape mirrors NotificationService.add() payloads.
 * Stored as an array in 'notifications' key (newest first).
 */
const SEED_NOTIFICATIONS = [
  {
    id:        5,
    title:     'Breakdown — EGY-5678',
    message:   'Driver Ahmed Mahmoud reported a breakdown on Ring Road. Transmission failure.',
    type:      'danger',
    icon:      'lightning-charge-fill',
    read:      false,
    timestamp: Date.now() - 2 * 60 * 1000, // 2 min ago
  },
  {
    id:        4,
    title:     'Insurance Expiry — EGY-5678',
    message:   'Vehicle EGY-5678 insurance expires in 10 days on April 25, 2026.',
    type:      'warning',
    icon:      'shield-exclamation',
    read:      false,
    timestamp: Date.now() - 8 * 60 * 1000,
  },
  {
    id:        3,
    title:     'Low Stock — Transmission Fluid',
    message:   'Transmission Fluid is out of stock. Please reorder immediately.',
    type:      'warning',
    icon:      'droplet-half',
    read:      false,
    timestamp: Date.now() - 15 * 60 * 1000,
  },
  {
    id:        2,
    title:     'WO-2039 Resolved',
    message:   'Karim Hassan resolved Work Order WO-2039 for EGY-1234. Ready for review.',
    type:      'info',
    icon:      'check-circle-fill',
    read:      true,
    timestamp: Date.now() - 45 * 60 * 1000,
  },
  {
    id:        1,
    title:     'Inspection Expiry — EGY-5678',
    message:   'Annual inspection for EGY-5678 expired on March 1, 2026. Schedule immediately.',
    type:      'warning',
    icon:      'calendar-x-fill',
    read:      true,
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
];

/**
 * Default delivery preferences — what the customer has saved so far.
 * Consumed by: arriving-alerts (instructions display) and
 * deliver-preferences (pre-selects the active card on load).
 */
const SEED_PREFERENCES = {
  option:     'no-disturb',  // Matches data-option on dp-card elements
  notes:      'Leave at front desk and notify security personnel upon arrival.',
  savedAt:    null,
};

// ── Seeder function ───────────────────────────────────────────────────────

/**
 * seedIfEmpty()
 *
 * Checks each storage key and populates it with seed data only if the
 * key does not already exist. This means real user actions (saving
 * preferences, marking notifications read) are never overwritten on
 * page reload.
 *
 * Call once from main.js before the router initialises.
 *
 * @returns {Promise<void>}
 */
export async function seedIfEmpty() {
  const [hasOrder, hasNotifications, hasPreferences] = await Promise.all([
    StorageService.has('order'),
    StorageService.has('notifications'),
    StorageService.has('preferences'),
  ]);

  const seeds = [];

  if (!hasOrder) {
    seeds.push(StorageService.save('order', SEED_ORDER));
  }

  if (!hasNotifications) {
    seeds.push(StorageService.save('notifications', SEED_NOTIFICATIONS));
  }

  if (!hasPreferences) {
    seeds.push(StorageService.save('preferences', SEED_PREFERENCES));
  }

  if (seeds.length > 0) {
    await Promise.all(seeds);
    console.info(`[Seeder] Seeded ${seeds.length} resource(s) into mock backend.`);
  }
}
