import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import bcrypt from "bcryptjs";
import generateToken from "../config/jwtConfig.js";

// تسجيل الدخول للمستخدم(staff)
const userLogin = async (req, res) => {

    try {
        const { username, password } = req.body;
        // التحقق من وجود اسم المستخدم وكلمة المرور في الطلب
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await User.findOne({ username }).select('+password'); // جلب كلمة المرور المشفرة أيضاً
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        // التحقق من كلمة المرور باستخدام الدالة المخصصة في نموذج المستخدم
        if (!user.isActive) {
            return res.status(403).json({ message: "User account is inactive" });
        }
        // مقارنة كلمة المرور المكتوبة مع الكلمة المشفرة في قاعدة البيانات
        const ispasswordMatch = await user.comparePassword(password);
        if (!ispasswordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        // إذا كانت كلمة المرور صحيحة، يمكنك إنشاء جلسة أو إصدار رمز JWT هنا

        const { password: _, ...userData } = user.toObject(); // إزالة كلمة المرور من بيانات المستخدم

        const token = generateToken({
            id: user._id,
            role: user.role,
        });
        res.status(200).json({
            status: "success", token, user: {
                id: user._id,
                username: user.username,
                role: user.role,
                name: user.name,
            }
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// admin login

const adminLogin = async (req, res) => {

    try {
        const { username, password } = req.body;
        // التحقق من وجود اسم المستخدم وكلمة المرور في الطلب
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }
        const adminUserName = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (username !== adminUserName || password !== adminPassword) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        // const dbAdmin = await User.findOne({ username: adminUserName, role: 'admin' });
        // if (!dbAdmin) {
        //     return res.status(401).json({ message: "Admin user not found" });
        // }
        // const ispasswordMatch = await dbAdmin.comparePassword(password);
        // if (!ispasswordMatch) {
        //     return res.status(401).json({ message: "Invalid username or password" });
        // }
        // const { password: _, ...adminData } = dbAdmin.toObject(); // إزالة كلمة المرور من بيانات المسؤول
        const token = generateToken({
            id: "super-admin-id-123456", // معرّف وهمي أو ثابت للأدمن الرئيسي
            role: "admin",
        });
        res.status(200).json({
            status: "success",
            token,
            user: {
                id: "super-admin-id-123456",
                name: "Main Admin",
                username: adminUserName,
                role: "admin"
            }
        });
    } catch (err) {
        console.error("Admin login error:", err.message);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// register employee admin only 

const registerEmployee = async (req, res) => {
    try {
        console.log('Register employee request body:', req.body);
        const { name, username, password, role } = req.body;
        // normalize username to avoid case/whitespace duplicates
        const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : username;
        if (!name || !normalizedUsername || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Get allowed roles from the schema (safe access)
        const rolePath = User.schema.path && User.schema.path('role');
        const allowedRoles = (rolePath && (rolePath.enumValues || (rolePath.options && rolePath.options.enum))) || [];
        if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
            console.warn('Could not read allowed roles from User schema, falling back to defaults');
        }
        if (allowedRoles.length && !allowedRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}` });
        }

        // Create a new user (attempt save and handle duplicate-key errors)
        const newUser = new User({
            name,
            username: normalizedUsername,
            password,
            role,
            isActive: true, // Set the new user as active by default
        });
        await newUser.save();
        res.status(201).json({
            message: "Employee registered successfully",
            employee: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error("Employee registration error:", err);
        // Include stack in server log; return more specific message when available
        const errMsg = err && err.message ? err.message : 'Server error';
        // Handle common mongoose errors explicitly
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 11000) {
            // duplicate key error
            return res.status(409).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: errMsg });
    }
};

//get all employees for admin

const getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find().select('-password').sort({ createdAt: -1 }); // جلب جميع الموظفين بدون كلمة المرور
        res.status(200).json({ status: "success", employees });
    } catch (err) {
        console.error("Get employees error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

//deactivate employee by admin

const deactivateEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const requesterUserId = req.user.id; // Assuming the user ID is stored in the token payload

        if (requesterUserId === id) {
            return res.status(400).json({ message: "You cannot deactivate your own account" });
        }
        const employee = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        res.status(200).json({
            message: "Employee deactivated successfully",
            employeeId: employee._id.toString()
        });
    } catch (err) {
        console.error("Deactivate employee error:", err.message);
        res.status(500).json({ status: "error", message: "Server error" });
    }

};
export { userLogin, adminLogin, registerEmployee, getAllEmployees, deactivateEmployee }
