import api from "/shared/api-handler.js";
import { MECHANICS, VEHICLES, WORK_ORDERS_STORAGE_KEY, workOrdersMockData } from "../storage/work-orders.js";

const BASE_URL = "http://localhost:8000";

function unwrap(res) {
    if (res && res.success !== undefined) {
        // Handle Laravel paginated responses
        if (res.data && Array.isArray(res.data.data)) {
            return res.data.data;
        }
        return res.data;
    }
    return res;
}

const BASE          = `/api/v1/maintenance/work-orders`;
const VEHICLES_URL  = `/api/v1/dispatch/vehicles`;
const MECHANICS_URL = `/api/v1/users/role/mechanics`;

// ─── Field maps ───────────────────────────────────────────────────────────────

const STATUS_MAP = {
    open:        "Open",
    assigned:    "Assigned",
    in_progress: "In Progress",
    resolved:    "Resolved",
    closed:      "Closed",
};

const PRIORITY_MAP = {
    low:      "Normal",
    medium:   "Normal",
    high:     "Urgent",
    critical: "Urgent",
};

const TYPE_MAP = {
    routine:   "Routine",
    emergency: "Emergency",
    breakdown: "Breakdown",
};

const TYPE_TO_BACKEND     = { Routine: "routine", Emergency: "emergency", Breakdown: "breakdown" };
const PRIORITY_TO_BACKEND = { Normal: "medium", Urgent: "high" };
const STATUS_TO_BACKEND   = Object.fromEntries(Object.entries(STATUS_MAP).map(([k, v]) => [v, k]));

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeMechanic(raw) {
    if (!raw) return { name: "Unassigned", initials: "UN", avatarClass: "wo-avatar--un" };
    const name = raw.name ?? raw.full_name ?? (typeof raw === "string" ? raw : "Unassigned");
    if (!name || name === "Unassigned") return { name: "Unassigned", initials: "UN", avatarClass: "wo-avatar--un" };
    const initials = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
    return { name, initials, avatarClass: "wo-avatar--km", id: raw.user_id ?? raw.id ?? null };
}

function normalizeOrder(raw) {
    const rawStatus   = raw.status   ?? "open";
    const rawPriority = raw.priority ?? "medium";
    const rawType     = raw.type     ?? "routine";
    const repairCost  = Number(raw.repair_cost ?? 0);

    return {
        id:          String(raw.work_order_id ?? raw.id ?? ""),
        vehicle:     raw.vehicle?.VehicleLicense ?? raw.vehicle_plate ?? (raw.vehicle_id != null ? `#${raw.vehicle_id}` : "Unknown"),
        vehicle_id:  raw.vehicle_id ?? raw.vehicle?.vehicle_id ?? null,
        type:        TYPE_MAP[rawType]         ?? rawType,
        mechanic:    normalizeMechanic(raw.mechanic ?? null),
        mechanic_id: raw.mechanic_id ?? null,
        status:      STATUS_MAP[rawStatus]     ?? rawStatus,
        priority:    PRIORITY_MAP[rawPriority] ?? "Normal",
        description: raw.description ?? raw.notes ?? "",
        cost:        repairCost > 0 ? `EGP ${repairCost.toLocaleString()}` : "—",
        partsCost:   Number(raw.parts_cost ?? 0),
        laborCost:   Number(raw.labor_cost ?? 0),
        logs:        raw.logs  ?? [],
        parts:       Array.isArray(raw.parts_used) ? raw.parts_used : (raw.parts ?? []),
        opened:      _fmtDate(raw.opened_at  ?? raw.created_at),
        updated:     _fmtRelative(raw.updated_at),
    };
}

function normalizeVehicle(raw) {
    return {
        id:       raw.vehicle_id,
        plate:    raw.VehicleLicense ?? raw.vehicle_license ?? "",
        category: raw.VehicleType   ?? raw.vehicle_type    ?? "Unknown",
        model:    raw.VehicleModel  ?? raw.vehicle_model   ?? "",
        status:   (raw.Status ?? raw.status ?? "active").toLowerCase(),
    };
}

function normalizeMechanicUser(raw) {
    const name = raw.name ?? raw.full_name ?? "Unknown";
    const initials = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
    return {
        id:       raw.user_id ?? raw.id,
        name,
        initials,
        avatarClass: "wo-avatar--km",
        role:     raw.role ?? "mechanic",
        isActive: raw.is_active ?? true,
    };
}

