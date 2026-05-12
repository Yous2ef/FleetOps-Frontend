export const INVENTORY_STORAGE_KEY = 'fleetops_inventory';

export const initialMockData = [
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
    // ... بقية الداتا التي أرسلتها توضع هنا كاملة
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

export let inventoryMockData = [...initialMockData];