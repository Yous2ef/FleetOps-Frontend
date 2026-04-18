import {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  deleteShipment,
  getShipmentStats,
} from '../storage/shipments.js';

const delay = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));

/** @returns {Promise<{data: Array, error: null}>} */
export async function fetchShipments() {
  await delay(300);
  try {
    return { data: getAllShipments(), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/** @returns {Promise<{data: object|null, error: string|null}>} */
export async function fetchShipmentById(id) {
  await delay(200);
  try {
    const data = getShipmentById(id);
    return data
      ? { data, error: null }
      : { data: null, error: `Shipment ${id} not found` };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/** @returns {Promise<{data: object, error: null}>} */
export async function fetchShipmentStats() {
  await delay(250);
  try {
    return { data: getShipmentStats(), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function createShipmentApi(payload) {
  await delay(400);
  try {
    return { data: createShipment(payload), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function updateShipmentApi(id, patch) {
  await delay(300);
  try {
    const data = updateShipment(id, patch);
    return data
      ? { data, error: null }
      : { data: null, error: `Shipment ${id} not found` };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function deleteShipmentApi(id) {
  await delay(300);
  try {
    const ok = deleteShipment(id);
    return ok
      ? { data: { id }, error: null }
      : { data: null, error: `Shipment ${id} not found` };
  } catch (err) {
    return { data: null, error: err.message };
  }
}