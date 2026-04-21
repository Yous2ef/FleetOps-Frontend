import api from "/shared/api-handler.js";
import { KPI_DATA, MONTHLY_CHART_DATA, FLEET_STATUS, DRIVER_PERF, AVATAR_COLORS, TABLE_DATA } from "../storage/analyticsData.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────

api.setBaseURL("http://localhost:3000");

// ─── API Methods ─────────────────────────────────────────────────────────────

function getKpiData(period = "7d") {
    return KPI_DATA[period] ? [...KPI_DATA[period]] : [];
}

function getMonthlyChartData() {
    return { ...MONTHLY_CHART_DATA };
}

function getFleetStatus() {
    return [...FLEET_STATUS];
}

function getDriverPerformance() {
    return { ...DRIVER_PERF };
}

function getAvatarColors() {
    return [...AVATAR_COLORS];
}

function getTableData() {
    return [...TABLE_DATA];
}

const AnalyticsStorage = {
    getKpiData,
    getMonthlyChartData,
    getFleetStatus,
    getDriverPerformance,
    getAvatarColors,
    getTableData,
};

export { KPI_DATA, MONTHLY_CHART_DATA, FLEET_STATUS, DRIVER_PERF, AVATAR_COLORS, TABLE_DATA };
export default AnalyticsStorage;
