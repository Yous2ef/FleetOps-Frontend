
import { KPI_DATA, MONTHLY_CHART_DATA, FLEET_STATUS, DRIVER_PERF, AVATAR_COLORS, TABLE_DATA } from "../../services/storage/analyticsData.js";

export function mount(root) {
  renderKPIs(currentRange);
  initDateFilter();
  initExportBtn();

  // Table
  filteredRows = [...TABLE_DATA];
  applySortToFiltered();
  renderTable();
  renderPagination();
  initSortHandlers();

  document.getElementById("table-search-input")?.addEventListener("input", applyFilters);
  document.getElementById("status-filter")?.addEventListener("change", applyFilters);

  if (window.lucide) window.lucide.createIcons();

  loadChartJs(() => {
    renderRevenueChart();
    renderFleetStatusChart();
    renderDriverChart();
    renderDistanceFuelChart();
  });
}

export function unmount() {
  [chartRevenue, chartStatus, chartDriver, chartDistFuel].forEach(c => c?.destroy());
  chartRevenue = chartStatus = chartDriver = chartDistFuel = null;
}

const DIST_FUEL_DATA = (() => {
  const labels = [], distance = [], fuel = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
    const km = Math.round(2800 + Math.random() * 1400);
    distance.push(km);
    fuel.push(+(km / (9 + Math.random() * 2)).toFixed(0));
  }
  return { labels, distance, fuel };
})();


// ── State ──────────────────────────────────────────────────────────────────────

let chartRevenue = null, chartStatus = null, chartDriver = null, chartDistFuel = null;
let currentRange = "7d";
let currentPage = 1;
const PAGE_SIZE = 10;
let filteredRows = [...TABLE_DATA];
let sortCol = "date";
let sortDir = "desc";

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function efficiencyColor(eff) {
  if (eff >= 85) return "#10b981";
  if (eff >= 65) return "#f59e0b";
  return "#ef4444";
}

function statusClass(s) {
  return s === "Optimal" ? "optimal" : s === "High Usage" ? "high-usage" : "needs-review";
}

// ── KPI Cards ──────────────────────────────────────────────────────────────────

function renderKPIs(range) {
  const grid = document.getElementById("kpi-grid");
  if (!grid) return;
  const data = KPI_DATA[range] || KPI_DATA["7d"];
  grid.innerHTML = data.map(k => `
    <div class="kpi-card">
      <div class="kpi-card__top">
        <div class="kpi-card__icon" style="background:${k.bg}; color:${k.color}">
          <i data-lucide="${k.icon}"></i>
        </div>
        <span class="kpi-badge ${k.change >= 0 ? 'up' : 'down'}">
          <i data-lucide="${k.change >= 0 ? 'trending-up' : 'trending-down'}"></i>
          ${k.change >= 0 ? '+' : ''}${k.change}%
        </span>
      </div>
      <div>
        <div class="kpi-card__value">${k.value}</div>
        <div class="kpi-card__label">${k.label}</div>
      </div>
      <div class="kpi-card__bar">
        <div class="kpi-card__bar-fill" style="width:0%; background:${k.color}" data-target="${k.bar}"></div>
      </div>
    </div>
  `).join("");

  if (window.lucide) window.lucide.createIcons();
  // Animate bars after next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      grid.querySelectorAll(".kpi-card__bar-fill").forEach(el => {
        el.style.width = el.dataset.target + "%";
      });
    });
  });
}

// ── Chart: Revenue vs Costs ────────────────────────────────────────────────────

function renderRevenueChart() {
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;
  if (chartRevenue) chartRevenue.destroy();

  const d = MONTHLY_CHART_DATA;
  chartRevenue = new Chart(ctx, {
    type: "bar",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Revenue",
          data: d.revenue,
          backgroundColor: "rgba(15,152,142,0.85)",
          borderRadius: 6,
          borderSkipped: false,
          order: 2,
        },
        {
          label: "Costs",
          data: d.costs,
          backgroundColor: "rgba(229,92,58,0.80)",
          borderRadius: 6,
          borderSkipped: false,
          order: 2,
        },
        {
          label: "Net Profit",
          data: d.profit,
          type: "line",
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.08)",
          borderWidth: 2.5,
          pointBackgroundColor: "#3b82f6",
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 }, color: "#94a3b8" },
          border: { display: false },
        },
        y: {
          grid: { color: "rgba(15,23,42,0.06)" },
          ticks: {
            font: { size: 11 },
            color: "#94a3b8",
            callback: v => "$" + (v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : v),
          },
          border: { display: false },
        },
      },
    },
  });
}

