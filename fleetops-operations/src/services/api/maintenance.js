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

/**
 * Returns the list of vehicles with health state info from backend.
 */
async function getVehicles() {
    try {
        const response = await api.get('/api/v1/maintenance/vehicles');
        if (response?.data?.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch maintenance vehicles:', error);
        return [];
    }
}

/**
 * Returns the list of active/recent work orders.
 */
function getWorkOrders() {
    return [...maintenanceWorkOrdersData];
}

/**
 * Returns the list of maintenance alerts.
 */
function getAlerts() {
    return [...maintenanceAlertsData];
}

/**
 * Returns the list of low-stock inventory warnings.
 */
function getStockWarnings() {
    return [...stockWarningsData];
}

// ─── Export ───────────────────────────────────────────────────────────────────

const MaintenanceApi = {
    getVehicles,
    getWorkOrders,
    getAlerts,
    getStockWarnings,
};

export default MaintenanceApi;
