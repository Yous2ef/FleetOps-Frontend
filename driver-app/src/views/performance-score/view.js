/**
 * Performance Score View Module
 * Displays static mock performance metrics for testing and demo purposes.
 */
export async function mount(rootElement) {
  const view = rootElement || document;

  // 1. Mock Data Object
  const performanceMockData = {
    score: 88,
    diffFromAverage: "+14%",
    rank: 5,
    tier: "Elite Driver Tier",
    metrics: {
      deliverySpeed: "22 min avg",
      fuelEfficiency: "94%",
      customerRating: 4.9,
      onTimeRate: "97%",
    },
  };

  // 2. UI Element Selectors
  const mainScoreEl = view.querySelector(".ps-main-score");
  const fleetDiffEl = view.querySelector(".ps-fleet-diff");
  const rankValEl = view.querySelector(".ps-rank-val");
  const tierNameEl = view.querySelector(".ps-tier-name");
  const rankDisplayEl = view.querySelector(".driver-rank-display");

  const speedEl = view.querySelector(".ps-metric-speed");
  const fuelEl = view.querySelector(".ps-metric-fuel");
  const ratingEl = view.querySelector(".ps-metric-rating");
  const ontimeEl = view.querySelector(".ps-metric-ontime");

  // 3. Data Binding
  if (mainScoreEl) mainScoreEl.textContent = performanceMockData.score;
  if (fleetDiffEl) fleetDiffEl.textContent = performanceMockData.diffFromAverage;
  if (rankValEl) rankValEl.textContent = performanceMockData.rank;
  if (tierNameEl) tierNameEl.textContent = performanceMockData.tier;

  if (rankDisplayEl) {
    rankDisplayEl.textContent = `Ranked top #${performanceMockData.rank} among regional drivers`;
  }

  // 4. Metric Cards Mapping & Formatting
  const m = performanceMockData.metrics;

  if (speedEl) speedEl.textContent = m.deliverySpeed;
  if (fuelEl) fuelEl.textContent = m.fuelEfficiency;

  if (ratingEl) {
    // Formatting: Display star rating with the ★ icon
    ratingEl.innerHTML = `<span class="ps-star-icon">★</span> ${m.customerRating.toFixed(1)}`;
  }

  if (ontimeEl) ontimeEl.textContent = m.onTimeRate;
}

export function unmount() {
  // Cleanup logic if needed
}
