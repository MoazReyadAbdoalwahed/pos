export const validate = (schema) => (req, res, next) => {
    try {
        // الفحص بيتم هنا
        schema.parse(req.body);
        next(); // لو الداتا سليمة كمل للـ Controller
    } catch (error) {
        // لو في أي غلط في الكتابة، يرجع الإيرور فوراً للفرونت إند
        return res.status(400).json({
            status: "fail",
            errors: error.errors.map(err => ({
                field: err.path[0],
                message: err.message
            }))
        });
    }
};