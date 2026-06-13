import { useAppSelector, useAppDispatch } from "../../../hooks/storeHooks"; // مسار الـ Hooks الموحد بمشروعك
import {
    createPurchaseInvoice,
    getAllPurchasesInvoices,
    getPurchaseInvoiceById,
    updatePurchaseInvoiceThunk,
    deletePurchaseInvoice
} from "../store/thunkPurchases";
import {
    selectAllPurchases,
    selectSelectedPurchase,
    selectPurchasesLoading,
    selectPurchasesError,
    selectTotalPurchasesCount,
    selectTotalPurchasesAmount
} from "../store/purchaseSelectors";
import { clearSelectedPurchase, clearPurchaseErrors } from "../store/PurchasesSlice";
import type { PurchaseFormData } from "../../../types/puchase";

export const usePurchases = () => {
    const dispatch = useAppDispatch();

    // ─── 1. قراءة بيانات حالة المشتريات من Redux Store ───────────────────
    const purchases = useAppSelector(selectAllPurchases);
    const selectedPurchase = useAppSelector(selectSelectedPurchase);
    const loading = useAppSelector(selectPurchasesLoading);
    const error = useAppSelector(selectPurchasesError);

    // ─── 2. قراءة بيانات حالة الموردين من Redux Store ─────────────────────
    // ─── 3. الإحصائيات والحسابات التجميعية الفورية ────────────────────────
    const totalPurchasesCount = useAppSelector(selectTotalPurchasesCount);
    const totalPurchasesAmount = useAppSelector(selectTotalPurchasesAmount);

    // ─── 4. العمليات البرمجية وطلبات الـ API (Actions) ────────────────────

    // جلب جميع فواتير المشتريات من السيرفر
    const fetchAllPurchases = () => {
        return dispatch(getAllPurchasesInvoices());
    };

    // جلب تفاصيل فاتورة مشتريات محددة بالـ ID
    const fetchPurchaseById = (id: string) => {
        return dispatch(getPurchaseInvoiceById(id));
    };

    // إنشاء فاتورة مشتريات جديدة وزيادة المخزن تلقائياً
    const createPurchase = (purchaseData: PurchaseFormData) => {
        return dispatch(createPurchaseInvoice(purchaseData));
    };

    // تحديث فاتورة مشتريات موجودة مع معالجة الفروقات المخزنية
    const updatePurchase = (id: string, purchaseData: PurchaseFormData) => {
        return dispatch(updatePurchaseInvoiceThunk({ purchaseId: id, purchaseData }));
    };

    // حذف فاتورة مشتريات وخصم كمياتها من جرد المستودع
    const removePurchase = (id: string) => {
        return dispatch(deletePurchaseInvoice(id));
    };

    // تنظيف المشتريات المختارة وحذف الأخطاء العالقة
    const clearSelectedAndErrors = () => {
        dispatch(clearSelectedPurchase());
        dispatch(clearPurchaseErrors());
    };

    // ─── 5. دوال البحث المباشر السريعة المعتمدة على الـ Selectors ───────────

    // البحث المحلي عن فاتورة بواسطة معرّفها الـ ID
    const getPurchaseFromStoreById = (id: string) => {
        return purchases.find((purchase) => purchase.id === id) || null;
    };

    // البحث المحلي عن فاتورة بواسطة رقم الفاتورة المميز المسجل بالسيرفر
    const getPurchaseFromStoreByInvoiceNumber = (invoiceNumber: string) => {
        return purchases.find((purchase) => purchase.purchaseInvoiceNumber === invoiceNumber) || null;
    };

    // تصفية الفواتير محلياً بناءً على اسم المورد المباشر
    const getPurchasesBySupplier = (supplierName: string) => {
        return purchases.filter((purchase) => purchase.supplierName === supplierName);
    };

    // تصفية الفواتير محلياً بناءً على نطاق تاريخ محدد (لصفحة التقارير والمحاسبة)
    const getPurchasesByDateFilter = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return purchases.filter((purchase) => {
            const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
            return purchaseDate >= start && purchaseDate <= end;
        });
    };

    return {
        // حالات المشتريات
        purchases,
        selectedPurchase,
        loading,
        error,

        // الإحصائيات التجميعية
        totalPurchasesCount,
        totalPurchasesAmount,

        // دوال العمليات (CRUD)
        fetchAllPurchases,
        fetchPurchaseById,
        createPurchase,
        updatePurchase,
        removePurchase,
        clearSelectedAndErrors,

        // دوال الفلترة والبحث الفوري المتقدمة
        getPurchaseFromStoreById,
        getPurchaseFromStoreByInvoiceNumber,
        getPurchasesBySupplier,
        getPurchasesByDateFilter
    };
};