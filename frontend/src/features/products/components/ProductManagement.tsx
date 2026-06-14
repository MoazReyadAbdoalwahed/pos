import { useEffect, useState } from "react";
import { useForm, useWatch, type SubmitHandler, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../../hooks/use-toast";
import { useAppDispatch } from "../../../hooks/storeHooks";
import { clearError } from "../../category/store/CategorySlice";
import {
    Plus, Package, Barcode, Tag, DollarSign,
    Hash, Truck, FileText, Edit2, Trash2,
    RefreshCw, AlertTriangle, X, Printer
} from "lucide-react";

import { useProducts } from "../hook/useProducts";
import { useCategory } from "../../category/hook/useCategory";
import FormInput from "../../../components/ui/form/FormInput";
import FormSelect from "../../../components/ui/form/FormSelect";
import Button from "../../../components/ui/Button";
import ProductLabelModal from "./ProductLable";
import type { ProductUpdateFormData, ProductFormData } from "../../../types/product";
import type { CreateCategoryRequest, UpdateCategoryRequest } from "../../../types/category";

// ─── Schema ───────────────────────────────────────────────────────────────────

const ProductSchema = z.object({
    name: z.string().min(2, "اسم المنتج يجب أن لا يقل عن حرفين"),
    wholesalePrice: z.coerce.number().int("يجب أن يكون الرقم عددًا صحيحًا").min(0, "يجب أن يكون الرقم موجباً"),
    purchasePrice: z.coerce.number().int("يجب أن يكون الرقم عددًا صحيحًا").min(0, "يجب أن يكون الرقم موجباً"),
    salePrice: z.coerce.number().int("يجب أن يكون الرقم عددًا صحيحًا").min(0, "سعر البيع مطلوب"),
    initialStock: z.coerce.number().int("يجب أن يكون الرقم عددًا صحيحًا").min(0, "الكمية يجب أن تكون موجبة"),
    sku: z.string().default(""),
    category: z.string().default(""),
    supplierName: z.string().default(""),
    supplierInvoiceNumber: z.string().default(""),
    supplierInvoiceDate: z.string().default(""),
});

const DEFAULT_COLOR = "#3B82F6";
const COLOR_OPTIONS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#06B6D4", "#84CC16", "#F97316",
];

const CategorySchema = z.object({
    name: z.string().min(2, "اسم الفئة يجب أن لا يقل عن حرفين"),
    description: z.string().default(""),
    color: z.string().min(1, "الرجاء اختيار لون").default(DEFAULT_COLOR),
});

