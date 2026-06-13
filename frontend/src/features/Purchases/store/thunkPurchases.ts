import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from "../../../api/axiosInstance";
import type {
    Purchase,
    PurchaseFormData,
} from '../../../types/puchase'; // تم تصحيح المسار الإملائي للنوع

import { AxiosError } from "axios";

// دالة مساعدة لتحويل معرّف المونجو _id إلى id متوافق مع الواجهات النصية
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformPurchase = (invoice: any): Purchase => ({
    ...invoice,
    id: invoice._id || invoice.id,
});

export const createPurchaseInvoice = createAsyncThunk<Purchase, PurchaseFormData>(
    'purchases/create',
    async (purchaseData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/purchases/add', purchaseData);
            // تم الإصلاح: السيرفر يعيد المفتاح باسم savedInvoice بناءً على كود الـ Controller
            return transformPurchase(response.data.savedInvoice);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to create purchase invoice');
        }
    }
);

export const getAllPurchasesInvoices = createAsyncThunk<Purchase[], void>(
    'purchases/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/purchases/');
            // تم الإصلاح: السيرفر يعيد مصفوفة الفواتير مباشرة دون غلاف كائن
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response.data.map((invoice: any) => transformPurchase(invoice));
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch purchase invoices');
        }
    }
);

export const getPurchaseInvoiceById = createAsyncThunk<Purchase, string>(
    'purchases/fetchById',
    async (purchaseId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/purchases/${purchaseId}`);
            // السيرفر يعيد الفاتورة مباشرة عند طلب البحث برقم معرّفها الخاص
            return transformPurchase(response.data);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch purchase invoice');
        }
    }
);

export const updatePurchaseInvoiceThunk = createAsyncThunk<Purchase, { purchaseId: string; purchaseData: PurchaseFormData }>(
    'purchases/update',
    async ({ purchaseId, purchaseData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/purchases/${purchaseId}`, purchaseData);
            // تم الإصلاح: السيرفر يعيد الفاتورة المعدلة بمفتاح updatedInvoice بناءً على كود الـ Controller
            return transformPurchase(response.data.updatedInvoice);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to update purchase invoice');
        }
    }
);

export const deletePurchaseInvoice = createAsyncThunk<string, string>(
    'purchases/delete',
    async (purchaseId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/purchases/${purchaseId}`);
            return purchaseId;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to delete purchase invoice');
        }
    }
);