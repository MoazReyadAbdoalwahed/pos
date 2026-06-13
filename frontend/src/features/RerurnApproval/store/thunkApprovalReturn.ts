import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../../api/axiosInstance";
import { AxiosError } from "axios";
import type {
    IReturnRequest,
    IInvoice,
    CreateReturnRequestBody,
    ApproveReturnBody,
    RejectReturnBody,
} from "../../../types/ApprovalReturn";

// دالة مساعدة لتحويل معرّف المونجو _id إلى id متوافق مع الواجهات النصية
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformReturn = (item: any): IReturnRequest => ({
    ...item,
    id: item._id || item.id,
});

// ════════════════════════════════════════════════════════════════════════
// 🔍 جلب تفاصيل الفاتورة الأصلية قبل إنشاء طلب المرتجع
// ════════════════════════════════════════════════════════════════════════
export const fetchInvoiceForReturn = createAsyncThunk<IInvoice, string>(
    "approval/fetchInvoice",
    async (invoiceId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/returns/invoice/${invoiceId}`);
            // السيرفر يعيد الفاتورة داخل مفتاح data بناءً على كود الـ Controller
            return response.data.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to fetch invoice details"
            );
        }
    }
);

// ════════════════════════════════════════════════════════════════════════
// 📝 كاشير يطلب عمل مرتجع (حالة معلقة)
// ════════════════════════════════════════════════════════════════════════
export const createReturnRequest = createAsyncThunk<IReturnRequest, CreateReturnRequestBody>(
    "approval/createRequest",
    async (returnData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/returns/request", returnData);
            // السيرفر يعيد طلب المرتجع داخل مفتاح returnRequest بناءً على كود الـ Controller
            return transformReturn(response.data.returnRequest);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to create return request"
            );
        }
    }
);

// ════════════════════════════════════════════════════════════════════════
// ⏳ جلب الطلبات المعلقة (للأدمن فقط)
// ════════════════════════════════════════════════════════════════════════
export const fetchPendingReturns = createAsyncThunk<IReturnRequest[], void>(
    "approval/fetchPending",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/returns/pending");
            // السيرفر يعيد المصفوفة داخل مفتاح data بناءً على كود الـ Controller
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response.data.data.map((item: any) => transformReturn(item));
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to fetch pending returns"
            );
        }
    }
);

// ════════════════════════════════════════════════════════════════════════
// 📜 جلب كامل سجل طلبات المرتجعات (المقبولة والمرفوضة)
// ════════════════════════════════════════════════════════════════════════
export const fetchReturnHistory = createAsyncThunk<IReturnRequest[], void>(
    "approval/fetchHistory",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/returns/history");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response.data.data.map((item: any) => transformReturn(item));
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to fetch return history"
            );
        }
    }
);

// ════════════════════════════════════════════════════════════════════════
// ✅ موافقة الأدمن على طلب المرتجع
// ════════════════════════════════════════════════════════════════════════
export const approveReturnRequest = createAsyncThunk<
    { returnRequest: IReturnRequest; invoice: IInvoice },
    { id: string } & ApproveReturnBody
>(
    "approval/approve",
    async ({ id, approvalNotes }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/returns/approve/${id}`, { approvalNotes });
            // السيرفر يعيد returnRequest و invoice بناءً على كود الـ Controller
            return {
                returnRequest: transformReturn(response.data.returnRequest),
                invoice: response.data.invoice,
            };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to approve return request"
            );
        }
    }
);

// ════════════════════════════════════════════════════════════════════════
// ❌ رفض طلب المرتجع
// ════════════════════════════════════════════════════════════════════════
export const rejectReturnRequest = createAsyncThunk<
    IReturnRequest,
    { id: string } & RejectReturnBody
>(
    "approval/reject",
    async ({ id, rejectionReason }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/returns/reject/${id}`, { rejectionReason });
            return transformReturn(response.data.returnRequest);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to reject return request"
            );
        }
    }
);