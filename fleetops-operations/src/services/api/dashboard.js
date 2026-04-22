import api from "/shared/api-handler.js";
import { summaryData, fleetData, alertsData, violationsData } from "../storage/dashboardData.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────

api.setBaseURL("http://localhost:3000");

// ─── API Methods ─────────────────────────────────────────────────────────────

function getSummaryData() {
    return [...summaryData];
}

function getFleetData() {
    return [...fleetData];
}

function getAlertsData() {
    return [...alertsData];
}

function getViolationsData() {
    return [...violationsData];
}

const DashboardStorage = {
    getSummaryData,
    getFleetData,
    getAlertsData,
    getViolationsData,
};

export { summaryData, fleetData, alertsData, violationsData };
export default DashboardStorage;
