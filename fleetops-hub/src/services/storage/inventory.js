const INVENTORY_STORAGE_KEY = 'fleetops_inventory';

const initialMockData = [
    {
        id: "PRT-1001",
        name: "Engine Oil Filter",
        sku: "SKU-10000",
        category: "Engine Parts",
        quantity: 25,
        minThreshold: 10,
        maxLevel: 50,
        unitPrice: 150.00,
        location: "Warehouse A, Row 1",
        supplier: "Global Auto Parts",
        lastRestocked: "2026-03-15T00:00:00Z",
        monthlyUsage: [20, 22, 18, 25, 24, 21]
    },
    {
        id: "PRT-1002",
        name: "Brake Pads (Front)",
        sku: "SKU-10001",
        category: "Brakes",
        quantity: 26,
        minThreshold: 15,
        maxLevel: 60,
        unitPrice: 450.00,
        location: "Warehouse A, Row 2",
        supplier: "StopTech Inc.",
        lastRestocked: "2026-04-10T00:00:00Z",
        monthlyUsage: [30, 28, 35, 32, 29, 31]
    },
    {
        id: "PRT-1003",
        name: "Heavy Duty Tires",
        sku: "SKU-10002",
        category: "Tires",
        quantity: 1,
        minThreshold: 8,
        maxLevel: 40,
        unitPrice: 3200.00,
        location: "Warehouse B, Rack 1",
        supplier: "Michelin Commercial",
        lastRestocked: "2026-01-20T00:00:00Z",
        monthlyUsage: [5, 4, 6, 8, 5, 7]
    },
    {
        id: "PRT-1004",
        name: "Air Filter",
        sku: "SKU-10003",
        category: "Filters",
        quantity: 5,
        minThreshold: 10,
        maxLevel: 40,
        unitPrice: 120.00,
        location: "Warehouse A, Row 1",
        supplier: "Global Auto Parts",
        lastRestocked: "2026-02-28T00:00:00Z",
        monthlyUsage: [15, 12, 18, 14, 16, 15]
    },
    {
        id: "PRT-1005",
        name: "Spark Plugs Set",
        sku: "SKU-10004",
        category: "Electrical",
        quantity: 35,
        minThreshold: 20,
        maxLevel: 100,
        unitPrice: 200.00,
        location: "Warehouse A, Row 3",
        supplier: "Bosch",
        lastRestocked: "2026-04-01T00:00:00Z",
        monthlyUsage: [10, 8, 12, 15, 11, 14]
    },
    {
        id: "PRT-1006",
        name: "Transmission Fluid",
        sku: "SKU-10005",
        category: "Fluids & Oils",
        quantity: 13,
        minThreshold: 15,
        maxLevel: 50,
        unitPrice: 350.00,
        location: "Warehouse C, Shelf 2",
        supplier: "Liqui Moly",
        lastRestocked: "2026-03-20T00:00:00Z",
        monthlyUsage: [8, 9, 7, 10, 12, 11]
    },
    {
        id: "PRT-1007",
        name: "Clutch Kit",
        sku: "SKU-10006",
        category: "Transmission",
        quantity: 25,
        minThreshold: 5,
        maxLevel: 20,
        unitPrice: 1800.00,
        location: "Warehouse B, Rack 3",
        supplier: "Valeo",
        lastRestocked: "2026-01-15T00:00:00Z",
        monthlyUsage: [2, 1, 3, 2, 4, 2]
    },
    {
        id: "PRT-1008",
        name: "Shock Absorber",
        sku: "SKU-10007",
        category: "Suspension",
        quantity: 32,
        minThreshold: 12,
        maxLevel: 48,
        unitPrice: 850.00,
        location: "Warehouse B, Rack 2",
        supplier: "Monroe",
        lastRestocked: "2026-02-10T00:00:00Z",
        monthlyUsage: [6, 8, 5, 7, 9, 8]
    },
    {
        id: "PRT-1009",
        name: "Headlight Bulb",
        sku: "SKU-10008",
        category: "Electrical",
        quantity: 25,
        minThreshold: 20,
        maxLevel: 100,
        unitPrice: 80.00,
        location: "Warehouse A, Row 4",
        supplier: "Philips",
        lastRestocked: "2026-04-18T00:00:00Z",
        monthlyUsage: [15, 18, 22, 19, 25, 20]
    },
    {
        id: "PRT-1010",
        name: "Windshield Wipers",
        sku: "SKU-10009",
        category: "Body Parts",
        quantity: 13,
        minThreshold: 20,
        maxLevel: 60,
        unitPrice: 120.00,
        location: "Warehouse A, Row 4",
        supplier: "Bosch",
        lastRestocked: "2025-11-20T00:00:00Z",
        monthlyUsage: [30, 25, 15, 10, 5, 2]
    },
    {
        id: "PRT-1011",
        name: "Coolant (5L)",
        sku: "SKU-10010",
        category: "Fluids & Oils",
        quantity: 35,
        minThreshold: 15,
        maxLevel: 80,
        unitPrice: 250.00,
        location: "Warehouse C, Shelf 1",
        supplier: "Prestone",
        lastRestocked: "2026-03-01T00:00:00Z",
        monthlyUsage: [12, 15, 20, 25, 30, 28]
    },
    {
        id: "PRT-1012",
        name: "Alternator",
        sku: "SKU-10011",
        category: "Electrical",
        quantity: 10,
        minThreshold: 5,
        maxLevel: 20,
        unitPrice: 2100.00,
        location: "Warehouse B, Rack 4",
        supplier: "Denso",
        lastRestocked: "2026-01-05T00:00:00Z",
        monthlyUsage: [1, 2, 1, 3, 2, 1]
    },
    {
        id: "PRT-1013",
        name: "Fuel Filter",
        sku: "SKU-10012",
        category: "Filters",
        quantity: 46,
        minThreshold: 15,
        maxLevel: 80,
        unitPrice: 180.00,
        location: "Warehouse A, Row 2",
        supplier: "Global Auto Parts",
        lastRestocked: "2026-04-15T00:00:00Z",
        monthlyUsage: [18, 16, 20, 22, 19, 21]
    },
    {
        id: "PRT-1014",
        name: "Brake Fluid",
        sku: "SKU-10013",
        category: "Fluids & Oils",
        quantity: 22,
        minThreshold: 10,
        maxLevel: 40,
        unitPrice: 150.00,
        location: "Warehouse C, Shelf 2",
        supplier: "StopTech Inc.",
        lastRestocked: "2026-02-20T00:00:00Z",
        monthlyUsage: [5, 4, 6, 5, 7, 6]
    },
    {
        id: "PRT-1015",
        name: "Battery (12V)",
        sku: "SKU-10014",
        category: "Electrical",
        quantity: 0,
        minThreshold: 5,
        maxLevel: 25,
        unitPrice: 1500.00,
        location: "Warehouse B, Rack 1",
        supplier: "Varta",
        lastRestocked: "2025-10-10T00:00:00Z",
        monthlyUsage: [8, 10, 12, 9, 15, 11]
    }
];

// Keep original export for compatibility if any code synchronously imports it
export let inventoryMockData = [...initialMockData];

/**
 * Simulates network delay
 */
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * API: GET /api/inventory
 */
export async function getInventory() {
    await delay();
    const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(initialMockData));
        inventoryMockData = JSON.parse(JSON.stringify(initialMockData));
        return inventoryMockData;
    }
    inventoryMockData = JSON.parse(stored);
    return inventoryMockData;
}

/**
 * API: POST/PUT /api/inventory
 * Replaces the entire inventory array
 */
export async function updateInventory(newInventory) {
    await delay(100);
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(newInventory));
    inventoryMockData = newInventory;
    return { success: true };
}
