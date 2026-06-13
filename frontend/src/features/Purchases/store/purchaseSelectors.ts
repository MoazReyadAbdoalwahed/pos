import type { RootState } from "../../../store/store";

// ─── 1. محددات حالة المشتريات (Purchase Selectors) ───────────────────────────

// جلب جميع فواتير المشتريات
export const selectAllPurchases = (state: RootState) => state.purchases.purchases;

// جلب الفاتورة المختارة حالياً للتفاصيل
export const selectSelectedPurchase = (state: RootState) => state.purchases.selectedPurchase;

// جلب حالة التحميل للمشتريات
export const selectPurchasesLoading = (state: RootState) => state.purchases.loading;

// جلب أخطاء المشتريات من السيرفر
export const selectPurchasesError = (state: RootState) => state.purchases.error;

// البحث عن فاتورة مشتريات محددة بواسطة الـ ID
export const selectPurchaseById = (state: RootState, purchaseId: string) => {
    return state.purchases.purchases.find(p => p.id === purchaseId) || null;
};

// البحث عن فواتير مشتريات بواسطة رقم الفاتورة المميز (purchaseInvoiceNumber)
export const selectPurchaseByInvoiceNumber = (state: RootState, invoiceNumber: string) => {
    return state.purchases.purchases.find(p => p.purchaseInvoiceNumber === invoiceNumber) || null;
};

// تصفية فواتير المشتريات بناءً على اسم المورد
export const selectPurchasesBySupplierName = (state: RootState, supplierName: string) => {
    return state.purchases.purchases.filter(p => p.supplierName === supplierName);
};

// ─── 2. الحسابات المالية والإحصائية للمشتريات (Aggregates) ───────────────────

// حساب إجمالي عدد فواتير المشتريات المسجلة
export const selectTotalPurchasesCount = (state: RootState) => state.purchases.purchases.length;

// حساب إجمالي المبالغ المالية المصروفة في فواتير المشتريات بالكامل (راس المال المستثمر في البضاعة)
export const selectTotalPurchasesAmount = (state: RootState) => {
    return state.purchases.purchases.reduce((total, purchase) => total + (purchase.totalAmount || 0), 0);
};

// تصفية المشتريات بناءً على نطاق تاريخ محدد (مفيد جداً في صفحة التقارير)
export const selectPurchasesByDateRange = (state: RootState, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ضبط التوقيت لضمان شمول اليوم بالكامل
    end.setHours(23, 59, 59, 999);

    return state.purchases.purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
        return purchaseDate >= start && purchaseDate <= end;
    });
};

