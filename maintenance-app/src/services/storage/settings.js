const SETTINGS_STORAGE_KEY = 'fleetops_settings';

const defaultSettingsMockData = {
    general: {
        currency: "EGP",
        timezone: "Africa/Cairo"
    },
    security: {
        roles: [
            { feature: "Dashboard", fleetManager: "Full Access", dispatcher: "Full Access", driver: "No Access" },
            { feature: "Orders Management", fleetManager: "Full Access", dispatcher: "Full Access", driver: "Read Only" },
            { feature: "Route Planning", fleetManager: "Full Access", dispatcher: "Full Access", driver: "Read Only" },
            { feature: "Live Monitoring", fleetManager: "Full Access", dispatcher: "Full Access", driver: "No Access" },
            { feature: "Fleet Management", fleetManager: "Full Access", dispatcher: "No Access", driver: "No Access" },
            { feature: "User Management", fleetManager: "Full Access", dispatcher: "No Access", driver: "No Access" },
            { feature: "Analytics & Reports", fleetManager: "Full Access", dispatcher: "No Access", driver: "No Access" },
            { feature: "Audit Trail", fleetManager: "Full Access", dispatcher: "No Access", driver: "No Access" },
            { feature: "Settings", fleetManager: "Full Access", dispatcher: "No Access", driver: "No Access" }
        ]
    },
    systemMaintenance: {
        lastArchiveRun: "2026-04-07T02:00:00Z",
        nextScheduledRun: "2026-04-14T02:00:00Z",
        archivePeriodMonths: 12,
        backupSchedule: "Weekly",
        recordsArchived: 1245,
        intervals: {
            oilChange: { light: 5000, heavy: 7500, refrigerated: 5000 },
            tireRotation: { light: 10000, heavy: 15000, refrigerated: 10000 },
            brakeInspection: { light: 20000, heavy: 15000, refrigerated: 20000 },
            transmissionService: { light: 50000, heavy: 40000, refrigerated: 45000 },
            fullInspection: { light: 30000, heavy: 25000, refrigerated: 30000 }
        }
    },
    fleetPolicies: {
        lowStockThreshold: 10,
        sparePartLifespanMonths: 24,
        deliveryWindowTriggerMins: 15,
        fuelDiscrepancyPct: 10,
        proximityAutoCheckInMeters: 500,
        maintenanceCostToValuePct: 40
    },
    kpiWeights: {
        deliverySpeed: 40,
        fuelEfficiency: 30,
        customerRating: 30
    },
    notifications: {
        deliveryWindowViolation: { push: true, sms: true, email: false },
        vehicleBreakdown: { push: true, sms: true, email: false },
        routeCompleted: { push: true, sms: true, email: false },
        speedAnomaly: { push: true, sms: true, email: false },
        fuelDiscrepancy: { push: true, sms: true, email: false },
        maintenanceDue: { push: true, sms: true, email: false }
    }
};



let settingsMockData = {...defaultSettingsMockData};
export { SETTINGS_STORAGE_KEY, settingsMockData };
