import { createSlice } from "@reduxjs/toolkit";
import type { IReturnRequest, IInvoice } from "../../../types/ApprovalReturn";
import {
    fetchInvoiceForReturn,
    createReturnRequest,
    fetchPendingReturns,
    fetchReturnHistory,
    approveReturnRequest,
    rejectReturnRequest,
} from "./thunkApprovalReturn";

// ════════════════════════════════════════════════════════════════════════
// 📐 Shape of the approval slice state
// ════════════════════════════════════════════════════════════════════════
interface ApprovalState {
    pendingReturns: IReturnRequest[];       // الطلبات المعلقة بانتظار موافقة الأدمن
    returnHistory: IReturnRequest[];        // السجل الكامل (مقبولة + مرفوضة)
    selectedInvoice: IInvoice | null;       // الفاتورة الأصلية المحددة عند إنشاء المرتجع
    selectedReturn: IReturnRequest | null;  // طلب المرتجع المحدد للعرض التفصيلي
    loading: boolean;
    error: string | null;
}

const initialState: ApprovalState = {
    pendingReturns: [],
    returnHistory: [],
    selectedInvoice: null,
    selectedReturn: null,
    loading: false,
    error: null,
};

const approvalSlice = createSlice({
    name: "approval",
    initialState,
    reducers: {
        // تنظيف الفاتورة المختارة بعد إغلاق نموذج المرتجع
        clearSelectedInvoice(state) {
            state.selectedInvoice = null;
        },
        // تنظيف طلب المرتجع المختار بعد إغلاق نافذة التفاصيل
        clearSelectedReturn(state) {
            state.selectedReturn = null;
        },
        // حذف الأخطاء العالقة من الـ State
        clearApprovalErrors(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ── Fetch Invoice For Return ─────────────────────────────────────
            .addCase(fetchInvoiceForReturn.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInvoiceForReturn.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedInvoice = action.payload;
            })
            .addCase(fetchInvoiceForReturn.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Create Return Request ────────────────────────────────────────
            .addCase(createReturnRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createReturnRequest.fulfilled, (state, action) => {
                state.loading = false;
                // إضافة الطلب الجديد لقائمة المعلقة فوراً دون إعادة جلب من السيرفر
                state.pendingReturns.unshift(action.payload);
            })
            .addCase(createReturnRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Fetch Pending Returns ────────────────────────────────────────
            .addCase(fetchPendingReturns.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPendingReturns.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingReturns = action.payload;
            })
            .addCase(fetchPendingReturns.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Fetch Return History ─────────────────────────────────────────
            .addCase(fetchReturnHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReturnHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.returnHistory = action.payload;
            })
            .addCase(fetchReturnHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Approve Return Request ───────────────────────────────────────
            .addCase(approveReturnRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveReturnRequest.fulfilled, (state, action) => {
                state.loading = false;
                const { returnRequest } = action.payload;
                // إزالة الطلب من قائمة المعلقة بعد الموافقة
                state.pendingReturns = state.pendingReturns.filter(
                    (r) => r._id?.toString() !== returnRequest._id?.toString()
                );
                // تحديث السجل إن كان الطلب موجوداً فيه، وإلا إضافته
                const historyIndex = state.returnHistory.findIndex(
                    (r) => r._id?.toString() === returnRequest._id?.toString()
                );
                if (historyIndex !== -1) {
                    state.returnHistory[historyIndex] = returnRequest;
                } else {
                    state.returnHistory.unshift(returnRequest);
                }
                // مزامنة الطلب المختار إن كان هو المعتمد
                if (state.selectedReturn?._id?.toString() === returnRequest._id?.toString()) {
                    state.selectedReturn = returnRequest;
                }
            })
            .addCase(approveReturnRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Reject Return Request ────────────────────────────────────────
            .addCase(rejectReturnRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectReturnRequest.fulfilled, (state, action) => {
                state.loading = false;
                const rejectedReturn = action.payload;
                // إزالة الطلب من قائمة المعلقة بعد الرفض
                state.pendingReturns = state.pendingReturns.filter(
                    (r) => r._id?.toString() !== rejectedReturn._id?.toString()
                );
                // تحديث السجل إن كان موجوداً، وإلا إضافته
                const historyIndex = state.returnHistory.findIndex(
                    (r) => r._id?.toString() === rejectedReturn._id?.toString()
                );
                if (historyIndex !== -1) {
                    state.returnHistory[historyIndex] = rejectedReturn;
                } else {
                    state.returnHistory.unshift(rejectedReturn);
                }
                // مزامنة الطلب المختار إن كان هو المرفوض
                if (state.selectedReturn?._id?.toString() === rejectedReturn._id?.toString()) {
                    state.selectedReturn = rejectedReturn;
                }
            })
            .addCase(rejectReturnRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    clearSelectedInvoice,
    clearSelectedReturn,
    clearApprovalErrors,
} = approvalSlice.actions;

export default approvalSlice.reducer;