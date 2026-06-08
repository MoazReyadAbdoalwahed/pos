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
        const { name, username, password, role } = req.body;
        if (!name || !username || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Get allowed roles from the schema
        const allowedRoles = User.schema.path('role').enumValues;
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}` });
        }

        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }
        // Create a new user
        const newUser = new User({
            name,
            username,
            password,
            role,
            isActive: true, // Set the new user as active by default
        });
        await newUser.save();
        res.status(201).json({ message: "Employee registered successfully" });
    } catch (err) {
        console.error("Employee registration error:", err.message);
        res.status(500).json({ message: "Server error" });
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
        res.status(200).json({ message: "Employee deactivated successfully", employee });
    } catch (err) {
        console.error("Deactivate employee error:", err.message);
        res.status(500).json({ status: "error", message: "Server error" });
    }

};
export { userLogin, adminLogin, registerEmployee, getAllEmployees, deactivateEmployee }
