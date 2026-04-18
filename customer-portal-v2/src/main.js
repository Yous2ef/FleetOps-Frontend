import { initRouter } from "./router/router.js";

document.addEventListener("DOMContentLoaded", () => {
    initRouter({ outletId: "app-content" });

    const clockEl = document.getElementById("topbar-clock");
    if (clockEl) {
        const updateClock = () => {
            clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        };
        updateClock();
        setInterval(updateClock, 60000);
    }

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const toggleBtn = document.getElementById("sidebar-toggle");

    if (toggleBtn && sidebar && overlay) {
        const toggleSidebar = () => {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("visible");
        };
        toggleBtn.addEventListener("click", toggleSidebar);
        overlay.addEventListener("click", toggleSidebar);
    }
});