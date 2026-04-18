import { fetchShipments } from '../../services/api/shipments.js';

let cleanups = [];
let allShipments = [];

function renderTable(root, data) {
    const tbody = root.querySelector('#full-shipments-table tbody');
    const noResults = root.querySelector('#no-results');
    const table = root.querySelector('#full-shipments-table');
    
    if (!tbody) return;

    if (data.length === 0) {
        table.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    noResults.style.display = 'none';
    tbody.innerHTML = data.map(s => `
        <tr>
            <td><strong>${s.id}</strong></td>
            <td>${s.origin}</td>
            <td>${s.dest}</td>
            <td>${s.date}</td>
            <td><span class="badge badge--${s.status}">${s.status.replace('_', ' ')}</span></td>
        </tr>
    `).join('');
}

export async function mount(root) {
    cleanups.length = 0;
    
    const res = await fetchShipments();
    if (!document.body.contains(root)) return;
    
    allShipments = res.data || [];
    renderTable(root, allShipments);

    const searchInput = root.querySelector('#shipment-search');
    if (searchInput) {
        const handleSearch = (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allShipments.filter(s => 
                s.id.toLowerCase().includes(query) ||
                s.origin.toLowerCase().includes(query) ||
                s.dest.toLowerCase().includes(query)
            );
            renderTable(root, filtered);
        };
        searchInput.addEventListener('input', handleSearch);
        cleanups.push(() => searchInput.removeEventListener('input', handleSearch));
    }
}

export function unmount(root) {
    cleanups.forEach(fn => fn());
    cleanups = [];
    allShipments = [];
    root.innerHTML = '';
}