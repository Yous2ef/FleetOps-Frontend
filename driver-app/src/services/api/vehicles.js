import api from "/shared/api-handler.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────

api.setBaseURL("http://localhost:8000");

// ─── API Methods ─────────────────────────────────────────────────────────────

/**
 * Fetches the full list of fleet vehicles from the dispatch API.
 *
 * Response shape per item:
 *   { vehicle_id, model, type, plate_number, status }
 *
 * @returns {Promise<Array>} Array of vehicle objects.
 */
async function getAllVehicles() {
  const response = await api.get("/api/v1/dispatch/vehicles/");
  // The backend returns { success: true, data: [...] }
  // We need to return the inner array.
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

// ────────────────────────────────────────────────────────────────

const VehiclesStorage = {
  getAllVehicles,
};

export default VehiclesStorage;
