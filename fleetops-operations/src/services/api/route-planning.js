import api from "/shared/api-handler.js";
import {
    AREAS,
    CUSTOMERS,
    VEHICLES,
    DRIVERS,
    MOCK_ORDERS,
} from "../storage/route-planning.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────

api.setBaseURL("http://localhost:3000");

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get all available areas
 * @returns {Promise<Array>} List of areas
 */
async function getAreas() {
    // Simulate API delay
    await delay(100);
    return [...AREAS];
}

/**
 * Get all customers
 * @returns {Promise<Array>} List of customers
 */
async function getCustomers() {
    await delay(100);
    return [...CUSTOMERS];
}

/**
 * Get all vehicles
 * @returns {Promise<Array>} List of vehicles
 */
async function getVehicles() {
    await delay(100);
    return [...VEHICLES];
}

/**
 * Get all drivers
 * @returns {Promise<Array>} List of drivers
 */
async function getDrivers() {
    await delay(100);
    return [...DRIVERS];
}

/**
 * Get all orders
 * @param {Object} filters - Optional filters
 * @param {string} filters.search - Search term
 * @param {string} filters.area - Filter by area
 * @param {string} filters.type - Filter by type (all, perishable, express)
 * @returns {Promise<Array>} List of orders
 */
async function getOrders(filters = {}) {
    await delay(200);

    let orders = [...MOCK_ORDERS];

    // Apply filters
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        orders = orders.filter(
            (order) =>
                order.id.toLowerCase().includes(searchLower) ||
                order.customer.toLowerCase().includes(searchLower) ||
                order.address.toLowerCase().includes(searchLower),
        );
    }

    if (filters.area && filters.area !== "All") {
        orders = orders.filter((order) => order.address === filters.area);
    }

    if (filters.type && filters.type !== "all") {
        if (filters.type === "perishable") {
            orders = orders.filter((order) => order.perishable);
        } else if (filters.type === "express") {
            orders = orders.filter((order) => order.express);
        }
    }

    return orders;
}

/**
 * Get paginated orders
 * @param {number} page - Page number (0-indexed)
 * @param {number} pageSize - Number of items per page
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} Paginated result with data and metadata
 */
async function getOrdersPaginated(page = 0, pageSize = 25, filters = {}) {
    const allOrders = await getOrders(filters);
    const start = page * pageSize;
    const end = start + pageSize;
    const data = allOrders.slice(start, end);

    return {
        data,
        pagination: {
            page,
            pageSize,
            total: allOrders.length,
            totalPages: Math.ceil(allOrders.length / pageSize),
            hasNext: end < allOrders.length,
            hasPrev: page > 0,
        },
    };
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object|null>} Order object or null
 */
async function getOrderById(orderId) {
    await delay(100);
    return MOCK_ORDERS.find((order) => order.id === orderId) || null;
}

/**
 * Sort orders by priority
 * @param {Array} orders - Orders to sort
 * @returns {Promise<Array>} Sorted orders
 */
async function sortOrdersByPriority(orders) {
    await delay(1200); // Simulate processing time

    return [...orders].sort((a, b) => {
        // Perishable first
        if (a.perishable !== b.perishable) {
            return a.perishable ? -1 : 1;
        }
        // Then express
        if (a.express !== b.express) {
            return a.express ? -1 : 1;
        }
        // Then by priority score
        return b.priority - a.priority;
    });
}

/**
 * Create geographic clusters from orders
 * @param {Array} orders - Orders to cluster
 * @returns {Promise<Array>} Array of clusters
 */
async function createGeoClusters(orders) {
    await delay(1200); // Simulate processing time

    // Group by address (simple clustering)
    const groups = {};

    orders.forEach((order) => {
        if (!groups[order.address]) {
            groups[order.address] = [];
        }
        groups[order.address].push(order);
    });

    // Convert to cluster format with colors
    const clusterColors = [
        "#14b8a6",
        "#6366f1",
        "#f59e0b",
        "#f43f5e",
        "#8b5cf6",
        "#06b6d4",
        "#10b981",
        "#ec4899",
        "#f97316",
        "#84cc16",
    ];

    const clusters = Object.entries(groups).map(([area, orders], index) => ({
        zone: area,
        color: clusterColors[index % clusterColors.length],
        orders: orders,
    }));

    return clusters;
}

