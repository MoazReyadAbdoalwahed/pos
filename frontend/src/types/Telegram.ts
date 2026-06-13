// types/Telegram.ts

// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────

export interface TelegramBaseResponse {
    success: boolean;
    error?: string;
    warning?: boolean; // true when the operation failed softly (e.g. user not linked)
}

export interface SentTo {
    chatId: string;
    name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Send Invoice  →  POST /telegram/send-invoice
// ─────────────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
    name: string;
    quantity: number;
    salePrice?: number;
    price?: number;
}

export interface InvoiceDetails {
    invoiceNumber?: string;
    items?: InvoiceItem[];
    totalAmount?: number;
    paidAmount?: number;
    remainingAmount?: number;
}

export interface SendInvoiceRequest {
    phone?: string;       // resolve user by phone number
    chatId?: string;      // or send directly by chatId
    invoiceDetails: InvoiceDetails;
}

export interface SendInvoiceResponse extends TelegramBaseResponse {
    message?: string;
    sentTo?: SentTo;
    needsLink?: boolean;  // true when user hasn't linked Telegram yet
}

// ─────────────────────────────────────────────────────────────────────────────
// Send Return Alert  →  POST /telegram/send-return-alert
// ─────────────────────────────────────────────────────────────────────────────

export interface ReturnItem {
    name: string;
    quantity: number;
}

export interface ReturnRequest {
    _id: string;
    invoiceNumber?: string;
    cashierName?: string;
    returnItems?: ReturnItem[];
    totalRefundAmount?: number;
    reason?: string;
}

export interface SendReturnAlertRequest {
    managerChatId: string;
    returnRequest: ReturnRequest;
}

export interface SendReturnAlertResponse extends TelegramBaseResponse {
    message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Send Return Status Update  →  POST /telegram/send-status-update
// ─────────────────────────────────────────────────────────────────────────────

export type ReturnStatus = "approved" | "rejected" | "pending";

export interface ReturnDetails {
    invoiceNumber?: string;
    status?: ReturnStatus;
    totalRefundAmount?: number;
    approverName?: string;
    rejectionReason?: string;
}

export interface SendReturnStatusRequest {
    cashierChatId: string;
    returnDetails: ReturnDetails;
}

export interface SendReturnStatusResponse extends TelegramBaseResponse {
    message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Send Daily Report  →  POST /telegram/send-daily-report
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyStats {
    totalSalesToday?: number;
    totalRevenue?: number;
    totalNetProfit?: number;
    avgTransactionValue?: number;
}

export interface SendDailyReportRequest {
    managerPhone?: string;
    managerChatId?: string;
    dailyStats: DailyStats;
}

export interface SendDailyReportResponse extends TelegramBaseResponse {
    message?: string;
    sentTo?: SentTo;
}

// ─────────────────────────────────────────────────────────────────────────────
// Trigger Daily Report  →  POST /telegram/trigger-daily-report
// ─────────────────────────────────────────────────────────────────────────────

export interface TriggerDailyReportRequest {
    dailyStats: DailyStats;
}

export interface TriggerDailyReportResponse extends TelegramBaseResponse {
    result?: { ok: boolean };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Broadcast  →  POST /telegram/broadcast
// ─────────────────────────────────────────────────────────────────────────────

export interface FailedSubscriber {
    chatId: string;
    name: string;
    error: string;
}

export interface BroadcastResults {
    total: number;
    sent: number;
    failed: number;
    imageUrl?: string;
    failedSubscribers: FailedSubscriber[];
}

export interface SendBroadcastRequest {
    message: string;
    image?: File; // multipart/form-data — attach via FormData
}

export interface SendBroadcastResponse extends TelegramBaseResponse {
    message?: string;
    results?: BroadcastResults;
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Image  →  POST /telegram/upload-image
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadImageResponse extends TelegramBaseResponse {
    message?: string;
    imageUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Link User to Telegram  →  POST /telegram/link-user
// ─────────────────────────────────────────────────────────────────────────────

export interface LinkUserRequest {
    userId: string;
    telegramChatId: string;
}

export interface LinkUserResponse extends TelegramBaseResponse {
    message?: string;
    user?: {
        _id: string;
        name: string;
        telegramChatId: string;
        telegramLinkedAt: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Telegram Linking Status  →  GET /telegram/link-status
// ─────────────────────────────────────────────────────────────────────────────

export interface TelegramLinkingStatus {
    success: boolean;
    total: number;
    linked: number;
    unlinked: number;
}