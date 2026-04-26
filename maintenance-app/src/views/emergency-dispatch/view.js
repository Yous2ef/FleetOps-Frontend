import emergencyDispatchService from "../../services/storage/emergency-dispatch.js";


export function mount() {
    renderIncidents()
}

export function unmount() {
    // Reserved for cleanup logic.
}

function renderIncidents() {
    const incidents = emergencyDispatchService.quereSelector("#incidents-list");
    incidents.innerHTML = "";

    if (emergencyDispatchService.incidents.length === 0) {
        incidents.innerHTML = `
            <div class="empty-state-placeholder">
                <i data-lucide="check-circle" class="icon-success"></i>
                <p class="text-muted">No active incidents</p>
            </div>
        `;
        return;
    }
}