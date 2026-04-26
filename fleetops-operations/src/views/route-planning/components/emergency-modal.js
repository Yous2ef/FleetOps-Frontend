/**
 * Emergency Insert Modal Component
 */

import { routePlanningState } from "../utils/state-manager.js";
import { createElement } from "../utils/helpers.js";
import RoutePlanningAPI from "../../../services/api/route-planning.js";

export function renderEmergencyModal(container) {
    const state = routePlanningState.getState();

    if (state.emergencyInserted) {
        renderSuccess(container);
        return;
    }

    container.innerHTML = `
        <div style="padding: 12px 16px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #991b1b; margin-bottom: 16px;">
            <i data-lucide="alert-triangle" style="width: 16px; height: 16px; flex-shrink: 0;"></i>
            This will immediately modify the active route. The driver will be notified of the change.
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div>
                <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 4px;">Customer Name *</label>
                <input type="text" id="emergency-customer" placeholder="e.g. Urgent Medical Supply" style="width: 100%;">
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 4px;">Phone</label>
                <input type="text" id="emergency-phone" placeholder="+966 50 xxx xxxx" style="width: 100%;">
            </div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 4px;">Delivery Address *</label>
            <input type="text" id="emergency-address" placeholder="Full delivery address" style="width: 100%;">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div>
                <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 4px;">Weight (kg)</label>
                <input type="number" id="emergency-weight" placeholder="5" style="width: 100%;">
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 4px;">Volume (m³)</label>
                <input type="number" id="emergency-volume" placeholder="0.3" step="0.1" style="width: 100%;">
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 4px;">Delivery Window</label>
                <input type="text" id="emergency-window" placeholder="ASAP" style="width: 100%;">
            </div>
        </div>
        
        ${
            state.clusters.length > 0
                ? `
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 8px;">Insert into Route</label>
                <div id="emergency-clusters" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
            </div>
        `
                : ""
        }
        
        <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 8px;">Insert Position</label>
            <div style="display: flex; gap: 8px;">
                ${[
                    {
                        key: "optimal",
                        label: "Optimal (System decides)",
                        desc: "Minimizes total route time",
                    },
                    { key: "start", label: "First Stop", desc: "Deliver ASAP" },
                    { key: "end", label: "Last Stop", desc: "End of route" },
                ]
                    .map(
                        (pos) => `
                    <button type="button" class="emergency-position-btn" data-position="${pos.key}" style="flex: 1; padding: 12px; border: 2px solid ${state.emergencyInsertPosition === pos.key ? "var(--color-primary)" : "var(--color-border)"}; background: ${state.emergencyInsertPosition === pos.key ? "rgba(61, 166, 154, 0.05)" : "var(--color-surface)"}; border-radius: 12px; text-align: left; cursor: pointer; transition: all 0.2s ease;">
                        <p style="margin: 0 0 4px 0; font-size: 0.75rem; font-weight: 600;">${pos.label}</p>
                        <p style="margin: 0; font-size: 0.625rem; color: var(--color-text-muted);">${pos.desc}</p>
                    </button>
                `,
                    )
                    .join("")}
            </div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 4px;">Notes</label>
            <textarea id="emergency-notes" placeholder="Special instructions..." style="width: 100%; height: 64px; resize: none;"></textarea>
        </div>
        
        <div style="display: flex; gap: 12px;">
            <button type="button" id="emergency-cancel-btn" class="button outlined" style="flex: 1;">
                Cancel
            </button>
            <button type="button" id="emergency-insert-submit-btn" class="button primary" style="flex: 1; background: #dc2626;">
                <i data-lucide="zap"></i>
                Insert Emergency Order
            </button>
        </div>
    `;

    setTimeout(() => {
        setupEventHandlers();
        renderClusterButtons();
    }, 0);
}

function renderSuccess(container) {
    container.innerHTML = `
        <div style="padding: 48px 20px; text-align: center;">
            <i data-lucide="check-circle" style="width: 64px; height: 64px; color: #10b981; margin: 0 auto 16px;"></i>
            <p style="font-size: 1.125rem; font-weight: 700; margin: 0 0 8px 0;">Emergency Order Inserted!</p>
            <p style="font-size: 0.875rem; color: var(--color-text-muted); margin: 0;">
                The order has been added to the route and the driver has been notified.
            </p>
        </div>
    `;
}

