import api from "/shared/api-handler.js";

// دالة مساعدة لاستخراج الـ ID الرقمي من صيغة (PRT-1001)
const extractId = (str) => str ? str.replace('PRT-', '') : null;
api.setBaseURL("http://localhost:8000");


// دالة مساعدة لتحويل مسميات الفرونت لمسميات الداتا بيز
const mapToBackend = (data) => ({
    name: data.name,
    sku: data.sku,
    category: data.category,
    stock_quantity: data.quantity,
    minimum_stock: data.minThreshold,
    reorder_level: data.maxLevel,
    unit_price: data.unitPrice,
    description: data.location, // بنستخدم الوصف كمكان التخزين مؤقتاً
    supplier_name: data.supplier
});

export async function getInventory() {
    const res = await api.get('/api/v1/maintenance/parts');
    // api-handler المفروض بيرجع { data: ... }
    return res.data || res;
}

export async function getPartById(partId) {
    const res = await api.get(`/api/v1/maintenance/parts/${extractId(partId)}`);
    return res.data || res;
}

export async function createPart(partData) {
    const res = await api.post('/api/v1/maintenance/parts', mapToBackend(partData));
    return res.data || res;
}

export async function updatePart(id, partData) {
    const res = await api.put(`/api/v1/maintenance/parts/${extractId(id)}`, mapToBackend(partData));
    return res.data || res;
}

export async function adjustStock(id, quantity, operation) {
    const res = await api.post(`/api/v1/maintenance/parts/${extractId(id)}/adjust-stock`, { quantity, operation });
    return res.data || res;
}

const InventoryApi = { getInventory, createPart, updatePart, adjustStock, getPartById };
export default InventoryApi;