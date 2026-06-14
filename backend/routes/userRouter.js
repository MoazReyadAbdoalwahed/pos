import express from "express";
import {
    userLogin,
    adminLogin,
    registerEmployee,
    getAllEmployees,
    deactivateEmployee
} from "../controllers/userControllers.js";
import adminOnly from "../middlewares/adminOnly.js";
import { adminOrManagerOnly } from "../middlewares/adminOnly.js";
import userAuth from "../middlewares/userAuth.js";
import loginLimiter from "../middlewares/loginLimiter.js";
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validations/userValidation.js';
const router = express.Router();


router.post("/login", loginLimiter, validate(loginSchema), userLogin);
router.post("/admin/login", loginLimiter, validate(loginSchema), adminLogin);
router.post("/register-employee", userAuth, adminOnly, validate(registerSchema), registerEmployee);
router.get("/employees", userAuth, adminOrManagerOnly, getAllEmployees);
router.put("/employees/:id", userAuth, adminOnly, deactivateEmployee);


export default router;