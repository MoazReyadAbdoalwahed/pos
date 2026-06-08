const adminOnly = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: الرجاء تسجيل الدخول أولاً" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: هذا الإجراء متاح فقط لمدير النظام (Admin)!"
            });
        }

        next();

    } catch (error) {

        return res.status(500).json({ message: "Server Error in admin middleware" });
    }
};

export default adminOnly;