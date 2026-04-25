const dpCleanupFns = [];

export function init(root) {
  dpCleanupFns.length = 0;

  // ── Grid card toggle ───────────────────────────────────────
  const cards = root.querySelectorAll('.dp-card');

  const handleCardClick = (e) => {
    const card = e.currentTarget;
    const isActive = card.classList.contains('dp-card--active');

    // Deselect all cards first (single-select behavior)
    cards.forEach((c) => {
      c.classList.remove('dp-card--active');
      c.setAttribute('aria-checked', 'false');
    });

    // If the clicked card was NOT already active, activate it
    if (!isActive) {
      card.classList.add('dp-card--active');
      card.setAttribute('aria-checked', 'true');
    }
  };

  cards.forEach((card) => {
    card.addEventListener('click', handleCardClick);
    dpCleanupFns.push(() => card.removeEventListener('click', handleCardClick));
  });

  // ── Save button ───────────────────────────────────────────
  const saveBtn = root.querySelector('#dp-save-btn');

  const handleSave = () => {
    const selectedCards = root.querySelectorAll('.dp-card--active');
    const selectedOptions = Array.from(selectedCards).map((card) => ({
      option: card.dataset.option,
      label: card.querySelector('.dp-card__label')?.textContent?.trim(),
    }));

    const notesInput = root.querySelector('#dp-notes-input');
    const notes = notesInput?.value?.trim() || '';

    const payload = {
      timestamp: new Date().toISOString(),
      selectedOptions,
      notes,
    };

    console.log('[Delivery Preferences] Save payload:', payload);

    saveBtn.textContent = '✓ Saved!';
    saveBtn.disabled = true;

    // Simulate redirect after delay (Go back to order-confirmed)
    setTimeout(() => {
      window.history.pushState(null, null, '/order-confirmed');
      window.dispatchEvent(new Event('popstate')); // router.js handles render + route:changed dispatch
    }, 800);
  };

  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
    dpCleanupFns.push(() => saveBtn.removeEventListener('click', handleSave));
  }
}

export function destroy(root) {
  dpCleanupFns.forEach((fn) => fn());
  dpCleanupFns.length = 0;
  if (root) {
    root.innerHTML = '';
  }
}