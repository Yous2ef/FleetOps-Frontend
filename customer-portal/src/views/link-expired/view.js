// ════════════════════════════════════════════════════════
// link-expired / view.js
// ════════════════════════════════════════════════════════

let cleanups = [];

export async function mount(root) {
    cleanups.length = 0;

    // ── Contact Support button ──────────────────────────────────
    const supportBtn = root.querySelector('#le-support-btn');
    if (supportBtn) {
        const handleSupport = () => {
            window.location.href = 'mailto:priority@fleetops.delivery?subject=Expired%20Tracking%20Link%20%E2%80%94%20Order%20%231293';
        };
        supportBtn.addEventListener('click', handleSupport);
        cleanups.push(() => supportBtn.removeEventListener('click', handleSupport));
    }

    // ── Help Center button ──────────────────────────────────────
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