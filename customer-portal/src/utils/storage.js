// ════════════════════════════════════════════════════════════════════════
// src/utils/storage.js — FleetOps · Mock Backend Storage Service
//
// ARCHITECTURE CONTRACT:
//   All methods are async and return Promises. This mirrors how a real
//   fetch()-based API client would behave, making it a drop-in swap:
//
//   CURRENT (localStorage mock):
//     const order = await StorageService.get('order');
//
//   FUTURE (real API):
//     // Just replace this file's internals — all callers stay identical.
//     async get(resource) {
//       const res = await fetch(`/api/${resource}`, { headers: authHeaders() });
//       return res.ok ? res.json() : null;
//     }
//
// NAMESPACE:
//   All keys are prefixed with NAMESPACE to avoid collisions with other
//   apps using the same localStorage origin.
//
// METHODS (mirrors HTTP verbs):
//   get(key)           → GET    /api/{key}        — fetch a resource
//   save(key, data)    → PUT    /api/{key}         — full replace
//   update(key, patch) → PATCH  /api/{key}         — shallow merge
//   push(key, item)    → POST   /api/{key}/items   — append to array
//   remove(key)        → DELETE /api/{key}         — delete resource
// ════════════════════════════════════════════════════════════════════════

const NAMESPACE = 'fleetops:';
const SIMULATED_LATENCY_MS = 0; // Set to e.g. 80 to simulate network delay

// ── Internal helpers ─────────────────────────────────────────────────────

/**
 * Wraps a synchronous localStorage operation in a Promise, optionally
 * adding a simulated network latency so views behave identically to
 * a real async backend.
 *
 * @param {Function} fn  Synchronous callback that performs the operation.
 * @returns {Promise<any>}
 */
function _async(fn) {
  return new Promise((resolve, reject) => {
    const execute = () => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    };

    if (SIMULATED_LATENCY_MS > 0) {
      setTimeout(execute, SIMULATED_LATENCY_MS);
    } else {
      // Still async (microtask), so callers using await are always safe.
      Promise.resolve().then(execute);
    }
  });
}

function _fullKey(key) {
  return `${NAMESPACE}${key}`;
}

function _read(key) {
  const raw = localStorage.getItem(_fullKey(key));
  return raw !== null ? JSON.parse(raw) : null;
}

function _write(key, value) {
  localStorage.setItem(_fullKey(key), JSON.stringify(value));
  return value;
}

// ── Public API ────────────────────────────────────────────────────────────

export const StorageService = {

  /**
   * get(key)
   * Retrieves the stored resource. Returns null if the key does not exist.
   *
   * Equivalent to:  GET /api/{key}
   *
   * @param   {string}       key  Resource identifier (e.g. 'order', 'notifications')
   * @returns {Promise<any>}      Parsed value, or null if not found.
   */
  get(key) {
    return _async(() => _read(key));
  },

  /**
   * save(key, data)
   * Fully replaces (or creates) a resource. Mirrors a PUT request.
   *
   * Equivalent to:  PUT /api/{key}
   *
   * @param   {string}       key   Resource identifier.
   * @param   {any}          data  Data to persist.
   * @returns {Promise<any>}       The saved data (mirrors API response pattern).
   */
  save(key, data) {
    return _async(() => _write(key, data));
  },

  /**
   * update(key, patch)
   * Shallow-merges `patch` into the existing object at `key`.
   * If the key does not exist, patch becomes the initial value.
   *
   * Equivalent to:  PATCH /api/{key}
   *
   * @param   {string}       key    Resource identifier.
   * @param   {object}       patch  Partial fields to merge.
   * @returns {Promise<any>}        The updated object.
   */
  update(key, patch) {
    return _async(() => {
      const existing = _read(key) ?? {};
      const merged   = { ...existing, ...patch };
      return _write(key, merged);
    });
  },

  /**
   * push(key, item)
   * Appends a new item to an array resource. Creates the array if needed.
   * Automatically assigns a numeric `id` if the item lacks one.
   *
   * Equivalent to:  POST /api/{key}
   *
   * @param   {string}       key   Resource identifier (should be a collection).
   * @param   {object}       item  Item to append.
   * @returns {Promise<any>}       The appended item (with auto-assigned id).
   */
  push(key, item) {
    return _async(() => {
      const collection = _read(key) ?? [];
      if (!Array.isArray(collection)) {
        throw new TypeError(`StorageService.push: "${key}" is not an array.`);
      }

      // Auto-assign a monotonic numeric ID if none provided.
      const withId = item.id != null
        ? item
        : { ...item, id: (collection.length > 0 ? Math.max(...collection.map(i => i.id ?? 0)) + 1 : 1) };

      collection.unshift(withId); // Prepend: newest first (mirrors REST pagination default)
      _write(key, collection);
      return withId;
    });
  },

  /**
   * remove(key)
   * Deletes a resource entirely.
   *
   * Equivalent to:  DELETE /api/{key}
   *
   * @param   {string}          key  Resource identifier.
   * @returns {Promise<boolean>}     true if the key existed and was removed.
   */
  remove(key) {
    return _async(() => {
      const existed = localStorage.getItem(_fullKey(key)) !== null;
      localStorage.removeItem(_fullKey(key));
      return existed;
    });
  },

  /**
   * has(key)
   * Check if a key exists without fetching its value.
   *
   * @param   {string}           key  Resource identifier.
   * @returns {Promise<boolean>}
   */
  has(key) {
    return _async(() => localStorage.getItem(_fullKey(key)) !== null);
  },
};
