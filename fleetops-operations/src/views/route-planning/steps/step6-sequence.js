/**
 * Step 6: Sequence Optimizer
 */

import RoutePlanningAPI from "../../../services/api/route-planning.js";
import { routePlanningState } from "../utils/state-manager.js";
import { createElement } from "../utils/helpers.js";

export async function renderStep6(container) {
    const state = routePlanningState.getState();

    const wrapper = createElement("div", { classes: "step-6-container" });

    // Auto-optimize if not done yet
    if (!state.stepComplete[6] && !state.isProcessing) {
        renderLoading(wrapper);
        container.appendChild(wrapper);
        // Run optimization after render to avoid infinite loop
        setTimeout(() => autoOptimize(), 0);
        return;
    }

    if (state.isProcessing) {
        renderLoading(wrapper);
    } else {
        renderSequence(wrapper);
    }

    container.appendChild(wrapper);
}

async function autoOptimize() {
    routePlanningState.setState({ isProcessing: true });

    const state = routePlanningState.getState();
    const newConfigs = { ...state.routeConfigs };

    for (const cluster of state.clusters) {
        const stops = await RoutePlanningAPI.optimizeRouteSequence(
            cluster.orders,
        );
        newConfigs[cluster.zone] = {
            ...newConfigs[cluster.zone],
            optimizedStops: stops,
        };
    }

    routePlanningState.setState({
        routeConfigs: newConfigs,
        isProcessing: false,
        stepComplete: { ...state.stepComplete, 6: true },
    });
}

function renderLoading(container) {
    container.innerHTML = `
        <div class="rp-loading">
            <div class="rp-loading__spinner"></div>
            <div class="rp-loading__text">
                <p class="rp-loading__title">Optimizing Delivery Sequences...</p>
                <p class="rp-loading__subtitle">Running TSP algorithm on all routes</p>
            </div>
        </div>
    `;
}

function renderSequence(container) {
    const state = routePlanningState.getState();
    const activeCluster = state.clusters[state.activeClusterIndex];
    const rc = state.routeConfigs[activeCluster.zone];
    const isManualMode = state.manualEditMode6;

    container.innerHTML = `
        <div id="cluster-tabs-6"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h4 style="margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
                    Optimized Sequence — <span style="color: var(--color-primary);">${activeCluster.zone}</span>
                    <span class="rp-badge" style="background: #ebfdf5; color: #0f4f49;">AUTO-COMPLETE</span>
                </h4>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="button outlined" id="manual-edit-step6-btn">
                    <i data-lucide="sliders-horizontal"></i>
                    ${isManualMode ? "Disable Manual Edit" : "Manual Edit"}
                </button>
                <button type="button" class="button outlined" id="recalculate-btn">
                    <i data-lucide="rotate-ccw"></i>
                    Recalculate All
                </button>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 420px; gap: 20px;">
            <div style="background: linear-gradient(135deg, #334155 0%, #1e293b 100%); border-radius: var(--radius-lg); height: 384px; position: relative;">
                <div style="position: absolute; bottom: 12px; left: 12px; display: flex; gap: 8px;">
                    <span style="padding: 6px 12px; border-radius: 8px; background: rgba(51, 65, 85, 0.8); color: white; font-size: 0.625rem; font-weight: 700;">
                        ${rc.optimizedStops.length} STOPS
                    </span>
                    <span style="padding: 6px 12px; border-radius: 8px; background: ${activeCluster.color}; color: white; font-size: 0.625rem; font-weight: 700;">
                        ${activeCluster.zone}
                    </span>
                </div>
            </div>
            <div id="stops-list" style="max-height: 384px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;"></div>
        </div>
    `;

    setTimeout(() => {
        renderClusterTabs();
        renderStops(
            rc.optimizedStops,
            activeCluster.color,
            activeCluster.zone,
            isManualMode,
        );

        document
            .getElementById("manual-edit-step6-btn")
            ?.addEventListener("click", () => {
                routePlanningState.setState({
                    manualEditMode6: !state.manualEditMode6,
                });
            });

        document
            .getElementById("recalculate-btn")
            ?.addEventListener("click", () => {
                const newState = { ...state.stepComplete };
                delete newState[6];
                routePlanningState.setState({
                    stepComplete: newState,
                    manualEditMode6: false,
                });
            });
    }, 0);
}

function renderClusterTabs() {
    const state = routePlanningState.getState();
    const container = document.getElementById("cluster-tabs-6");
    if (!container) return;

    container.innerHTML = `
        <p style="font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); font-weight: 600; margin: 0 0 8px 0;">
            SELECT ROUTE (CLUSTER)
        </p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;" id="tabs-container-6"></div>
    `;

    const tabsContainer = document.getElementById("tabs-container-6");
    state.clusters.forEach((cluster, index) => {
        const isActive = state.activeClusterIndex === index;
        const btn = createElement("button", {
            classes: "button",
            html: `
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${cluster.color};"></div>
                <span style="font-weight: 600;">${cluster.zone}</span>
                <span style="color: var(--color-text-muted);">(${cluster.orders.length})</span>
            `,
        });

        btn.style.cssText = isActive
            ? "border: 2px solid var(--color-primary); background: rgba(61, 166, 154, 0.05);"
            : "border: 2px solid var(--color-border); background: var(--color-surface);";

        btn.addEventListener("click", () => {
            routePlanningState.setState({ activeClusterIndex: index });
        });

        tabsContainer.appendChild(btn);
    });
}

