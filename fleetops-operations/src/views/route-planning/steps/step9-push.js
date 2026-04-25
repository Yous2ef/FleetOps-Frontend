/**
 * Step 9: Push Routes
 */

import { routePlanningState } from "../utils/state-manager.js";
import { createElement, calculateTotalWeight, calculateTotalVolume } from "../utils/helpers.js";

export function renderStep9(container) {
    const state = routePlanningState.getState();
    
    container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <h4 style="margin: 0;">Route Summary — ${state.clusters.length} Routes Ready</h4>
        </div>
        <p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 0 0 20px 0;">
            Review all routes before pushing to driver apps
        </p>
        <div id="routes-summary" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px;"></div>
        <button type="button" class="button primary" id="confirm-push-btn" style="width: 100%; padding: 16px; font-size: 0.875rem; font-weight: 700;">
            <i data-lucide="check-circle"></i>
            Confirm & Push All ${state.clusters.length} Routes to Driver App
        </button>
    `;
    
    setTimeout(() => {
        renderRoutesSummary();
        
        document.getElementById('confirm-push-btn')?.addEventListener('click', () => {
            alert('Routes pushed successfully! (This is a demo)');
        });
    }, 0);
}

function renderRoutesSummary() {
    const state = routePlanningState.getState();
    const container = document.getElementById('routes-summary');
    if (!container) return;
    
    state.clusters.forEach((cluster, index) => {
        const rc = state.routeConfigs[cluster.zone];
        const weight = calculateTotalWeight(cluster.orders);
        const volume = calculateTotalVolume(cluster.orders);
        const hasViolations = rc.optimizedStops?.some(s => !s.withinWindow) || false;
        const lastEta = rc.optimizedStops?.length > 0 
            ? rc.optimizedStops[rc.optimizedStops.length - 1].eta 
            : '—';
        
        const card = createElement('div', {
            html: `
                <div style="background: var(--color-surface-low); border-radius: var(--radius-lg); padding: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 16px; height: 16px; border-radius: 50%; background: ${cluster.color};"></div>
                        <span style="font-size: 0.875rem; font-weight: 700;">Route ${index + 1}: ${cluster.zone}</span>
                        ${hasViolations ? `
                            <span style="font-size: 0.625rem; padding: 4px 10px; border-radius: 999px; background: #fef3c7; color: #92400e; display: flex; align-items: center; gap: 4px; font-weight: 600;">
                                <i data-lucide="alert-triangle" style="width: 12px; height: 12px;"></i>
                                ${rc.optimizedStops.filter(s => !s.withinWindow).length} window violations
                            </span>
                        ` : ''}
                        <i data-lucide="check-circle" style="width: 16px; height: 16px; color: #10b981; margin-left: auto;"></i>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                        ${[
                            { label: 'Vehicle', value: rc.vehicle || '—' },
                            { label: 'Driver', value: rc.driver || '—' },
                            { label: 'Stops', value: rc.optimizedStops?.length || 0 },
                            { label: 'Distance', value: `${Math.round((rc.optimizedStops?.length || 0) * 4.2)} km` },
                            { label: 'Weight', value: `${Math.round(weight)} kg` },
                            { label: 'Volume', value: `${Math.round(volume * 10) / 10} m³` },
                            { label: 'Shift', value: 'Morning' },
                            { label: 'Last ETA', value: lastEta }
                        ].map(field => `
                            <div style="display: flex; justify-content: space-between; padding: 10px 12px; background: var(--color-surface); border-radius: 12px; font-size: 0.875rem;">
                                <span style="color: var(--color-text-muted); font-size: 0.75rem;">${field.label}</span>
                                <span style="font-weight: 600; font-size: 0.75rem;">${field.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
        });
        
        container.appendChild(card);
    });
}
