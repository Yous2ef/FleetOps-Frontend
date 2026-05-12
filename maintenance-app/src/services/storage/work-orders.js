export async function fetchWorkOrders() {
    try {
        const response = await fetch('http://localhost:8000/api/v1/work-orders', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error('Failed to fetch work orders:', error);
        throw error;
    }
}
