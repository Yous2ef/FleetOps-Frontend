// ════════════════════════════════════════════════════════
// delivery-failed / view.js
// ════════════════════════════════════════════════════════

let cleanups = [];

export async function mount(root) {
    cleanups.length = 0;

    // ── Staggered card entrance animations ──────────────────────
    const cards = root.querySelectorAll('.card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        card.style.transitionDelay = `${i * 80}ms`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });
    });

    // ── Call Now button ─────────────────────────────────────────
    const callBtn = root.querySelector('#df-call-btn');
    if (callBtn) {
        const handleCall = () => { window.location.href = 'tel:+20123456789'; };
        callBtn.addEventListener('click', handleCall);
        cleanups.push(() => callBtn.removeEventListener('click', handleCall));
    }
}

export function destroy(root) {
    cleanups.forEach(fn => fn());
    cleanups = [];
    root.innerHTML = '';
}