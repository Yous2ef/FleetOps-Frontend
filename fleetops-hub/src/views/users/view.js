import { getUsers, updateUsers } from "/src/services/storage/users.js";
import { logAuditAction } from "/src/services/storage/auditLogger.js";

// ─── State ────────────────────────────────────────────────────────────────────

let _users = [];
let _filter = "all";
let _editingId = null;
let _handlers = {};

// ─── Data Methods (storage layer) ─────────────

async function loadUsers() {
    _users = await getUsers();
    updateCountLabel();
    applyFilter();
}

async function persistUpdate(id, changes) {
    const idx = _users.findIndex((u) => u.id === id);
    if (idx !== -1) {
        const oldVal = { ..._users[idx] };
        _users[idx] = { ..._users[idx], ...changes };
        await updateUsers([..._users]);
        await logAuditAction("ADM-001", "Admin", "Updated", "User", id, oldVal, _users[idx]);
    }
}

async function persistCreate(payload) {
    const newUser = {
        ...payload,
        id: "USR-" + Date.now(),
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
    };
    _users.push(newUser);
    await updateUsers([..._users]);
    await logAuditAction("ADM-001", "Admin", "Created", "User", newUser.id, null, newUser);
}

// ─── Render Helpers ───────────────────────────────────────────────────────────

