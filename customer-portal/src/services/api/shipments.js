import { getAllShipments } from '../storage/shipments.js';
export async function fetchShipments() {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ data: getAllShipments(), error: null }), 300);
    });
}
export async function fetchShipmentStats() {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ data: { total: 3, active: 2 }, error: null }), 200);
    });
}