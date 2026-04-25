/**
 * Helper functions for Route Planning
 */

/**
 * Calculate total weight of orders
 * @param {Array} orders - Array of orders
 * @returns {number} Total weight
 */
export function calculateTotalWeight(orders) {
    return orders.reduce((sum, order) => sum + order.weight, 0);
}

/**
 * Calculate total volume of orders
 * @param {Array} orders - Array of orders
 * @returns {number} Total volume
 */
export function calculateTotalVolume(orders) {
    return orders.reduce((sum, order) => sum + order.volume, 0);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Create element with classes and attributes
 * @param {string} tag - HTML tag
 * @param {Object} options - Options
 * @param {string|Array} options.classes - CSS classes
 * @param {Object} options.attrs - HTML attributes
 * @param {string} options.text - Text content
 * @param {string} options.html - HTML content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.classes) {
        const classes = Array.isArray(options.classes) ? options.classes : [options.classes];
        // Filter out empty strings
        const validClasses = classes.filter(c => c && c.trim());
        if (validClasses.length > 0) {
            element.classList.add(...validClasses);
        }
    }
    
    if (options.attrs) {
        Object.entries(options.attrs).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    if (options.text) {
        element.textContent = options.text;
    }
    
    if (options.html) {
        element.innerHTML = options.html;
    }
    
    return element;
}

/**
 * Clear element children
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Show/hide element
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} show - Show or hide
 */
export function toggleElement(element, show) {
    if (show) {
        element.style.display = "";
    } else {
        element.style.display = "none";
    }
}

/**
 * Get cluster color by index
 * @param {number} index - Cluster index
 * @returns {string} Color hex code
 */
export function getClusterColor(index) {
    const colors = [
        "#14b8a6", "#6366f1", "#f59e0b", "#f43f5e", "#8b5cf6",
        "#06b6d4", "#10b981", "#ec4899", "#f97316", "#84cc16"
    ];
    return colors[index % colors.length];
}

/**
 * Get cluster foreground color by index
 * @param {number} index - Cluster index
 * @returns {string} Color hex code
 */
export function getClusterFgColor(index) {
    const colors = [
        "#0d9488", "#4f46e5", "#d97706", "#e11d48", "#7c3aed",
        "#0891b2", "#059669", "#db2777", "#ea580c", "#65a30d"
    ];
    return colors[index % colors.length];
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate phone number (Saudi format)
 * @param {string} phone - Phone to validate
 * @returns {boolean} Is valid
 */
export function isValidPhone(phone) {
    const re = /^\+966\s?\d{2}\s?\d{3}\s?\d{4}$/;
    return re.test(phone);
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two arrays are equal
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} Are equal
 */
export function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
}

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

/**
 * Sort array by multiple keys
 * @param {Array} array - Array to sort
 * @param {Array} keys - Keys to sort by
 * @returns {Array} Sorted array
 */
export function sortByMultipleKeys(array, keys) {
    return [...array].sort((a, b) => {
        for (const key of keys) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
        }
        return 0;
    });
}