type ProductFormInput = z.infer<typeof ProductSchema>;
type CategoryFormInput = z.infer<typeof CategorySchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStockBadge = (stock: number) => {
    if (stock === 0)
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">نفذ</span>;
    if (stock === 1)
        return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">وشك النفاذ: قطعة واحدة</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">متوفر: {stock} قطع</span>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductManagement() {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const showSuccess = (msg: string) => toast({ title: msg });
    const showError = (msg: string) => toast({ title: msg, variant: "destructive" });
    const showInfo = (msg: string) => toast({ title: msg });
    const {
        selectedAllProduct: products,
        loading,
        error,
        fetchAll,
        create,
        update,
        remove,
    } = useProducts();

    const {
        categories,
        loading: categoryLoading,
        error: categoryError,
        fetchAll: fetchCategories,
        create: createCategory,
        update: updateCategory,
        remove: removeCategory,
    } = useCategory();

    // ── Tab State ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

    // ── Product Dialog State ────────────────────────────────────────────────────
    const [productDialogMode, setProductDialogMode] = useState<null | "create" | string>(null);
    const isProductDialogOpen = productDialogMode !== null;
    const isProductEditing = productDialogMode !== null && productDialogMode !== "create";

    // ── Category Dialog State ────────────────────────────────────────────────────
    const [categoryDialogMode, setCategoryDialogMode] = useState<null | "create" | string>(null);
    const isCategoryDialogOpen = categoryDialogMode !== null;
    const isCategoryEditing = categoryDialogMode !== null && categoryDialogMode !== "create";

    // ── Product Form ────────────────────────────────────────────────────────────
    const {
        register: registerProduct,
        handleSubmit: handleProductSubmit,
        reset: resetProduct,
        clearErrors: clearProductErrors,
        setValue: setProductValue,
        getValues: getProductValues,
        formState: { errors: productErrors, isSubmitting: productSubmitting },
    } = useForm<ProductFormInput>({
        mode: "onBlur",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(ProductSchema) as any,
        defaultValues: {
            name: "",
            sku: "",
            category: "",
            supplierName: "",
            supplierInvoiceNumber: "",
            supplierInvoiceDate: "",
        },
    });

    // ── Category Form ───────────────────────────────────────────────────────────
    const {
        register: registerCategory,
        handleSubmit: handleCategorySubmit,
        reset: resetCategory,
        control: categoryControl,
        setValue: setValueCategory,
        formState: { errors: categoryErrors, isSubmitting: categorySubmitting },
    } = useForm<CategoryFormInput>({
        mode: "onBlur",
        resolver: zodResolver(CategorySchema) as Resolver<CategoryFormInput>,
        defaultValues: { name: "", description: "", color: DEFAULT_COLOR },
    });

    const selectedColor = useWatch({ control: categoryControl, name: "color" });

    // جلب البيانات الأساسية عند أول تحميل للصفحة فقط بشكل آمن
    useEffect(() => {
        fetchAll();
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // دالة التحديث اليدوي الآمنة لتحديث المنتجات والمخزن وفئات المنتجات
    const handleForceRefresh = async () => {
        try {
            await fetchAll();
            await fetchCategories();
            showInfo("تم تحديث بيانات المخزن والمنتجات");
        } catch (err) {
            console.error("فشل تحديث البيانات المحلية:", err);
        }
    };

    // ══ Product Dialog Helpers ══════════════════════════════════════════════════

    const closeProductDialog = () => {
        setProductDialogMode(null);
        resetProduct();
        clearProductErrors();
    };

    const openProductCreateDialog = () => {
        clearProductErrors();
        resetProduct({
            name: "",
            sku: "",
            category: "",
            supplierName: "",
            supplierInvoiceNumber: "",
            supplierInvoiceDate: "",
        });
        setProductDialogMode("create");
    };

    const openProductEditDialog = (productId: string) => {
        clearProductErrors();
        const product = products?.find((p) => p.id === productId);
        if (!product) return;

        resetProduct({
            name: product.name || "",
            wholesalePrice: Math.round(product.wholesalePrice ?? 0),
            purchasePrice: Math.round(product.purchasePrice ?? 0),
            salePrice: Math.round(product.salePrice ?? 0),
            initialStock: Math.max(0, Math.round(product.stock ?? 0)),
            sku: product.sku || "",
            category: typeof product.category === 'string' ? product.category : "",
            supplierName: product.supplierName || "",
            supplierInvoiceNumber: product.supplierInvoiceNumber || "",
            supplierInvoiceDate: product.supplierInvoiceDate || "",
        });
        setProductDialogMode(productId);
    };

    // ══ Category Dialog Helpers ═════════════════════════════════════════════════

    const generateSku = (baseName = "") => {
        const prefix = baseName.trim().replace(/\s+/g, "-").toUpperCase().slice(0, 4) || "PRD";
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const timeSegment = Date.now().toString().slice(-4);
        return `${prefix}-${randomDigits}-${timeSegment}`;
    };

    const closeCategoryDialog = () => {
        setCategoryDialogMode(null);
        resetCategory({ name: "", description: "", color: DEFAULT_COLOR });
        dispatch(clearError());
    };

    const openCategoryCreateDialog = () => {
        resetCategory({ name: "", description: "", color: DEFAULT_COLOR });
        dispatch(clearError());
        setCategoryDialogMode("create");
    };

    const openCategoryEditDialog = (categoryId: string) => {
        const category = categories.find((cat) => cat.id === categoryId);
        if (!category) return;
        dispatch(clearError());
        resetCategory({
            name: category.name,
            description: category.description || "",
            color: category.color || DEFAULT_COLOR,
        });
        setCategoryDialogMode(categoryId);
    };

    // ══ Product Actions ════════════════════════════════════════════════════════

    const onProductSubmit: SubmitHandler<ProductFormInput> = async (data) => {
        try {
            if (isProductEditing) {
                const updateData: ProductUpdateFormData = {
                    name: data.name,
                    wholesalePrice: data.wholesalePrice,
                    purchasePrice: data.purchasePrice,
                    salePrice: data.salePrice,
                    sku: data.sku || undefined,
                    category: data.category || undefined,
                    supplierName: data.supplierName || undefined,
                    supplierInvoiceNumber: data.supplierInvoiceNumber || undefined,
                    supplierInvoiceDate: data.supplierInvoiceDate || undefined,
                };
                const result = await update(productDialogMode, updateData);
                if (result.meta?.requestStatus === "fulfilled") {
                    await fetchAll();
                    showSuccess("تم تحديث المنتج بنجاح!");
                    closeProductDialog();
                } else {
                    showError((result.payload as string) || "فشل تحديث المنتج");
                }
            } else {
                const createData: ProductFormData = {
                    name: data.name,
                    wholesalePrice: data.wholesalePrice,
                    purchasePrice: data.purchasePrice,
                    salePrice: data.salePrice,
                    stock: data.initialStock,
                    initialStock: data.initialStock,
                    sku: data.sku,
                    category: data.category,
                    supplierName: data.supplierName,
                    supplierInvoiceNumber: data.supplierInvoiceNumber,
                    supplierInvoiceDate: data.supplierInvoiceDate,
                    description: "",
                };
                const result = await create(createData);
                if (result.meta?.requestStatus === "fulfilled") {
                    showSuccess("تم إضافة المنتج بنجاح!");
                    closeProductDialog();
                } else {
                    showError((result.payload as string) || "فشل إنشاء المنتج");
                }
            }
        } catch {
            showError("حدث خطأ غير متوقع");
        }
    };

    const handleProductDelete = async (productId: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
        try {
            const result = await remove(productId);
            if (result.meta?.requestStatus === "fulfilled") {
                showSuccess("تم حذف المنتج بنجاح!");
            } else {
                showError((result.payload as string) || "فشل حذف المنتج");
            }
        } catch {
            showError("حدث خطأ أثناء الحذف");
        }
    };

    // ══ Category Actions ═══════════════════════════════════════════════════════

    const onCategorySubmit: SubmitHandler<CategoryFormInput> = async (data) => {
        const categoryData = {
            name: data.name.trim(),
            description: data.description?.trim() || "",
            color: data.color,
        };
        try {
            if (isCategoryEditing) {
                const result = await updateCategory(categoryDialogMode as string, categoryData as UpdateCategoryRequest);
                if (result.meta?.requestStatus === "fulfilled") {
                    showSuccess("تم تحديث الفئة بنجاح!");
                    closeCategoryDialog();
                } else {
                    showError((result.payload as string) || "فشل تحديث الفئة");
                }
            } else {
                const result = await createCategory(categoryData as CreateCategoryRequest);
                if (result.meta?.requestStatus === "fulfilled") {
                    showSuccess("تم إنشاء فئة جديدة بنجاح!");
                    closeCategoryDialog();
                } else {
                    showError((result.payload as string) || "فشل إنشاء الفئة");
                }
            }
        } catch {
            showError("حدث خطأ غير متوقع");
        }
    };

    const handleCategoryDelete = async (categoryId: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;
        try {
            const result = await removeCategory(categoryId);
            if (result.meta?.requestStatus === "fulfilled") {
                showSuccess("تم حذف الفئة بنجاح!");
                if (isCategoryEditing && categoryDialogMode === categoryId) closeCategoryDialog();
            } else {
                showError((result.payload as string) || "فشل حذف الفئة");
            }
        } catch {
            showError("حدث خطأ أثناء الحذف");
        }
    };

    const categoryOptions = [
        { value: "", label: "اختر الفئة المستهدفة" },
        ...(categories?.map((cat) => ({ value: cat.id, label: cat.name })) || []),
    ];

    const shouldDisplayCategoryError = categoryError && categoryError !== "No categories found";

    return (
        <div className="min-h-screen bg-slate-900 p-6" dir="rtl">
            <div className="max-w-7xl mx-auto">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">إدارة المنتجات والمخزون</h1>
                        <p className="text-slate-400 text-sm mt-1">إضافة وتعديل المنتج والفئات في نقطة البيع من قاعدة البيانات</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="text"
                            size="sm"
                            icon={RefreshCw}
                            onClick={handleForceRefresh}
                            disabled={loading || categoryLoading}
                            className={loading || categoryLoading ? "animate-spin" : ""}
                        />
                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            icon={Plus}
                            iconPosition="left"
                            onClick={activeTab === "products" ? openProductCreateDialog : openCategoryCreateDialog}
                        >
                            {activeTab === "products" ? "إضافة منتج جديد" : "إضافة فئة"}
                        </Button>
                    </div>
                </div>

                {/* ── Tab Navigation ── */}
                <div className="flex gap-2 mb-6 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab("products")}
                        className={`px-4 py-3 font-medium transition border-b-2 ${activeTab === "products"
                            ? "text-blue-400 border-blue-400"
                            : "text-slate-400 border-transparent hover:text-slate-300"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            المنتجات
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("categories")}
                        className={`px-4 py-3 font-medium transition border-b-2 ${activeTab === "categories"
                            ? "text-blue-400 border-blue-400"
                            : "text-slate-400 border-transparent hover:text-slate-300"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            الفئات
                        </div>
                    </button>
                </div>

                {/* ══ PRODUCTS TAB ══════════════════════════════════════════════════ */}
                {activeTab === "products" && (
                    <>
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: "إجمالي المنتجات", value: products?.length ?? 0, color: "text-blue-400" },
                                { label: "إجمالي المخزون", value: products?.reduce((s: number, p) => s + (p.stock ?? 0), 0) ?? 0, color: "text-emerald-400" },
                                { label: "نفاذ المخزون", value: products?.filter((p) => p.stock === 0).length ?? 0, color: "text-red-400" },
                                { label: "مخزون منخفض", value: products?.filter((p) => Number(p.stock || 0) === 1).length ?? 0, color: "text-amber-400" },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-slate-800 border border-white/10 rounded-xl p-4">
                                    <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Error Banner */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                                <p className="text-slate-400 mt-3">جاري التحميل...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && (!products || products.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Package className="w-16 h-16 text-slate-600 mb-4" />
                                <p className="text-slate-400 text-lg">لا توجد منتجات حتى الآن</p>
                                <p className="text-slate-500 text-sm mt-1">ابدأ بإضافة منتج جديد للمخزن</p>
                            </div>
                        )}

                        {/* Products Grid */}
                        {!loading && products && products.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-slate-800 border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:border-white/20 transition justify-between"
                                    >
                                        <div>
                                            {/* Card Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-white text-sm leading-tight flex-1 text-right break-all">
                                                    {product.name}
                                                </h3>
                                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mr-2">
                                                    <span className="text-blue-400 text-xs font-bold">
                                                        {product.name?.slice(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Prices and Info */}
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-3 gap-2 text-right text-xs text-slate-400">
                                                    <div className="rounded-2xl bg-slate-900/70 p-2">
                                                        <p className="text-[10px] mb-1 uppercase tracking-[0.08em] text-slate-500">سعر الشراء</p>
                                                        <p className="text-sm font-semibold text-slate-100">{product.purchasePrice?.toLocaleString() ?? 0} ج.م</p>
                                                    </div>
                                                    <div className="rounded-2xl bg-slate-900/70 p-2">
                                                        <p className="text-[10px] mb-1 uppercase tracking-[0.08em] text-slate-500">سعر البيع</p>
                                                        <p className="text-sm font-semibold text-emerald-400">{product.salePrice?.toLocaleString() ?? 0} ج.م</p>
                                                    </div>
                                                    <div className="rounded-2xl bg-slate-900/70 p-2">
                                                        <p className="text-[10px] mb-1 uppercase tracking-[0.08em] text-slate-500">سعر الجملة</p>
                                                        <p className="text-sm font-semibold text-indigo-400">{product.wholesalePrice?.toLocaleString() ?? 0} ج.م</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <div>{getStockBadge(product.stock ?? 0)}</div>
                                                    <span className="text-slate-400 text-xs">رصيد المخزن:</span>
                                                </div>
                                                {product.sku && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-300 text-xs font-mono bg-slate-700 px-2 py-0.5 rounded">
                                                            {product.sku}
                                                        </span>
                                                        <span className="text-slate-400 text-xs">الكود:</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2 border-t border-white/5 mt-auto">
                                            <ProductLabelModal product={product} />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                icon={Edit2}
                                                iconPosition="left"
                                                onClick={() => openProductEditDialog(product.id)}
                                                disabled={productSubmitting}
                                            >
                                                تعديل
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                icon={Trash2}
                                                onClick={() => handleProductDelete(product.id)}
                                                disabled={productSubmitting}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ══ CATEGORIES TAB ════════════════════════════════════════════════ */}
                {activeTab === "categories" && (
                    <>
                        {/* Loading */}
                        {categoryLoading && (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
                                <p className="text-slate-400 mt-3 text-sm">جاري التحميل...</p>
                            </div>
                        )}

                        {/* Empty */}
                        {!categoryLoading && (categories.length === 0 || categoryError === "No categories found") && (
                            <div className="text-center py-8 text-gray-500">
                                <Tag className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p>لا توجد فئات محددة</p>
                                <p className="text-sm mt-2">قم بإضافة فئة جديدة لتنظيم المنتجات</p>
                            </div>
                        )}

                        {/* Grid */}
                        {!categoryLoading && categories.length > 0 && (!categoryError || categoryError === "No categories found") && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-between group hover:bg-slate-700 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div
                                                className="w-4 h-4 rounded-full shrink-0"
                                                style={{ backgroundColor: category.color || DEFAULT_COLOR }}
                                            />
                                            <div className="overflow-hidden">
                                                <span className="font-medium text-sm text-white truncate block">
                                                    {category.name}
                                                </span>
                                                {category.description && (
                                                    <p className="text-xs text-slate-400 truncate">{category.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openCategoryEditDialog(category.id)}
                                                disabled={categorySubmitting}
                                                className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-600 transition disabled:opacity-50"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCategoryDelete(category.id)}
                                                disabled={categorySubmitting}
                                                className="h-6 w-6 flex items-center justify-center rounded text-red-400 hover:text-red-300 hover:bg-slate-600 transition disabled:opacity-50"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ══ Product Modal ══════════════════════════════════════════════════════ */}
            {isProductDialogOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
                    onClick={(e) => { if (e.target === e.currentTarget) closeProductDialog(); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* Panel */}
                    <div
                        className="relative z-10 w-full max-w-xl bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                        dir="rtl"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-slate-800 rounded-t-2xl z-10">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-400" />
                                {isProductEditing ? "تعديل بيانات منتج" : "إضافة منتج جديد للمستودع"}
                            </h2>
                            <button
                                type="button"
                                onClick={closeProductDialog}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <form onSubmit={handleProductSubmit(onProductSubmit as any)} className="p-5 space-y-5">

                            {/* اسم المنتج */}
                            <FormInput
                                id="name"
                                label="اسم المنتج *"
                                placeholder="مثال: فلتر هواء دراجة نارية أو طقم فرامل"
                                icon={Package}
                                registration={registerProduct("name")}
                                error={productErrors.name?.message}
                                disabled={productSubmitting}
                                isRtl
                            />

                            {/* الشركة المورد + رقم فاتورة المورد */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    id="supplierInvoiceNumber"
                                    label="رقم فاتورة المورد"
                                    placeholder="مثال: PUR-MOTO-001"
                                    icon={FileText}
                                    registration={registerProduct("supplierInvoiceNumber")}
                                    error={productErrors.supplierInvoiceNumber?.message}
                                    disabled={productSubmitting}
                                    isRtl
                                />
                                <FormInput
                                    id="supplierName"
                                    label="الشركة الموردة"
                                    placeholder="مثال: اسم المورد (شركة قطع غيار)"
                                    icon={Truck}
                                    registration={registerProduct("supplierName")}
                                    error={productErrors.supplierName?.message}
                                    disabled={productSubmitting}
                                    isRtl
                                />
                            </div>

                            {/* سعر البيع القطاعي + سعر الشراء */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    id="purchasePrice"
                                    label="سعر الشراء (ج.م)"
                                    placeholder=""
                                    icon={DollarSign}
                                    type="number"
                                    step="1"
                                    min={0}
                                    registration={registerProduct("purchasePrice", { valueAsNumber: true })}
                                    error={productErrors.purchasePrice?.message}
                                    disabled={productSubmitting}
                                    isRtl
                                />
                                <FormInput
                                    id="salePrice"
                                    label="سعر البيع القطاعي (ج.م) *"
                                    placeholder=""
                                    icon={DollarSign}
                                    type="number"
                                    step="1"
                                    min={0}
                                    registration={registerProduct("salePrice", { valueAsNumber: true })}
                                    error={productErrors.salePrice?.message}
                                    disabled={productSubmitting}
                                    isRtl
                                />
                            </div>

                            {/* الكمية الابتدائية + سعر الجملة */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    id="initialStock"
                                    label={isProductEditing ? "الكمية الحالية (غير قابلة للتعديل هنا)" : "الكمية الابتدائية"}
                                    placeholder=""
                                    icon={Hash}
                                    type="number"
                                    step="1"
                                    min={0}
                                    registration={registerProduct("initialStock", { valueAsNumber: true })}
                                    error={productErrors.initialStock?.message}
                                    disabled={productSubmitting || isProductEditing}
                                    isRtl
                                />
                                <FormInput
                                    id="wholesalePrice"
                                    label="سعر الجملة (ج.م)"
                                    placeholder=""
                                    icon={DollarSign}
                                    type="number"
                                    step="1"
                                    min={0}
                                    registration={registerProduct("wholesalePrice", { valueAsNumber: true })}
                                    error={productErrors.wholesalePrice?.message}
                                    disabled={productSubmitting}
                                    isRtl
                                />
                            </div>

                            {/* رقم الكود / الباركود */}
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    رقم الكود / الباركود
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="p-2.5 bg-slate-700 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition shrink-0"
                                        onClick={() => {
                                            const generated = generateSku(getProductValues("name"));
                                            setProductValue("sku", generated, { shouldValidate: true });
                                        }}
                                    >
                                        <Barcode className="w-5 h-5" />
                                    </button>
                                    <FormInput
                                        id="sku"
                                        placeholder="امسح الباركود أو أنشئ تلقائياً (مثال: SP-MOTO-001)"
                                        icon={Tag}
                                        registration={registerProduct("sku")}
                                        error={productErrors.sku?.message}
                                        disabled={productSubmitting}
                                        isRtl
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            {/* الفئة الرئيسية */}
                            <FormSelect
                                id="category"
                                label="الفئة الرئيسية"
                                icon={Tag}
                                options={categoryOptions}
                                registration={registerProduct("category")}
                                error={productErrors.category?.message}
                                disabled={productSubmitting}
                                isRtl
                            />

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="md"
                                    onClick={closeProductDialog}
                                    disabled={productSubmitting}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    fullWidth
                                    isLoading={productSubmitting}
                                    icon={isProductEditing ? Edit2 : Plus}
                                    iconPosition="left"
                                    loadingSpinner={
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                                            جاري الحفظ...
                                        </span>
                                    }
                                    className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                >
                                    {isProductEditing ? "حفظ التعديلات" : "حفظ المنتج الجديد"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Category Modal ════════════════════════════════════════════════════ */}
            {isCategoryDialogOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) closeCategoryDialog(); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60" />

                    {/* Panel */}
                    <div className="relative z-10 w-full max-w-md mx-4 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl" dir="rtl">

                        {/* Dialog header */}
                        <div className="mb-4">
                            <h3 className="text-white font-semibold text-lg">
                                {isCategoryEditing ? "تعديل الفئة" : "إضافة فئة جديدة"}
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                {isCategoryEditing ? "تعديل بيانات الفئة" : "إضافة فئة جديدة للنظام"}
                            </p>
                        </div>

                        {/* Error */}
                        {shouldDisplayCategoryError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-red-300 text-sm">{categoryError}</p>
                            </div>
                        )}

                        <form onSubmit={handleCategorySubmit(onCategorySubmit)} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1">
                                <label htmlFor="cat-name" className="block text-sm text-slate-300">
                                    اسم الفئة *
                                </label>
                                <input
                                    id="cat-name"
                                    placeholder="أدخل اسم الفئة"
                                    disabled={categorySubmitting}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                                    {...registerCategory("name")}
                                />
                                {categoryErrors.name && (
                                    <p className="text-red-400 text-xs">{categoryErrors.name.message}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <label htmlFor="cat-desc" className="block text-sm text-slate-300">
                                    وصف الفئة
                                </label>
                                <input
                                    id="cat-desc"
                                    placeholder="وصف اختياري للفئة"
                                    disabled={categorySubmitting}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                                    {...registerCategory("description")}
                                />
                            </div>

                            {/* Color swatches */}
                            <div className="space-y-2">
                                <label className="block text-sm text-slate-300">لون الفئة</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLOR_OPTIONS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color
                                                ? "border-white scale-110"
                                                : "border-slate-600"
                                                }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setValueCategory("color", color, { shouldDirty: true })}
                                        />
                                    ))}
                                </div>
                                {categoryErrors.color && (
                                    <p className="text-red-400 text-xs">{categoryErrors.color.message}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={categorySubmitting}
                                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50"
                                >
                                    {categorySubmitting ? "جاري الحفظ..." : isCategoryEditing ? "تحديث" : "إضافة"}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeCategoryDialog}
                                    disabled={categorySubmitting}
                                    className="py-2 px-4 rounded-lg text-sm font-medium text-slate-300 border border-slate-600 hover:bg-slate-700 transition disabled:opacity-50"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
