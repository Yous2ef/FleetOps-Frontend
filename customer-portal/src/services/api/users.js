import {
  getProfile,
  updateProfile,
  updateNotifications,
} from '../storage/users.js';

const delay = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));

/** @returns {Promise<{data: object, error: null}>} */
export async function fetchProfile() {
  await delay(250);
  try {
    return { data: getProfile(), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function saveProfile(patch) {
  await delay(400);
  try {
    return { data: updateProfile(patch), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function saveNotifications(patch) {
  await delay(300);
  try {
    return { data: updateNotifications(patch), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}