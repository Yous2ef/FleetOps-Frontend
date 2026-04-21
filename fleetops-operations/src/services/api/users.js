import api from "/shared/api-handler.js"; //
import { usersMockData, USERS_STORAGE_KEY, initialMockData } from "../storage/users.js";

// ─── Global Setup ─────────────────────────────────────────────────────────────
api.setBaseURL("http://localhost:3000"); //

const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// ─── API Methods ────────────────────────────────────────────────────────────

// API: GET /api/users
export async function getUsers() {
    await delay(100);
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialMockData));
        return [...initialMockData];
    }
    return JSON.parse(stored);
}

// API: POST/PUT /api/users
export async function updateUsers(newUsers) {
    await delay(100);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
    return { success: true };
}

// Additional helper functions for mock data access(لو حد منكم عاوز ياخد ال users بردو استعملوا دي )

export function getAllUsersMockData() {
    return [...usersMockData];
}

export function getUserByIdMockData(userId) {
    return usersMockData.find((user) => user.id === userId) || null;
}

// Exporting a combined object for easier imports in components
const UsersApi = {
    getUsers,
    updateUsers,
    getAllUsersMockData,
    getUserByIdMockData,
};

export default UsersApi;