function renderClusterButtons() {
    const state = routePlanningState.getState();
    const container = document.getElementById("emergency-clusters");
    if (!container) return;

    state.clusters.forEach((cluster) => {
        const rc = state.routeConfigs[cluster.zone];
        const isSelected = state.emergencyTargetCluster === cluster.zone;

        const btn = createElement("button", {
            classes: "emergency-cluster-btn",
            attrs: {
                type: "button",
                "data-cluster": cluster.zone,
            },
            html: `
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${cluster.color};"></div>
                <span style="font-weight: 600;">${cluster.zone}</span>
                <span style="color: var(--color-text-muted);">(${cluster.orders.length} stops)</span>
                ${rc.driver ? `<span style="font-size: 0.625rem; color: var(--color-primary);">${rc.driver.split(" ")[0]}</span>` : ""}
            `,
        });

        btn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border: 2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"};
            background: ${isSelected ? "rgba(61, 166, 154, 0.05)" : "var(--color-surface)"};
            border-radius: 12px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        btn.addEventListener("click", () => {
            routePlanningState.setState({
                emergencyTargetCluster: cluster.zone,
            });
        });

        container.appendChild(btn);
    });
}

function setupEventHandlers() {
    // Position buttons
    document.querySelectorAll(".emergency-position-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const position = e.currentTarget.dataset.position;
            routePlanningState.setState({ emergencyInsertPosition: position });
        });
    });

    // Cancel button
    document
        .getElementById("emergency-cancel-btn")
        ?.addEventListener("click", () => {
            const modal = document.getElementById("emergency-modal");
            if (modal) modal.style.display = "none";
        });

    // Submit button
    document
        .getElementById("emergency-insert-submit-btn")
        ?.addEventListener("click", handleSubmit);
}

async function handleSubmit() {
    const state = routePlanningState.getState();
    const customer = document.getElementById("emergency-customer").value;
    const address = document.getElementById("emergency-address").value;
    const phone = document.getElementById("emergency-phone").value;
    const weight = document.getElementById("emergency-weight").value;
    const volume = document.getElementById("emergency-volume").value;
    const window = document.getElementById("emergency-window").value;
    const notes = document.getElementById("emergency-notes").value;

    if (!customer || !address) {
        alert("Please fill in required fields");
        return;
    }

    const emergencyOrder = await RoutePlanningAPI.createEmergencyOrder({
        customer,
        address,
        phone,
        weight,
        volume,
        window,
        notes,
    });

    const targetCluster =
        state.emergencyTargetCluster || state.clusters[0]?.zone || "";
    const updatedOrders = [emergencyOrder, ...state.orders];
    const updatedPrioritizedOrders = [
        emergencyOrder,
        ...state.prioritizedOrders,
    ];

    let updatedClusters = state.clusters;
    let updatedRouteConfigs = state.routeConfigs;

    if (targetCluster && state.clusters.length > 0) {
        updatedClusters = state.clusters.map((cluster) => {
            if (cluster.zone !== targetCluster) return cluster;
            return {
                ...cluster,
                orders: [emergencyOrder, ...cluster.orders],
            };
        });

        const currentConfig = state.routeConfigs[targetCluster] || {
            clusterId: targetCluster,
            vehicle: "",
            driver: "",
            capacityResult: null,
            optimizedStops: [],
        };

        const newStops = await RoutePlanningAPI.insertEmergencyStop(
            currentConfig.optimizedStops || [],
            emergencyOrder,
            state.emergencyInsertPosition,
        );

        updatedRouteConfigs = {
            ...state.routeConfigs,
            [targetCluster]: {
                ...currentConfig,
                optimizedStops: newStops,
            },
        };
    }

    // Show success
    routePlanningState.setState({
        orders: updatedOrders,
        prioritizedOrders: updatedPrioritizedOrders,
        clusters: updatedClusters,
        routeConfigs: updatedRouteConfigs,
        emergencyInserted: true,
    });

    // Close modal after 2 seconds
    setTimeout(() => {
        const modal = document.getElementById("emergency-modal");
        if (modal) modal.style.display = "none";

        routePlanningState.setState({
            emergencyInserted: false,
            emergencyOrder: {
                customer: "",
                address: "",
                phone: "",
                weight: "",
                volume: "",
                window: "",
                notes: "",
            },
            emergencyTargetCluster: "",
            emergencyInsertPosition: "optimal",
        });
    }, 2000);
}
