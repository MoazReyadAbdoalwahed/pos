import { createSlice } from "@reduxjs/toolkit";
import type {
    SendInvoiceResponse,
    SendReturnAlertResponse,
    SendReturnStatusResponse,
    SendDailyReportResponse,
    TriggerDailyReportResponse,
    SendBroadcastResponse,
    UploadImageResponse,
    LinkUserResponse,
    TelegramLinkingStatus,
} from "../../../types/Telegram";
import {
    sendInvoiceByPhone,
    sendReturnAlert,
    sendReturnStatusUpdate,
    sendDailyReport,
    triggerDailyReport,
    sendBulkBroadcast,
    sendBulkBroadcastWithFile,
    uploadImage,
    linkUserToTelegram,
    getTelegramLinkingStatus,
} from "./thunkTelegram";

// ─────────────────────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────────────────────
export interface TelegramState {
    // per-action loading flags
    loading: {
        sendInvoice: boolean;
        sendReturnAlert: boolean;
        sendReturnStatus: boolean;
        sendDailyReport: boolean;
        triggerDailyReport: boolean;
        bulkBroadcast: boolean;
        uploadImage: boolean;
        linkUser: boolean;
        linkingStatus: boolean;
    };

    // last successful responses (null = never fetched / cleared)
    lastInvoiceResult: SendInvoiceResponse | null;
    lastReturnAlertResult: SendReturnAlertResponse | null;
    lastReturnStatusResult: SendReturnStatusResponse | null;
    lastDailyReportResult: SendDailyReportResponse | null;
    lastTriggerResult: TriggerDailyReportResponse | null;
    lastBroadcastResult: SendBroadcastResponse | null;
    lastUploadedImageUrl: string | null;
    lastLinkResult: LinkUserResponse | null;
    linkingStatus: TelegramLinkingStatus | null;

    // per-action errors (null = no error)
    errors: {
        sendInvoice: string | null;
        sendReturnAlert: string | null;
        sendReturnStatus: string | null;
        sendDailyReport: string | null;
        triggerDailyReport: string | null;
        bulkBroadcast: string | null;
        uploadImage: string | null;
        linkUser: string | null;
        linkingStatus: string | null;
    };
}

