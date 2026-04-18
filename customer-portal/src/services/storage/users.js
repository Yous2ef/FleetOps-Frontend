// ── Mock user database (sync, in-memory) ─────────────────────
let profile = {
  id:       'U-001',
  name:     'Abdulrahman',
  email:    'abdulrahman@fleetops.io',
  role:     'Admin',
  location: 'Cairo, Egypt',
  joined:   '2024-01-15',
  notifications: {
    email:  true,
    sms:    false,
    push:   true,
  },
};

export function getProfile() {
  return { ...profile };
}

export function updateProfile(patch) {
  profile = { ...profile, ...patch };
  return { ...profile };
}

export function updateNotifications(patch) {
  profile.notifications = { ...profile.notifications, ...patch };
  return { ...profile.notifications };
}