/**
 * Step 2: Priority Balancer
 */

import RoutePlanningAPI from "../../../services/api/route-planning.js";
import { routePlanningState } from "../utils/state-manager.js";
import { createElement } from "../utils/helpers.js";

// Keep in-progress manual edits local to avoid global state-triggered re-renders on each keystroke.
const pendingPriorityEdits = {};

export async function renderStep2(container) {
    const state = routePlanningState.getState();

    const wrapper = createElement("div", { classes: "step-2-container" });

    // Auto-process if not done yet
    if (
        state.prioritizedOrders.length === 0 &&
        !state.stepComplete[2] &&
        !state.isProcessing
    ) {
        renderLoading(wrapper);
        container.appendChild(wrapper);
        // Run sorting after render to avoid infinite loop
        setTimeout(() => autoSortOrders(), 0);
        return;
    }

    if (state.isProcessing) {
        renderLoading(wrapper);
    } else {
        renderPrioritizedList(wrapper);
    }

    container.appendChild(wrapper);
}

async function autoSortOrders() {
    routePlanningState.setState({ isProcessing: true });

    const state = routePlanningState.getState();
    const selectedOrders = state.orders.filter((o) => o.selected);

    const sorted = await RoutePlanningAPI.sortOrdersByPriority(selectedOrders);

    routePlanningState.setState({
        prioritizedOrders: sorted,
        isProcessing: false,
        stepComplete: { ...state.stepComplete, 2: true },
    });
}

function renderLoading(container) {
    const loading = createElement("div", {
        classes: "rp-loading",
        html: `
            <div class="rp-loading__spinner"></div>
            <div class="rp-loading__text">
                <p class="rp-loading__title">Auto-Sorting by Priority...</p>
                <p class="rp-loading__subtitle">Analyzing orders: Perishable → Express → Tightest window</p>
            </div>
        `,
    });
    container.appendChild(loading);
}

