export async function mount(root) {
    // 404 does not require API calls
}

export function unmount(root) {
    root.innerHTML = '';
}