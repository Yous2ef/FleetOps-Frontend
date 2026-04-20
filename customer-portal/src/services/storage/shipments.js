const shipments = [
    { id: "SHP-001", origin: "NY", dest: "LA", status: "in_transit", date: "2026-04-20" },
    { id: "SHP-002", origin: "TX", dest: "FL", status: "delivered", date: "2026-04-18" },
    { id: "SHP-003", origin: "CA", dest: "WA", status: "pending", date: "2026-04-22" }
];
export function getAllShipments() { return shipments; }