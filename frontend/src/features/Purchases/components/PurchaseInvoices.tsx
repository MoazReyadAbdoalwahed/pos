import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch, type Resolver, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../../hooks/use-toast";
import { useProducts } from "../../products/hook/useProducts";
import type { Product } from "../../../types/product";

// استيراد أيقونات Lucide
import {
    FileText, Plus, Calendar, Building, Receipt,
    Trash2, Loader2, Search, X, Tag, Hash, DollarSign,
    Barcode
} from "lucide-react";

// استيراد المكونات المحلية المرفقة من مشروعك بالمسارات الصحيحة
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Input } from "../../../components/ui/Input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/Dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import FormInput from "../../../components/ui/form/FormInput";
import Button from "../../../components/ui/Button";

// استيراد الريدوكس والـ Hook المخصص للمشتريات
import { usePurchases } from "../hook/usePurchases";
import type { Purchase, PurchaseFormData } from "../../../types/puchase";

// ─── 1. Schema Validation (Zod) ───────────────────────────────────────────────
const PurchaseItemSchema = z.object({
    productId: z.string().min(1, "يجب تحديد المنتج"),
    name: z.string().min(2, "اسم المنتج مطلوب"),
    barcode: z.string().optional(),
    quantity: z.coerce.number().int("الكمية يجب أن تكون عددًا صحيحًا").min(1, "الكمية يجب أن تكون 1 على الأقل"),
    puchasePrice: z.coerce.number().int("يجب أن يكون السعر عددًا صحيحًا").min(0, "سعر الشراء مطلوب"), // يطابق السيرفر إملائياً
    suggestedSalePrice: z.coerce.number().int("يجب أن يكون السعر عددًا صحيحًا").min(0).default(0),
    suggestedWholesalePrice: z.coerce.number().int("يجب أن يكون السعر عددًا صحيحًا").min(0).default(0)
});

const PurchaseInvoiceSchema = z.object({
    purchaseInvoiceNumber: z.string().min(2, "رقم الفاتورة مطلوب"),
    supplierName: z.string().min(2, "اسم الشركة الموردة مطلوب"),
    purchaseDate: z.string().min(10, "التاريخ مطلوب"),
    items: z.array(PurchaseItemSchema).min(1, "يجب إضافة بند واحد على الأقل")
});

type PurchaseFormValues = z.infer<typeof PurchaseInvoiceSchema>;

