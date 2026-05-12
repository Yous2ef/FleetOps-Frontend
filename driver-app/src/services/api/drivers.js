import api from "/shared/api-handler.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────

api.setBaseURL("http://localhost:8000");

// ─── API Methods ─────────────────────────────────────────────────────────────

async function login(email, password) {
  const response = await api.post("/api/v1/auth/login", { email, password });
  return response.data;
}



/**
 * Fetches a driver/user profile from the backend.
 *
 * @param {string|number} id - The user ID.
 * @returns {Promise<Object>} The user data object.
 */
async function getDriverProfile(id) {
  const response = await api.get(`/api/v1/users/${id}`);
  return response.data.data;
}

/**
 * Fetches the full list of fleet drivers from the dispatch API.
 *
 * Response shape per item:
 *   { driver_id, name, initials, status, score, shift, license_type, license_no, stats }
 *
 * Note: driver_id is returned as a string by this endpoint.
 *
 * @returns {Promise<Array>} Array of driver objects.
 */
async function getAllFleetDrivers() {
  const response = await api.get("/api/v1/dispatch/fleet/drivers");
  // The backend returns { success: true, message: "...", data: [...] }
  // We need to return the inner array.
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

/**
 * Fetches the full list of users from the backend.
 * Used for cross-referencing contact info (phone/email).
 *
 * @returns {Promise<Array>} Array of user objects.
 */
async function getAllUsers() {
  const response = await api.get("/api/v1/users");
  // Assuming standard { success: true, data: [...] } structure
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

// ────────────────────────────────────────────────────────────────
const DriverStorage = {
  login,
  getDriverProfile,
  getAllFleetDrivers,
  getAllUsers,
};

export default DriverStorage;
