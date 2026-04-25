let itCleanups = [];

export function init(root) {
    itCleanups = [];

    // Accordion Logic (للأجزاء اللي مش بتنقل لصفحة تانية)
    const summaryAcc = root.querySelector('#it-summary-accordion');
    if (summaryAcc) {
        const header = summaryAcc.querySelector('.it-accordion-header');
        const handleToggle = () => summaryAcc.classList.toggle('open');
        header.addEventListener('click', handleToggle);
        itCleanups.push(() => header.removeEventListener('click', handleToggle));
    }

    // Driver Actions
    const callBtn = root.querySelector('#it-btn-call');
    const chatBtn = root.querySelector('#it-btn-chat');
    
    if (callBtn) callBtn.onclick = () => alert("Calling Ahmed...");
    if (chatBtn) chatBtn.onclick = () => alert("Opening chat...");
}

export function destroy(root) {
    itCleanups.forEach(fn => fn());
    itCleanups = [];
    root.innerHTML = '';
}