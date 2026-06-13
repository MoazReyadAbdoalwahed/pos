import type { RootState } from "../../../store/store";
import type { ReturnStatus } from "../../../types/ApprovalReturn";

// ─── 1. محددات الطلبات المعلقة (Pending Returns) ─────────────────────────────

// جلب جميع طلبات المرتجع المعلقة بانتظار موافقة الأدمن
export const selectPendingReturns = (state: RootState) => state.approval.pendingReturns;

// حساب عدد الطلبات المعلقة (مفيد لعرض Badge التنبيه في الـ Navbar)
export const selectPendingReturnsCount = (state: RootState) =>
    state.approval.pendingReturns.length;

// البحث عن طلب معلق محدد بواسطة الـ ID
export const selectPendingReturnById = (state: RootState, returnId: string) =>
    state.approval.pendingReturns.find(
        (r) => r._id?.toString() === returnId
    ) || null;

// ─── 2. محددات سجل المرتجعات (Return History) ────────────────────────────────

// جلب كامل سجل المرتجعات (المقبولة والمرفوضة)
export const selectReturnHistory = (state: RootState) => state.approval.returnHistory;

// حساب إجمالي عدد المرتجعات المسجلة في السجل
export const selectReturnHistoryCount = (state: RootState) =>
    state.approval.returnHistory.length;

// تصفية السجل بناءً على حالة الطلب (approved / rejected)
export const selectReturnHistoryByStatus = (state: RootState, status: ReturnStatus) =>
    state.approval.returnHistory.filter((r) => r.status === status);

// البحث في السجل عن طلب محدد بواسطة الـ ID
export const selectReturnHistoryById = (state: RootState, returnId: string) =>
    state.approval.returnHistory.find(
        (r) => r._id?.toString() === returnId
    ) || null;

// ─── 3. محددات الفاتورة والطلب المختار حالياً ────────────────────────────────

// جلب الفاتورة الأصلية المحددة لبناء نموذج طلب المرتجع
export const selectSelectedInvoice = (state: RootState) => state.approval.selectedInvoice;

// جلب طلب المرتجع المحدد لعرض تفاصيله
export const selectSelectedReturn = (state: RootState) => state.approval.selectedReturn;

// ─── 4. محددات حالة التحميل والأخطاء ────────────────────────────────────────

// جلب حالة التحميل لأي عملية في الـ Slice
export const selectApprovalLoading = (state: RootState) => state.approval.loading;

// جلب آخر خطأ من السيرفر أو الـ Thunk
export const selectApprovalError = (state: RootState) => state.approval.error;

// ─── 5. الحسابات المالية والإحصائية (Aggregates) ─────────────────────────────

// حساب إجمالي المبالغ المستردة من المرتجعات المقبولة فقط
export const selectTotalApprovedRefundAmount = (state: RootState) =>
    state.approval.returnHistory
        .filter((r) => r.status === "approved")
        .reduce((total, r) => total + (r.totalRefundAmount || 0), 0);

// تصفية سجل المرتجعات بناءً على نطاق تاريخ محدد (لصفحة التقارير)
export const selectReturnHistoryByDateRange = (
    state: RootState,
    startDate: string,
    endDate: string
) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return state.approval.returnHistory.filter((r) => {
        const returnDate = new Date(r.approvalDate || r.createdAt || "");
        return returnDate >= start && returnDate <= end;
    });
};

// تصفية المرتجعات بناءً على معرّف الكاشير الذي أنشأ الطلب
export const selectReturnsByKashier = (state: RootState, cashierId: string) =>
    state.approval.returnHistory.filter(
        (r) =>
            (typeof r.cashierId === "string"
                ? r.cashierId
                : r.cashierId?._id?.toString()) === cashierId
    );