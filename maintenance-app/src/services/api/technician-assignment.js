import client, { unwrap } from "../api-client.js";

const WO_BASE       = "/api/v1/maintenance/work-orders";
const MECHANICS_URL = "/api/v1/users/role/mechanics";

function normalizeWorkOrder(raw) {
    const typeMap = { routine: "Routine", emergency: "Emergency", breakdown: "Breakdown" };
    const type    = typeMap[raw.type?.toLowerCase()] ?? raw.type ?? "Routine";
    return {
        id:          String(raw.work_order_id ?? raw.id ?? ""),
        vehicle:     raw.vehicle?.VehicleLicense ?? raw.vehicle_plate ?? (raw.vehicle_id ? `#${raw.vehicle_id}` : "Unknown"),
        date:        raw.opened_at ?? raw.created_at ?? "—",
        type,
        priority:    (raw.priority === "high" || raw.priority === "critical" || type === "Emergency") ? "Urgent" : "Normal",
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
    const { data } = await client.get(`${WO_BASE}/open`);
    return unwrap(data)
        .filter((o) => !o.mechanic_id)
        .map(normalizeWorkOrder);
}

async function getMechanicRoster() {
    const { data } = await client.get(MECHANICS_URL);
    return unwrap(data).map(normalizeMechanic);
}

async function assignWorkOrder(workOrderId, mechanicId) {
    const { data } = await client.post(`${WO_BASE}/${workOrderId}/assign`, {
        mechanic_id: mechanicId,
    });
    return data;
}

const TechnicianAssignmentApi = {
    getUnassignedWorkOrders,
    getMechanicRoster,
    assignWorkOrder,
};

export default TechnicianAssignmentApi;
