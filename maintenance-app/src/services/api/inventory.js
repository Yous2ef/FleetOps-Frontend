import api from "/shared/api-handler.js";
import { initialMockData, INVENTORY_STORAGE_KEY } from "../storage/inventory.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────
// إعداد قاعدة URL وهمية (يمكن تعديله لاحقًا ليتوافق مع API حقيقي)
api.setBaseURL("http://localhost:3000");

// دالة محاكاة تأخير الشبكة لزيادة واقعية التجربة
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// ─── API Methods ────────────────────────────────────────────────────────────

// API: GET /api/inventory
export async function getInventory() {
    await delay(100);
    const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(initialMockData));
        return [...initialMockData];
    }
    return JSON.parse(stored);
}

// API: POST/PUT /api/inventory(localStorage)
export async function updateInventory(newInventory) {
    await delay(100);
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(newInventory));
    return { success: true };
}

// Helper function to get a specific part by ID
export async function getPartById(partId) {
    const inventory = await getInventory();
    return inventory.find(part => part.id === partId) || null;
}
// Exporting a combined object for easier imports in components(لو حد منكم عاوز ياخد ال inventory بردو استعملوا دي )
const InventoryApi = {
    getInventory,
    updateInventory,
    getPartById
};

export default InventoryApi;