function renderStops(stops, color, zone, isManualMode) {
    const container = document.getElementById("stops-list");
    if (!container) return;

    stops.forEach((stop, index) => {
        const card = createElement("div", {
            html: `
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px;">
                    <span style="width: 28px; height: 28px; border-radius: 50%; background: ${color}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; flex-shrink: 0;">
                        ${stop.num}
                    </span>
                    <div style="flex: 1; min-width: 0;">
                        <p style="margin: 0; font-size: 0.875rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${stop.customer}
                        </p>
                        <p style="margin: 0; font-size: 0.625rem; color: var(--color-text-muted);">
                            ${stop.address} · ${stop.orderId}
                        </p>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                        <p style="margin: 0; font-size: 0.75rem; font-weight: 600;">${stop.eta}</p>
                        ${stop.travel !== "—" ? `<p style="margin: 0; font-size: 0.625rem; color: var(--color-text-muted);">${stop.travel}</p>` : ""}
                    </div>
                    ${
                        isManualMode
                            ? `
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <button type="button" data-stop-up-index="${index}" class="button outlined" style="padding: 4px 6px;"><i data-lucide="arrow-up" style="width: 12px; height: 12px;"></i></button>
                            <button type="button" data-stop-down-index="${index}" class="button outlined" style="padding: 4px 6px;"><i data-lucide="arrow-down" style="width: 12px; height: 12px;"></i></button>
                            <button type="button" data-stop-remove-index="${index}" class="button outlined" style="padding: 4px 6px; color: #b91c1c;"><i data-lucide="trash-2" style="width: 12px; height: 12px;"></i></button>
                        </div>
                    `
                            : ""
                    }
                </div>
            `,
        });
        container.appendChild(card);
    });

    if (isManualMode) {
        setTimeout(() => {
            document.querySelectorAll("[data-stop-up-index]").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const index = Number(e.currentTarget.dataset.stopUpIndex);
                    moveStopUp(zone, index);
                });
            });

            document
                .querySelectorAll("[data-stop-down-index]")
                .forEach((btn) => {
                    btn.addEventListener("click", (e) => {
                        const index = Number(
                            e.currentTarget.dataset.stopDownIndex,
                        );
                        moveStopDown(zone, index);
                    });
                });

            document
                .querySelectorAll("[data-stop-remove-index]")
                .forEach((btn) => {
                    btn.addEventListener("click", (e) => {
                        const index = Number(
                            e.currentTarget.dataset.stopRemoveIndex,
                        );
                        removeStop(zone, index);
                    });
                });
        }, 0);
    }
}

function moveStopUp(zone, index) {
    if (index <= 0) return;

    const state = routePlanningState.getState();
    const routeConfig = state.routeConfigs[zone];
    if (!routeConfig) return;

    const stops = [...(routeConfig.optimizedStops || [])];
    [stops[index - 1], stops[index]] = [stops[index], stops[index - 1]];

    const renumbered = stops.map((s, i) => ({ ...s, num: i + 1 }));
    routePlanningState.setState({
        routeConfigs: {
            ...state.routeConfigs,
            [zone]: { ...routeConfig, optimizedStops: renumbered },
        },
    });
}

function moveStopDown(zone, index) {
    const state = routePlanningState.getState();
    const routeConfig = state.routeConfigs[zone];
    if (!routeConfig) return;

    const stops = [...(routeConfig.optimizedStops || [])];
    if (index >= stops.length - 1) return;

    [stops[index], stops[index + 1]] = [stops[index + 1], stops[index]];

    const renumbered = stops.map((s, i) => ({ ...s, num: i + 1 }));
    routePlanningState.setState({
        routeConfigs: {
            ...state.routeConfigs,
            [zone]: { ...routeConfig, optimizedStops: renumbered },
        },
    });
}

function removeStop(zone, index) {
    const state = routePlanningState.getState();
    const routeConfig = state.routeConfigs[zone];
    if (!routeConfig) return;

    const stops = [...(routeConfig.optimizedStops || [])];
    if (index < 0 || index >= stops.length) return;

    stops.splice(index, 1);
    const renumbered = stops.map((s, i) => ({ ...s, num: i + 1 }));

    routePlanningState.setState({
        routeConfigs: {
            ...state.routeConfigs,
            [zone]: { ...routeConfig, optimizedStops: renumbered },
        },
    });
}
