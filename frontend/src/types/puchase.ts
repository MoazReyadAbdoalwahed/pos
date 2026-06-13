// ─── 1. واجهة الصنف الداخلي المشتري داخل الفاتورة ─────────────────────────────
export interface PurchaseItem {
    productId: string;                    // معرف المنتج (MongoDB ObjectId)
    name: string;                         // اسم المنتج
    barcode?: string;                     // كود الباركود إن وُجد
    quantity: number;                     // الكمية المشتراة
    puchasePrice: number;                 // ⚠️ تطابق الخطأ الإملائي بالسيرفر (puchasePrice) لضمان عدم خروج الحسابات بصفر
    suggestedSalePrice?: number;          // سعر البيع المقترح لتحديث الداتابيز تلقائياً
    suggestedWholesalePrice?: number;     // سعر الجملة المقترح لتحديث الداتابيز تلقائياً
    totalItemCost?: number;               // الحساب الفرعي للصنف
}

// ─── 2. واجهة فاتورة المشتريات الشاملة المرتجعة من السيرفر ─────────────────────
export interface Purchase {
    id: string;
    _id: string;
    purchaseInvoiceNumber: string;         // رقم الفاتورة المميز (تطابق السيرفر)
    supplierName: string;                 // اسم المورد المباشر (تطابق السيرفر)
    purchaseDate: string;                 // تاريخ الفاتورة
    items: PurchaseItem[];                // مصفوفة الأصناف الواردة
    totalAmount: number;                  // الإجمالي الكلي المالي للفاتورة
    createdAt: string;
    updatedAt: string;
}

// ─── 3. واجهة البيانات المرسلة من النموذج لإنشاء فاتورة جديدة ───────────────────
export interface PurchaseFormData {
    purchaseInvoiceNumber: string;         // رقم فاتورة المشتريات
    supplierName: string;                 // اسم المورد المسجل
    purchaseDate: string;                 // تاريخ الشراء أو الاستلام (YYYY-MM-DD)
    items: {
        productId?: string;
        sku?: string;
        name: string;
        barcode?: string;
        quantity: number;
        puchasePrice: number;             // سعر الشراء بالقطعة للفاتورة
        suggestedSalePrice?: number;      // اختياري: لتحديث سعر البيع بالمخزن فوراً
        suggestedWholesalePrice?: number; // اختياري: لتحديث سعر الجملة بالمخزن فوراً
    }[];
}

// ─── 4. حالة المشتريات داخل متجر الـ Redux State ──────────────────────────────
export interface PurchaseState {
    purchases: Purchase[];
    selectedPurchase: Purchase | null;
    loading: boolean;
    error: string | null;
}

// ─── 5. واجهات الموردين المستقلة ──────────────────────────────────────────────
export interface Supplier {
    id: string;
    _id: string;
    name: string;
    contactInfo: string;
    createdAt: string;
    updatedAt: string;
}

export interface SupplierFormData {
    name: string;
    contactInfo: string;
}

export interface SupplierState {
    suppliers: Supplier[];
    selectedSupplier: Supplier | null;
    loading: boolean;
    error: string | null;
}