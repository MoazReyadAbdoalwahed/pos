import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // 💡 استيراد مكتبة التشفير

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "manager", "cashier", "customer",],
        default: "customer",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    phone: {
        type: String,
        sparse: true,
        trim: true,
        match: [/^(\+20)?0(100\d{7}|(10|11|12|15)\d{8})$/, "Please enter a valid Egyptian phone number starting with 010, 0100, 011, 012, or 015"],
    },
    telegramChatId: {
        type: String,
        sparse: true,
    },
    telegramLinkedAt: {
        type: Date,
        default: null,
    },

}, { timestamps: true });

// 1. تشفير كلمة المرور تلقائياً قبل الحفظ في قاعدة البيانات
userSchema.pre('save', async function () {
    // إذا لم يتم تعديل كلمة المرور أو كتابتها لأول مرة، انتقل للخطوة التالية ولا تفعل شيئاً
    if (!this.isModified('password')) {
        return;
    }

    try {
        // توليد عينة تشفير عشوائية (Salt) بمستوى قوة 10
        const salt = await bcrypt.genSalt(10);
        // تشفير كلمة المرور الأصلية ودمجها بالـ Salt
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// 2. دالة مخصصة لمقارنة كلمة المرور المكتوبة عند تسجيل الدخول بالكلمة المشفرة
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;