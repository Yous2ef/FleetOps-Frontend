import RoutesStorage from "../../services/api/routes.js";

let listContainer;
let modal;
let modalTitle;
let modalBody;
let closeBtn;

/**
 * Mounts the Notification Center view.
 * @param {HTMLElement} element - The parent container.
 */
export async function mount(element) {
  listContainer = element.querySelector(".notification-list-container");
  modal = element.querySelector(".notification-modal");
  modalTitle = element.querySelector(".modal-title");
  modalBody = element.querySelector(".modal-body");
  closeBtn = element.querySelector(".modal-close");

  closeBtn.addEventListener("click", hideModal);

  const driverId = localStorage.getItem("driver_id");
  if (!driverId) {
    renderEmptyState("Driver ID not found. Please log in.");
    return;
  }

  try {
    renderLoading();
    const routes = await RoutesStorage.getDriverRoutes(driverId);
    renderNotifications(routes);
  } catch (error) {
    console.error("Failed to fetch routes:", error);
    renderEmptyState("Unable to load notifications. Please try again later.");
  }
}

/**
 * Unmounts the Notification Center view.
 */
export function unmount() {
  if (closeBtn) {
    closeBtn.removeEventListener("click", hideModal);
  }
}

function renderLoading() {
  listContainer.innerHTML = `
        <div class="stack items-center justify-center p-20">
            <div class="spinner"></div>
            <p class="description mt-10">Loading communications...</p>
        </div>
    `;
}

function renderEmptyState(message) {
  listContainer.innerHTML = `
        <div class="card p-24 stack items-center text-center">
            <div class="notification-icon-wrapper mb-16" style="background: var(--color-surface-low);">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-off"><path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 4.8"/><path d="M17 17H3"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/><path d="m2 2 20 20"/></svg>
            </div>
            <p class="description">${message}</p>
        </div>
    `;
}

function renderNotifications(routes) {
  if (!routes || routes.length === 0) {
    renderEmptyState("No active dispatch routes or alerts found.");
    return;
  }

  listContainer.innerHTML = "";

  routes.forEach((route) => {
    const card = createRouteNotificationCard(route);
    listContainer.appendChild(card);
  });
}

function createRouteNotificationCard(route) {
  const card = document.createElement("div");
  card.className = "notification-card type-route unread";

  // In a real app, we might check if it's already accepted
  const isAccepted =
    localStorage.getItem(`route_accepted_${route.route_id}`) === "true";

  card.innerHTML = `
        <div class="notification-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="notification-content">
            <div class="notification-header-row">
                <h3 class="notification-title">NEW ROUTE ASSIGNED</h3>
                <span class="notification-time">JUST NOW</span>
            </div>
            <p class="notification-desc">
                Route <strong>#${route.route_id}</strong> is ready for dispatch. 
                Contains ${route.stops?.length || 0} stops.
            </p>
            <p class="notification-from">SYSTEM DISPATCH</p>
            <button class="button primary accept-route-btn" ${isAccepted ? "disabled" : ""}>
                ${isAccepted ? "ACCEPTED" : "ACCEPT ROUTE"}
            </button>
        </div>
    `;

  const acceptBtn = card.querySelector(".accept-route-btn");
  acceptBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleAcceptRoute(route, acceptBtn);
  });

  card.addEventListener("click", () => {
    showModal(
      "New Route Assigned",
      `You have been assigned a new route (#${route.route_id}) with ${route.stops?.length || 0} stops. Please accept the route to begin navigation.`,
    );
  });

  return card;
}

async function handleAcceptRoute(route, button) {
  button.disabled = true;
  button.textContent = "ACCEPTING...";

  try {
    // 1. Call backend API to start/accept the route
    const response = await RoutesStorage.startRoute(route.route_id);

    if (response.success) {
      // 2. Update local state
      localStorage.setItem(`route_accepted_${route.route_id}`, "true");
      localStorage.setItem("active_route", JSON.stringify(route));

      button.textContent = "ACCEPTED";
      button.classList.add("secondary");

      // 3. Redirect to active route page after a delay
      setTimeout(() => {
        window.location.href = "/active-route-page";
      }, 800);
    } else {
      throw new Error(response.message || "Failed to start route");
    }
  } catch (error) {
    console.error("Failed to accept route:", error);
    button.disabled = false;
    button.textContent = "RETRY ACCEPT";
    alert("Error: " + error.message);
  }
}

function showModal(title, body) {
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modal.classList.remove("hidden");
}

function hideModal() {
  modal.classList.add("hidden");
}
