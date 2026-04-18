// ── Mock database (sync, in-memory) ──────────────────────────
let shipments = [
  {
    id: 'SHP-1001', origin: 'New York, NY', dest: 'Los Angeles, CA',
    status: 'in_transit', date: '2026-04-20', weight: '14 kg', customer: 'Apex Corp',
  },
  {
    id: 'SHP-1002', origin: 'Houston, TX', dest: 'Miami, FL',
    status: 'delivered', date: '2026-04-18', weight: '3 kg', customer: 'NovaTech',
  },
  {
    id: 'SHP-1003', origin: 'San Francisco, CA', dest: 'Seattle, WA',
    status: 'pending', date: '2026-04-22', weight: '8 kg', customer: 'BlueWave LLC',
  },
  {
    id: 'SHP-1004', origin: 'Chicago, IL', dest: 'Detroit, MI',
    status: 'delivered', date: '2026-04-17', weight: '22 kg', customer: 'RedLine Inc',
  },
  {
    id: 'SHP-1005', origin: 'Phoenix, AZ', dest: 'Denver, CO',
    status: 'exception', date: '2026-04-19', weight: '5 kg', customer: 'Apex Corp',
  },
  {
    id: 'SHP-1006', origin: 'Atlanta, GA', dest: 'Charlotte, NC',
    status: 'pending', date: '2026-04-23', weight: '11 kg', customer: 'Meridian Ltd',
  },
];

let nextId = 1007;

export function getAllShipments() {
  return [...shipments];
}

export function getShipmentById(id) {
  return shipments.find(s => s.id === id) ?? null;
}

export function createShipment(data) {
  const newShipment = { id: `SHP-${nextId++}`, ...data };
  shipments.push(newShipment);
  return newShipment;
}

export function updateShipment(id, patch) {
  const idx = shipments.findIndex(s => s.id === id);
  if (idx === -1) return null;
  shipments[idx] = { ...shipments[idx], ...patch };
  return shipments[idx];
}

export function deleteShipment(id) {
  const idx = shipments.findIndex(s => s.id === id);
  if (idx === -1) return false;
  shipments.splice(idx, 1);
  return true;
}

export function getShipmentStats() {
  const total     = shipments.length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const pending   = shipments.filter(s => s.status === 'pending').length;
  const exception = shipments.filter(s => s.status === 'exception').length;
  return { total, delivered, inTransit, pending, exception };
}