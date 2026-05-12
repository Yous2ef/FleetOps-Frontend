import api from "/shared/api-handler.js";
import { FUEL_STORAGE_KEY, fuelMockData } from "../storage/fuel.js";

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

const BASE = "/api/v1/analytics/fuel";

function _currentMonthRange() {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        period_start: start.toISOString().slice(0, 10),
        period_end:   end.toISOString().slice(0, 10),
    };
}

/** Returns YYYY-MM from a human label like "April 2026" or an ISO date */
function _parsePeriod(raw) {
    if (!raw) return "";
    // Already YYYY-MM
    if (/^\d{4}-\d{2}$/.test(raw)) return raw;
    // ISO date YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 7);
    // Human label "April 2026" / "Apr 2026"
    const d = new Date(`1 ${raw}`);
    if (!isNaN(d)) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    return raw;
}

/** Build date range params for a YYYY-MM period string */
function _rangeFromPeriod(period) {
    const [year, month] = period.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0);
    return {
        period_start: start.toISOString().slice(0, 10),
        period_end:   end.toISOString().slice(0, 10),
    };
}

/** Try current month first, then last month, then April 2026 as fallback */
async function _findActiveRange() {
    const candidates = [
        _currentMonthRange(),
        (() => {
            const now   = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end   = new Date(now.getFullYear(), now.getMonth(), 0);
            return { period_start: start.toISOString().slice(0, 10), period_end: end.toISOString().slice(0, 10) };
        })(),
        { period_start: "2026-04-01", period_end: "2026-04-30" },
        { period_start: "2026-03-01", period_end: "2026-03-31" },
    ];

    for (const range of candidates) {
        try {
            const { data } = await api.get(`${BASE}/audit`, { params: range, baseURL: BASE_URL });
            const rows = data?.rows ?? [];
            if (rows.length > 0) return range;
        } catch { /* try next */ }
    }
    // Return last month as best-effort even if empty
    return candidates[1];
}

function normalizeAuditRow(raw) {
    return {
        vehiclePlate:       raw.vehicle_license ?? "",
        vehicleType:        raw.vehicle_type    ?? "Unknown",
        period:             _parsePeriod(raw.period ?? ""),
        gpsDistanceKm:      Number(raw.gps_distance_km ?? 0),
        expectedFuelLiters: Number(raw.expected_fuel_l  ?? 0),
        actualFuelLiters:   Number(raw.actual_fuel_l    ?? 0),
        avgEfficiencyKmL:   0,
        _discrepancyPct:    Number(raw.discrepancy_pct  ?? 0),
        _flag:              raw.flag ?? "none",
    };
}

function normalizeEfficiencyRow(raw) {
    return {
        vehiclePlate:       raw.vehicle_license ?? "",
        vehicleType:        raw.vehicle_type    ?? "Unknown",
        period:             _parsePeriod(raw.period ?? ""),
        gpsDistanceKm:      Number(raw.total_km     ?? 0),
        expectedFuelLiters: 0,
        actualFuelLiters:   Number(raw.total_fuel_l ?? 0),
        avgEfficiencyKmL:   Number(raw.avg_efficiency ?? raw.km_per_litre ?? 0),
        _vsFleetAvg:        Number(raw.vs_fleet_avg   ?? 0),
        _trend:             raw.trend ?? null,
        _rank:              raw.rank  ?? 0,
    };
}

async function getFuelAudit(params = {}) {
    try {
        const range = Object.keys(params).length ? params : await _findActiveRange();
        const { data } = await api.get(`${BASE}/audit`, { params: range, baseURL: BASE_URL });
        const rows = data?.rows ?? unwrap(data);
        return {
            rows:            rows.map(normalizeAuditRow),
            vehiclesTracked: data?.vehicles_tracked ?? rows.length,
            flaggedCount:    data?.flagged_count    ?? 0,
        };
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(FUEL_STORAGE_KEY);
        const fuelData = stored ? JSON.parse(stored) : fuelMockData;
        return {
            rows: fuelData.records,
            vehiclesTracked: fuelData.records.length,
            flaggedCount: fuelData.records.filter(r => r.actualFuelLiters > r.expectedFuelLiters * 1.1).length
        };
    }
}

async function getFuelEfficiency(params = {}) {
    try {
        const range = Object.keys(params).length ? params : await _findActiveRange();
        const { data } = await api.get(`${BASE}/efficiency`, { params: range, baseURL: BASE_URL });
        const rows = data?.table ?? unwrap(data);
        return {
            rows:            rows.map(normalizeEfficiencyRow),
            fleetAverage:    Number(data?.fleet_average_km_per_litre ?? 0),
            mostEfficient:   data?.most_efficient  ?? null,
            leastEfficient:  data?.least_efficient ?? null,
            vehiclesTracked: data?.vehicles_tracked ?? rows.length,
        };
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(FUEL_STORAGE_KEY);
        const fuelData = stored ? JSON.parse(stored) : fuelMockData;
        return {
            rows: fuelData.records,
            fleetAverage: fuelData.records.reduce((acc, r) => acc + r.avgEfficiencyKmL, 0) / (fuelData.records.length || 1),
            mostEfficient: fuelData.records.reduce((prev, current) => (prev.avgEfficiencyKmL > current.avgEfficiencyKmL) ? prev : current),
            leastEfficient: fuelData.records.reduce((prev, current) => (prev.avgEfficiencyKmL < current.avgEfficiencyKmL) ? prev : current),
            vehiclesTracked: fuelData.records.length,
        };
    }
}

