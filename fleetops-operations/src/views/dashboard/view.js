import { summaryData, fleetData, alertsData, violationsData } from "../../services/storage/dashboardData.js";

const PAGE_SIZE = 5;
let currentPage = 1;
let prevHandler = null;
let nextHandler = null;

export function mount(root) {
    currentPage = 1;
 
    renderSummaryCards(root);
    renderFleetTable(root, currentPage);
    renderAlerts(root);
    renderViolations(root);
    initPagination(root);
}

export function unmount(root) {
    const prevBtn = root.querySelector("#fleet-operations-prev");
    const nextBtn = root.querySelector("#fleet-operations-next");
 
    if (prevBtn && prevHandler) prevBtn.removeEventListener("click", prevHandler);
    if (nextBtn && nextHandler) nextBtn.removeEventListener("click", nextHandler);
 
    prevHandler = null;
    nextHandler = null;
}

function renderSummaryCards(root){
    summaryData.forEach(({selector, count, change ,positive})=>{
        const card = root.querySelector(selector)
        if(!card) return;

        const countEl = card.querySelector(".report-count")
        const changeEl = card.querySelector(".report-change")

        if(countEl) countEl.textContent = count
        if(changeEl) changeEl.textContent = change

        changeEl.style.color = ''

        if(positive === true) changeEl.style.color = 'var(--color-primary)'
        else if(positive === false) changeEl.style.color = 'var(--color-danger)'
        else changeEl.style.color = 'var(--color-text-muted)'
    })
}

function renderFleetTable(root, page){
    const tbody = root.querySelector('.fleet-operations-tbody')
    if(!tbody) return;

    const totalResults = fleetData.length;
    const totalPages   = Math.ceil(totalResults / PAGE_SIZE);
    const safePage     = Math.max(1, Math.min(page, totalPages));
    const start        = (safePage - 1) * PAGE_SIZE;
    const pageRows     = fleetData.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = pageRows.map(row =>`
    <tr>
        <td><strong style="color:var(--color-primary);">${row.routeId}</strong></td>

        <td>${row.location}</td>

        <td>${row.driver}</td>

        <td>${buildProgressCell(row.progress)}</td>

        <td><span style="font-weight:600;color:var(--color-text-title)">${row.eta}</span></td>
    </tr>
    `).join('')
    
    const results = root.querySelector('.fleet-operations-results')
    if(!results) return;

    const displayStart = start + 1;
    const displayEnd   = Math.min(start + PAGE_SIZE, totalResults);
    results.textContent = `Showing ${displayStart}–${displayEnd} of ${totalResults} results`;

    const prevBtn = root.querySelector("#fleet-operations-prev");
    const nextBtn = root.querySelector("#fleet-operations-next");

    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= totalPages;
}

function initPagination(root){   
    const prevBtn = root.querySelector('#fleet-operations-prev');
    const nextBtn = root.querySelector('#fleet-operations-next');

        prevHandler = () =>{
            currentPage = Math.max(1, currentPage -1)
            renderFleetTable(root, currentPage)
        }
        nextHandler = () =>{
            const totalPages = Math.ceil(fleetData.length / PAGE_SIZE);
            currentPage = Math.min(totalPages, currentPage +1)
            renderFleetTable(root, currentPage)
        }
    prevBtn?.addEventListener('click', prevHandler)
    nextBtn?.addEventListener('click', nextHandler)
}

function buildProgressCell(progress){
    const color = progress >= 75 ? "var(--color-primary)"
            : progress >= 40 ? "var(--color-tertiary)"
            : "var(--color-text-muted)";
    
    return `
    <div style=
    "display: flex;
     flex-direction: column;
     gap: 4px;">

    </div>
    `
}

function renderAlerts(root){
    const alertContainer = root.querySelector('.recent-alerts-content')
    if(!alertContainer) return;

    alertContainer.innerHTML = alertsData.map(buildAlertCard).join('')
}

function renderViolations(root){
    const violationContainer = root.querySelector('.window-violations-content')
    if(!violationContainer) return;

    violationContainer.innerHTML = violationsData.map(buildViolationCard).join('')
}

function buildViolationCard({type, time, severity, message}){
    
}

function buildAlertCard({type, time, severity, message}){
    const severityClass = severity === 'critical' ? 'alert-critical' : 'alertWarning'

    const formattedMessage = message.replace(/(V-\d+|ORD-\d+)/g, "<strong>$1</strong>");

    return`<div class="alert-item ${severityClass}">
              <div class="alert-meta">
                <span class="alert-type">${type}</span>
                <span class="alert-time">${time}</span>
              </div>
              <div class="alert-message">
                <strong>V-788293</strong> detected sudden G-force spike on Route A4.
              </div>
            </div>`
}
