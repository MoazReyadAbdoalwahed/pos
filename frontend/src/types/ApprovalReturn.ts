import { Types } from "mongoose";

// ════════════════════════════════════════════════════════════════════════
// 🧾 Enums
// ════════════════════════════════════════════════════════════════════════

export type ReturnStatus = "pending" | "approved" | "rejected";
export type PriceType = "sale" | "wholesale" | "custom";
export type InvoiceType = "sale" | "return";

// ════════════════════════════════════════════════════════════════════════
// 📦 Return Request Item
// ════════════════════════════════════════════════════════════════════════

export interface ReturnItem {
    productId: string | Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    wholesalePrice: number;
    totalItemPrice: number;
    priceType: PriceType;
}

// ════════════════════════════════════════════════════════════════════════
// 📋 Return Request (DB Document)
// ════════════════════════════════════════════════════════════════════════

export interface IReturnRequest {
    _id: Types.ObjectId;
    invoiceId: Types.ObjectId | IInvoice;
    items: ReturnItem[];
    totalRefundAmount: number;
    reason: string;
    cashierId: Types.ObjectId | IUser;
    approverUserId?: Types.ObjectId | IUser | null;
    status: ReturnStatus;
    approvalDate?: Date;
    approvalNotes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// ════════════════════════════════════════════════════════════════════════
// 🧾 Invoice / Sale
// ════════════════════════════════════════════════════════════════════════

export interface InvoiceItem {
    productId: string | Types.ObjectId;
    name: string;
    quantity: number;
    salesPrice?: number;
    salePrice?: number;
    wholesalePrice?: number;
    totalItemPrice: number;
    priceType: PriceType;
}

export interface IInvoice {
    _id: Types.ObjectId;
    invoiceNumber: string;
    originalInvoiceNumber?: string;
    items: InvoiceItem[];
    totalAmount: number;
    totalCost?: number;
    netProfit?: number;
    invoiceType: InvoiceType;
    createdAt?: Date;
    updatedAt?: Date;
}

// ════════════════════════════════════════════════════════════════════════
// 👤 User
// ════════════════════════════════════════════════════════════════════════

export interface IUser {
    _id: Types.ObjectId;
    userId?: string;
    id?: string;
    name?: string;
    username?: string;
    role?: string;
}

// ════════════════════════════════════════════════════════════════════════
// 📦 Product
// ════════════════════════════════════════════════════════════════════════

export interface IProduct {
    _id: Types.ObjectId;
    name: string;
    stock: number;
    purchasePrice?: number;
    wholesalePrice?: number;
    salePrice?: number;
}

// ════════════════════════════════════════════════════════════════════════
// 📨 Request Bodies
// ════════════════════════════════════════════════════════════════════════

export interface CreateReturnRequestBody {
    invoiceId: string;
    items: ReturnItem[];
    totalRefundAmount: number;
    reason: string;
}

export interface ApproveReturnBody {
    approvalNotes?: string;
}

export interface RejectReturnBody {
    rejectionReason?: string;
}

// ════════════════════════════════════════════════════════════════════════
// 📤 API Responses
// ════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
    message: string;
    data?: T;
    error?: string;
}

export interface InvoiceDetailsResponse extends ApiResponse<IInvoice> { }

export interface ReturnRequestResponse extends ApiResponse<IReturnRequest> {
    returnRequest?: IReturnRequest;
    invoice?: IInvoice;
}

export interface PendingReturnsResponse extends ApiResponse<IReturnRequest[]> { }

export interface ReturnHistoryResponse extends ApiResponse<IReturnRequest[]> { }

// ════════════════════════════════════════════════════════════════════════
// 🤖 Telegram Types
// ════════════════════════════════════════════════════════════════════════

export interface TelegramUser {
    id: number;
    first_name: string;
    username?: string;
}

export interface TelegramChat {
    id: number;
    type: "private" | "group" | "supergroup" | "channel";
}

export interface TelegramMessage {
    message_id: number;
    chat: TelegramChat;
    from?: TelegramUser;
    text?: string;
    date: number;
}

export interface TelegramCallbackQuery {
    id: string;
    from: TelegramUser;
    message: TelegramMessage;
    data: string;
}

// ════════════════════════════════════════════════════════════════════════
// ⚙️ Internal Logic Result (shared between HTTP & Telegram handlers)
// ════════════════════════════════════════════════════════════════════════

export interface ProcessApproveResult {
    success: boolean;
    status?: number;
    message?: string;
    returnRequest?: IReturnRequest;
    invoice?: IInvoice;
}

export interface ProcessRejectResult {
    success: boolean;
    status?: number;
    message?: string;
    returnRequest?: IReturnRequest;
}