// ── Chart: Fleet Status Doughnut ───────────────────────────────────────────────

function renderFleetStatusChart() {
  const ctx = document.getElementById("fleetStatusChart");
  if (!ctx) return;
  if (chartStatus) chartStatus.destroy();

  chartStatus = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: FLEET_STATUS.map(s => s.label),
      datasets: [{
        data: FLEET_STATUS.map(s => s.count),
        backgroundColor: FLEET_STATUS.map(s => s.color),
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          padding: 10,
          cornerRadius: 10,
        },
      },
    },
  });

  // Legend
  const leg = document.getElementById("fleet-legend");
  if (leg) {
    const total = FLEET_STATUS.reduce((a, s) => a + s.count, 0);
    leg.innerHTML = FLEET_STATUS.map(s => `
      <div class="fleet-legend-row">
        <div class="fleet-legend-left">
          <span class="fleet-legend-dot" style="background:${s.color}"></span>
          <span class="fleet-legend-name">${s.label}</span>
        </div>
        <div class="fleet-legend-bar-wrap">
          <div class="fleet-legend-bar" style="width:0%; background:${s.color}" data-target="${Math.round(s.count/total*100)}"></div>
        </div>
        <span class="fleet-legend-count">${s.count}</span>
      </div>
    `).join("");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      leg.querySelectorAll(".fleet-legend-bar").forEach(el => {
        el.style.width = el.dataset.target + "%";
      });
    }));
  }
}

// ── Chart: Driver Performance ──────────────────────────────────────────────────