// ─── 2. Main Component ────────────────────────────────────────────────────────
const PurchaseInvoices = () => {
    const { toast } = useToast();
    const showSuccess = (msg: string) => toast({ title: msg });
    const showError = (msg: string) => toast({ title: msg, variant: "destructive" });
    // استخدام الهوك المطور الموحد لإدارة المشتريات والموردين وحالات التحميل
    const {
        purchases: invoices,
        loading,
        error,
        fetchAllPurchases,
        createPurchase,
        updatePurchase,
        removePurchase,
        clearSelectedAndErrors
    } = usePurchases();

    const {
        selectedAllProduct: products,
        loading: productsLoading,
        fetchAll: fetchProducts,
    } = useProducts();

    // Local UI States
    const [selectedInvoice, setSelectedInvoice] = useState<Purchase | null>(null);
    const [productSearchQuery, setProductSearchQuery] = useState("");
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // تنسيق وعرض التواريخ البرمجية بالصيغة العربية المحلية
    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "غير محدد";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        } catch {
            return dateStr;
        }
    };

    // ─── 3. React Hook Form Setup ──────────────────────────────────────────────
    const {
        register,
        control,
        handleSubmit,
        reset,
        clearErrors,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<PurchaseFormValues>({
        mode: "onBlur",
        resolver: zodResolver(PurchaseInvoiceSchema) as Resolver<PurchaseFormValues>,
        defaultValues: {
            purchaseInvoiceNumber: "",
            supplierName: "",
            purchaseDate: new Date().toISOString().slice(0, 16),
            items: [{ productId: "temp-id", name: "", barcode: "", quantity: 1, puchasePrice: undefined, suggestedSalePrice: undefined, suggestedWholesalePrice: undefined }]
        }
    });

    // استخدام useFieldArray للتحكم بالصفوف الديناميكية وإضافة وحذف الأصناف باحترافية
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const watchedItems = useWatch({ control, name: "items", defaultValue: [] }) as PurchaseFormValues["items"];

    const resetFormToDefault = () => {
        reset({
            purchaseInvoiceNumber: "",
            supplierName: "",
            purchaseDate: new Date().toISOString().slice(0, 16),
            items: [{ productId: "temp-id", name: "", barcode: "", quantity: 1, puchasePrice: undefined, suggestedSalePrice: undefined, suggestedWholesalePrice: undefined }]
        });
        setProductSearchQuery("");
        setIsEditMode(false);
        setEditingInvoiceId(null);
    };

    const productSuggestions = useMemo(() => {
        const query = productSearchQuery.trim().toLowerCase();
        if (!query) return [];
        return products
            .filter((product) =>
                product.name.toLowerCase().includes(query) ||
                product.sku?.toLowerCase().includes(query)
            )
            .slice(0, 8);
    }, [products, productSearchQuery]);

    const handleAddProductRow = (product: Product) => {
        const existingIndex = watchedItems.findIndex((item) => item.productId === product.id);
        if (existingIndex !== -1) {
            const currentQuantity = Number(watchedItems[existingIndex].quantity) || 0;
            setValue(`items.${existingIndex}.quantity`, currentQuantity + 1);
            setValue(`items.${existingIndex}.puchasePrice`, Math.round(product.purchasePrice || 0));
            setValue(`items.${existingIndex}.name`, product.name);
            setValue(`items.${existingIndex}.barcode`, product.sku || "");
            setProductSearchQuery("");
            return;
        }

        append({
            productId: product.id,
            name: product.name,
            barcode: product.sku || "",
            quantity: 1,
            puchasePrice: Math.round(product.purchasePrice || 0),
            suggestedSalePrice: Math.round(product.salePrice || 0),
            suggestedWholesalePrice: Math.round(product.wholesalePrice || 0)
        });
        setProductSearchQuery("");
    };

    const openEditDialog = (invoice: Purchase) => {
        setIsEditMode(true);
        setEditingInvoiceId(invoice.id || invoice._id || null);
        reset({
            purchaseInvoiceNumber: invoice.purchaseInvoiceNumber || "",
            supplierName: invoice.supplierName || "",
            purchaseDate: invoice.purchaseDate ? new Date(invoice.purchaseDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            items: invoice.items.map((item) => ({
                productId: typeof item.productId === "string" ? item.productId : String(item.productId || "temp-id"),
                name: item.name || "",
                barcode: item.barcode || "",
                quantity: item.quantity || 1,
                puchasePrice: item.puchasePrice || 0,
                suggestedSalePrice: item.suggestedSalePrice || 0,
                suggestedWholesalePrice: item.suggestedWholesalePrice || 0
            }))
        });
        setIsAddDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsAddDialogOpen(false);
        setTimeout(() => {
            resetFormToDefault();
            clearErrors();
        }, 0);
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        try {
            const result = await removePurchase(invoiceId);
            if (result.meta.requestStatus === "fulfilled") {
                showSuccess("تم حذف فاتورة الشراء بنجاح");
            } else {
                showError((result.payload as string) || "فشل حذف فاتورة الشراء");
            }
        } catch (err) {
            showError("حدث خطأ أثناء حذف فاتورة الشراء");
            console.error(err);
        }
    };

    // جلب البيانات عند التحميل لأول مرة
    useEffect(() => {
        fetchAllPurchases();
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // تصفية وعرض الأخطاء المرتدة من خادم Redux
    useEffect(() => {
        if (error) {
            showError(error);
            clearSelectedAndErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    // منطق البحث والفلترة الديناميكي للفواتير المدخلة مسبقاً
    const filteredInvoices = invoices.filter((invoice) => {
        const query = searchQuery.toLowerCase().trim();
        return (
            invoice.purchaseInvoiceNumber.toLowerCase().includes(query) ||
            invoice.supplierName.toLowerCase().includes(query)
        );
    });

    // حساب المبلغ الإجمالي للفاتورة بشكل آمن وتلقائي
    const calculateTotal = () => {
        return watchedItems.reduce((total, item) => {
            const qty = Number(item?.quantity) || 0;
            const price = Number(item?.puchasePrice) || 0;
            return total + (qty * price);
        }, 0);
    };

    // ─── 4. Form Action Submission ───────────────────────────────────────────
    const onSubmitForm: SubmitHandler<PurchaseFormValues> = async (data) => {
        try {
            // معالجة البيانات وتجهيز الكائن لتمريره مباشرة للـ Thunk المتوافق مع السيرفر
            const formattedPayload: PurchaseFormData = {
                purchaseInvoiceNumber: data.purchaseInvoiceNumber.trim(),
                supplierName: data.supplierName.trim(),
                purchaseDate: data.purchaseDate,
                items: data.items.map(item => ({
                    productId: item.productId && item.productId !== "temp-id" ? item.productId : undefined,
                    sku: item.barcode?.trim() || item.name.trim().replace(/\s+/g, '-').toUpperCase(),
                    name: item.name.trim(),
                    barcode: item.barcode?.trim(),
                    quantity: Number(item.quantity),
                    puchasePrice: Number(item.puchasePrice),
                    suggestedSalePrice: Number(item.suggestedSalePrice) || 0,
                    suggestedWholesalePrice: Number(item.suggestedWholesalePrice) || 0
                }))
            };

            const result = isEditMode && editingInvoiceId
                ? await updatePurchase(editingInvoiceId, formattedPayload)
                : await createPurchase(formattedPayload);

            if (result.meta.requestStatus === "fulfilled") {
                await fetchProducts();
                showSuccess(isEditMode
                    ? `تم تحديث فاتورة الشراء رقم ${data.purchaseInvoiceNumber} بنجاح`
                    : `تم إدراج فاتورة الشراء رقم ${data.purchaseInvoiceNumber} بنجاح إلى المخازن`
                );
                handleCloseFormDialog();
            } else {
                showError((result.payload as string) || (isEditMode ? "فشل تحديث فاتورة المشتريات" : "فشل قيد فاتورة المشتريات"));
            }
        } catch (err) {
            showError("حدث خطأ أثناء معالجة البيانات المدخلة");
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 text-slate-100" dir="rtl">

            {/* ── Page Top Header Card ── */}
            <Card className="bg-[#1e293b] border-slate-800 shadow-lg">
                <CardHeader className="py-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-white text-xl font-black">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                أوامر وفواتير الشراء (الواردة)
                            </CardTitle>
                            <p className="text-xs text-slate-400">
                                تسجيل السلع والكميات الموردة لزيادة مخزون الأرفف الفعلي في المستودعات
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="primary"
                            className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-bold shadow-md text-white"
                            onClick={() => {
                                resetFormToDefault();
                                setIsAddDialogOpen(true);
                            }}
                            disabled={loading || isSubmitting}
                        >
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة فاتورة واردة جديدة
                        </Button>
                        <Dialog open={isAddDialogOpen} onOpenChange={(val) => { if (!val) handleCloseFormDialog(); else setIsAddDialogOpen(true); }}>
                            <DialogContent className="max-w-5xl bg-[#1e293b] border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto" dir="rtl">
                                <DialogHeader>
                                    <DialogTitle className="text-white font-bold border-b border-slate-800 pb-3">
                                        {isEditMode ? 'تعديل فاتورة توريد للمخزن' : 'إدراج فاتورة توريد للمخزن'}
                                    </DialogTitle>
                                    <DialogDescription className="sr-only">نموذج إضافة فاتورة شراء جديدة وتحديث المخزن</DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 pt-2">

                                    {/* Invoice Metadata (Grid Layout) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0f172a] rounded-xl border border-slate-800/60">
                                        <FormInput
                                            id="purchaseInvoiceNumber"
                                            label="رقم فاتورة المورد *"
                                            placeholder="مثال: PUR-MOTO-001"
                                            icon={Receipt}
                                            registration={register("purchaseInvoiceNumber")}
                                            error={errors.purchaseInvoiceNumber?.message}
                                            disabled={isSubmitting}
                                        />
                                        <FormInput
                                            id="supplierName"
                                            label="الشركة الموردة *"
                                            placeholder="مثال: اسم المورد (شركة قطع غيار)"
                                            icon={Building}
                                            registration={register("supplierName")}
                                            error={errors.supplierName?.message}
                                            disabled={isSubmitting}
                                        />
                                        <FormInput
                                            id="purchaseDate"
                                            label="تاريخ والوقت الفعلي *"
                                            type="datetime-local"
                                            icon={Calendar}
                                            registration={register("purchaseDate")}
                                            error={errors.purchaseDate?.message}
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Invoice Items Sub-form List */}
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <label className="text-sm font-black text-indigo-400">حصر السلع المستلمة</label>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="border border-slate-700 text-slate-200 hover:text-white font-bold"
                                                    onClick={() => append({ productId: "temp-id", name: "", barcode: "", quantity: 1, puchasePrice: 0, suggestedSalePrice: 0, suggestedWholesalePrice: 0 })}
                                                    disabled={isSubmitting}
                                                >
                                                    <Plus className="w-3.5 h-3.5 ml-1.5 text-indigo-400" />
                                                    بند منتج جديد
                                                </Button>
                                            </div>

                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    value={productSearchQuery}
                                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                                    placeholder="ابحث باسم المنتج أو الكود..."
                                                    className="bg-[#0f172a] border-slate-700 text-slate-200 placeholder-slate-500"
                                                    disabled={productsLoading || isSubmitting}
                                                />
                                                {productSuggestions.length > 0 && (
                                                    <div className="absolute z-20 mt-1 w-full rounded-2xl border border-slate-700 bg-[#020617] shadow-xl">
                                                        {productSuggestions.map((product) => (
                                                            <button
                                                                key={product.id}
                                                                type="button"
                                                                onClick={() => handleAddProductRow(product)}
                                                                className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors"
                                                            >
                                                                <div className="flex justify-between gap-3">
                                                                    <span className="font-medium text-slate-100">{product.name}</span>
                                                                    <span className="text-xs text-slate-500">{product.sku}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-3 text-xs text-slate-500">
                                                                    <span>رصيد حالي: {product.stock}</span>
                                                                    <span>سعر شراء: {product.purchasePrice.toLocaleString()} ج.م</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="p-4 bg-[#0f172a] border border-slate-800 rounded-xl relative group">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                                                        <FormInput
                                                            label="اسم الصنف المعرف"
                                                            placeholder="فلتر هواء، شمعة إشعال، طقم فرامل..."
                                                            icon={Tag}
                                                            registration={register(`items.${index}.name` as const)}
                                                            error={errors.items?.[index]?.name?.message}
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormInput
                                                            label="كود الباركود"
                                                            placeholder="622..."
                                                            icon={Barcode}
                                                            registration={register(`items.${index}.barcode` as const)}
                                                            error={errors.items?.[index]?.barcode?.message}
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormInput
                                                            label="الكمية الموردة"
                                                            type="number"
                                                            step="1"
                                                            min={1}
                                                            icon={Hash}
                                                            registration={register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                                                            error={errors.items?.[index]?.quantity?.message}
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormInput
                                                            label="سعر الشراء (ج.م)"
                                                            type="number"
                                                            step="1"
                                                            min={0}
                                                            icon={DollarSign}
                                                            className="text-emerald-400"
                                                            registration={register(`items.${index}.puchasePrice` as const, { valueAsNumber: true })}
                                                            error={errors.items?.[index]?.puchasePrice?.message}
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormInput
                                                            label="سعر البيع المقترح"
                                                            type="number"
                                                            step="1"
                                                            min={0}
                                                            icon={DollarSign}
                                                            className="text-indigo-400"
                                                            registration={register(`items.${index}.suggestedSalePrice` as const, { valueAsNumber: true })}
                                                            error={errors.items?.[index]?.suggestedSalePrice?.message}
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormInput
                                                            label="سعر جملة"
                                                            type="number"
                                                            step="1"
                                                            min={0}
                                                            icon={DollarSign}
                                                            className="text-blue-400"
                                                            registration={register(`items.${index}.suggestedWholesalePrice` as const, { valueAsNumber: true })}
                                                            error={errors.items?.[index]?.suggestedWholesalePrice?.message}
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>

                                                    {/* Delete Button (visible when more than 1 item exists) */}
                                                    {fields.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="text"
                                                            onClick={() => remove(index)}
                                                            className="absolute top-2 left-2 text-rose-500 hover:text-rose-400 p-0 h-7 w-7 rounded-lg"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Live Total Computation Indicator */}
                                    <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400">فاتورة حسابية مستحقة للمورد:</span>
                                        <span className="text-lg font-black text-emerald-400 font-mono">
                                            {Math.round(calculateTotal()).toLocaleString()} ج.م
                                        </span>
                                    </div>

                                    {/* Action Footers */}
                                    <div className="flex gap-2">
                                        <Button
                                            type="submit"
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
                                            disabled={isSubmitting}
                                            isLoading={isSubmitting}
                                        >
                                            {isEditMode ? 'تحديث الفاتورة' : 'اعتماد الفاتورة وضخ المنتجات للمخزون'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="border border-slate-700 text-slate-300 font-bold"
                                            onClick={() => setIsAddDialogOpen(false)}
                                            disabled={isSubmitting}
                                        >
                                            إلغاء الأمر
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
            </Card>

            {/* ── Invoices Historical Data Record Section ── */}
            <Card className="bg-[#1e293b] border-slate-800 shadow-md">
                <CardHeader className="py-4 border-b border-slate-800/60 pb-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="flex items-center gap-2 text-slate-200 text-sm font-bold">
                            <Receipt className="w-4 h-4 text-slate-400" />
                            بيانات الشحنات الموردة السابقة ({filteredInvoices.length})
                        </CardTitle>

                        {/* Search Container */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                type="text"
                                placeholder="ابحث برقم الفاتورة أو المورد..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#0f172a] border-slate-800 text-slate-200 pl-9 pr-9 h-9 text-xs rounded-lg focus:border-indigo-500 placeholder:text-slate-500"
                            />
                            {searchQuery && (
                                <Button
                                    type="button"
                                    variant="text"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute left-1 top-1 h-7 w-7 text-slate-500 hover:text-slate-300"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading && invoices.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <Loader2 className="w-12 h-12 mx-auto mb-3 text-slate-700 stroke-1 animate-spin" />
                            <p className="text-sm">جاري تحميل الفواتير المالية...</p>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-700 stroke-1" />
                            <p className="text-sm">لم يتم قيد أي فواتير شراء إلى السجل للمخزن المطور بعد</p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <Search className="w-12 h-12 mx-auto mb-3 text-slate-700 stroke-1" />
                            <p className="text-sm">لا توجد نتائج تطابق بحثك الحالي عن "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredInvoices.map((invoice) => (
                                <Card
                                    key={invoice._id || invoice.id}
                                    className="bg-[#0f172a] border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer shadow-sm group"
                                    onClick={() => {
                                        setSelectedInvoice(invoice);
                                        setIsInvoiceDialogOpen(true);
                                    }}
                                >
                                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 font-mono text-xs font-bold px-2 py-0.5">
                                                        {invoice.purchaseInvoiceNumber}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">
                                                        {invoice.items?.length || 0} أصناف مسجلة
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                        {formatDateTime(invoice.purchaseDate)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Building className="w-3.5 h-3.5 text-slate-500" />
                                                        {invoice.supplierName}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 text-left">
                                                <div className="text-base font-black text-amber-500 font-mono">
                                                    {Math.round(invoice.totalAmount || 0).toLocaleString()} ج.م
                                                </div>

                                                <div className="flex flex-wrap gap-2 justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="border border-slate-700 text-slate-200 hover:text-white"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            openEditDialog(invoice);
                                                        }}
                                                    >
                                                        تعديل
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        size="sm"
                                                        className="border border-rose-500 text-rose-300 hover:text-white"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            const invoiceId = invoice.id || invoice._id;
                                                            handleDeleteInvoice(invoiceId);
                                                        }}
                                                    >
                                                        حذف
                                                    </Button>
                                                </div>

                                                <span className="text-[10px] text-indigo-400 underline opacity-0 group-hover:opacity-100 transition-opacity block mt-1">
                                                    تفاصيل البنود والأسعار ←
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Invoice Detailed Analysis Items Dialog ── */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogContent className="max-w-4xl bg-[#1e293b] border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white font-bold text-lg border-b border-slate-800 pb-3">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            تفاصيل الفاتورة المستلمة {selectedInvoice?.purchaseInvoiceNumber}
                        </DialogTitle>
                        <DialogDescription className="sr-only">عرض تفاصيل فاتورة الشراء المستلمة وجرد البنود</DialogDescription>
                    </DialogHeader>

                    {selectedInvoice && (
                        <div className="space-y-5 pt-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#0f172a] border border-slate-800/60 rounded-xl">
                                <div>
                                    <span className="text-[11px] text-slate-500 block mb-0.5">رقم مرجع الفاتورة</span>
                                    <p className="font-mono font-bold text-xs text-slate-200">{selectedInvoice.purchaseInvoiceNumber}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block mb-0.5">تاريخ والوقت</span>
                                    <p className="font-bold text-xs text-slate-200">{formatDateTime(selectedInvoice.purchaseDate)}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block mb-0.5">الجهة الموردة</span>
                                    <p className="font-bold text-xs text-slate-200">{selectedInvoice.supplierName}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block mb-0.5">الإجمالي</span>
                                    <p className="font-bold text-xs text-amber-400">{Math.round(selectedInvoice.totalAmount || 0).toLocaleString()} ج.م</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-300 mb-3">بيان السلع المضافة لرصيد المخزن</h3>
                                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0f172a]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-slate-800 hover:bg-transparent">
                                                <TableHead className="text-right text-slate-400 text-xs font-bold">اسم المنتج</TableHead>
                                                <TableHead className="text-right text-slate-400 text-xs font-bold">الباركود</TableHead>
                                                <TableHead className="text-center text-slate-400 text-xs font-bold">سعر الشراء</TableHead>
                                                <TableHead className="text-center text-slate-400 text-xs font-bold">الكمية</TableHead>
                                                <TableHead className="text-left text-slate-400 text-xs font-bold">الإجمالي</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedInvoice.items?.map((item, index) => (
                                                <TableRow key={index} className="border-b border-slate-800 text-xs">
                                                    <TableCell className="text-slate-200 text-right">{item.name}</TableCell>
                                                    <TableCell className="text-slate-400 text-right font-mono text-[10px]">{item.barcode || "N/A"}</TableCell>
                                                    <TableCell className="text-emerald-400 text-center font-mono">{Math.round(item.puchasePrice || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="text-blue-400 text-center font-bold">{item.quantity}</TableCell>
                                                    <TableCell className="text-amber-400 text-left font-mono">{Math.round((item.quantity || 0) * (item.puchasePrice || 0)).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PurchaseInvoices;