async function getFuelState(params = {}) {
    try {
        // Auto-detect the most recent period that has data
        const range = Object.keys(params).length ? params : await _findActiveRange();

        // Derive a YYYY-MM period key from the range for records that lack one
        const periodKey = _parsePeriod(range.period_start);

        const [auditRes, effRes] = await Promise.all([
            api.get(`${BASE}/audit`,      { params: range, baseURL: BASE_URL }),
            api.get(`${BASE}/efficiency`, { params: range, baseURL: BASE_URL }),
        ]);

        const auditRows = (auditRes.data?.rows  ?? unwrap(auditRes.data)).map(normalizeAuditRow);
        const effRows   = (effRes.data?.table   ?? unwrap(effRes.data)).map((r) => ({
            ...normalizeEfficiencyRow(r),
            // Efficiency rows don't carry a period — inject it from the range
            period: periodKey,
        }));

        const auditByPlate = Object.fromEntries(auditRows.map((r) => [r.vehiclePlate, r]));
        const records = effRows.map((r) => ({
            ...r,
            expectedFuelLiters: auditByPlate[r.vehiclePlate]?.expectedFuelLiters ?? r.expectedFuelLiters,
            actualFuelLiters:   auditByPlate[r.vehiclePlate]?.actualFuelLiters   ?? r.actualFuelLiters,
        }));

        // Also include audit-only rows (vehicles with fuel logs but no GPS routes)
        const effPlates = new Set(effRows.map(r => r.vehiclePlate));
        const auditOnly = auditRows
            .filter(r => !effPlates.has(r.vehiclePlate))
            .map(r => ({ ...r, period: r.period || periodKey }));

        return {
            records:        [...records, ...auditOnly],
            invoices:       [],
            fleetAverage:   Number(effRes.data?.fleet_average_km_per_litre ?? 0),
            mostEfficient:  effRes.data?.most_efficient  ?? null,
            leastEfficient: effRes.data?.least_efficient ?? null,
        };
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(FUEL_STORAGE_KEY);
        const fuelData = stored ? JSON.parse(stored) : fuelMockData;
        return {
            records: fuelData.records,
            invoices: fuelData.invoices || [],
            fleetAverage: fuelData.records.reduce((acc, r) => acc + r.avgEfficiencyKmL, 0) / (fuelData.records.length || 1),
            mostEfficient: fuelData.records.reduce((prev, current) => (prev.avgEfficiencyKmL > current.avgEfficiencyKmL) ? prev : current),
            leastEfficient: fuelData.records.reduce((prev, current) => (prev.avgEfficiencyKmL < current.avgEfficiencyKmL) ? prev : current)
        };
    }
}

async function getFuelRecords(params = {}) {
    return (await getFuelState(params)).records;
}

async function createFuelInvoice(invoiceData) {
    try {
        const { data } = await api.post(`${BASE}/invoices`, {
            vehicle_plate:  invoiceData.vehiclePlate,
            fill_date:      invoiceData.fillDate,
            liters_filled:  invoiceData.litersFilled,
            total_cost_egp: invoiceData.totalCostEgp,
            odometer_km:    invoiceData.odometerKm,
            supplier:       invoiceData.supplier ?? null,
        }, { baseURL: BASE_URL });

        const raw = unwrap(data);
        return {
            invoice: {
                id:           raw.fuel_log_id ?? raw.id ?? `INV-${Date.now()}`,
                vehiclePlate: invoiceData.vehiclePlate,
                fillDate:     invoiceData.fillDate,
                litersFilled: invoiceData.litersFilled,
                totalCostEgp: invoiceData.totalCostEgp,
                odometerKm:   invoiceData.odometerKm,
                supplier:     invoiceData.supplier ?? "Direct Entry",
                period:       String(invoiceData.fillDate ?? "").slice(0, 7),
            },
            record: null,
        };
    } catch (error) {
        console.warn("API failed, falling back to local storage", error);
        const stored = localStorage.getItem(FUEL_STORAGE_KEY);
        const fuelData = stored ? JSON.parse(stored) : { ...fuelMockData };
        
        const newInvoice = {
            id: `INV-${Date.now()}`,
            vehiclePlate: invoiceData.vehiclePlate,
            fillDate: invoiceData.fillDate,
            litersFilled: invoiceData.litersFilled,
            totalCostEgp: invoiceData.totalCostEgp,
            odometerKm: invoiceData.odometerKm,
            supplier: invoiceData.supplier ?? "Direct Entry",
            period: String(invoiceData.fillDate ?? "").slice(0, 7),
        };
        
        if (!fuelData.invoices) fuelData.invoices = [];
        fuelData.invoices.push(newInvoice);
        localStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(fuelData));
        
        return { invoice: newInvoice, record: null };
    }
}

const FuelApi = {
    getFuelState,
    getFuelRecords,
    getFuelAudit,
    getFuelEfficiency,
    createFuelInvoice,
};

export default FuelApi;