/**
 * Optimize route sequence
 * @param {Array} orders - Orders in the route
 * @returns {Promise<Array>} Optimized stops
 */
async function optimizeRouteSequence(orders) {
    await delay(1200); // Simulate TSP algorithm

    return orders.map((order, index) => {
        const baseTime = 9 * 60 + index * 18; // Start at 9:00, 18 min per stop
        const hours = Math.floor(baseTime / 60);
        const minutes = baseTime % 60;
        const windowEnd = parseInt(order.window.split("-")[1].split(":")[0]);

        return {
            num: index + 1,
            customer: order.customer,
            address: order.address,
            orderId: order.id,
            eta: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
            travel:
                index === 0
                    ? "—"
                    : `${12 + Math.floor(Math.random() * 15)} min`,
            withinWindow: hours < windowEnd,
        };
    });
}

/**
 * Check vehicle capacity
 * @param {Object} vehicle - Vehicle object
 * @param {Array} orders - Orders to check
 * @returns {Promise<Object>} Capacity check result
 */
async function checkVehicleCapacity(vehicle, orders) {
    await delay(300);

    const totalWeight = orders.reduce((sum, order) => sum + order.weight, 0);
    const totalVolume = orders.reduce((sum, order) => sum + order.volume, 0);

    const weightPct = Math.round((totalWeight / vehicle.maxWeight) * 100);
    const volPct = Math.round((totalVolume / vehicle.maxVolume) * 100);

    return {
        ok: weightPct <= 100 && volPct <= 100,
        weightPct,
        volPct,
        totalWeight: Math.round(totalWeight),
        totalVolume: Math.round(totalVolume * 10) / 10,
    };
}

/**
 * Create an emergency order payload
 * @param {Object} payload - Raw emergency order data
 * @returns {Promise<Object>} Emergency order object
 */
async function createEmergencyOrder(payload) {
    await delay(50);

    return {
        id: `ORD-E${Date.now().toString().slice(-6)}`,
        customer: payload.customer,
        address: payload.address,
        weight: Number(payload.weight) || 5,
        volume: Number(payload.volume) || 0.3,
        priority: 99,
        window: payload.window || "ASAP",
        perishable: false,
        express: true,
        selected: true,
        lat: 24.65 + Math.random() * 0.15,
        lng: 46.6 + Math.random() * 0.2,
    };
}

/**
 * Insert emergency stop in route stops list.
 * @param {Array} currentStops - Existing route stops
 * @param {Object} emergencyOrder - Emergency order
 * @param {string} position - start|end|optimal
 * @returns {Promise<Array>} Updated and renumbered stops
 */
async function insertEmergencyStop(
    currentStops,
    emergencyOrder,
    position = "optimal",
) {
    await delay(20);

    const emergencyStop = {
        num: 0,
        customer: emergencyOrder.customer,
        address: emergencyOrder.address,
        orderId: emergencyOrder.id,
        eta: "ASAP",
        travel: "—",
        withinWindow: true,
    };

    let updatedStops = [];
    if (position === "end") {
        updatedStops = [...currentStops, emergencyStop];
    } else {
        // start and optimal are front-loaded for now.
        updatedStops = [emergencyStop, ...currentStops];
    }

    return updatedStops.map((stop, index) => ({
        ...stop,
        num: index + 1,
    }));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simulate API delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// EXPORTS
// ============================================================================

const RoutePlanningAPI = {
    getAreas,
    getCustomers,
    getVehicles,
    getDrivers,
    getOrders,
    getOrdersPaginated,
    getOrderById,
    sortOrdersByPriority,
    createGeoClusters,
    optimizeRouteSequence,
    checkVehicleCapacity,
    createEmergencyOrder,
    insertEmergencyStop,
};

export default RoutePlanningAPI;
