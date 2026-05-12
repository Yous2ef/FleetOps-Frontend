import api from "/shared/api-handler.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────

// The base URL for our backend API
api.setBaseURL("http://localhost:8000");

// ─── API Methods ─────────────────────────────────────────────────────────────

/**
 * Calls the backend logout API to securely invalidate the driver's session.
 * 
 * @returns {Promise<Object>} The API response data.
 * @throws {Error} If the request fails (though the view handler should handle it gracefully).
 */
async function logoutApi() {
  /**
   * NOTE: The apiHandler automatically retrieves the Bearer token 
   * from localStorage on every request and attaches it to the 
   * 'Authorization' header as required.
   */
  const response = await api.post("/api/v1/auth/logout");
  return response.data;
}

// ────────────────────────────────────────────────────────────────

const AuthStorage = {
  logoutApi,
};

export default AuthStorage;
