import rateLimit from 'express-rate-limit'; // تصحيح اسم المكتبة هنا


const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 دقيقة
    max: 10, // 5 محاولات فقط
    message: { message: "Too many login attempts, please try again after 10 minutes" },
    standardHeaders: true, // يرجع معلومات الـ Limit في الـ Headers
    legacyHeaders: false,
});

export default loginLimiter;