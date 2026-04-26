import alertsData from "../storage/alerts.js";
import api from "/shared/api-handler.js";

api.setBaseURL("http://localhost:3000");

function getAlertsData() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ ...alertsData });
        }, 200);
    });
}

function getAlertsByType(type) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(alertsData[type] || []);
        }, 200);
    });
}

const AlertsApi = {
    getAlertsData,
    getAlertsByType,
};

export default AlertsApi;