function _fmtDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function _fmtRelative(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    const diffDays = Math.floor((Date.now() - d) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1d ago";
    return `${diffDays}d ago`;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

async function getAllOrders() {
    try {
        const { data } = await api.get(BASE, { baseURL: BASE_URL });
        return unwrap(data).map(normalizeOrder);
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        return workOrdersMockData;
    }
}

async function getOrderById(id) {
    try {
        const { data } = await api.get(`${BASE}/${id}`, { baseURL: BASE_URL });
        return normalizeOrder(unwrap(data));
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
        const orders = stored ? JSON.parse(stored) : [...workOrdersMockData];
        const order = orders.find(o => o.id === String(id));
        if (order) return order;
        throw new Error("Order not found in local storage");
    }
}

async function getVehicles() {
    try {
        const { data } = await api.get(VEHICLES_URL, { baseURL: BASE_URL });
        return unwrap(data).map(normalizeVehicle);
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        return VEHICLES.map((v, i) => ({
            id: v.plate || i + 1,
            plate: v.plate,
            category: v.category,
            model: v.model,
            status: v.status
        }));
    }
}

async function getMechanics() {
    try {
        const { data } = await api.get(MECHANICS_URL, { baseURL: BASE_URL });
        return unwrap(data).map(normalizeMechanicUser);
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        return MECHANICS.map((m, i) => ({
            id: i + 1,
            name: m.name,
            initials: m.initials,
            avatarClass: m.avatarClass,
            role: "mechanic",
            isActive: true
        }));
    }
}

async function createOrder(payload) {
    try {
        const vehicles = await getVehicles();
        const vehicle  = vehicles.find((v) => v.plate === payload.vehicle);

        const { data } = await api.post(BASE, {
            vehicle_id:  vehicle?.id ?? payload.vehicle,
            type:        TYPE_TO_BACKEND[payload.type]         ?? (payload.type ?? "routine").toLowerCase(),
            description: payload.description,
            priority:    PRIORITY_TO_BACKEND[payload.priority] ?? "medium",
            notes:       payload.startDate ? `Start date: ${payload.startDate}` : undefined,
        }, { baseURL: BASE_URL });
        return normalizeOrder(unwrap(data));
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const newOrder = {
            id: "WO-" + Date.now().toString().slice(-4),
            vehicle: payload.vehicle,
            vehicle_id: payload.vehicle,
            type: payload.type || "Routine",
            mechanic: { name: "Unassigned", initials: "UN", avatarClass: "wo-avatar--un" },
            mechanic_id: null,
            status: "Open",
            priority: payload.priority || "Normal",
            description: payload.description || "",
            cost: "—",
            partsCost: 0,
            laborCost: 0,
            logs: [],
            parts: [],
            opened: _fmtDate(new Date()),
            updated: "Today"
        };
        const stored = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
        const orders = stored ? JSON.parse(stored) : [...workOrdersMockData];
        orders.unshift(newOrder);
        localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(orders));
        return newOrder;
    }
}

async function updateOrderStatus(id, status) {
    try {
        const backendStatus = STATUS_TO_BACKEND[status] ?? status.toLowerCase().replace(" ", "_");
        const { data } = await api.patch(`${BASE}/${id}/status`, { status: backendStatus }, { baseURL: BASE_URL });
        return normalizeOrder(unwrap(data));
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
        const orders = stored ? JSON.parse(stored) : [...workOrdersMockData];
        const index = orders.findIndex(o => o.id === String(id));
        if (index > -1) {
            orders[index] = { ...orders[index], status: status, updated: "Today" };
            localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(orders));
            return orders[index];
        }
        throw new Error("Order not found in local storage");
    }
}

async function assignMechanic(workOrderId, mechanicId) {
    try {
        const { data } = await api.post(`${BASE}/${workOrderId}/assign`, { mechanic_id: mechanicId }, { baseURL: BASE_URL });
        return normalizeOrder(unwrap(data));
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
        const orders = stored ? JSON.parse(stored) : [...workOrdersMockData];
        const index = orders.findIndex(o => o.id === String(workOrderId));
        if (index > -1) {
            const mechanicMatch = MECHANICS[mechanicId - 1] || MECHANICS[0];
            orders[index] = { 
                ...orders[index], 
                mechanic_id: mechanicId, 
                mechanic: { name: mechanicMatch.name, initials: mechanicMatch.initials, avatarClass: mechanicMatch.avatarClass },
                updated: "Today",
                status: orders[index].status === "Open" ? "Assigned" : orders[index].status
            };
            localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(orders));
            return orders[index];
        }
        throw new Error("Order not found in local storage");
    }
}

// ─── Export ───────────────────────────────────────────────────────────────────

const WorkOrdersApi = {
    getAllOrders,
    getOrderById,
    getVehicles,
    getMechanics,
    createOrder,
    updateOrderStatus,
    assignMechanic,
};

export default WorkOrdersApi;
