// ─── 1. واجهة الصنف الداخلي داخل الفاتورة ─────────────────────────────────────
export interface SaleItem {
    productId: string;
    name: string;
    quantity: number;
    salesPrice: number;        // تم التعديل من price لتطابق السيرفر
    wholesalePrice: number;
    totalItemPrice: number;
    priceType: 'sale' | 'wholesale' | 'custom'; // الأنواع المدعومة في منطق السيرفر
}

// ─── 2. واجهة الفاتورة الشاملة (مبيعات أو مرتجع) ──────────────────────────────
export interface Sale {
    id: string;
    _id: string;
    invoiceNumber: string;            // رقم الفاتورة المميز المسجل بالسيرفر
    originalInvoiceNumber?: string;   // مخصص لفواتير المرتجع لربطها بالأصل
    items: SaleItem[];                // تم التعديل من products إلى items لتطابق الـ Schema
    totalAmount: number;              // إجمالي قيمة الفاتورة
    totalCost: number;                // إجمالي التكلفة بناءً على سعر الشراء
    netProfit: number;                // صافي الربح المحمي محاسبياً
    paymentMethod: 'cash' | 'card' | string;
    invoiceType: 'sales' | 'return';  // نوع الفاتورة المسجل بالسيرفر
    cashierId: string | null;         // معرف الكاشير المسؤول
    cashierName: string | null;       // اسم الكاشير المسؤول
    createdAt: string;
    updatedAt: string;
}

// ─── 3. واجهة البيانات المرسلة لإنشاء فاتورة مبيعات جديدة ────────────────────────
export interface SaleFormData {
    items: {
        productId: string;
        quantity: number;
        customPrice?: number;         // اختياري في حال البيع بسعر يدوي حُر
        priceType?: 'sale' | 'wholesale' | 'custom'; // تحديد نوع السعر للصنف
    }[];
    paymentMethod: 'cash' | 'card' | string;
    cashierId?: string;
    cashierName?: string;             // اسم الموظف الذي قام ببيع المنتج
}

// ─── 4. واجهة البيانات المرسلة لعمل مرتجع ──────────────────────────────────────
export interface ReturnSaleFormData {
    originalInvoiceNumber: string;    // رقم الفاتورة المراد إرجاعها أو DIRECT-RETURN للمرتجعات الحرة
    returnType?: 'direct' | 'linked';
    itemsToReturn: {
        productId: string;
        quantity: number;
        activePrice?: number;
        priceType?: 'sale' | 'wholesale' | 'custom';
    }[];
    cashierId?: string;
    cashierName?: string;             // اسم الموظف الذي قام بتسجيل المرتجع
}

// ─── 5. حالة المبيعات داخل متجر الـ Redux State ────────────────────────────────
export interface SaleState {
    sales: Sale[];
    selectedSale: Sale | null;
    loading: boolean;
    error: string | null;
}