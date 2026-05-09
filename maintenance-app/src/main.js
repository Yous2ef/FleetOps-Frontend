import { initRouter } from "./router/router.js";
import AuthService from "./services/api/auth.js";
import { canAccessPath, normalizeRole } from "./router/routes.js";
import {
    createIcons,
    icons,
} from "../../node_modules/lucide/dist/esm/lucide.mjs";

// Check if user is logged in and filter sidebar immediately
const userRaw = localStorage.getItem("user");
let currentUser = null;
let currentRole = "";

if (userRaw) {
    try {
        currentUser = JSON.parse(userRaw);
        currentRole = normalizeRole(currentUser?.role);
    } catch {
        currentUser = null;
        currentRole = "";
    }
}

// Apply role-based filtering to sidebar links immediately
if (currentUser && currentRole) {
    document.querySelectorAll("[data-route]").forEach((link) => {
        const routePath = link.getAttribute("data-route");
        const allowedRolesAttr = link.getAttribute("data-allowed-roles");
        const allowedRoles = allowedRolesAttr
            ? allowedRolesAttr
                  .split(",")
                  .map((role) => role.trim().toLowerCase())
                  .filter(Boolean)
            : null;

        if (!routePath) {
            return;
        }

        link.hidden = Array.isArray(allowedRoles)
            ? !allowedRoles.includes(currentRole)
            : !canAccessPath(routePath, currentRole);
    });
}

// 1. تهيئة الراوتر والأيقونات
initRouter({ outletId: "app-content" });
createIcons({ icons });

// 2. تحديث بيانات المستخدم في الـ Topbar
function updateUserInfo() {
    const user = AuthService.getCurrentUser();

    // إذا لم يكن هناك مستخدم، لا تفعل شيئاً (الراوتر سيتولى الطرد)
    if (!user) return;

    const userNameEl = document.querySelector(".topbar-user__meta strong");
    const userRoleEl = document.querySelector(".topbar-user__meta span");
    const userAvatarEl = document.querySelector(".topbar-user__avatar");

    if (userNameEl) {
        userNameEl.textContent = user.name;
    }

    if (userRoleEl) {
        userRoleEl.textContent = user.role || "User";
    }

    if (userAvatarEl) {
        // أخذ أول حرفين من الاسم لعرضهم في الصورة الرمزية
        const initials = user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
        userAvatarEl.textContent = initials;
    }
}
// 3. الأحداث التي تتم عند تغيير الصفحة (Route Changed)
window.addEventListener("route:changed", () => {
    createIcons({ icons });
    updateUserInfo();
});

// 4. تفعيل زر تسجيل الخروج (Sign Out)
const signoutBtn = document.querySelector(".sidebar-signout");
if (signoutBtn) {
    signoutBtn.addEventListener("click", () => {
        AuthService.logout();
    });
}

// 5. تهيئة الـ Shell الخاص بالداشبورد وتحديث بيانات المستخدم للمرة الأولى
initDashboardShell();
updateUserInfo();

function initDashboardShell() {
    const shell = document.querySelector("[data-shell]");
    const collapseBtn = document.getElementById("sidebar-collapse-btn");
    const mobileBtn = document.getElementById("sidebar-mobile-btn");
    const collapseStateKey = "maintenance-app:sidebar-collapsed";

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
}

function updateCollapseAria(button, isCollapsed) {
    if (!button) {
        return;
    }

    button.setAttribute("aria-expanded", String(!isCollapsed));
}
