import { fetchProfile } from '../../services/api/users.js';

let cleanups = [];
let originalData = {};

export async function mount(root) {
    cleanups.length = 0;
    
    const saveBtn = root.querySelector('#save-btn');
    const nameInput = root.querySelector('#profile-name');
    const roleInput = root.querySelector('#profile-role');
    const themeSelect = root.querySelector('#theme-select');

    // Load initial theme from HTML attribute
    if (themeSelect) {
        themeSelect.value = document.documentElement.getAttribute('data-theme') || 'dark';
        
        const handleThemeChange = (e) => {
            document.documentElement.setAttribute('data-theme', e.target.value);
        };
        themeSelect.addEventListener('change', handleThemeChange);
        cleanups.push(() => themeSelect.removeEventListener('change', handleThemeChange));
    }

    const res = await fetchProfile();
    if (!document.body.contains(root)) return;

    if (res.data) {
        originalData = res.data;
        if (nameInput) nameInput.value = originalData.name;
        if (roleInput) roleInput.value = originalData.role;
    }

    if (nameInput && saveBtn) {
        const handleInput = () => {
            saveBtn.disabled = (nameInput.value.trim() === originalData.name);
        };
        nameInput.addEventListener('input', handleInput);
        cleanups.push(() => nameInput.removeEventListener('input', handleInput));

        const handleSave = () => {
            originalData.name = nameInput.value.trim();
            saveBtn.disabled = true;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.style.backgroundColor = 'var(--status-success)';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = '';
            }, 1500);
        };
        saveBtn.addEventListener('click', handleSave);
        cleanups.push(() => saveBtn.removeEventListener('click', handleSave));
    }
}

export function unmount(root) {
    cleanups.forEach(fn => fn());
    cleanups = [];
    originalData = {};
    root.innerHTML = '';
}