function renderDriverChart() {
  const ctx = document.getElementById("driverChart");
  if (!ctx) return;
  if (chartDriver) chartDriver.destroy();

  const d = DRIVER_PERF;
  chartDriver = new Chart(ctx, {
    type: "bar",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Efficiency",
          data: d.efficiency,
          backgroundColor: "rgba(15,152,142,0.85)",
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: "Safety",
          data: d.safety,
          backgroundColor: "rgba(59,130,246,0.75)",
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: {
          position: "top",
          labels: { font: { size: 11 }, color: "#94a3b8", boxWidth: 10, padding: 14 },
        },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          padding: 10,
          cornerRadius: 10,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.x}` },
        },
      },
      scales: {
        x: {
          min: 40,
          max: 100,
          grid: { color: "rgba(15,23,42,0.06)" },
          ticks: { font: { size: 11 }, color: "#94a3b8" },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 12 }, color: "#495763" },
          border: { display: false },
        },
      },
    },
  });
}

// ── Chart: Distance & Fuel ─────────────────────────────────────────────────────

function renderDistanceFuelChart() {
  const ctx = document.getElementById("distanceFuelChart");
  if (!ctx) return;
  if (chartDistFuel) chartDistFuel.destroy();

  const d = DIST_FUEL_DATA;
  chartDistFuel = new Chart(ctx, {
    type: "line",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Distance (km)",
          data: d.distance,
          borderColor: "#0f988e",
          backgroundColor: "rgba(15,152,142,0.08)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#0f988e",
          yAxisID: "y",
        },
        {
          label: "Fuel (L)",
          data: d.fuel,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.07)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#f59e0b",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          padding: 12,
          cornerRadius: 10,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: "#94a3b8", maxTicksLimit: 7 },
          border: { display: false },
        },
        y: {
          position: "left",
          grid: { color: "rgba(15,23,42,0.06)" },
          ticks: { font: { size: 11 }, color: "#94a3b8" },
          border: { display: false },
        },
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 11 }, color: "#94a3b8" },
          border: { display: false },
        },
      },
    },
  });
}

// ── Table ─────────────────────────────────────────────────────────────────────

function applyFilters() {
  const search = (document.getElementById("table-search-input")?.value || "").toLowerCase();
  const statusF = document.getElementById("status-filter")?.value || "";

  filteredRows = TABLE_DATA.filter(r => {
    const matchSearch = !search ||
      r.vehicle.toLowerCase().includes(search) ||
      r.driver.toLowerCase().includes(search) ||
      r.date.includes(search);
    const matchStatus = !statusF || r.status === statusF;
    return matchSearch && matchStatus;
  });

  applySortToFiltered();
  currentPage = 1;
  renderTable();
  renderPagination();
}

function applySortToFiltered() {
  filteredRows.sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (sortCol === "date") { va = new Date(va); vb = new Date(vb); }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

function renderTable() {
  const tbody = document.getElementById("analytics-tbody");
  if (!tbody) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredRows.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = pageRows.map(r => {
    const color = AVATAR_COLORS[Math.abs(r.driver.split(" ").reduce((h, s) => h + s.charCodeAt(0), 0)) % AVATAR_COLORS.length];
    const effColor = efficiencyColor(r.eff);
    return `
      <tr>
        <td>${r.date}</td>
        <td><span class="vehicle-id">${r.vehicle}</span></td>
        <td>
          <div class="driver-cell">
            <div class="driver-avatar" style="background:${color}">${initials(r.driver)}</div>
            ${r.driver}
          </div>
        </td>
        <td>${r.distance.toLocaleString()} km</td>
        <td>${r.fuel} L</td>
        <td>${r.idle}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px">
            <div class="efficiency-bar-wrap">
              <div class="efficiency-bar" style="width:${r.eff}%; background:${effColor}"></div>
            </div>
            <span style="font-size:12px; font-weight:700; color:${effColor}">${r.eff}%</span>
          </div>
        </td>
        <td><span class="status-badge ${statusClass(r.status)}">${r.status}</span></td>
      </tr>
    `;
  }).join("");

  const info = document.getElementById("table-info");
  if (info) {
    const end = Math.min(start + PAGE_SIZE, filteredRows.length);
    info.textContent = filteredRows.length
      ? `Showing ${start + 1}–${end} of ${filteredRows.length} records`
      : "No records found";
  }
}

function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);

  let html = `<button class="page-btn" id="pg-prev"><i data-lucide="chevron-left"></i></button>`;
  for (let p = 1; p <= totalPages; p++) {
    if (totalPages > 7 && p > 2 && p < totalPages - 1 && Math.abs(p - currentPage) > 1) {
      if (p === 3 || p === totalPages - 2) html += `<button class="page-btn" disabled>…</button>`;
      continue;
    }
    html += `<button class="page-btn ${p === currentPage ? "is-active" : ""}" data-page="${p}">${p}</button>`;
  }
  html += `<button class="page-btn" id="pg-next"><i data-lucide="chevron-right"></i></button>`;

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();

  container.querySelector("#pg-prev")?.addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; renderTable(); renderPagination(); }
  });
  container.querySelector("#pg-next")?.addEventListener("click", () => {
    if (currentPage < totalPages) { currentPage++; renderTable(); renderPagination(); }
  });
  container.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = parseInt(btn.dataset.page);
      renderTable();
      renderPagination();
    });
  });
}

// ── Sort ──────────────────────────────────────────────────────────────────────

function initSortHandlers() {
  document.querySelectorAll(".analytics-table th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.col;
      if (sortCol === col) { sortDir = sortDir === "asc" ? "desc" : "asc"; }
      else { sortCol = col; sortDir = "desc"; }
      applySortToFiltered();
      renderTable();
      renderPagination();
    });
  });
}

// ── Chart.js loader ───────────────────────────────────────────────────────────

function loadChartJs(callback) {
  if (window.Chart) { callback(); return; }
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js";
  script.onload = callback;
  document.head.appendChild(script);
}

// ── Date Range Filter ─────────────────────────────────────────────────────────

function initDateFilter() {
  const filter = document.getElementById("date-filter");
  if (!filter) return;
  filter.querySelectorAll(".date-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filter.querySelectorAll(".date-btn").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentRange = btn.dataset.range;
      renderKPIs(currentRange);
      if (window.lucide) window.lucide.createIcons();
    });
  });
}

// ── Export button ─────────────────────────────────────────────────────────────

function initExportBtn() {
  const btn = document.getElementById("export-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const rows = [
      ["Date", "Vehicle ID", "Driver", "Distance (km)", "Fuel (L)", "Idle Time", "Efficiency (%)", "Status"],
      ...TABLE_DATA.map(r => [r.date, r.vehicle, r.driver, r.distance, r.fuel, r.idle, r.eff, r.status]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "fleetops-analytics.csv";
    a.click();
  });
}

// ── Mount / Unmount ───────────────────────────────────────────────────────────
