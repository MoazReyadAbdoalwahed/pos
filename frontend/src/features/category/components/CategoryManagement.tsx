import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useAppDispatch } from "../../../hooks/storeHooks";
import { clearError } from "../store/CategorySlice";
import { Plus, Edit, Trash2, Tag, Package, RefreshCw, AlertCircle } from "lucide-react";
import { useCategory } from "../hook/useCategory";
import type { CreateCategoryRequest, UpdateCategoryRequest } from "../../../types/category";

// ─── Schema ───────────────────────────────────────────────────────────────────

const DEFAULT_COLOR = "#3B82F6";

const CategorySchema = z.object({
    name: z.string().min(2, "اسم الفئة يجب أن لا يقل عن حرفين"),
    description: z.string().optional().default(""),
    color: z.string().min(1, "الرجاء اختيار لون").default(DEFAULT_COLOR),
});

type CategoryFormInput = z.infer<typeof CategorySchema>;

const COLOR_OPTIONS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#06B6D4", "#84CC16", "#F97316",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CategoryManagement() {
    const dispatch = useAppDispatch();
    const { categories, loading, error, fetchAll, create, update, remove } = useCategory();

    // null = closed | "create" = new | string id = editing that category
    const [dialogMode, setDialogMode] = useState<null | "create" | string>(null);

    const isOpen = dialogMode !== null;
    const isEditing = dialogMode !== null && dialogMode !== "create";

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CategoryFormInput>({
        mode: "onBlur",
        resolver: zodResolver(CategorySchema),
        defaultValues: { name: "", description: "", color: DEFAULT_COLOR },
    });

    const selectedColor = watch("color");

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Dialog helpers ────────────────────────────────────────────────────────

    const closeDialog = () => {
        setDialogMode(null);
        reset({ name: "", description: "", color: DEFAULT_COLOR });
        dispatch(clearError());
    };

    const openCreateDialog = () => {
        reset({ name: "", description: "", color: DEFAULT_COLOR });
        dispatch(clearError());
        setDialogMode("create");
    };

    // FIX: reset() populates form BEFORE dialog opens → no empty form on mount
    const openEditDialog = (categoryId: string) => {
        const category = categories.find((cat) => cat.id === categoryId);
        if (!category) return;
        dispatch(clearError());
        reset({
            name: category.name,
            description: category.description || "",
            color: category.color || DEFAULT_COLOR,
        });
        setDialogMode(categoryId); // open AFTER reset
    };

    // ── Actions ───────────────────────────────────────────────────────────────

    const handleForceRefresh = async () => {
        try {
            dispatch(clearError());
            await fetchAll();
            toast.info("جاري تحديث البيانات...");
        } catch {
            toast.error("فشل التحديث");
        }
    };

    const onSubmit: SubmitHandler<CategoryFormInput> = async (data) => {
        const categoryData = {
            name: data.name.trim(),
            description: data.description?.trim() || "",
            color: data.color,
        };
        try {
            if (isEditing) {
                const result = await update(dialogMode as string, categoryData as UpdateCategoryRequest);
                if (result.meta?.requestStatus === "fulfilled") {
                    toast.success("تم تحديث الفئة بنجاح!");
                    closeDialog();
                } else {
                    toast.error((result.payload as string) || "فشل تحديث الفئة");
                }
            } else {
                const result = await create(categoryData as CreateCategoryRequest);
                if (result.meta?.requestStatus === "fulfilled") {
                    toast.success("تم إنشاء فئة جديدة بنجاح!");
                    closeDialog();
                } else {
                    toast.error((result.payload as string) || "فشل إنشاء الفئة");
                }
            }
        } catch {
            toast.error("حدث خطأ غير متوقع");
        }
    };

    const handleDelete = async (categoryId: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;
        try {
            const result = await remove(categoryId);
            if (result.meta?.requestStatus === "fulfilled") {
                toast.success("تم حذف الفئة بنجاح!");
                if (isEditing && dialogMode === categoryId) closeDialog();
            } else {
                toast.error((result.payload as string) || "فشل حذف الفئة");
            }
        } catch {
            toast.error("حدث خطأ أثناء الحذف");
        }
    };

    const shouldDisplayError = error && error !== "No categories found";

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="bg-slate-800 backdrop-blur-sm border border-blue-100 rounded-xl" dir="rtl">

            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4">
                <h2 className="flex items-center gap-2 text-blue-400 font-semibold text-lg">
                    <Tag className="w-5 h-5" />
                    إدارة الفئات
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleForceRefresh}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        type="button"
                        onClick={openCreateDialog}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة فئة
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-6">
                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
                        <p className="text-slate-400 mt-3 text-sm">جاري التحميل...</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && (categories.length === 0 || error === "No categories found") && (
                    <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                        <p>لا توجد فئات محددة</p>
                        <p className="text-sm mt-2">قم بإضافة فئة جديدة لتنظيم المنتجات</p>
                    </div>
                )}

                {/* Grid */}
                {!loading && categories.length > 0 && (!error || error === "No categories found") && (
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
                                        onClick={() => openEditDialog(category.id)}
                                        disabled={isSubmitting}
                                        className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-600 transition disabled:opacity-50"
                                    >
                                        <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(category.id)}
                                        disabled={isSubmitting}
                                        className="h-6 w-6 flex items-center justify-center rounded text-red-400 hover:text-red-300 hover:bg-slate-600 transition disabled:opacity-50"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Dialog (fully controlled, no DialogTrigger) ────────────────── */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60" />

                    {/* Panel */}
                    <div className="relative z-10 w-full max-w-md mx-4 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl" dir="rtl">

                        {/* Dialog header */}
                        <div className="mb-4">
                            <h3 className="text-white font-semibold text-lg">
                                {isEditing ? "تعديل الفئة" : "إضافة فئة جديدة"}
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                {isEditing ? "تعديل بيانات الفئة" : "إضافة فئة جديدة للنظام"}
                            </p>
                        </div>

                        {/* Error */}
                        {shouldDisplayError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1">
                                <label htmlFor="cat-name" className="block text-sm text-slate-300">
                                    اسم الفئة *
                                </label>
                                <input
                                    id="cat-name"
                                    placeholder="أدخل اسم الفئة"
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="text-red-400 text-xs">{errors.name.message}</p>
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
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                                    {...register("description")}
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
                                            onClick={() => setValue("color", color, { shouldDirty: true })}
                                        />
                                    ))}
                                </div>
                                {errors.color && (
                                    <p className="text-red-400 text-xs">{errors.color.message}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? "جاري الحفظ..." : isEditing ? "تحديث" : "إضافة"}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={isSubmitting}
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