import { initRouter } from "./router/router.js";
import { getUser, clearAuth, isAuthenticated } from "./services/auth.js";
import {
    createIcons,
    icons,
} from "../../node_modules/lucide/dist/esm/lucide.mjs";

initRouter({ outletId: "app-content" });
createIcons({ icons });

window.addEventListener("route:changed", () => {
    createIcons({ icons });
    updateTopbarUser();
});

initDashboardShell();
updateTopbarUser();

function updateTopbarUser() {
    if (!isAuthenticated()) return;
    const user = getUser();
    if (!user) return;

    const avatarEl = document.querySelector(".topbar-user__avatar");
    const nameEl   = document.querySelector(".topbar-user__meta strong");
    const roleEl   = document.querySelector(".topbar-user__meta span");

    if (avatarEl) {
        const initials = (user.name ?? "")
            .trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
        avatarEl.textContent = initials || "?";
    }
    if (nameEl) nameEl.textContent = user.name ?? "User";
    if (roleEl) roleEl.textContent = user.role ?? "";
}



initDashboardShell();

function initDashboardShell() {
    const shell = document.querySelector("[data-shell]");
    const collapseBtn = document.getElementById("sidebar-collapse-btn");
    const mobileBtn = document.getElementById("sidebar-mobile-btn");
    const collapseStateKey = "maintenance-app:sidebar-collapsed";
    const signOutBtn = document.querySelector(".sidebar-signout");

    if (!shell) {
        return;
    }

    const savedCollapsed = localStorage.getItem(collapseStateKey) === "true";

    if (savedCollapsed) {
        shell.classList.add("is-collapsed");
    }

    updateCollapseAria(collapseBtn, shell.classList.contains("is-collapsed"));

    collapseBtn?.addEventListener("click", () => {
        const collapsed = shell.classList.toggle("is-collapsed");
        localStorage.setItem(collapseStateKey, String(collapsed));
        updateCollapseAria(collapseBtn, collapsed);
    });

    mobileBtn?.addEventListener("click", () => {
        shell.classList.toggle("is-sidebar-open");
    });

    window.addEventListener("route:changed", () => {
        shell.classList.remove("is-sidebar-open");
    });

    signOutBtn?.addEventListener("click", () => {
        clearAuth();
        window.history.replaceState({}, "", "/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
}

function updateCollapseAria(button, isCollapsed) {
    if (!button) {
        return;
    }

    button.setAttribute("aria-expanded", String(!isCollapsed));
}
