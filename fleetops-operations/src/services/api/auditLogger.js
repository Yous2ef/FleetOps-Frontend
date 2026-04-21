import api from "/shared/api-handler.js";
import { AUDIT_STORAGE_KEY, initialAuditMockData ,auditMockData} from "../storage/audit.js";

// إعداد قاعدة URL وهمية (يمكن تعديله لاحقًا ليتوافق مع API حقيقي)
api.setBaseURL("http://localhost:3000");

// دالة محاكاة تأخير الشبكة لزيادة واقعية التجربة
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// تسجيل عملية جديدة في سجل المراجعة المركزي (Audit Trail)
export async function logAuditAction(userName, userRole, action, entity, entityId, oldValue = null, newValue = null) {
    const logs = await getAuditLogs();
    
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
        userRole,
        entity,
        entityId,
        action,
        timestamp: new Date().toISOString(),
        details: `${action} ${entity} ${entityId}`,
        oldValue,
        newValue
    };
    
    logs.unshift(newLog);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    
    return newLog;
}

//ApI function to get audit logs, simulating an async call
export async function getAuditLogs() {
    // محاكاة تأخير بسيط كأنها API حقيقية
    return new Promise((resolve) => {
        setTimeout(() => resolve(auditMockData), 100);
    });
}