import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { axiosInstance } from "../../../api/axiosInstance";
import { tokenManger } from "../../../api/tokenManager"; // تم تعديل الإملاء هنا
import type {
    LoginResponse,
    LoginCredentials,
    EmployeeLogin,
    RegisterEmployeeResponse,
    GetAllEmployeesResponse,
    User,
} from "../../../types/users";

// تيب موحد للـ Configuration الخاص بالـ Thunk لتقليل التكرار
interface ThunkConfig {
    rejectValue: string;
}

// 🔑 1. تسجيل دخول مستخدم عادي (كاشير / مدير)
export const loginUser = createAsyncThunk<LoginResponse, LoginCredentials, ThunkConfig>(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/users/login', credentials);
            const token = response.data.token;
            const user = response.data.user;
            tokenManger.setToken(token);
            tokenManger.setUser(user);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'فشل تسجيل الدخول');
        }
    }
);

// 🔑 2. تسجيل دخول الأدمن
export const adminLogin = createAsyncThunk<LoginResponse, LoginCredentials, ThunkConfig>(
    'auth/adminLogin',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/users/admin/login', credentials);
            const token = response.data.token;
            const user = response.data.user;
            tokenManger.setToken(token);
            tokenManger.setUser(user);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'فشل تسجيل دخول المسؤول');
        }
    }
);

// 📝 3. تسجيل موظف جديد بالسيستم
export const registerEmployee = createAsyncThunk<RegisterEmployeeResponse, EmployeeLogin, ThunkConfig>(
    'auth/registerEmployee',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/users/register-employee', credentials);
            // Transform MongoDB _id to id for frontend consistency
            const employee = response.data.employee;
            return {
                ...response.data,
                employee: {
                    ...employee,
                    id: employee._id || employee.id,
                }
            };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'فشل تسجيل الموظف');
        }
    }
);

// 👥 4. جلب قائمة كل الموظفين
// تم تعديل الـ Return type ليطابق مصفوفة الموظفين المستخرجة من السيرفر
export const getAllEmployees = createAsyncThunk<GetAllEmployeesResponse['employees'], void, ThunkConfig>(
    'auth/getAllEmployee',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/users/employees');
            // Transform MongoDB _id to id and filter out customers
            const transformedEmployees = response.data.employees
                .filter((emp: User) => emp.role !== 'customer')
                .map((emp: User) => ({
                    ...emp,
                    id: emp._id || emp.id,
                }));
            return transformedEmployees;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'فشل جلب قائمة الموظفين');
        }
    }
);

// 🚫 5. إيقاف تنشيط موظف
export const deactivateEmployee = createAsyncThunk<string, string, ThunkConfig>(
    'auth/deactivateEmployee',
    async (employeeId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/users/employees/${employeeId}`);
            // ملحوظة: تأكد هل السيرفر يرجع employeddId أم employeeId مصلحة برمجياً
            return response.data.employeeId || employeeId;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'فشل تعديل حالة الموظف');
        }
    }
);