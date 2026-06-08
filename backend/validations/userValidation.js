import { z } from 'zod';

// اسكيما التحقق من بيانات التسجيل
export const registerSchema = z.object({
    name: z.string()
        .min(3, { message: "الاسم يجب أن يكون 3 حروف على الأقل" })
        .max(50),
    username: z.string()
        .min(3, { message: "اسم المستخدم يجب أن يكون 3 حروف على الأقل" })
        .toLowerCase(), // يحول الحروف تلقائياً لـ lowercase
    password: z.string()
        .min(6, { message: "كلمة المرور يجب أن لا تقل عن 6 أحرف" }),
    role: z.enum(["admin", "manager", "cashier", "customer"], {
        errorMap: () => ({ message: "الصلاحية المكتوبة غير صحيحة" })
    })
});

// اسكيما التحقق من بيانات اللوجن (منفصلة ونظيفة)
export const loginSchema = z.object({
    username: z.string().min(1, { message: "اسم المستخدم مطلوب" }),
    password: z.string().min(1, { message: "كلمة المرور مطلوبة" })
});