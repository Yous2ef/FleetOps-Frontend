import { fetchWorkOrders } from '../../services/storage/work-orders.js';

export default async function render() {
    let html = `
        <div class="work-orders-container">
            <header class="work-orders-header" style="margin-bottom: 20px;">
                <h2>Work Orders</h2>
            </header>
    `;

    try {
        const orders = await fetchWorkOrders();

        if (!orders || orders.length === 0) {
            html += `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #6b7c96;">
                    <p>No work orders found.</p>
                </div>
            `;
        } else {
            const rows = orders.map(o => {
                const mechanicName = o.technician || (typeof o.mechanic === 'object' ? o.mechanic?.name : o.mechanic) || 'Unassigned';
                return `
                <tr>
                    <td>${o.id || o.work_order_id || 'N/A'}</td>
                    <td>${o.vehicle || o.vehicle_model || 'N/A'}</td>
                    <td>${mechanicName}</td>
                    <td><span class="priority-badge priority-${(o.priority || '').toLowerCase()}">${o.priority || 'Normal'}</span></td>
                    <td><span class="status-badge status-${(o.status || '').toLowerCase().replace(' ', '-')}">${o.status || 'Open'}</span></td>
                </tr>
            `}).join('');

            html += `
                <table class="work-orders-table" style="width: 100%; border-collapse: collapse;">
                    <thead style="text-align: left; border-bottom: 2px solid #edf2f7;">
                        <tr>
                            <th style="padding: 12px;">ID</th>
                            <th style="padding: 12px;">Vehicle</th>
                            <th style="padding: 12px;">Technician</th>
                            <th style="padding: 12px;">Priority</th>
                            <th style="padding: 12px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        html += `
            <div class="error-state" style="text-align: center; padding: 40px; color: #e53e3e;">
                <p>Failed to load work orders. Please try again later.</p>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

export async function mount(outlet) {
    if (outlet) {
        outlet.innerHTML = await render();
    }
}

export function unmount() {
    // cleanup if needed
}
