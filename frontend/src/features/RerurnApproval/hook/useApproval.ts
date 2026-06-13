import { useAppSelector, useAppDispatch } from "../../../hooks/storeHooks";
import {
    fetchInvoiceForReturn,
    createReturnRequest,
    fetchPendingReturns,
    fetchReturnHistory,
    approveReturnRequest,
    rejectReturnRequest,
} from "../store/thunkApprovalReturn";
import {
    selectPendingReturns,
    selectPendingReturnsCount,
    selectReturnHistory,
    selectReturnHistoryCount,
    selectSelectedInvoice,
    selectSelectedReturn,
    selectApprovalLoading,
    selectApprovalError,
    selectTotalApprovedRefundAmount,
} from "../store/ApprovalSelectors";
import {
    clearSelectedInvoice,
    clearSelectedReturn,
    clearApprovalErrors,
} from "../store/ApprovalSlice";
import type {
    CreateReturnRequestBody,
    ApproveReturnBody,
    RejectReturnBody,
    ReturnStatus,
} from "../../../types/ApprovalReturn";

export const useApproval = () => {
    const dispatch = useAppDispatch();

    // ─── 1. قراءة بيانات حالة المرتجعات من Redux Store ──────────────────
    const pendingReturns = useAppSelector(selectPendingReturns);
    const pendingReturnsCount = useAppSelector(selectPendingReturnsCount);
    const returnHistory = useAppSelector(selectReturnHistory);
    const returnHistoryCount = useAppSelector(selectReturnHistoryCount);
    const selectedInvoice = useAppSelector(selectSelectedInvoice);
    const selectedReturn = useAppSelector(selectSelectedReturn);
    const loading = useAppSelector(selectApprovalLoading);
    const error = useAppSelector(selectApprovalError);

    // ─── 2. الإحصائيات والحسابات التجميعية الفورية ────────────────────────
    const totalApprovedRefundAmount = useAppSelector(selectTotalApprovedRefundAmount);

    // ─── 3. العمليات البرمجية وطلبات الـ API (Actions) ────────────────────

    // جلب تفاصيل الفاتورة الأصلية قبل بناء نموذج طلب المرتجع
    const fetchInvoice = (invoiceId: string) => {
        return dispatch(fetchInvoiceForReturn(invoiceId));
    };

    // إنشاء طلب مرتجع جديد من الكاشير (يُرسل للأدمن للموافقة)
    const submitReturnRequest = (returnData: CreateReturnRequestBody) => {
        return dispatch(createReturnRequest(returnData));
    };

    // جلب جميع الطلبات المعلقة (للأدمن فقط)
    const fetchPending = () => {
        return dispatch(fetchPendingReturns());
    };

    // جلب كامل سجل المرتجعات (المقبولة والمرفوضة)
    const fetchHistory = () => {
        return dispatch(fetchReturnHistory());
    };

    // موافقة الأدمن على طلب مرتجع مع تعديل المخزن وإصدار الفاتورة المحاسبية
    const approveReturn = (id: string, approvalBody?: ApproveReturnBody) => {
        return dispatch(approveReturnRequest({ id, ...approvalBody }));
    };

    // رفض طلب المرتجع وإغلاق الملف دون أي تعديل مالي
    const rejectReturn = (id: string, rejectBody?: RejectReturnBody) => {
        return dispatch(rejectReturnRequest({ id, ...rejectBody }));
    };

    // تنظيف الحالة وحذف الأخطاء العالقة
    const clearAll = () => {
        dispatch(clearSelectedInvoice());
        dispatch(clearSelectedReturn());
        dispatch(clearApprovalErrors());
    };

    // ─── 4. دوال البحث المباشر السريعة المعتمدة على الـ Selectors ───────────

    // تصفية سجل المرتجعات محلياً بناءً على الحالة
    const getReturnsByStatus = (status: ReturnStatus) =>
        returnHistory.filter((r) => r.status === status);

    // البحث المحلي في الطلبات المعلقة بواسطة الـ ID
    const getPendingReturnById = (id: string) =>
        pendingReturns.find((r) => r._id?.toString() === id) || null;

    // البحث المحلي في سجل المرتجعات بواسطة الـ ID
    const getHistoryReturnById = (id: string) =>
        returnHistory.find((r) => r._id?.toString() === id) || null;

    // تصفية المرتجعات محلياً بناءً على نطاق تاريخ محدد (لصفحة التقارير)
    const getReturnsByDateFilter = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return returnHistory.filter((r) => {
            const returnDate = new Date(r.approvalDate || r.createdAt || "");
            return returnDate >= start && returnDate <= end;
        });
    };

    return {
        // حالات المرتجعات
        pendingReturns,
        pendingReturnsCount,
        returnHistory,
        returnHistoryCount,
        selectedInvoice,
        selectedReturn,
        loading,
        error,

        // الإحصائيات التجميعية
        totalApprovedRefundAmount,

        // دوال العمليات (CRUD + Approval)
        fetchInvoice,
        submitReturnRequest,
        fetchPending,
        fetchHistory,
        approveReturn,
        rejectReturn,
        clearAll,

        // دوال الفلترة والبحث الفوري المتقدمة
        getReturnsByStatus,
        getPendingReturnById,
        getHistoryReturnById,
        getReturnsByDateFilter,
    };
};