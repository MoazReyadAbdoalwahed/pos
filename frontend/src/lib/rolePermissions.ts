export const Roles = {
    ADMAIN: 'admin',
    MANAGER: 'manager',
    CASHIER: 'cashier',
}

// ── تحديد الصلاحيات بناءً على الدور ──
const rolePermissions: Record<string, string[]> = {
    admin: [
        'sales',
        'products',
        'sales-invoices',
        'return-invoices',
        'return-approval',
        'invoices',
        'reports',
        'employees',
        'marketing',
        'dashboard'
    ],
    manager: [
        'sales',
        'products',
        'sales-invoices',
        'return-invoices',
        'return-approval',
        'invoices',
        'reports',
        'employees',
        'marketing'
    ],
    cashier: [
        'sales',
        'sales-invoices'
    ],
};

// ── التحقق من وصول المستخدم لتبويب معين ──
export const hasTabAccess = (tabValue: string, userRole: string): boolean => {
    if (!userRole || !rolePermissions[userRole]) {
        return false;
    }
    return rolePermissions[userRole].includes(tabValue);
};

// ── الحصول على نص الدور بصيغة واضحة ──
export const getRoleDisplayName = (role: string): string => {
    const displayNames: Record<string, string> = {
        admin: 'إدارة نظام',
        manager: 'مدير',
        cashier: 'أمين صندوق',
    };
    return displayNames[role] || role;
};

// ── الحصول على لون الـ badge بناءً على الدور ──
export const getRoleBadgeColor = (role: string): string => {
    const colors: Record<string, string> = {
        admin: 'bg-red-500/10 border-red-500/20 text-red-400',
        manager: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
        cashier: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    };
    return colors[role] || 'bg-slate-500/10 border-slate-500/20 text-slate-400';
};