const initialState: TelegramState = {
    loading: {
        sendInvoice: false,
        sendReturnAlert: false,
        sendReturnStatus: false,
        sendDailyReport: false,
        triggerDailyReport: false,
        bulkBroadcast: false,
        uploadImage: false,
        linkUser: false,
        linkingStatus: false,
    },
    lastInvoiceResult: null,
    lastReturnAlertResult: null,
    lastReturnStatusResult: null,
    lastDailyReportResult: null,
    lastTriggerResult: null,
    lastBroadcastResult: null,
    lastUploadedImageUrl: null,
    lastLinkResult: null,
    linkingStatus: null,
    errors: {
        sendInvoice: null,
        sendReturnAlert: null,
        sendReturnStatus: null,
        sendDailyReport: null,
        triggerDailyReport: null,
        bulkBroadcast: null,
        uploadImage: null,
        linkUser: null,
        linkingStatus: null,
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────
const telegramSlice = createSlice({
    name: "telegram",
    initialState,
    reducers: {
        clearTelegramErrors(state) {
            Object.keys(state.errors).forEach((k) => {
                (state.errors as Record<string, string | null>)[k] = null;
            });
        },
        clearLastResults(state) {
            state.lastInvoiceResult = null;
            state.lastReturnAlertResult = null;
            state.lastReturnStatusResult = null;
            state.lastDailyReportResult = null;
            state.lastTriggerResult = null;
            state.lastBroadcastResult = null;
            state.lastUploadedImageUrl = null;
            state.lastLinkResult = null;
        },
    },
    extraReducers: (builder) => {
        // ── sendInvoiceByPhone ────────────────────────────────────────────────
        builder
            .addCase(sendInvoiceByPhone.pending, (state) => {
                state.loading.sendInvoice = true;
                state.errors.sendInvoice = null;
            })
            .addCase(sendInvoiceByPhone.fulfilled, (state, action) => {
                state.loading.sendInvoice = false;
                state.lastInvoiceResult = action.payload;
            })
            .addCase(sendInvoiceByPhone.rejected, (state, action) => {
                state.loading.sendInvoice = false;
                state.errors.sendInvoice = action.payload ?? "خطأ غير معروف";
            });

        // ── sendReturnAlert ───────────────────────────────────────────────────
        builder
            .addCase(sendReturnAlert.pending, (state) => {
                state.loading.sendReturnAlert = true;
                state.errors.sendReturnAlert = null;
            })
            .addCase(sendReturnAlert.fulfilled, (state, action) => {
                state.loading.sendReturnAlert = false;
                state.lastReturnAlertResult = action.payload;
            })
            .addCase(sendReturnAlert.rejected, (state, action) => {
                state.loading.sendReturnAlert = false;
                state.errors.sendReturnAlert = action.payload ?? "خطأ غير معروف";
            });

        // ── sendReturnStatusUpdate ────────────────────────────────────────────
        builder
            .addCase(sendReturnStatusUpdate.pending, (state) => {
                state.loading.sendReturnStatus = true;
                state.errors.sendReturnStatus = null;
            })
            .addCase(sendReturnStatusUpdate.fulfilled, (state, action) => {
                state.loading.sendReturnStatus = false;
                state.lastReturnStatusResult = action.payload;
            })
            .addCase(sendReturnStatusUpdate.rejected, (state, action) => {
                state.loading.sendReturnStatus = false;
                state.errors.sendReturnStatus = action.payload ?? "خطأ غير معروف";
            });

        // ── sendDailyReport ───────────────────────────────────────────────────
        builder
            .addCase(sendDailyReport.pending, (state) => {
                state.loading.sendDailyReport = true;
                state.errors.sendDailyReport = null;
            })
            .addCase(sendDailyReport.fulfilled, (state, action) => {
                state.loading.sendDailyReport = false;
                state.lastDailyReportResult = action.payload;
            })
            .addCase(sendDailyReport.rejected, (state, action) => {
                state.loading.sendDailyReport = false;
                state.errors.sendDailyReport = action.payload ?? "خطأ غير معروف";
            });

        // ── triggerDailyReport ────────────────────────────────────────────────
        builder
            .addCase(triggerDailyReport.pending, (state) => {
                state.loading.triggerDailyReport = true;
                state.errors.triggerDailyReport = null;
            })
            .addCase(triggerDailyReport.fulfilled, (state, action) => {
                state.loading.triggerDailyReport = false;
                state.lastTriggerResult = action.payload;
            })
            .addCase(triggerDailyReport.rejected, (state, action) => {
                state.loading.triggerDailyReport = false;
                state.errors.triggerDailyReport = action.payload ?? "خطأ غير معروف";
            });

        // ── sendBulkBroadcast ─────────────────────────────────────────────────
        builder
            .addCase(sendBulkBroadcast.pending, (state) => {
                state.loading.bulkBroadcast = true;
                state.errors.bulkBroadcast = null;
            })
            .addCase(sendBulkBroadcast.fulfilled, (state, action) => {
                state.loading.bulkBroadcast = false;
                state.lastBroadcastResult = action.payload;
            })
            .addCase(sendBulkBroadcast.rejected, (state, action) => {
                state.loading.bulkBroadcast = false;
                state.errors.bulkBroadcast = action.payload ?? "خطأ غير معروف";
            });

        // ── sendBulkBroadcastWithFile ─────────────────────────────────────────
        builder
            .addCase(sendBulkBroadcastWithFile.pending, (state) => {
                state.loading.bulkBroadcast = true;
                state.errors.bulkBroadcast = null;
            })
            .addCase(sendBulkBroadcastWithFile.fulfilled, (state, action) => {
                state.loading.bulkBroadcast = false;
                state.lastBroadcastResult = action.payload;
            })
            .addCase(sendBulkBroadcastWithFile.rejected, (state, action) => {
                state.loading.bulkBroadcast = false;
                state.errors.bulkBroadcast = action.payload ?? "خطأ غير معروف";
            });

        // ── uploadImage ───────────────────────────────────────────────────────
        builder
            .addCase(uploadImage.pending, (state) => {
                state.loading.uploadImage = true;
                state.errors.uploadImage = null;
                state.lastUploadedImageUrl = null;
            })
            .addCase(uploadImage.fulfilled, (state, action) => {
                state.loading.uploadImage = false;
                state.lastUploadedImageUrl = action.payload.imageUrl ?? null;
            })
            .addCase(uploadImage.rejected, (state, action) => {
                state.loading.uploadImage = false;
                state.errors.uploadImage = action.payload ?? "خطأ غير معروف";
            });

        // ── linkUserToTelegram ────────────────────────────────────────────────
        builder
            .addCase(linkUserToTelegram.pending, (state) => {
                state.loading.linkUser = true;
                state.errors.linkUser = null;
            })
            .addCase(linkUserToTelegram.fulfilled, (state, action) => {
                state.loading.linkUser = false;
                state.lastLinkResult = action.payload;
            })
            .addCase(linkUserToTelegram.rejected, (state, action) => {
                state.loading.linkUser = false;
                state.errors.linkUser = action.payload ?? "خطأ غير معروف";
            });

        // ── getTelegramLinkingStatus ──────────────────────────────────────────
        builder
            .addCase(getTelegramLinkingStatus.pending, (state) => {
                state.loading.linkingStatus = true;
                state.errors.linkingStatus = null;
            })
            .addCase(getTelegramLinkingStatus.fulfilled, (state, action) => {
                state.loading.linkingStatus = false;
                state.linkingStatus = action.payload;
            })
            .addCase(getTelegramLinkingStatus.rejected, (state, action) => {
                state.loading.linkingStatus = false;
                state.errors.linkingStatus = action.payload ?? "خطأ غير معروف";
            });
    },
});

export const { clearTelegramErrors, clearLastResults } = telegramSlice.actions;
export default telegramSlice.reducer;