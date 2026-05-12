// ─── Work Orders — Seed / Mock Data ──────────────────────────────────────────
// This is the single source of truth for static work-order data.
// Views consume this data only through services/api/work-orders.js.

export const MECHANICS = [
    { name: "Karim",      initials: "KM", avatarClass: "wo-avatar--km" },
    { name: "Omar",       initials: "OY", avatarClass: "wo-avatar--oy" },
    { name: "Ahmed",      initials: "AS", avatarClass: "wo-avatar--as" },
    { name: "Unassigned", initials: "",   avatarClass: "wo-avatar--un" },
];

export const TYPES = ["Routine", "Breakdown", "Emergency"];

export const STATUSES = ["Open", "Closed", "Assigned", "In Progress", "Resolved"];

export const VEHICLES = [
    { plate: "EGY-1234", category: "Light",        model: "Toyota Hilux",    status: "available"      },
    { plate: "EGY-5678", category: "Heavy",        model: "Mercedes Actros", status: "out_of_service" },
    { plate: "EGY-9012", category: "Refrigerated", model: "Isuzu NQR",       status: "in service"     },
    { plate: "EGY-3456", category: "Light",        model: "Mitsubishi L200", status: "available"      },
    { plate: "EGY-7890", category: "Heavy",        model: "Volvo FH16",      status: "out_of_service" },
    { plate: "EGY-2345", category: "Refrigerated", model: "Hyundai HD78",    status: "available"      },
    { plate: "EGY-6789", category: "Light",        model: "Ford Ranger",     status: "in service"     },
    { plate: "EGY-0123", category: "Heavy",        model: "MAN TGX",         status: "available"      },
    { plate: "EGY-4567", category: "Light",        model: "Nissan Navara",   status: "available"      },
    { plate: "EGY-8901", category: "Refrigerated", model: "Fuso Fighter",    status: "available"      },
    { plate: "EGY-0987", category: "Heavy",        model: "Scania R450",     status: "available"      },
    { plate: "EGY-3210", category: "Light",        model: "Isuzu D-Max",     status: "in service"     },
];

export const DESCRIPTIONS = [
    "Engine overheating reported by driver during long-haul route.",
    "Transmission failure on highway. Vehicle towed to depot.",
    "Scheduled 30,000km service. Oil change, filter replacement.",
    "Refrigeration unit producing unusual noise during operation.",
    "Brake pad replacement and rotor resurfacing required.",
    "Air filter replacement and fuel system clean-up needed.",
    "Driver reports brake pedal feels soft. Possible fluid leak.",
    "Battery replacement and electrical system diagnostic.",
    "Coolant leak detected under the hood after morning inspection.",
    "Suspension noise on left front wheel. Alignment check needed.",
    "AC system not cooling properly. Refrigerant recharge required.",
    "Tyre rotation and wheel balancing — monthly schedule.",
    "Emergency: engine warning light on. Diagnostic scan needed.",
    "Windshield wiper motor failure. Replaced under warranty.",
    "Fuel injector cleaning and throttle body service requested.",
];

export const WORK_ORDERS_STORAGE_KEY = "maintenance-app:work-orders";
export const workOrdersMockData = [];
