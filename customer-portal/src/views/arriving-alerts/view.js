// ════════════════════════════════════════════════════════
// arriving-alerts / view.js
// ════════════════════════════════════════════════════════

let cleanups = [];

export async function mount(root) {
    cleanups.length = 0;

    // ── "I'm Ready" button ─────────────────────────────────────
    const readyBtn = root.querySelector('#aa-ready-btn');
    if (readyBtn) {
        const handleReady = () => {
            readyBtn.disabled = true;
            readyBtn.innerHTML = `
                <svg class="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Notifying driver...
            `;
            setTimeout(() => {
                if (!document.body.contains(root)) return;
                readyBtn.innerHTML = `
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Driver notified — Stand by!
                `;
                readyBtn.style.opacity = '0.75';
            }, 1500);
        };
        readyBtn.addEventListener('click', handleReady);
        cleanups.push(() => readyBtn.removeEventListener('click', handleReady));
    }

    // ── Message Driver button ───────────────────────────────────
    const msgBtn = root.querySelector('#aa-msg-btn');
    if (msgBtn) {
        const handleMsg = () => console.log('[ArrivingAlerts] Message driver triggered');
        msgBtn.addEventListener('click', handleMsg);
        cleanups.push(() => msgBtn.removeEventListener('click', handleMsg));
    }

    // ── Re-center button ────────────────────────────────────────
    const recenterBtn = root.querySelector('.aa-map-recenter');
    if (recenterBtn) {
        const handleRecenter = () => {
            recenterBtn.style.transform = 'scale(0.88) rotate(360deg)';
            setTimeout(() => {
                if (!document.body.contains(root)) return;
                recenterBtn.style.transform = '';
            }, 300);
        };
        recenterBtn.addEventListener('click', handleRecenter);
        cleanups.push(() => recenterBtn.removeEventListener('click', handleRecenter));
    }
}

export function destroy(root) {
    cleanups.forEach(fn => fn());
    cleanups = [];
    root.innerHTML = '';
}