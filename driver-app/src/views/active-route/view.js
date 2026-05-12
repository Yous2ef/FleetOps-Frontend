import RoutesStorage from "../../services/api/routes.js";
import RouteStopsAPI from "../../services/api/route-stops.js";

/**
 * Parses an ISO 8601 ETA string into { time, ampm } display parts.
 * e.g. "2026-05-07T15:53:00.000000Z" → { time: "3:53", ampm: "PM" }
 *
 * @param {string|null} etaString
 * @returns {{ time: string, ampm: string }}
 */
function parseETA(etaString) {
  if (!etaString) return { time: "—", ampm: "" };

  try {
    const date = new Date(etaString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return { time: `${hours}:${minutes}`, ampm };
  } catch {
    return { time: "—", ampm: "" };
  }
}

/**
 * Renders the empty state inside the active route view.
 * @param {Element} container
 * @param {string} message
 */
function showEmptyState(
  container,
  message = "No active route found. Please accept a route from the Notification Center.",
) {
  if (container) {
    container.innerHTML = `
      <div class="stack items-center justify-center p-24 text-center" style="min-height: 50vh;">
        <div class="icon-button secondary mb-16" style="width: 64px; height: 64px; pointer-events: none; background: var(--color-surface-strong);">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20l-5-5 5-5"/><path d="M20 20V5a2 2 0 0 0-2-2H8"/><path d="M15 7v5"/><path d="M15 17v.01"/></svg>
        </div>
        <h2 class="heading-md">NO ACTIVE ROUTE</h2>
        <p class="helper-text max-w-280">${message}</p>
        <button class="button primary mt-24" onclick="window.history.pushState({}, '', '/notification-center-page'); window.dispatchEvent(new Event('popstate'));">
          Go to Notifications
        </button>
      </div>`;
  }
}

export async function mount(rootElement) {
  const view = rootElement || document;
  const routeView = view.querySelector(".active-route-view");

  // ── Step A: Acceptance Check ──────────────────────────────────────────────
  const activeRouteRaw = localStorage.getItem("active_route");

  if (!activeRouteRaw) {
    showEmptyState(routeView);
    return;
  }

  let activeRoute;
  try {
    activeRoute = JSON.parse(activeRouteRaw);
  } catch (e) {
    console.error("Failed to parse active_route from localStorage", e);
    showEmptyState(
      routeView,
      "Session data is corrupted. Please re-accept the route.",
    );
    return;
  }

  // ── Step B: Loading State ─────────────────────────────────────────────────
  const originalHTML = routeView ? routeView.innerHTML : "";
  if (routeView) {
    routeView.innerHTML = `
      <div class="stack" style="align-items:center;justify-content:center;padding:5rem 2rem;text-align:center;">
        <div class="spinner mb-16"></div>
        <p class="heading-md">Syncing Route Data...</p>
        <p class="helper-text">Fetching latest stops and optimization data.</p>
      </div>`;
  }

  try {
    // ── Step C: Fetch Initial Data ────────────────────────────────────────────
    let stops = [];
    try {
      stops = await RouteStopsAPI.getRouteStops(activeRoute.route_id);
    } catch (stopsErr) {
      console.error("Failed to load route stops:", stopsErr);
      if (routeView) {
        showEmptyState(
          routeView,
          "Failed to load stops. Please try again later.",
        );
      }
      return;
    }

    // Restore the original HTML skeleton so we can populate it
    if (routeView) routeView.innerHTML = originalHTML;

    // ── Step D: State & Templates ────────────────────────────────────────────
    const activeStopTemplate = view
      .querySelector(".active-stop-card")
      .cloneNode(true);
    const pendingStopTemplate = view
      .querySelector(".pending-stop-card")
      .cloneNode(true);
    const stopsTimeline = view.querySelector(".stops-timeline");

    /**
     * Render the entire timeline based on the current 'stops' array.
     */
    const renderTimeline = () => {
      if (!stopsTimeline) return;

      // Clear existing items but keep the background lines
      const items = stopsTimeline.querySelectorAll(".card");
      items.forEach((item) => item.remove());

      // Sort stops by stop_no
      stops.sort((a, b) => (a.stop_no || 0) - (b.stop_no || 0));

      // ── Step 1: Calculate Progress ────────────────────────────────────────
      // Rule: Stops with actual_arrival_time !== null are counted as "completed" in progress
      const completedStopsCount = stops.filter(
        (stop) => stop.actual_arrival_time !== null,
      ).length;
      const totalStopsCount = stops.length;
      const progressPercent =
        totalStopsCount > 0 ? (completedStopsCount / totalStopsCount) * 100 : 0;

      // Update progress DOM
      const progressEl = view.querySelector(".data-target-progress");
      if (progressEl)
        progressEl.textContent = `${completedStopsCount} / ${totalStopsCount} Stops`;

      const progressBarFill = view.querySelector(".data-target-progress-bar");
      if (progressBarFill) progressBarFill.style.width = `${progressPercent}%`;

      const timelineProgress = view.querySelector(".timeline-progress-line");
      if (timelineProgress)
        timelineProgress.style.height = `${progressPercent}%`;

      // ── Step 2: The "Active Stop" Logic (Sequential Focus) ────────────────
      // Focus stays on the stop until it is fully delivered/finished
      const nextStopIndex = stops.findIndex(
        (stop) =>
          stop.status !== "delivered" &&
          stop.status !== "completed" &&
          stop.status !== "failed",
      );

      // ── Step 3: Conditional Rendering in Stop Cards ────────────────────────
      stops.forEach((stop, index) => {
        const order = stop.order || {};
        const customerName =
          order.customer?.user?.name ||
          order.customer?.name ||
          `Order #${stop.order_id}`;
        const address =
          order.customer?.address ||
          order.delivery_address ||
          order.Area ||
          "Address TBD";

        const isCurrentFocus = nextStopIndex !== -1 && index === nextStopIndex;
        const isNextAfterArrived =
          nextStopIndex !== -1 &&
          index > nextStopIndex &&
          index > 0 &&
          stops[index - 1].actual_arrival_time !== null;

        if (index < nextStopIndex && nextStopIndex !== -1) {
          // Rule: For Completed Stops (index < nextStopIndex)
          // Dim the card's opacity (Heavy/Faded), remove buttons, add "Completed" badge.
          const completedCard = pendingStopTemplate.cloneNode(true);
          completedCard.classList.add("completed-stop-card");
          completedCard.style.opacity = "0.5";
          completedCard.style.pointerEvents = "none";
          completedCard.style.filter = "grayscale(1)";

          const nameEl = completedCard.querySelector(
            ".data-target-pending-name",
          );
          if (nameEl) {
            nameEl.innerHTML = `
              <div class="row items-center">
                <span class="badge success mr-8" style="padding: 2px 6px; border-radius: 4px; background: var(--color-success); color: white;">COMPLETED</span>
                <span style="text-decoration: line-through;">${customerName}</span>
              </div>`;
          }

          const addressEl = completedCard.querySelector(
            ".data-target-pending-address",
          );
          if (addressEl) addressEl.textContent = address;

          stopsTimeline.appendChild(completedCard);
        } else if (isCurrentFocus || isNextAfterArrived) {
          // Rule: For the Current Active Stop OR Next Stop after Arrival
          const activeCard = activeStopTemplate.cloneNode(true);
          activeCard.classList.add("current-active-stop");

          // Only apply primary highlight to the actual focus
          if (isCurrentFocus) {
            activeCard.style.border = "2px solid var(--color-primary)";
            activeCard.style.background = "var(--color-surface-elevated)";
          } else {
            activeCard.style.border = "1px solid var(--color-border)";
            activeCard.style.opacity = "1";
          }

          // Data Mapping
          const stopNoEl = activeCard.querySelector(
            ".data-target-completed-stops",
          );
          if (stopNoEl) stopNoEl.textContent = index + 1;

          const totalEl = activeCard.querySelector(".data-target-total-stops");
          if (totalEl) totalEl.textContent = totalStopsCount;

          const { time, ampm } = parseETA(stop.eta);
          const etaTimeEl = activeCard.querySelector(".data-target-eta-time");
          if (etaTimeEl) etaTimeEl.textContent = time;

          const etaAmPmEl = activeCard.querySelector(".data-target-eta-am-pm");
          if (etaAmPmEl) etaAmPmEl.textContent = ampm;

          const stopNameEl = activeCard.querySelector(".data-target-stop-name");
          if (stopNameEl) stopNameEl.textContent = customerName;

          const stopAddressEl = activeCard.querySelector(
            ".data-target-stop-address",
          );
          if (stopAddressEl) stopAddressEl.textContent = address;

          // Navigation Button
          const navigateBtn = activeCard.querySelector(".navigate-btn");
          const lat = order.latitude || stop.latitude;
          const lng = order.longitude || stop.longitude;
          if (navigateBtn && lat && lng) {
            navigateBtn.onclick = () => {
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                "_blank",
              );
            };
          }

          // Internal Transition Logic (Arrived -> Details)
          const actionBtn = activeCard.querySelector(".route-action-btn");
          if (actionBtn) {
            if (stop.actual_arrival_time === null) {
              // Scenario: Render "Mark as Arrived" initially
              actionBtn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Mark as Arrived`;
              actionBtn.onclick = () => handleArrive(stop.stop_id, actionBtn);
            } else {
              // Scenario: Render "View Stop Details" after arrival
              actionBtn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                View Stop Details`;
              actionBtn.classList.remove("primary");
              actionBtn.classList.add("secondary");
              actionBtn.onclick = () => navigateToStopDetails(stop.stop_id);
            }
          }

          stopsTimeline.appendChild(activeCard);
        } else {
          // Rule: For Future/Pending Stops (index > nextStopIndex)
          const pendingCard = pendingStopTemplate.cloneNode(true);
          pendingCard.style.opacity = "0.6";

          const pendingNameEl = pendingCard.querySelector(
            ".data-target-pending-name",
          );
          if (pendingNameEl) pendingNameEl.textContent = customerName;

          const pendingAddressEl = pendingCard.querySelector(
            ".data-target-pending-address",
          );
          if (pendingAddressEl) pendingAddressEl.textContent = address;

          stopsTimeline.appendChild(pendingCard);
        }
      });
    };

    /**
     * Handles the 'Arrive' action by calling the API and updating the state.
     */
    const handleArrive = async (stopId, btn) => {
      if (!btn || btn.disabled) return;

      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spin"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" /></svg> Arriving…`;

      try {
        // Authenticated PATCH request
        const response = await RoutesStorage.markArrived(stopId);

        if (response && response.success) {
          // Success Update: Replace the stop in the local array
          const updatedStop = response.data; // response.data.data per user instruction, but markArrived returns response.data

          stops = stops.map((s) =>
            String(s.stop_id) === String(stopId) ? { ...s, ...updatedStop } : s,
          );

          // Snappy UI re-render
          renderTimeline();
        } else {
          throw new Error(response?.message || "Failed to mark arrival");
        }
      } catch (err) {
        console.error("Arrival failed:", err);
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        alert("Unable to mark arrival. Please check your connection.");
      }
    };

    /**
     * Standard navigation helper for stop details.
     */
    const navigateToStopDetails = (stopId) => {
      localStorage.setItem("current_stop_id", stopId);
      localStorage.setItem("route_id", activeRoute.route_id);

      // SPA Navigation
      window.history.pushState({}, "", `/stop-details-page?stopId=${stopId}`);
      window.dispatchEvent(new Event("popstate"));
    };

    // ── Step E: Metadata & Initial Render ──────────────────────────────────────
    const routeIdEl = view.querySelector(".data-target-route-id");
    if (routeIdEl) routeIdEl.textContent = `#RT-${activeRoute.route_id}`;

    const statusEl = view.querySelector(".data-target-status");
    if (statusEl) {
      const status = activeRoute.status || "";
      statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }

    const vehicleEl = view.querySelector(".data-target-vehicle");
    if (vehicleEl) {
      vehicleEl.textContent = activeRoute.vehicle_id
        ? `Vehicle #${activeRoute.vehicle_id}`
        : "—";
    }

    const distanceEl = view.querySelector(".data-target-distance");
    if (distanceEl) {
      distanceEl.textContent = activeRoute.total_distance
        ? `${activeRoute.total_distance} km`
        : "—";
    }

    // Initial render
    renderTimeline();
  } catch (error) {
    console.error("Critical error in Active Route view:", error);
    showEmptyState(
      routeView,
      "An unexpected error occurred. Please try again.",
    );
  }
}

export function unmount() {}
