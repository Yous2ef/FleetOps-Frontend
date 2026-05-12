import VehicleStorage from "../../services/api/vehicles.js";
import DriverStorage from "../../services/api/drivers.js";
import AuthStorage from "../../services/api/auth.js";

/**
 * Generates initials from a full name (e.g., "Ahmed Sayed" → "AS").
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Handles the logout process by calling the API and clearing client-side state.
 * @param {Event} event
 */
async function handleLogout(event) {
  const logoutBtn = event.currentTarget;

  // 1. UI Feedback: Disable button to prevent spamming
  logoutBtn.disabled = true;
  logoutBtn.style.opacity = "0.7";
  logoutBtn.textContent = "Logging out...";

  try {
    // 2. API Call: Securely invalidate session on the server
    await AuthStorage.logoutApi();
  } catch (error) {
    console.warn("Backend logout failed, proceeding with client-side cleanup:", error);
  } finally {
    // 3. Client-side Cleanup: CRITICAL RULE
    // This must execute regardless of API success or failure
    localStorage.clear();
    
    // Redirect to login (using window.location.href as requested for absolute cleanup)
    window.location.href = "/login-page";
  }
}

export async function mount(rootElement) {
  const view = rootElement || document;

  const profileContainer = view.querySelector(".profile-owner");
  const phoneValue = view.querySelector(".phone-value");
  const emailValue = view.querySelector(".driver-email");
  const plateValue = view.querySelector(".vehicle-plate-value");
  const modelValue = view.querySelector(".vehicle-model-value");

  // ── Step A: Read IDs from localStorage ──────────────────────────────────────
  const driverId = localStorage.getItem("driver_id");
  const vehicleId = localStorage.getItem("vehicle_id") || 1;

  if (!driverId) {
    if (profileContainer) {
      profileContainer.innerHTML = `
        <p class="helper-text" style="text-align:center;padding:1rem;">
          No driver session found. Please log in again.
        </p>`;
    }
    return;
  }

  // ── Loading State ───────────────────────────────────────────────────────────
  if (profileContainer) {
    profileContainer.innerHTML = `
      <div class="stack" style="align-items:center;padding:1.5rem;">
        <span class="helper-text">Loading profile…</span>
      </div>`;
  }
  if (phoneValue) phoneValue.textContent = "…";
  if (emailValue) emailValue.textContent = "…";
  if (plateValue) plateValue.textContent = "…";
  if (modelValue) modelValue.textContent = "…";

  // ── Step B: Fetch Data in Parallel ──────────────────────────────────────────
  try {
    const [allDrivers, allVehicles, userProfile] = await Promise.all([
      DriverStorage.getAllFleetDrivers(),
      VehicleStorage.getAllVehicles(),
      DriverStorage.getDriverProfile(driverId),
    ]);

    // ── Step C: Match the Data ────────────────────────────────────────────────
    // 1. Find the fleet driver record
    const matchedDriver = allDrivers.find(
      (d) => String(d.driver_id) === String(driverId)
    );

    // 2. Find the assigned vehicle
    const assignedVehicleId = matchedDriver?.current_vehicle;
    const vehicle = allVehicles.find(
      (v) => String(v.vehicle_id) === String(assignedVehicleId)
    );

    // ── Step D: Render Driver Data ────────────────────────────────────────────
    if (matchedDriver) {
      if (profileContainer) {
        const initials = getInitials(matchedDriver.name);
        const status = matchedDriver.status || "Unknown";
        const license = matchedDriver.license_no || "N/A";
        
        // Use status to determine chip color
        const statusLower = status.toLowerCase();
        let statusChipClass = "neutral";
        if (statusLower.includes("onshift") || statusLower.includes("available")) {
          statusChipClass = "success";
        } else if (statusLower.includes("break") || statusLower.includes("off")) {
          statusChipClass = "warning";
        }

        profileContainer.innerHTML = `
          <div class="profile-avatar-wrapper">
              <div class="profile-avatar profile-initials">${initials}</div>
              <span class="profile-avatar-badge">A</span>
          </div>
          <div class="stack profile-meta-text">
              <h1 class="heading-xl profile-name">${matchedDriver.name}</h1>
              <div class="row profile-meta-chips">
                  <span class="chip neutral profile-id">LIC: ${license}</span>
                  <span class="chip ${statusChipClass} profile-status">${status}</span>
              </div>
          </div>`;
      }
    } else {
      console.warn(`Driver with id=${driverId} not found in fleet list.`);
      if (profileContainer) {
        profileContainer.innerHTML = `
          <p class="helper-text" style="text-align:center;padding:1rem;">
            Driver profile not found in system records.
          </p>`;
      }
    }

    // ── Step E: Render Contact Data (from User Profile object) ────────────────
    if (userProfile) {
      if (phoneValue) phoneValue.textContent = userProfile.phone_no || "Not provided";
      if (emailValue) emailValue.textContent = userProfile.email || "Not provided";
    } else {
      if (phoneValue) phoneValue.textContent = "Not available";
      if (emailValue) emailValue.textContent = "Not available";
    }

    // ── Step F: Render Vehicle Data ───────────────────────────────────────────
    if (vehicle) {
      if (plateValue) plateValue.textContent = vehicle.plate_number || "—";
      if (modelValue) modelValue.textContent = vehicle.model || "—";
    } else {
      if (plateValue) plateValue.textContent = "Not assigned";
      if (modelValue) modelValue.textContent = "Not assigned";
    }

  } catch (error) {
    console.error("Error fetching profile data:", error);
    if (profileContainer) {
      profileContainer.innerHTML = `
        <p class="helper-text" style="text-align:center;padding:1rem;color:var(--color-error, #e53935);">
          Could not load profile. Please check your connection.
        </p>`;
    }
    if (phoneValue) phoneValue.textContent = "N/A";
    if (emailValue) emailValue.textContent = "N/A";
    if (plateValue) plateValue.textContent = "N/A";
    if (modelValue) modelValue.textContent = "N/A";
  }

  // ── Logout Handler ──────────────────────────────────────────────────────────
  const logoutBtn = rootElement.querySelector(".logout-button");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

export function unmount(rootElement) {
  // Cleanup Logout event listener
  const logoutBtn = rootElement.querySelector(".logout-button");
  if (logoutBtn) {
    logoutBtn.removeEventListener("click", handleLogout);
  }
}