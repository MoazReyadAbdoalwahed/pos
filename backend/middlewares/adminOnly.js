const authorizeRoles = (allowedRoles) => (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: الرجاء تسجيل الدخول أولاً" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden: هذا الإجراء متاح فقط للمستخدمين المصرح لهم"
            });
        }

        next();

    } catch (error) {
        return res.status(500).json({ message: "Server Error in authorization middleware" });
    }
};

const adminOnly = authorizeRoles(['admin']);
const adminOrManagerOnly = authorizeRoles(['admin', 'manager']);

export default adminOnly;
export { adminOrManagerOnly };