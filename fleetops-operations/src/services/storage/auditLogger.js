// import { AUDIT_STORAGE_KEY, getAuditLogsFromStorage } from './audit.js';

// /**
//  * تسجيل عملية جديدة في سجل المراجعة المركزي (Audit Trail)
//  */
// export async function logAuditAction(userName, userRole, action, entity, entityId, oldValue = null, newValue = null) {
//     // جلب السجلات الحالية عبر الـ Storage Layer
//     const logs = getAuditLogsFromStorage();
    
//     // توليد معرف جديد (e.g., LOG-2026-94)
//     const year = new Date().getFullYear();
//     const maxId = logs.reduce((max, log) => {
//         const parts = log.id.split('-');
//         if (parts.length === 3) {
//             const num = parseInt(parts[2], 10);
//             return num > max ? num : max;
//         }
//         return max;
//     }, 0);
    
//     const newLog = {
//         id: `LOG-${year}-${maxId + 1}`,
//         userId: userName,
//         userRole,
//         entity,
//         entityId,
//         action,
//         timestamp: new Date().toISOString(),
//         details: `${action} ${entity} ${entityId}`,
//         oldValue,
//         newValue
//     };
    
//     // إضافة السجل الجديد في البداية
//     logs.unshift(newLog);
    
//     // الحفظ في الـ LocalStorage
//     localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    
//     return newLog;
// }