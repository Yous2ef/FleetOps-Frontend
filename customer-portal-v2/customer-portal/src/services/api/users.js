import { getUserProfile } from '../storage/users.js';
export async function fetchProfile() {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ data: getUserProfile(), error: null }), 200);
    });
}