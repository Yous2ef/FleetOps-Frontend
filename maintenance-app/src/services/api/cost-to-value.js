import api from "/shared/api-handler.js";
import { ctvMockVehicles } from "../storage/cost-to-value.js";

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

const VEHICLES_URL = "/api/v1/dispatch/vehicles";
const WO_BASE      = "/api/v1/maintenance/work-orders";

const CTV_THRESHOLDS = { safe: 25, monitor: 40 };

function enrichVehicle(v) {
    const ratio = v.marketValueEgp > 0
        ? (v.totalRepairCostEgp / v.marketValueEgp) * 100
        : 0;
    let riskLevel;
    if (ratio >= CTV_THRESHOLDS.monitor)    riskLevel = "Retire";
    else if (ratio >= CTV_THRESHOLDS.safe)  riskLevel = "Monitor";
    else                                    riskLevel = "Safe";
    return { ...v, ctvRatio: parseFloat(ratio.toFixed(1)), riskLevel };
}

function normalizeVehicle(raw) {
    return {
        plate:             raw.VehicleLicense ?? raw.vehicle_license ?? "",
        type:              raw.VehicleType    ?? raw.vehicle_type    ?? "Unknown",
        model:             raw.VehicleModel   ?? raw.vehicle_model   ?? "",
        year:              raw.year           ?? null,
        status:            raw.Status         ?? raw.status          ?? "Unknown",
        marketValueEgp:    Number(raw.MarketValue ?? raw.market_value ?? 0),
        vehicle_id:        raw.vehicle_id,
        totalRepairCostEgp: 0,
        lastMajorRepair:   null,
        odometer:          Number(raw.Current_odometer ?? raw.odometer ?? 0),
        nextServiceKm:     Number(raw.next_service_km  ?? 0),
        insuranceExpiry:   raw.insurance_expiry  ?? null,
        inspectionExpiry:  raw.inspection_expiry ?? null,
        maxCapacityKg:     Number(raw.MaxWeightCapacity ?? raw.max_capacity_kg ?? 0),
        fuelLogs:          [],
        parts:             [],
        maintenanceHistory: [],
    };
}

function normalizeWorkOrder(raw) {
    return {
        id:            String(raw.work_order_id ?? raw.id ?? ""),
        type:          raw.type    ?? "routine",
        mechanic:      raw.mechanic?.name ?? raw.mechanic_name ?? "Unassigned",
        status:        raw.status  ?? "open",
        repairCostEgp: Number(raw.repair_cost ?? 0),
        opened:        raw.opened_at  ?? raw.created_at ?? null,
        closed:        raw.closed_at  ?? raw.resolved_at ?? null,
    };
}

const STATUS_DISPLAY = {
    open: "Open", assigned: "Assigned", in_progress: "In Progress",
    resolved: "Resolved", closed: "Closed",
};

async function getAllVehicles() {
    try {
        const { data } = await api.get(VEHICLES_URL, { baseURL: BASE_URL });
        const vehicles = unwrap(data).map(normalizeVehicle);

        await Promise.all(
            vehicles.map(async (v) => {
                if (!v.vehicle_id) return;
                try {
                    const { data: woData } = await api.get(`${WO_BASE}/vehicle/${v.vehicle_id}`, { baseURL: BASE_URL });
                    const orders = unwrap(woData).map(normalizeWorkOrder);

                    v.totalRepairCostEgp = orders.reduce((sum, o) => sum + o.repairCostEgp, 0);
                    v.maintenanceHistory = orders.map((o) => ({
                        id:            o.id,
                        type:          o.type.charAt(0).toUpperCase() + o.type.slice(1),
                        mechanic:      o.mechanic,
                        status:        STATUS_DISPLAY[o.status] ?? o.status,
                        repairCostEgp: o.repairCostEgp || null,
                        opened:        o.opened,
                        closed:        o.closed,
                    }));

                    const closedWithCost = orders.filter((o) => o.repairCostEgp > 0 && o.closed);
                    if (closedWithCost.length) {
                        v.lastMajorRepair = closedWithCost
                            .sort((a, b) => new Date(b.closed) - new Date(a.closed))[0].closed;
                    }
                } catch { /* vehicle may have no orders */ }
            })
        );

        return vehicles.map(enrichVehicle).sort((a, b) => b.ctvRatio - a.ctvRatio);
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        return ctvMockVehicles.map(enrichVehicle).sort((a, b) => b.ctvRatio - a.ctvRatio);
    }
}

async function getVehicleByPlate(plate) {
    const all = await getAllVehicles();
    return all.find((v) => v.plate === plate) ?? null;
}

function getThresholds() {
    return { ...CTV_THRESHOLDS };
}

const CostToValueApi = {
    getAllVehicles,
    getVehicleByPlate,
    getThresholds,
};

export default CostToValueApi;
