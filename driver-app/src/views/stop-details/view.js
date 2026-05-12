import RouteStopsAPI from "../../services/api/route-stops.js";

/**
 * Stop Details View Module
 *
 * Dynamically populates stop and order information using the RouteStopsAPI.
 * Features: Loading states, optional chaining for safety, and reactive UI mapping.
 */
export async function mount(rootElement) {
  if (!rootElement) return;

  // 1. State Retrieval: Extract stopId from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const stopId =
    urlParams.get("stopId") || localStorage.getItem("current_stop_id");

  if (!stopId) {
    console.error("No Stop ID provided in URL or storage.");
    renderError(
      rootElement,
      "Missing Stop ID. Please return to the route page.",
    );
    return;
  }

  // 2. Loading State Initialization
  const container = rootElement.querySelector(".stop-details-container");
  const originalContent = container ? container.innerHTML : "";

  if (container) {
    container.innerHTML = `
      <div class="stack items-center justify-center p-48 text-center" style="min-height: 60vh;">
        <div class="spinner mb-16"></div>
        <p class="helper-text">Loading stop details...</p>
      </div>`;
  }

  try {
    // 3. Data Fetching
    const stopData = await RouteStopsAPI.getStopDetails(stopId);

    if (!stopData) {
      throw new Error("No data returned for this stop.");
    }

    // Restore UI structure
    if (container) container.innerHTML = originalContent;

    // 4. UI Data Binding (with Optional Chaining)
    const safeSetText = (selector, text, fallback = "N/A") => {
      const el = rootElement.querySelector(selector);
      if (el) el.textContent = text || fallback;
    };

    /**
     * Helper to format single time strings or ISO dates to HH:MM.
     * Robust enough to handle existing "HH:MM" strings.
     */
    const formatTime = (timeStr) => {
      if (!timeStr) return "";
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr;

      try {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr;
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } catch (e) {
        return timeStr;
      }
    };

    /**
     * Parses PromisedWindow (could be "Start - End" or ISO range)
     * and returns formatted "HH:MM —<br>HH:MM"
     */
    const formatWindow = (windowStr) => {
      if (!windowStr || windowStr === "TBD") return "TBD";

      // Split by common range separators
      const separators = [" — ", " —", "— ", "—", " - ", " -", "- ", "-"];
      let parts = [windowStr];

      for (const sep of separators) {
        if (windowStr.includes(sep)) {
          parts = windowStr.split(sep);
          break;
        }
      }

      if (parts.length === 2) {
        const start = formatTime(parts[0].trim());
        const end = formatTime(parts[1].trim());
        return `${start} —<br>${end}`;
      }

      return formatTime(windowStr);
    };

    // Header Stop Number
    safeSetText(
      ".data-stop-number",
      stopData.stop_no ? `STOP #${stopData.stop_no}` : "STOP #—",
    );

    // Customer Name (Deeply Nested)
    safeSetText(
      ".data-customer-name",
      stopData.order?.customer?.user?.name || stopData.order?.Customer?.name,
      "Unknown Customer",
    );

    // Address Mapping (Deeply Nested)
    const address =
      stopData.order?.customer?.address ||
      stopData.order?.delivery_address ||
      stopData.order?.Customer?.address ||
      "Address not specified";
    safeSetText(".data-address", address);

    // Time Window (Strictly inside the card)
    const windowEl = rootElement.querySelector(".data-time-window");
    if (windowEl) {
      const windowStr = stopData.order?.PromisedWindow || "TBD";
      windowEl.innerHTML = formatWindow(windowStr);
    }

    // ETA Formatting
    const etaText = formatTime(stopData.eta);
    safeSetText(".data-eta", stopData.eta ? `ETA: ${etaText}` : "ETA: TBD");

    // Payment Logic
    const amount =
      stopData.order?.TotalAmount ||
      stopData.order?.amount ||
      stopData.order?.Price ||
      "0.00";
    safeSetText(".data-payment-amount", `EGP ${amount}`);

    const paymentStatusEl = rootElement.querySelector(".data-payment-status");
    if (paymentStatusEl) {
      const method = (
        stopData.order?.Payment_method ||
        stopData.order?.payment_method ||
        ""
      ).toUpperCase();
      if (method.includes("COD")) {
        paymentStatusEl.textContent = "COD REQUIRED";
        paymentStatusEl.className = "label text-danger m-0 data-payment-status";
      } else {
        paymentStatusEl.textContent = "PAID";
        paymentStatusEl.className =
          "label text-success m-0 data-payment-status";
      }
    }

    // Contact Phone (Deeply Nested)
    const phone =
      stopData.order?.customer?.user?.phone_no ||
      stopData.order?.Customer?.phone ||
      stopData.order?.Customer?.phone_no ||
      "Not available";
    safeSetText(".data-phone-number", phone);

    // Special Instructions
    const instructions =
      stopData.order?.notes ||
      stopData.order?.Customer?.instructions ||
      stopData.order?.SpecialInstructions ||
      "No special instructions provided";
    safeSetText(".data-special-instructions", instructions);

    // 5. Navigation: Setup Scan Button
    const scanBtn = rootElement.querySelector(".scan-btn");
    if (scanBtn) {
      scanBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const orderId = stopData.order_id || stopData.order?.OrderID;

        if (orderId) {
          localStorage.setItem("expected_order_id", orderId);
          window.history.pushState({}, "", `/qr-scan-page?orderId=${orderId}`);
          window.dispatchEvent(new Event("popstate"));
        }
      });
    }

    // 6. Navigation: Setup Report Failed Delivery Button
    const reportBtn = rootElement.querySelector(".report-issue-btn");
    if (reportBtn) {
      // Update text to be more specific
      reportBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        Report Failed Delivery`;

      reportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const orderId = stopData.order_id || stopData.order?.OrderID;
        const path = `/failed-delivery-page?stopId=${stopId}&orderId=${orderId || ""}`;

        window.history.pushState({}, "", path);
        window.dispatchEvent(new Event("popstate"));
      });
    }

    // Update Status Badge if available
    const statusBadge = rootElement.querySelector(".data-status");
    if (statusBadge && stopData.actual_arrival_time) {
      statusBadge.textContent = "ARRIVED";
      statusBadge.classList.replace("neutral", "success");
    }

    // 7. Navigation: Back to Route
    const backBtn = rootElement.querySelector(".back-button");
    if (backBtn) {
      backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", "/active-route-page");
        window.dispatchEvent(new Event("popstate"));
      });
    }
  } catch (error) {
    console.error("Critical error in Stop Details View:", error);
    renderError(
      rootElement,
      "Failed to load stop details. Please check your connection.",
    );
  }
}

/**
 * Renders an error state in the container.
 */
function renderError(rootElement, message) {
  const container = rootElement.querySelector(".stop-details-container");
  if (container) {
    container.innerHTML = `
      <div class="stack items-center justify-center p-24 text-center">
        <div class="icon-button danger mb-16" style="width: 64px; height: 64px; pointer-events: none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 class="heading-md">Data Load Failed</h2>
        <p class="helper-text">${message}</p>
        <button class="button primary mt-24" onclick="window.history.back()">Go Back</button>
      </div>`;
  }
}

export function unmount() {}
