import type { RootState } from '../../../store/store';
import { tokenManger } from '../../../api/tokenManager';

// --- دوال الحالة العامة (General Auth Selectors) ---
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token; //  تم تصحيح الإملاء هنا
export const selectUserRole = (state: RootState) => state.auth.user?.role || null;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectUsername = (state: RootState) => state.auth.user?.username || null; //  تم تصحيح الإملاء هنا
export const selectIsToken = (state: RootState) => !!state.auth.token || !!tokenManger.getToken();
export const employees = (state: RootState) => state.auth.employees; //  تم إضافة هذا السلكتور ليتوافق مع البيانات التي نحتاجها في الـ Slice
// --- دوال التحقق من الأدوار والصلاحيات (Role-Based Selectors) ---
export const selectAdmin = (state: RootState) => state.auth.user?.role === 'admin';
export const selectManager = (state: RootState) => state.auth.user?.role === 'manager';
export const selectCashier = (state: RootState) => state.auth.user?.role === 'cashier';
export const selectCustomer = (state: RootState) => state.auth.user?.role === 'customer';