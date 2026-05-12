import api from '/shared/api-handler.js';

export async function fetchVehicles() {
    try {
        const response = await api.get('/api/v1/vehicles');
        return response.data || response;
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
    }
}
