import { fetchShipments, fetchShipmentStats } from '../../services/api/shipments.js';

let cleanups = [];

export async function mount(root) {
    cleanups.length = 0;
    
    // Fetch Data
    const [statsRes, shipRes] = await Promise.all([
        fetchShipmentStats(),
        fetchShipments()
    ]);

    if (!document.body.contains(root)) return; // unmounted while fetching
    
    // Render KPIs
    const kpiGrid = root.querySelector('#kpi-grid');
    if (kpiGrid && statsRes.data) {
        kpiGrid.innerHTML = `
            <div class="card kpi-card">Total Shipments <span>${statsRes.data.total}</span></div>
            <div class="card kpi-card">Active Routes <span>${statsRes.data.active}</span></div>
        `;
    }

    // Render Table
    const tbody = root.querySelector('#home-shipments-table tbody');
    if (tbody && shipRes.data) {
        tbody.innerHTML = shipRes.data.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.origin} &rarr; ${s.dest}</td>
                <td><span class="badge badge--${s.status}">${s.status.replace('_', ' ')}</span></td>
            </tr>
        `).join('');
    }
}

export function unmount(root) {
    cleanups.forEach(fn => fn());
    cleanups = [];
    root.innerHTML = '';
}