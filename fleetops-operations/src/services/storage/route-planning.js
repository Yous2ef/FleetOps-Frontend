/**
 * Route Planning Mock Data Storage
 * 
 * This file contains all mock data for the route planning feature.
 * In production, this will be replaced by real API calls.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const AREAS = [
    "Al Malqa", "King Fahd Rd", "Olaya District", "Exit 5", "Al Nakheel",
    "Downtown", "Industrial Zone", "Al Yasmin", "Al Rawdah", "Sulaimaniyah",
    "Al Murabba", "Al Wurud", "Al Sahafah", "Hittin", "Al Narjis",
    "Al Aqiq", "Al Ghadir", "An Nakhil", "Irqah", "Al Shifa"
];

const CUSTOMERS = [
    "Fresh Market Co", "Green Garden", "Daily Bread", "Office Supplies",
    "Pharma Direct", "Tech Solutions", "Al Safi Dairy", "MedSupply KSA",
    "Saudi Parts", "Home Décor Plus", "Ahmad Electronics", "Quick Bites",
    "Cold Chain Logistics", "AutoParts Express", "Furniture World",
    "Clean Supplies", "BakeryMax", "Grocery Hub", "Print Solutions", "Pet Store KSA"
];

const VEHICLES = [
    { plate: "TRK-023", type: "Heavy", maxWeight: 2000, maxVolume: 50, status: "Available" },
    { plate: "TRK-015", type: "Light", maxWeight: 800, maxVolume: 25, status: "Available" },
    { plate: "TRK-031", type: "Refrigerated", maxWeight: 1500, maxVolume: 35, status: "Available" },
    { plate: "TRK-042", type: "Heavy", maxWeight: 2000, maxVolume: 50, status: "Available" },
    { plate: "TRK-007", type: "Light", maxWeight: 800, maxVolume: 25, status: "Available" },
    { plate: "TRK-050", type: "Refrigerated", maxWeight: 1500, maxVolume: 35, status: "Available" },
    { plate: "TRK-019", type: "Heavy", maxWeight: 2000, maxVolume: 50, status: "Available" },
    { plate: "TRK-028", type: "Light", maxWeight: 800, maxVolume: 25, status: "Available" }
];

const DRIVERS = [
    { name: "Omar Khalid", license: "Heavy", score: 94, status: "Available" },
    { name: "Layla Ahmed", license: "Light", score: 91, status: "Available" },
    { name: "Hassan Youssef", license: "Heavy", score: 87, status: "Available" },
    { name: "Mohammed Ali", license: "Heavy", score: 88, status: "Available" },
    { name: "Fatima Noor", license: "Light", score: 85, status: "Available" },
    { name: "Sara Hassan", license: "Heavy", score: 90, status: "Available" },
    { name: "Khalid Tariq", license: "Heavy", score: 92, status: "Available" },
    { name: "Nora Mansoor", license: "Light", score: 89, status: "Available" }
];

// ============================================================================
// DATA GENERATORS
// ============================================================================

/**
 * Generate mock orders
 * @param {number} count - Number of orders to generate
 * @returns {Array} Array of order objects
 */
function generateOrders(count) {
    const orders = [];
    
    for (let i = 0; i < count; i++) {
        const isPerishable = Math.random() < 0.15;
        const isExpress = Math.random() < 0.2;
        const windowStart = 6 + Math.floor(Math.random() * 8);
        const windowEnd = windowStart + 2 + Math.floor(Math.random() * 4);
        
        orders.push({
            id: `ORD-${5000 + i}`,
            customer: CUSTOMERS[i % CUSTOMERS.length] + (i >= 20 ? ` #${Math.floor(i / 20)}` : ""),
            address: AREAS[i % AREAS.length],
            weight: Math.round((2 + Math.random() * 120) * 10) / 10,
            volume: Math.round((0.1 + Math.random() * 4) * 10) / 10,
            priority: isPerishable ? 95 : isExpress ? 85 : 40 + Math.floor(Math.random() * 40),
            window: `${String(windowStart).padStart(2, "0")}:00-${String(windowEnd).padStart(2, "0")}:00`,
            perishable: isPerishable,
            express: isExpress,
            selected: false,
            lat: 24.65 + Math.random() * 0.15,
            lng: 46.6 + Math.random() * 0.2
        });
    }
    
    return orders;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_ORDERS = generateOrders(1000);

// ============================================================================
// EXPORTS
// ============================================================================

export {
    AREAS,
    CUSTOMERS,
    VEHICLES,
    DRIVERS,
    MOCK_ORDERS,
    generateOrders
};
