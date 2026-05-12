import { fetchVehicles } from '../../services/storage/vehicles.js';

export default async function render() {
    let html = `
        <div class="vehicles-container">
            <header class="vehicles-header" style="margin-bottom: 20px;">
                <h2>Vehicles</h2>
            </header>
    `;

    try {
        const vehicles = await fetchVehicles();

        if (!vehicles || vehicles.length === 0) {
            html += `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #6b7c96;">
                    <p>No vehicles found matching your criteria.</p>
                </div>
            `;
        } else {
            const rows = vehicles.map(v => `
                <tr>
                    <td>${v.plate_number || v.plateNumber || v.plate || 'N/A'}</td>
                    <td>${v.model || v.vehicle_model || 'N/A'}</td>
                    <td><span class="status-badge status-${(v.status || '').toLowerCase()}">${v.status || 'N/A'}</span></td>
                    <td>${v.last_maintenance || v.lastService || v.last_service_date || 'N/A'}</td>
                </tr>
            `).join('');

            html += `
                <table class="vehicles-table" style="width: 100%; border-collapse: collapse;">
                    <thead style="text-align: left; border-bottom: 2px solid #edf2f7;">
                        <tr>
                            <th style="padding: 12px;">Plate Number</th>
                            <th style="padding: 12px;">Model</th>
                            <th style="padding: 12px;">Status</th>
                            <th style="padding: 12px;">Last Maintenance</th>
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
                <p>Failed to load vehicles. Please try again later.</p>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}
