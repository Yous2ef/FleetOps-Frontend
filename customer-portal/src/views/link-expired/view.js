// ════════════════════════════════════════════════════════════════════════
// link-expired / view.js
//
// REFACTOR (real API, 2026-05-05):
//   mount() calls CustomerPortalAPI.fetchSupportInfo()
//   (GET /customer-portal/support) to populate the support contact
//   email dynamically instead of hard-coding it.
// ════════════════════════════════════════════════════════════════════════

import { fetchSupportInfo } from '../../services/api/customer-portal.js';

let cleanups = [];

export async function mount(root) {
    cleanups.length = 0;

    // ── Fetch support contact info from the backend ─────────────────────
    //    GET /customer-portal/support
    let supportEmail = 'priority@fleetops.delivery'; // fallback
    try {
        const info = await fetchSupportInfo();
        if (info?.email) supportEmail = info.email;
    } catch (err) {
        console.warn('[link-expired] Could not load support info, using fallback.', err);
    }

    // ── Contact Support button ──────────────────────────────────────────
    const supportBtn = root.querySelector('#le-support-btn');
    if (supportBtn) {
        const handleSupport = () => {
            window.location.href = `mailto:${supportEmail}?subject=Expired%20Tracking%20Link%20%E2%80%94%20Order%20%231293`;
        };
        supportBtn.addEventListener('click', handleSupport);
        cleanups.push(() => supportBtn.removeEventListener('click', handleSupport));
    }

    // ── Help Center button ──────────────────────────────────────────────
    const helpBtn = root.querySelector('#le-help-btn');
    if (helpBtn) {
        const handleHelp = () => {
            window.open('https://help.fleetops.delivery', '_blank', 'noopener,noreferrer');
        };
        helpBtn.addEventListener('click', handleHelp);
        cleanups.push(() => helpBtn.removeEventListener('click', handleHelp));
    }
}

export function destroy(root) {
    cleanups.forEach(fn => fn());
    cleanups = [];
    root.innerHTML = '';
}