function getInitials(name = "") {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

function roleBadge(role = "") {
    const known = ["customer", "driver", "dispatcher", "mechanic", "supervisor"];
    const cls = known.includes(role.toLowerCase()) ? role.toLowerCase() : "default";
    const label = role.charAt(0).toUpperCase() + role.slice(1);
    return `<span class="role-badge role-badge--${cls}">${label}</span>`;
}

function statusBadge(status = "") {
    const cls = ["active", "inactive", "suspended"].includes(status) ? status : "inactive";
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="status-badge status-badge--${cls}">${label}</span>`;
}

function renderRows(users) {
    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;

    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="users-table__empty">No users found.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map((u) => `
        <tr>
            <td><span class="emp-id">${u.id ?? "—"}</span></td>
            <td>
                <div class="user-name-cell">
                    <div class="user-avatar">${getInitials(u.fullName)}</div>
                    <span>${u.fullName ?? "—"}</span>
                </div>
            </td>
            <td>${roleBadge(u.role)}</td>
            <td>${u.email ?? "—"}</td>
            <td>${u.phone ?? "—"}</td>
            <td>${u.city ?? "—"}</td>
            <td>${statusBadge(u.status)}</td>
            <td>
                <div class="row-actions">
                    <button class="row-action-btn" data-action="edit" data-id="${u.id}" title="Edit" type="button">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="row-action-btn danger" data-action="toggle" data-id="${u.id}" title="Toggle status" type="button">
                        <i class="fa-solid fa-power-off"></i>
                    </button>
                </div>
            </td>
        </tr>`).join("");
}

function applyFilter() {
    const search = document.getElementById("users-search-input")?.value.toLowerCase() ?? "";
    const filtered = _users.filter((u) => {
        const matchRole = _filter === "all" || u.role?.toLowerCase() === _filter;
        const matchSearch =
            !search ||
            u.fullName?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search) ||
            u.id?.toLowerCase().includes(search);
        return matchRole && matchSearch;
    });
    renderRows(filtered);
}

function updateCountLabel() {
    const el = document.getElementById("users-count-label");
    if (el) el.textContent = `${_users.length} member${_users.length !== 1 ? "s" : ""}`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openModal(user = null) {
    _editingId = user?.id ?? null;
    const modal = document.getElementById("users-modal");
    if (!modal) return;

    document.getElementById("modal-name").value = user?.fullName ?? "";
    document.getElementById("modal-email").value = user?.email ?? "";
    document.getElementById("modal-phone").value = user?.phone ?? "";
    document.getElementById("modal-role").value = user?.role ?? "";
    document.getElementById("modal-city").value = user?.city ?? "";
    document.getElementById("modal-status").value = user?.status ?? "active";
    document.getElementById("modal-title").textContent = user ? "Edit User" : "Add User";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    const modal = document.getElementById("users-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    _editingId = null;
}

async function saveModal() {
    const payload = {
        fullName: document.getElementById("modal-name")?.value.trim(),
        email: document.getElementById("modal-email")?.value.trim(),
        phone: document.getElementById("modal-phone")?.value.trim(),
        role: document.getElementById("modal-role")?.value,
        city: document.getElementById("modal-city")?.value.trim(),
        status: document.getElementById("modal-status")?.value,
    };

    if (!payload.fullName || !payload.email || !payload.role) return;

    const submitBtn = document.getElementById("modal-save-btn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    if (_editingId) {
        await persistUpdate(_editingId, payload);
    } else {
        await persistCreate(payload);
    }

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save User';
    }

    updateCountLabel();
    applyFilter();
    closeModal();
}

async function toggleUserStatus(id) {
    const user = _users.find((u) => u.id === id);
    if (!user) return;
    await persistUpdate(id, { status: user.status === "active" ? "inactive" : "active" });
    applyFilter();
}

// ─── Mount / Unmount ──────────────────────────────────────────────────────────

export function mount(rootElement) {
    loadUsers(); // This is async but we don't need to await it for the basic UI to mount

    const filterTabs = rootElement.querySelector("#users-filter-tabs");
    _handlers.filterClick = (e) => {
        const tab = e.target.closest(".filter-tab");
        if (!tab) return;
        filterTabs.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        _filter = tab.dataset.filter;
        applyFilter();
    };
    filterTabs?.addEventListener("click", _handlers.filterClick);

    _handlers.searchInput = () => applyFilter();
    rootElement.querySelector("#users-search-input")?.addEventListener("input", _handlers.searchInput);

    _handlers.addClick = () => openModal(null);
    rootElement.querySelector("#users-add-btn")?.addEventListener("click", _handlers.addClick);

    _handlers.exportClick = () => {
        const csv = [
            ["ID", "Name", "Role", "Email", "Phone", "City", "Status"],
            ..._users.map((u) => [u.id, u.fullName, u.role, u.email, u.phone, u.city ?? "", u.status]),
        ].map((r) => r.join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = "users.csv";
        a.click();
    };
    rootElement.querySelector("#users-export-btn")?.addEventListener("click", _handlers.exportClick);

    _handlers.tableClick = (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === "edit") {
            const user = _users.find((u) => u.id === id);
            if (user) openModal(user);
        } else if (action === "toggle") {
            toggleUserStatus(id);
        }
    };
    rootElement.querySelector("#users-table-body")?.addEventListener("click", _handlers.tableClick);

    _handlers.modalClose = closeModal;
    _handlers.modalSave = saveModal;
    _handlers.backdropClick = (e) => {
        if (e.target === document.getElementById("users-modal")) closeModal();
    };

    rootElement.querySelector("#modal-close-btn")?.addEventListener("click", _handlers.modalClose);
    rootElement.querySelector("#modal-cancel-btn")?.addEventListener("click", _handlers.modalClose);
    rootElement.querySelector("#modal-save-btn")?.addEventListener("click", _handlers.modalSave);
    rootElement.querySelector("#users-modal")?.addEventListener("click", _handlers.backdropClick);
}

export function unmount(rootElement) {
    rootElement.querySelector("#users-filter-tabs")?.removeEventListener("click", _handlers.filterClick);
    rootElement.querySelector("#users-search-input")?.removeEventListener("input", _handlers.searchInput);
    rootElement.querySelector("#users-add-btn")?.removeEventListener("click", _handlers.addClick);
    rootElement.querySelector("#users-export-btn")?.removeEventListener("click", _handlers.exportClick);
    rootElement.querySelector("#users-table-body")?.removeEventListener("click", _handlers.tableClick);
    rootElement.querySelector("#modal-close-btn")?.removeEventListener("click", _handlers.modalClose);
    rootElement.querySelector("#modal-cancel-btn")?.removeEventListener("click", _handlers.modalClose);
    rootElement.querySelector("#modal-save-btn")?.removeEventListener("click", _handlers.modalSave);
    rootElement.querySelector("#users-modal")?.removeEventListener("click", _handlers.backdropClick);

    _users = [];
    _filter = "all";
    _editingId = null;
    _handlers = {};
}