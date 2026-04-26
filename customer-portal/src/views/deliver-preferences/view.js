// ════════════════════════════════════════════════════════════════════════
// src/views/deliver-preferences/view.js
//
// REFACTOR (data-driven, 2026-04-26):
//   init() awaits StorageService.get('preferences') to pre-select the
//   previously saved delivery option and restore the notes textarea.
//   handleSave() persists the new selection via StorageService.save().
// ════════════════════════════════════════════════════════════════════════

import { StorageService } from '../../utils/storage.js';

const dpCleanupFns = [];

export async function init(root) {
  dpCleanupFns.length = 0;

  // ── 1. Load saved preferences ────────────────────────────────────────
  const saved = await StorageService.get('preferences');

  // ── 2. Restore previous selection ───────────────────────────────────
  const cards = root.querySelectorAll('.dp-card');

  if (saved?.option) {
    cards.forEach(c => {
      const isActive = c.dataset.option === saved.option;
      c.classList.toggle('dp-card--active', isActive);
      c.setAttribute('aria-checked', String(isActive));
    });
  }

  // Restore saved notes
  const notesInput = root.querySelector('#dp-notes-input');
  if (notesInput && saved?.notes) {
    notesInput.value = saved.notes;
  }

  // ── 3. Card toggle (single-select) ───────────────────────────────────
  const handleCardClick = (e) => {
    const card     = e.currentTarget;
    const isActive = card.classList.contains('dp-card--active');

    cards.forEach(c => {
      c.classList.remove('dp-card--active');
      c.setAttribute('aria-checked', 'false');
    });

    if (!isActive) {
      card.classList.add('dp-card--active');
      card.setAttribute('aria-checked', 'true');
    }
  };

  cards.forEach(card => {
    card.addEventListener('click', handleCardClick);
    dpCleanupFns.push(() => card.removeEventListener('click', handleCardClick));
  });

  // ── 4. Save button ───────────────────────────────────────────────────
  const saveBtn = root.querySelector('#dp-save-btn');

  const handleSave = async () => {
    const selectedCard  = root.querySelector('.dp-card--active');
    const notes         = notesInput?.value?.trim() || '';

    const payload = {
      option:  selectedCard?.dataset.option ?? null,
      label:   selectedCard?.querySelector('.dp-card__label')?.textContent?.trim() ?? null,
      notes,
      savedAt: new Date().toISOString(),
    };

    // Persist to storage — this is the single source of truth that
    // arriving-alerts and other views will read.
    await StorageService.save('preferences', payload);

    console.log('[DeliveryPreferences] Saved:', payload);

    saveBtn.textContent = '✓ Saved!';
    saveBtn.disabled    = true;

    setTimeout(() => {
      window.history.pushState(null, null, '/order-confirmed');
      window.dispatchEvent(new Event('popstate'));
    }, 800);
  };

  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
    dpCleanupFns.push(() => saveBtn.removeEventListener('click', handleSave));
  }
}

export function destroy(root) {
  dpCleanupFns.forEach(fn => fn());
  dpCleanupFns.length = 0;
  if (root) root.innerHTML = '';
}
