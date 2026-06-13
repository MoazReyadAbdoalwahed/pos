import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
import categoryReducer from '../features/category/store/CategorySlice';
import productReducer from '../features/products/store/productSlice';
import saleReducer from '../features/sales/store/saleSlice';
import purchasesReducer from '../features/Purchases/store/PurchasesSlice'; // تم إضافة Reducer الخاص بالمشتريات
import approvalReducer from '../features/RerurnApproval/store/ApprovalSlice'; // تم إضافة Reducer الخاص بالموافقة على المرتجعات
import dashboardReducer from '../features/Dashboard/store/DashboardSlice'; // تم إضافة Reducer الخاص باللوحة الرئيسية
import TelegramReducer from '../features/telegram/store/sliceTelegram'; // تم إضافة Reducer الخاص بالتليجرام

export const store = configureStore({
    reducer: {
        auth: authReducer,
        category: categoryReducer,
        products: productReducer,
        sales: saleReducer,
        purchases: purchasesReducer, // تم تسجيل Reducer المشتريات في الـ Store
        approval: approvalReducer, // تم تسجيل Reducer الموافقة على المرتجعات في الـ Store
        dashboard: dashboardReducer, // تم تسجيل Reducer اللوحة الرئيسية في الـ Store
        telegram: TelegramReducer, // تم تسجيل Reducer التليجرام في الـ Store
    },

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;