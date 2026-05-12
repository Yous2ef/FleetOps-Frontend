import api from "/shared/api-handler.js";
import { MECHANICS, WORK_ORDERS_STORAGE_KEY, workOrdersMockData } from "../storage/work-orders.js";

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

const WO_BASE       = "/api/v1/maintenance/work-orders";
const MECHANICS_URL = "/api/v1/users/role/mechanics";

function normalizeWorkOrder(raw) {
    const typeMap = { routine: "Routine", emergency: "Emergency", breakdown: "Breakdown" };
    const type    = typeMap[raw.type?.toLowerCase()] ?? raw.type ?? "Routine";
    return {
        id:          String(raw.work_order_id ?? raw.id ?? ""),
        vehicle:     raw.vehicle?.VehicleLicense ?? raw.vehicle_plate ?? (raw.vehicle_id ? `#${raw.vehicle_id}` : raw.vehicle ?? "Unknown"),
        date:        raw.opened_at ?? raw.created_at ?? raw.opened ?? "—",
        type,
        priority:    (raw.priority === "high" || raw.priority === "critical" || type === "Emergency" || raw.priority === "Urgent") ? "Urgent" : "Normal",
        description: raw.description ?? raw.notes ?? "No description provided.",
    };
}

function normalizeMechanic(raw) {
    const name     = raw.name ?? raw.full_name ?? "Unknown";
    const initials = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
    return {
        id:         raw.user_id ?? raw.id,
        name,
        initials,
        specialty:  raw.specialty ?? raw.department ?? "General",
        activeJobs: Number(raw.active_jobs ?? raw.activeJobs ?? 0),
        status:     raw.is_active === false ? "Off Duty" : (raw.status ?? "Available"),
    };
}

async function getUnassignedWorkOrders() {
    try {
        const { data } = await api.get(`${WO_BASE}/open`, { baseURL: BASE_URL });
        return unwrap(data)
            .filter((o) => !o.mechanic_id)
            .map(normalizeWorkOrder);
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
        const orders = stored ? JSON.parse(stored) : [...workOrdersMockData];
        return orders
            .filter((o) => !o.mechanic_id && o.status !== "Closed")
            .map(normalizeWorkOrder);
    }
}

async function getMechanicRoster() {
    try {
        const { data } = await api.get(MECHANICS_URL, { baseURL: BASE_URL });
        return unwrap(data).map(normalizeMechanic);
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        return MECHANICS.map((m, i) => ({
            id: i + 1,
            name: m.name,
            initials: m.initials,
            specialty: "General",
            activeJobs: 0,
            status: "Available"
        })).filter(m => m.name !== "Unassigned");
    }
}

async function assignWorkOrder(workOrderId, mechanicId) {
    try {
        const { data } = await api.post(`${WO_BASE}/${workOrderId}/assign`, {
            mechanic_id: mechanicId,
        }, { baseURL: BASE_URL });
        return data;
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
            return { success: true, data: orders[index] };
        }
        throw new Error("Order not found in local storage");
    }
}

const TechnicianAssignmentApi = {
    getUnassignedWorkOrders,
    getMechanicRoster,
    assignWorkOrder,
};

export default TechnicianAssignmentApi;
