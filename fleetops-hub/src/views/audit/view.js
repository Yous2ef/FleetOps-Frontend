import { getAuditLogs } from '../../services/storage/audit.js';

let root = null;
let currentLogs = [];

/**
 * Format ISO date string into readable format
 */
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

/**
 * Render the table rows based on filtered data
 */
function renderTable(data) {
    if (!root) return;
    
    const tbody = root.querySelector('#audit-table-body');
    const emptyState = root.querySelector('#audit-empty-state');
    const table = root.querySelector('.audit-table');
    
    if (!tbody || !emptyState || !table) return;
    
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        emptyState.style.display = 'block';
        table.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    table.style.display = 'table';
    
    data.forEach(log => {
        const tr = document.createElement('tr');
        
        // Determine badge class based on action type
        let actionBadgeClass = '';
        if (log.action === 'Created') actionBadgeClass = 'badge-created';
        else if (log.action === 'Updated') actionBadgeClass = 'badge-updated';
        else if (log.action === 'Deleted') actionBadgeClass = 'badge-deleted';
        
        // Build JSON changes viewer if data exists
        let changesHtml = '';
        if (log.oldValue || log.newValue) {
            changesHtml = `<div class="changes-viewer">`;
            if (log.oldValue) {
                changesHtml += `
                    <div class="changes-box old">
                        <span class="changes-label">Old Value</span>
                        <pre>${JSON.stringify(log.oldValue, null, 2)}</pre>
                    </div>`;
            }
            if (log.newValue) {
                changesHtml += `
                    <div class="changes-box new">
                        <span class="changes-label">New Value</span>
                        <pre>${JSON.stringify(log.newValue, null, 2)}</pre>
                    </div>`;
            }
            changesHtml += `</div>`;
        }
        
        tr.innerHTML = `
            <td><span class="log-id">${log.id}</span></td>
            <td>${formatDate(log.timestamp)}</td>
            <td>${log.userId}</td>
            <td>${log.entity}</td>
            <td><span class="audit-badge ${actionBadgeClass}">${log.action}</span></td>
            <td>
                <div class="log-details-text">${log.details}</div>
                ${changesHtml}
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

/**
 * Gather filter inputs and apply to the mock data array
 */
function applyFilters() {
    if (!root) return;
    
    const searchText = root.querySelector('#filter-search').value.toLowerCase();
    const dateFrom = root.querySelector('#filter-date-from').value;
    const dateTo = root.querySelector('#filter-date-to').value;
    const user = root.querySelector('#filter-user').value;
    const entity = root.querySelector('#filter-entity').value;
    const action = root.querySelector('#filter-action').value;
    
    const filteredData = currentLogs.filter(log => {
        // Text Match (Search in ID or Details)
        if (searchText && !log.details.toLowerCase().includes(searchText) && !log.id.toLowerCase().includes(searchText)) {
            return false;
        }
        
        // Date Range Match
        const logDate = new Date(log.timestamp);
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            if (logDate < fromDate) return false;
        }
        if (dateTo) {
            const toDate = new Date(dateTo);
            // Include entire end day
            toDate.setHours(23, 59, 59, 999);
            if (logDate > toDate) return false;
        }
        
        // Select Dropdown Matches
        if (user && log.userId !== user) return false;
        if (entity && log.entity !== entity) return false;
        if (action && log.action !== action) return false;
        
        return true;
    });
    
    renderTable(filteredData);
}

/**
 * Export current filtered data to a CSV file
 */
function exportToCSV() {
    // Current visible rows determine the export data based on current DOM state, 
    // but better to re-run filter logic or rely on state. To keep it simple, we re-run filter.
    const searchText = root.querySelector('#filter-search').value.toLowerCase();
    const dateFrom = root.querySelector('#filter-date-from').value;
    const dateTo = root.querySelector('#filter-date-to').value;
    const user = root.querySelector('#filter-user').value;
    const entity = root.querySelector('#filter-entity').value;
    const action = root.querySelector('#filter-action').value;
    
    const dataToExport = currentLogs.filter(log => {
        if (searchText && !log.details.toLowerCase().includes(searchText) && !log.id.toLowerCase().includes(searchText)) return false;
        const logDate = new Date(log.timestamp);
        if (dateFrom && logDate < new Date(dateFrom)) return false;
        if (dateTo) {
            const tDate = new Date(dateTo);
            tDate.setHours(23, 59, 59, 999);
            if (logDate > tDate) return false;
        }
        if (user && log.userId !== user) return false;
        if (entity && log.entity !== entity) return false;
        if (action && log.action !== action) return false;
        return true;
    });

    const headers = ['Log ID', 'Date / Time', 'User', 'Entity', 'Action', 'Details', 'Old Value', 'New Value'];
    const rows = [headers.join(',')];
    
    dataToExport.forEach(log => {
        const row = [
            log.id,
            formatDate(log.timestamp),
            log.userId,
            log.entity,
            log.action,
            `"${log.details.replace(/"/g, '""')}"`,
            log.oldValue ? `"${JSON.stringify(log.oldValue).replace(/"/g, '""')}"` : '""',
            log.newValue ? `"${JSON.stringify(log.newValue).replace(/"/g, '""')}"` : '""'
        ];
        rows.push(row.join(','));
    });
    
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ---------------------------------------------------------
// Event Handlers for Delegation
// ---------------------------------------------------------

function handleInput(e) {
    if (e.target.id === 'filter-search') {
        applyFilters();
    }
}

function handleChange(e) {
    if (
        e.target.id === 'filter-date-from' ||
        e.target.id === 'filter-date-to' ||
        e.target.id === 'filter-user' ||
        e.target.id === 'filter-entity' ||
        e.target.id === 'filter-action'
    ) {
        applyFilters();
    }
}

function handleClick(e) {
    const exportBtn = e.target.closest('#export-csv-btn');
    if (exportBtn) {
        exportToCSV();
    }
}

// ---------------------------------------------------------
// Lifecycle Methods
// ---------------------------------------------------------

export async function mount(rootElement) {
    root = rootElement;
    
    const tbody = root.querySelector('#audit-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Loading Logs...</td></tr>';
    
    try {
        currentLogs = await getAuditLogs();
        renderTable(currentLogs);
    } catch (e) {
        console.error("Failed to load audit logs", e);
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Failed to load logs.</td></tr>';
    }
    
    // Attach event listeners via event delegation to the root element
    root.addEventListener('input', handleInput);
    root.addEventListener('change', handleChange);
    root.addEventListener('click', handleClick);
}

export function unmount(rootElement) {
    if (!root) return;
    
    // Clean up all event listeners
    root.removeEventListener('input', handleInput);
    root.removeEventListener('change', handleChange);
    root.removeEventListener('click', handleClick);
    
    // Reset state
    root = null;
}
