import { getAuditLogs } from './audit.js';

const AUDIT_STORAGE_KEY = 'fleetops_audit';

/**
 * Log a new action to the centralized localStorage audit trail.
 * 
 * @param {string} userName - The name or ID of the user performing the action (e.g., "ADM-001", "Ahmed K.")
 * @param {string} userRole - The role of the user (e.g., "Admin", "Mechanic")
 * @param {string} action - The action taken (e.g., "Created", "Updated", "Deleted", "Consumed")
 * @param {string} entity - The system entity modified (e.g., "SystemConfig", "SparePart", "UserRole")
 * @param {string} entityId - The unique ID of the specific entity (e.g., "PRT-1001")
 * @param {object|null} oldValue - The JSON object before modification
 * @param {object|null} newValue - The JSON object after modification
 */
export async function logAuditAction(userName, userRole, action, entity, entityId, oldValue = null, newValue = null) {
    const logs = await getAuditLogs();
    
    // Generate new ID (e.g., LOG-2026-94)
    const year = new Date().getFullYear();
    const maxId = logs.reduce((max, log) => {
        const parts = log.id.split('-');
        if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            return num > max ? num : max;
        }
        return max;
    }, 0);
    
    const newLog = {
        id: `LOG-${year}-${maxId + 1}`,
        userId: userName,
        userRole, // newly added per architecture directive
        entity,
        entityId, // newly added per architecture directive
        action,
        timestamp: new Date().toISOString(),
        details: `${action} ${entity} ${entityId}`,
        oldValue,
        newValue
    };
    
    logs.unshift(newLog); // Add to top
    
    // Directly save to localStorage to guarantee synchronization
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    
    return newLog;
}
