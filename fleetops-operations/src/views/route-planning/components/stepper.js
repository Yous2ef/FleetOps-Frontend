/**
 * Stepper Component
 */

import { routePlanningState } from "../utils/state-manager.js";
import { createElement } from "../utils/helpers.js";

/**
 * Render stepper
 * @param {Array} steps - Array of step objects
 */
export function renderStepper(steps) {
    const container = document.getElementById("stepper-container");
    if (!container) return;

    const state = routePlanningState.getState();
    const currentStep = state.currentStep;
    const stepComplete = state.stepComplete;

    // Clear container
    container.innerHTML = "";

    // Create track
    const track = createElement("div", { classes: "stepper-track" });

    steps.forEach((step, index) => {
        // Create step wrapper
        const stepWrapper = createElement("div", { classes: "stepper-step" });

        // Create button
        const button = createElement("button", {
            classes: ["stepper-button"],
            attrs: {
                type: "button",
                "data-step": step.num,
                "aria-label": step.label,
            },
        });

        // Add active class
        if (step.num === currentStep) {
            button.classList.add("active");
        }

        // Add completed class
        if (stepComplete[step.num]) {
            button.classList.add("completed");
        }

        const canOpenStep = canNavigateToStep(step.num, state);
        if (!canOpenStep) {
            button.classList.add("locked");
            button.setAttribute("aria-disabled", "true");
            button.title = "Complete previous steps first";
        }

        // Create content wrapper
        const content = createElement("div", {
            classes: "stepper-content",
        });

        // Add icon
        const icon = createElement("i", {
            classes: "stepper-icon",
            attrs: {
                "data-lucide": stepComplete[step.num] ? "check" : step.icon,
            },
        });
        content.appendChild(icon);

        // Add number
        const number = createElement("span", {
            classes: "stepper-number",
            text: step.num.toString(),
        });
        content.appendChild(number);

        button.appendChild(content);

        // Add click handler
        button.addEventListener("click", () => {
            if (!canNavigateToStep(step.num, routePlanningState.getState())) {
                return;
            }
            routePlanningState.setState({ currentStep: step.num });
        });

        stepWrapper.appendChild(button);
        track.appendChild(stepWrapper);

        // Add line between steps (except last)
        if (index < steps.length - 1) {
            const line = createElement("div", {
                classes: ["stepper-line"],
            });

            // Add completed class if current step is past this line
            if (currentStep > step.num) {
                line.classList.add("completed");
            }

            track.appendChild(line);
        }
    });

    container.appendChild(track);
}

function canNavigateToStep(targetStep, state) {
    const currentStep = state.currentStep;

    // Backward navigation is always allowed.
    if (targetStep <= currentStep) {
        return true;
    }

    for (let step = currentStep; step < targetStep; step += 1) {
        if (!isStepCompleted(step, state)) {
            return false;
        }
    }

    return true;
}

function isStepCompleted(step, state) {
    switch (step) {
        case 1:
            return state.orders.some((order) => order.selected);
        case 2:
            return state.prioritizedOrders.length > 0;
        case 3:
            return (
                state.clusters.length > 0 &&
                state.clusters.every((cluster) => cluster.orders.length > 0)
            );
        case 4:
            return state.clusters.every((cluster) => {
                const config = state.routeConfigs[cluster.zone];
                return config && config.vehicle;
            });
        case 5:
            return state.clusters.every((cluster) => {
                const config = state.routeConfigs[cluster.zone];
                return (
                    config && config.capacityResult && config.capacityResult.ok
                );
            });
        case 6:
            return Boolean(state.stepComplete[6]);
        case 7:
            return true;
        case 8:
            return state.clusters.every((cluster) => {
                const config = state.routeConfigs[cluster.zone];
                return config && config.driver;
            });
        default:
            return true;
    }
}
