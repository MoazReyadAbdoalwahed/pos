import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { axiosInstance } from "../../../api/axiosInstance";
import type {
    SendInvoiceRequest,
    SendInvoiceResponse,
    SendReturnAlertRequest,
    SendReturnAlertResponse,
    SendReturnStatusRequest,
    SendReturnStatusResponse,
    SendDailyReportRequest,
    SendDailyReportResponse,
    TriggerDailyReportRequest,
    TriggerDailyReportResponse,
    SendBroadcastResponse,
    UploadImageResponse,
    LinkUserRequest,
    LinkUserResponse,
    TelegramLinkingStatus,
} from "../../../types/Telegram";

// ─── helper ────────────────────────────────────────────────────────────────
const rejectMsg = (error: unknown, fallback: string): string => {
    const e = error as AxiosError<{ error?: string; message?: string }>;
    return e.response?.data?.error ?? e.response?.data?.message ?? fallback;
};

// ─────────────────────────────────────────────────────────────────────────────
// 📄  Send Invoice  →  POST /telegram/send-invoice
// ─────────────────────────────────────────────────────────────────────────────
export const sendInvoiceByPhone = createAsyncThunk<
    SendInvoiceResponse,
    SendInvoiceRequest,
    { rejectValue: string }
>(
    "telegram/sendInvoiceByPhone",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post<SendInvoiceResponse>(
                "/telegram/send-invoice",
                payload
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل إرسال الفاتورة عبر التليجرام"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔄  Send Return Alert  →  POST /telegram/send-return-alert
// ─────────────────────────────────────────────────────────────────────────────
export const sendReturnAlert = createAsyncThunk<
    SendReturnAlertResponse,
    SendReturnAlertRequest,
    { rejectValue: string }
>(
    "telegram/sendReturnAlert",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post<SendReturnAlertResponse>(
                "/telegram/send-return-alert",
                payload
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل إرسال تنبيه المرتجع"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// 📬  Send Return Status Update  →  POST /telegram/send-status-update
// ─────────────────────────────────────────────────────────────────────────────
export const sendReturnStatusUpdate = createAsyncThunk<
    SendReturnStatusResponse,
    SendReturnStatusRequest,
    { rejectValue: string }
>(
    "telegram/sendReturnStatusUpdate",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post<SendReturnStatusResponse>(
                "/telegram/send-status-update",
                payload
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل إرسال تحديث حالة المرتجع"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// 📊  Send Daily Report  →  POST /telegram/send-daily-report
// ─────────────────────────────────────────────────────────────────────────────
export const sendDailyReport = createAsyncThunk<
    SendDailyReportResponse,
    SendDailyReportRequest,
    { rejectValue: string }
>(
    "telegram/sendDailyReport",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post<SendDailyReportResponse>(
                "/telegram/send-daily-report",
                payload
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل إرسال التقرير اليومي"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// ⚡  Trigger Daily Report  →  POST /telegram/trigger-daily-report
// ─────────────────────────────────────────────────────────────────────────────
export const triggerDailyReport = createAsyncThunk<
    TriggerDailyReportResponse,
    TriggerDailyReportRequest,
    { rejectValue: string }
>(
    "telegram/triggerDailyReport",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post<TriggerDailyReportResponse>(
                "/telegram/trigger-daily-report",
                payload
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل تشغيل التقرير اليومي"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// 📢  Bulk Broadcast (text only)  →  POST /telegram/send-bulk-broadcast
// ─────────────────────────────────────────────────────────────────────────────
export const sendBulkBroadcast = createAsyncThunk<
    SendBroadcastResponse,
    { message: string },
    { rejectValue: string }
>(
    "telegram/sendBulkBroadcast",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post<SendBroadcastResponse>(
                "/telegram/send-bulk-broadcast",
                payload
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل الإرسال الجماعي"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// 📢🖼️  Bulk Broadcast with File  →  POST /telegram/send-bulk-broadcast-with-file
// ─────────────────────────────────────────────────────────────────────────────
export const sendBulkBroadcastWithFile = createAsyncThunk<
    SendBroadcastResponse,
    { message: string; file?: File },
    { rejectValue: string }
>(
    "telegram/sendBulkBroadcastWithFile",
    async ({ message, file }, { rejectWithValue }) => {
        try {
            const form = new FormData();
            form.append("message", message);
            if (file) form.append("file", file);

            const { data } = await axiosInstance.post<SendBroadcastResponse>(
                "/telegram/send-bulk-broadcast-with-file",
                form,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل الإرسال الجماعي مع الملف"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// 📸  Upload Image  →  POST /telegram/upload-image
// ─────────────────────────────────────────────────────────────────────────────
export const uploadImage = createAsyncThunk<
    UploadImageResponse,
    { file: File },
    { rejectValue: string }
>(
    "telegram/uploadImage",
    async ({ file }, { rejectWithValue }) => {
        try {
            const form = new FormData();
            form.append("file", file);

            const { data } = await axiosInstance.post<UploadImageResponse>(
                "/telegram/upload-image",
                form,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل رفع الصورة"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔗  Link User to Telegram  →  POST /telegram/link-user
// ─────────────────────────────────────────────────────────────────────────────
export const linkUserToTelegram = createAsyncThunk<
    LinkUserResponse,
    LinkUserRequest,
    { rejectValue: string }
>(
    "telegram/linkUserToTelegram",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post<LinkUserResponse>(
                "/telegram/link-user",
                payload
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل ربط حساب التليجرام"));
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// 📋  Get Linking Status  →  GET /telegram/status
// ─────────────────────────────────────────────────────────────────────────────
export const getTelegramLinkingStatus = createAsyncThunk<
    TelegramLinkingStatus,
    void,
    { rejectValue: string }
>(
    "telegram/getLinkingStatus",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get<TelegramLinkingStatus>(
                "/telegram/status"
            );
            return data;
        } catch (error) {
            return rejectWithValue(rejectMsg(error, "فشل جلب حالة الربط"));
        }
    }
);