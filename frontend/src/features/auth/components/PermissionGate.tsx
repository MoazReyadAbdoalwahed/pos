import React from 'react';
import { useAuth } from '../hooks/useAuth'; // تأكد من صحة مسار الـ Hook الخاص بك

interface PermissionGateProps {
    children: React.ReactNode;
    allowedRoles: ('admin' | 'manager' | 'cashier' | 'customer')[];
    fallback?: React.ReactNode; // اختياري: ماذا يظهر إذا لم يكن يملك الصلاحية (مثلاً رسالة خطأ)
}

export default function PermissionGate({ children, allowedRoles, fallback = null }: PermissionGateProps) {
    const { userRole, isAuthenticated } = useAuth();

    // إذا لم يكن مسجلاً للدخول من الأساس، أو دور المستخدم ليس من الأدوار المسموح لها
    if (!isAuthenticated || !userRole || !allowedRoles.includes(userRole)) {
        return <>{fallback}</>;
    }

    // إذا نجح الفحص، يتم إظهار المحتوى الداخلي بشكل طبيعي
    return <>{children}</>;
}