function renderPrioritizedList(container) {
    const state = routePlanningState.getState();
    const isManualMode = state.manualEditMode2;
    const editPriorityId = state.editPriorityId;
    const editPriorityValue = state.editPriorityValue;

    const header = createElement("div", {
        html: `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h4 style="margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
                        Priority Sorted
                        <span class="rp-badge" style="background: #ebfdf5; color: #0f4f49;">AUTO-COMPLETE</span>
                    </h4>
                    <p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 0;">
                        Perishable → Express → Tightest delivery window
                    </p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="button outlined" id="manual-edit-step2-btn" style="padding: 6px 10px; font-size: 0.75rem;">
                        <i data-lucide="${isManualMode ? "check" : "sliders-horizontal"}"></i>
                        ${isManualMode ? "Save Edit" : "Manual Edit"}
                    </button>
                    <button type="button" class="button outlined" id="resort-btn" style="padding: 6px 10px; font-size: 0.75rem;">
                        <i data-lucide="rotate-ccw"></i>
                        Re-sort
                    </button>
                </div>
            </div>
        `,
    });
    container.appendChild(header);

    // Add re-sort handler
    setTimeout(() => {
        const resortBtn = document.getElementById("resort-btn");
        const manualEditBtn = document.getElementById("manual-edit-step2-btn");

        if (manualEditBtn) {
            manualEditBtn.addEventListener("click", () => {
                if (state.manualEditMode2) {
                    saveManualEdits();
                    return;
                }

                Object.keys(pendingPriorityEdits).forEach((key) => {
                    delete pendingPriorityEdits[key];
                });

                routePlanningState.setState({
                    manualEditMode2: true,
                    editPriorityId: null,
                    editPriorityValue: "",
                });
            });
        }

        if (resortBtn) {
            resortBtn.addEventListener("click", () => {
                const latestState = routePlanningState.getState();
                routePlanningState.setState({
                    prioritizedOrders: sortPrioritizedOrders(
                        latestState.prioritizedOrders,
                    ),
                    manualEditMode2: false,
                    editPriorityId: null,
                    editPriorityValue: "",
                });

                Object.keys(pendingPriorityEdits).forEach((key) => {
                    delete pendingPriorityEdits[key];
                });
            });
        }
    }, 0);

    // Table
    const tableContainer = createElement("div", {
        classes: "rp-table-container",
    });
    const table = createElement("table", { classes: "rp-table" });

    // Header
    const thead = createElement("thead");
    thead.innerHTML = `
        <tr>
            <th style="width: 50px;">#</th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Area</th>
            <th>Weight</th>
            <th>Window</th>
            <th>Type</th>
            <th>Score</th>
        </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = createElement("tbody");
    state.prioritizedOrders.forEach((order, index) => {
        const row = createElement("tr");
        row.innerHTML = `
            <td>
                <div style="width: 24px; height: 24px; border-radius: 8px; background: rgba(61, 166, 154, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700;">
                    ${index + 1}
                </div>
            </td>
            <td style="font-weight: 600;">${order.id}</td>
            <td>${order.customer}</td>
            <td style="color: var(--color-text-muted);">${order.address}</td>
            <td>${order.weight} kg</td>
            <td style="font-size: 0.75rem; color: var(--color-text-muted);">${order.window}</td>
            <td>
                ${
                    order.perishable
                        ? '<span class="rp-badge perishable">Perish</span>'
                        : order.express
                          ? '<span class="rp-badge express">Express</span>'
                          : '<span class="rp-badge normal">Normal</span>'
                }
            </td>
            <td>
                ${
                    editPriorityId === order.id
                        ? `
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value="${pendingPriorityEdits[order.id] ?? editPriorityValue}"
                            data-priority-edit-id="${order.id}"
                            style="width: 72px; padding: 4px 6px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.75rem;"
                        />
                    </div>
                `
                        : `
                    <span class="rp-badge" style="background: ${order.priority > 80 ? "#fee2e2" : order.priority > 60 ? "#fef3c7" : "#f0f0f0"}; color: ${order.priority > 80 ? "#991b1b" : order.priority > 60 ? "#92400e" : "#525252"}; cursor: ${isManualMode ? "pointer" : "default"};" data-priority-badge-id="${order.id}">
                        ${order.priority}
                    </span>
                `
                }
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    // Create wrapper for scrolling
    const tableWrapper = createElement("div", { classes: "rp-table-wrapper" });
    tableWrapper.appendChild(table);

    tableContainer.appendChild(tableWrapper);
    container.appendChild(tableContainer);

    if (isManualMode) {
        setTimeout(() => {
            document
                .querySelectorAll("[data-priority-badge-id]")
                .forEach((badge) => {
                    badge.addEventListener("click", (e) => {
                        const orderId = e.currentTarget.dataset.priorityBadgeId;
                        const currentOrder = routePlanningState
                            .getState()
                            .prioritizedOrders.find((o) => o.id === orderId);

                        if (!(orderId in pendingPriorityEdits)) {
                            pendingPriorityEdits[orderId] = String(
                                currentOrder?.priority ?? "",
                            );
                        }

                        routePlanningState.setState({
                            editPriorityId: orderId,
                            editPriorityValue: pendingPriorityEdits[orderId],
                        });
                    });
                });

            document
                .querySelectorAll("[data-priority-edit-id]")
                .forEach((input) => {
                    input.addEventListener("input", (e) => {
                        const orderId = e.target.dataset.priorityEditId;
                        pendingPriorityEdits[orderId] = e.target.value;
                    });
                });
        }, 0);
    }

    const info = createElement("p", {
        html: `<span style="font-size: 0.75rem; color: var(--color-text-muted);">${state.prioritizedOrders.length} orders in queue</span>`,
    });
    container.appendChild(info);
}

function sortPrioritizedOrders(orders) {
    return [...orders].sort((a, b) => b.priority - a.priority);
}

function saveManualEdits() {
    const state = routePlanningState.getState();

    let updatedOrders = [...state.prioritizedOrders];

    if (state.editPriorityId !== null) {
        const draftValue =
            pendingPriorityEdits[state.editPriorityId] ??
            state.editPriorityValue;
        const value = Number(draftValue);
        if (!Number.isNaN(value) && value >= 0 && value <= 100) {
            updatedOrders = updatedOrders.map((o) =>
                o.id === state.editPriorityId ? { ...o, priority: value } : o,
            );
        }
    }

    Object.keys(pendingPriorityEdits).forEach((key) => {
        delete pendingPriorityEdits[key];
    });

    routePlanningState.setState({
        prioritizedOrders: sortPrioritizedOrders(updatedOrders),
        manualEditMode2: false,
        editPriorityId: null,
        editPriorityValue: "",
    });
}
