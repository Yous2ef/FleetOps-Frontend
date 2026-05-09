import api from "/shared/api-handler.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────

api.setBaseURL("http://localhost:8000");

const WO_BASE    = "/api/v1/maintenance/work-orders";
const PARTS_BASE = "/api/v1/maintenance/parts";
const KPI_BASE   = "/api/v1/analytics/kpis";

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeVehicle(raw) {
    return {
        id:          raw.vehicle_id ?? raw.id ?? "—",
        type:        raw.VehicleType  ?? raw.vehicle_type  ?? "Unknown",
        odometer:    raw.Odometer     ?? raw.odometer      ?? "—",
        lastService: raw.last_service ?? raw.lastService   ?? "—",
        nextDue:     raw.next_due     ?? raw.nextDue       ?? "—",
        state:       raw.state        ?? raw.health        ?? "healthy",
    };
}

function normalizeWorkOrder(raw) {
    const typeMap = { routine: "Routine", emergency: "Emergency", breakdown: "Breakdown" };
    return {
        id:       String(raw.work_order_id ?? raw.id ?? "—"),
        vehicle:  raw.vehicle?.VehicleLicense ?? raw.vehicle_plate ?? (raw.vehicle_id ? `#${raw.vehicle_id}` : "—"),
        issue:    typeMap[raw.type?.toLowerCase()] ?? raw.type ?? "Routine",
        mechanic: raw.mechanic?.name ?? raw.mechanic_name ?? "Unassigned",
        status:   _fmtStatus(raw.status ?? "open"),
        opened:   _fmtDate(raw.opened_at ?? raw.created_at),
    };
}

function normalizeAlert(raw) {
    return {
        vehicle: raw.vehicle_id ? `#${raw.vehicle_id}` : (raw.vehicle ?? "—"),
        title:   raw.title       ?? raw.alert_type  ?? "Alert",
        desc:    raw.description ?? raw.message     ?? "—",
        icon:    raw.icon        ?? "triangle-alert",
    };
}

function normalizeStockWarning(raw) {
    return {
        item:     raw.part_name  ?? raw.name     ?? "—",
        category: raw.category   ?? "—",
        qty:      Number(raw.stock_quantity ?? raw.quantity ?? raw.qty ?? 0),
        capacity: Number(raw.max_stock      ?? raw.capacity ?? 10),
        unit:     "units",
        reorder:  Number(raw.reorder_level  ?? raw.reorder  ?? 0),
    };
}

function _fmtStatus(s) {
    const map = { open: "Open", assigned: "Assigned", in_progress: "In Progress", resolved: "Resolved", closed: "Closed" };
    return map[s] ?? s;
}

function _fmtDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── API Methods ──────────────────────────────────────────────────────────────

async function getVehicles() {
    const { data } = await api.get(`${KPI_BASE}/anomalies`);
    const items = Array.isArray(data) ? data : (data?.vehicles ?? data?.data ?? data?.items ?? []);
    return items.map(normalizeVehicle);
}

async function getWorkOrders() {
    const { data } = await api.get(WO_BASE);
    const items = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
    return items.slice(0, 10).map(normalizeWorkOrder);
}

async function getAlerts() {
    const { data } = await api.get(`${KPI_BASE}/anomalies`);
    const items = Array.isArray(data) ? data : (data?.alerts ?? data?.data ?? data?.items ?? []);
    return items.map(normalizeAlert);
}

async function getStockWarnings() {
    const { data } = await api.get(`${PARTS_BASE}/low-stock`);
    const items = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
    return items.map(normalizeStockWarning);
}

// ─── Export ───────────────────────────────────────────────────────────────────

const MaintenanceApi = {
    getVehicles,
    getWorkOrders,
    getAlerts,
    getStockWarnings,
};

export default MaintenanceApi;
