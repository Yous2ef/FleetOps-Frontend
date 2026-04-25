import TechnicianAssignmentApi from "../../services/api/technician-assignment.js";

let pageRoot = null;
let clickHandler = null;
let keydownHandler = null;
let activeLoadId = 0;

const state = {
    loading: true,
    saving: false,
    error: "",
    workOrders: [],
    mechanics: [],
    selectedWorkOrderId: "",
    selectedMechanicId: "",
};

function escapeHtml(value) {
    const text = String(value ?? "");
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function getSelectedWorkOrder() {
    return (
        state.workOrders.find((item) => item.id === state.selectedWorkOrderId) || null
    );
}

function getSelectedMechanic() {
    return (
        state.mechanics.find((item) => item.id === state.selectedMechanicId) || null
    );
}

function getStatusOrder(status) {
    if (status === "Available") {
        return 0;
    }

    if (status === "Busy") {
        return 1;
    }

    return 2;
}

function getSortedMechanics() {
    return [...state.mechanics].sort((left, right) => {
        const statusDiff =
            getStatusOrder(left.status) - getStatusOrder(right.status);

        if (statusDiff !== 0) {
            return statusDiff;
        }

        if (left.activeJobs !== right.activeJobs) {
            return left.activeJobs - right.activeJobs;
        }

        return left.name.localeCompare(right.name);
    });
}

function getWorkOrderTags(workOrder) {
    const tags = [workOrder.type];

    if (workOrder.priority === "Urgent") {
        tags.push("Urgent");
    } else {
        tags.push("Normal");
    }

    return tags;
}

function getTagClass(tag) {
    if (tag === "Routine") {
        return "ta-pill--routine";
    }

    if (tag === "Emergency") {
        return "ta-pill--emergency";
    }

    if (tag === "Urgent") {
        return "ta-pill--urgent";
    }

    return "ta-pill--normal";
}

function getMechanicStatusClass(status) {
    if (status === "Available") {
        return "available";
    }

    if (status === "Off Duty") {
        return "off-duty";
    }

    return "busy";
}

function renderError() {
    const header = pageRoot?.querySelector(".ta-page-header");

    if (!header) {
        return;
    }

    const existingError = header.querySelector(".ta-page-header__error");

    if (existingError) {
        existingError.remove();
    }

    if (!state.error) {
        return;
    }

    const errorElement = document.createElement("p");
    errorElement.className = "ta-page-header__error";
    errorElement.textContent = state.error;
    header.appendChild(errorElement);
}

function renderWorkOrders() {
    const listElement = pageRoot?.querySelector("#ta-work-order-list");
    const countElement = pageRoot?.querySelector("#ta-work-order-count");

    if (!listElement || !countElement) {
        return;
    }

    countElement.textContent = String(state.workOrders.length);

    if (state.loading) {
        listElement.innerHTML = `
            <div class="ta-empty-state">
                <p>Loading unassigned work orders…</p>
            </div>
        `;
        return;
    }

    if (!state.workOrders.length) {
        listElement.innerHTML = `
            <div class="ta-empty-state">
                <p>There are no unassigned work orders right now.</p>
            </div>
        `;
        return;
    }

    listElement.innerHTML = state.workOrders
        .map((workOrder) => {
            const isSelected = workOrder.id === state.selectedWorkOrderId;
            const tags = getWorkOrderTags(workOrder);

            return `
                <article
                    class="ta-work-order-card${isSelected ? " is-selected" : ""}"
                    data-work-order-id="${escapeHtml(workOrder.id)}"
                    role="button"
                    tabindex="0"
                    aria-pressed="${isSelected ? "true" : "false"}"
                >
                    <div class="ta-work-order-card__top">
                        <div class="ta-work-order-card__title-row">
                            <h3 class="ta-work-order-card__id">${escapeHtml(workOrder.id)}</h3>

                            <div class="ta-work-order-card__badges">
                                ${tags
                                    .map((tag) => {
                                        return `<span class="ta-pill ${getTagClass(tag)}">${escapeHtml(tag)}</span>`;
                                    })
                                    .join("")}
                            </div>
                        </div>

                        <div class="ta-work-order-card__meta">
                            <strong>${escapeHtml(workOrder.vehicle)}</strong>
                            <span class="ta-work-order-card__dot" aria-hidden="true">•</span>
                            <span>${escapeHtml(workOrder.date)}</span>
                        </div>
                    </div>

                    <p class="ta-work-order-card__description">
                        ${escapeHtml(workOrder.description)}
                    </p>
                </article>
            `;
        })
        .join("");
}

function renderRoster() {
    const rosterElement = pageRoot?.querySelector("#ta-mechanic-roster");
    const hintElement = pageRoot?.querySelector("#ta-assignment-hint");
    const selectedWorkOrder = getSelectedWorkOrder();

    if (!rosterElement || !hintElement) {
        return;
    }

    if (selectedWorkOrder) {
        hintElement.textContent = `Click Assign to assign to ${selectedWorkOrder.id}`;
        hintElement.classList.add("is-active");
    } else {
        hintElement.textContent = "";
        hintElement.classList.remove("is-active");
    }

    if (state.loading) {
        rosterElement.innerHTML = `
            <div class="ta-empty-state">
                <p>Loading mechanic roster…</p>
            </div>
        `;
        return;
    }

    if (!state.mechanics.length) {
        rosterElement.innerHTML = `
            <div class="ta-empty-state">
                <p>No mechanics are available in the roster.</p>
            </div>
        `;
        return;
    }

    rosterElement.innerHTML = getSortedMechanics()
        .map((mechanic) => {
            const statusClass = getMechanicStatusClass(mechanic.status);
            const isOffDuty = mechanic.status === "Off Duty";
            const showAssignButton = Boolean(selectedWorkOrder);
            const activeJobsLabel =
                mechanic.activeJobs > 0
                    ? `${mechanic.activeJobs} active job${mechanic.activeJobs > 1 ? "s" : ""}`
                    : "No active jobs";

            return `
                <article class="ta-mechanic-card ta-mechanic-card--${statusClass}">
                    <div class="ta-mechanic-card__identity">
                        <div class="ta-avatar" aria-hidden="true">
                            ${escapeHtml(mechanic.initials)}
                        </div>

                        <div class="ta-mechanic-card__details">
                            <div class="ta-mechanic-card__heading">
                                <h3 class="ta-mechanic-card__name">${escapeHtml(mechanic.name)}</h3>
                                <span class="ta-mechanic-card__code">${escapeHtml(mechanic.id)}</span>
                            </div>

                            <div class="ta-mechanic-card__meta">
                                <span>${escapeHtml(mechanic.specialty)}</span>
                                <span class="ta-mechanic-card__dot" aria-hidden="true">·</span>
                                <span>${escapeHtml(activeJobsLabel)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="ta-mechanic-card__actions">
                        <span class="ta-status-badge ta-status-badge--${statusClass}">
                            ${escapeHtml(mechanic.status)}
                        </span>

                        ${
                            (showAssignButton && !isOffDuty)
                                ? `
                                    <button
                                        class="ta-assign-button"
                                        type="button"
                                        data-assign-mechanic-id="${escapeHtml(mechanic.id)}"
                                    >
                                        <i data-lucide="user-plus"></i>
                                        Assign
                                    </button>
                                `
                                : ""
                        }
                    </div>
                </article>
            `;
        })
        .join("");
}

function renderModal() {
    const modalRoot = pageRoot?.querySelector("#ta-modal-root");
    const selectedWorkOrder = getSelectedWorkOrder();
    const selectedMechanic = getSelectedMechanic();

    if (!modalRoot) {
        return;
    }

    if (!selectedWorkOrder || !selectedMechanic) {
        modalRoot.innerHTML = "";
        return;
    }

    modalRoot.innerHTML = `
        <div class="ta-modal" role="dialog" aria-modal="true" aria-labelledby="ta-modal-title">
            <div class="ta-modal__backdrop" data-close-modal="true"></div>

            <div class="ta-modal__dialog">
                <div class="ta-modal__content">
                    <h3 class="ta-modal__title" id="ta-modal-title">Confirm Assignment</h3>

                    <p class="ta-modal__text">
                        Assign <strong>${escapeHtml(selectedMechanic.name)}</strong> to
                        <strong>${escapeHtml(selectedWorkOrder.id)}</strong> for vehicle
                        <strong>${escapeHtml(selectedWorkOrder.vehicle)}</strong>?
                    </p>

                    <div class="ta-modal__actions">
                        <button
                            class="button primary ta-modal__confirm"
                            id="ta-confirm-assignment"
                            type="button"
                            ${state.saving ? "disabled" : ""}
                        >
                            ${state.saving ? "Confirming..." : "Confirm Assignment"}
                        </button>

                        <button
                            class="button outlined ta-modal__cancel"
                            type="button"
                            data-close-modal="true"
                            ${state.saving ? "disabled" : ""}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPage() {
    if (!pageRoot) {
        return;
    }

    renderError();
    renderWorkOrders();
    renderRoster();
    renderModal();
}

async function loadPageData() {
    const loadId = ++activeLoadId;

    state.loading = true;
    state.error = "";
    renderPage();

    try {
        const [workOrders, mechanics] = await Promise.all([
            TechnicianAssignmentApi.getUnassignedWorkOrders(),
            TechnicianAssignmentApi.getMechanicRoster(),
        ]);

        if (loadId !== activeLoadId) {
            return;
        }

        state.workOrders = workOrders;
        state.mechanics = mechanics;

        const selectedStillExists = state.workOrders.some((workOrder) => {
            return workOrder.id === state.selectedWorkOrderId;
        });

        if (!selectedStillExists) {
            state.selectedWorkOrderId = "";
        }
    } catch (error) {
        if (loadId !== activeLoadId) {
            return;
        }

        state.error =
            error?.data?.message ||
            error?.message ||
            "Could not load technician assignment data.";
        state.workOrders = [];
        state.mechanics = [];
    } finally {
        if (loadId === activeLoadId) {
            state.loading = false;
            renderPage();
        }
    }
}

async function confirmAssignment() {
    const selectedWorkOrder = getSelectedWorkOrder();
    const selectedMechanic = getSelectedMechanic();

    if (!selectedWorkOrder || !selectedMechanic || state.saving) {
        return;
    }

    state.saving = true;
    state.error = "";
    renderPage();

    try {
        await TechnicianAssignmentApi.assignWorkOrder(
            selectedWorkOrder.id,
            selectedMechanic.id,
        );

        state.workOrders = state.workOrders.filter((workOrder) => {
            return workOrder.id !== selectedWorkOrder.id;
        });

        state.mechanics = state.mechanics.map((mechanic) => {
            if (mechanic.id !== selectedMechanic.id) {
                return mechanic;
            }

            return {
                ...mechanic,
                activeJobs: mechanic.activeJobs + 1,
                status: mechanic.status === "Available" ? "Busy" : mechanic.status,
            };
        });

        state.selectedWorkOrderId = "";
        state.selectedMechanicId = "";
    } catch (error) {
        state.error =
            error?.data?.message ||
            error?.message ||
            "Could not assign technician. Please retry.";
    } finally {
        state.saving = false;
        renderPage();
    }
}

function handlePageClick(event) {
    const confirmButton = event.target.closest("#ta-confirm-assignment");
    const closeModalButton = event.target.closest("[data-close-modal]");
    const assignButton = event.target.closest("[data-assign-mechanic-id]");
    const workOrderCard = event.target.closest("[data-work-order-id]");

    if (confirmButton) {
        confirmAssignment();
        return;
    }

    if (closeModalButton) {
        if (!state.saving) {
            state.selectedMechanicId = "";
            renderPage();
        }
        return;
    }

    if (assignButton) {
        if (!assignButton.disabled) {
            state.selectedMechanicId =
                assignButton.dataset.assignMechanicId || "";
            renderPage();
        }
        return;
    }

    if (workOrderCard) {
        const clickedId = workOrderCard.dataset.workOrderId || "";
        if (state.selectedWorkOrderId === clickedId) {
            state.selectedWorkOrderId = "";
        } else {
            state.selectedWorkOrderId = clickedId;
        }
        state.selectedMechanicId = "";
        renderPage();
    }
}

function handlePageKeydown(event) {
    if (event.key === "Escape" && state.selectedMechanicId && !state.saving) {
        state.selectedMechanicId = "";
        renderPage();
        return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    const workOrderCard = event.target.closest("[data-work-order-id]");

    if (!workOrderCard) {
        return;
    }

    event.preventDefault();
    const clickedId = workOrderCard.dataset.workOrderId || "";
    if (state.selectedWorkOrderId === clickedId) {
        state.selectedWorkOrderId = "";
    } else {
        state.selectedWorkOrderId = clickedId;
    }
    state.selectedMechanicId = "";
    renderPage();
}

export function mount(outlet) {
    pageRoot =
        outlet?.querySelector(".technician-assignment-page") ||
        document.querySelector(".technician-assignment-page");

    if (!pageRoot) {
        return;
    }

    clickHandler = handlePageClick;
    keydownHandler = handlePageKeydown;

    pageRoot.addEventListener("click", clickHandler);
    pageRoot.addEventListener("keydown", keydownHandler);

    loadPageData();
}

export function unmount() {
    activeLoadId += 1;

    if (pageRoot && clickHandler) {
        pageRoot.removeEventListener("click", clickHandler);
    }

    if (pageRoot && keydownHandler) {
        pageRoot.removeEventListener("keydown", keydownHandler);
    }

    pageRoot = null;
    clickHandler = null;
    keydownHandler = null;

    state.loading = true;
    state.saving = false;
    state.error = "";
    state.workOrders = [];
    state.mechanics = [];
    state.selectedWorkOrderId = "";
    state.selectedMechanicId = "";
}
