import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Loader2,
    AlertCircle,
    Trash2,
    Barcode,
    Plus,
    Minus,
    RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { useToast } from "../../../hooks/use-toast";
import { useAppDispatch } from "../../../hooks/storeHooks"; // مسار الـ Hooks الموحد بمشروعك
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useProducts } from "../../products/hook/useProducts"; // استدعاء هوك المنتجات لجلب المنتجات والـ sku
import { createReturnSale } from "../store/thunksales";
import type { ReturnSaleFormData } from "../../../types/sales";

type ReturnItem = {
    productId: string;
    name: string;
    quantity: number;
    salePrice: number;
    wholesalePrice: number;
    priceType: "sale" | "wholesale" | "custom";
    activePrice: number;
};

type ReturnProduct = {
    id: string;
    _id?: string;
    name: string;
    salePrice: number;
    wholesalePrice?: number;
    sku?: string;
};

const ReturnInterface: React.FC = () => {
    const dispatch = useAppDispatch();
    const { currentUser, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const showSuccess = (msg: string) => toast({ title: msg });
    const showError = (msg: string) => toast({ title: msg, variant: "destructive" });

    // جلب المنتجات المتاحة بالسيستم للتحقق من الباركود (sku)
    const { selectedAllProduct: products, fetchAll: fetchProducts } = useProducts();

    const [returnCart, setReturnCart] = useState<ReturnItem[]>([]);
    const returnTotal = useMemo(
        () => returnCart.reduce((sum, item) => sum + item.activePrice * item.quantity, 0),
        [returnCart]
    );

    const [barcode, setBarcode] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const reasonInputRef = useRef<HTMLTextAreaElement>(null);

    const addToReturnCart = (product: ReturnProduct) => {
        const productId = product.id || product._id;
        if (!productId) {
            showError("خطأ داخلي: معرّف المنتج غير موجود");
            return;
        }

        setReturnCart((prev) => {
            const existing = prev.find((item) => item.productId === productId);
            if (existing) {
                return prev.map((item) =>
                    item.productId === productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...prev,
                {
                    productId,
                    name: product.name,
                    quantity: 1,
                    salePrice: product.salePrice,
                    wholesalePrice: product.wholesalePrice ?? product.salePrice,
                    priceType: "sale",
                    activePrice: product.salePrice,
                },
            ];
        });
    };

    const updateReturnQuantity = (productId: string, quantity: number) => {
        setReturnCart((prev) =>
            prev
                .map((item) =>
                    item.productId === productId ? { ...item, quantity } : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromReturnCart = (productId: string) => {
        setReturnCart((prev) => prev.filter((item) => item.productId !== productId));
    };

    const updateReturnPriceType = (productId: string, priceType: "sale" | "wholesale" | "custom") => {
        setReturnCart((prev) =>
            prev.map((item) => {
                if (item.productId !== productId) return item;
                const activePrice =
                    priceType === "sale"
                        ? item.salePrice
                        : priceType === "wholesale"
                            ? item.wholesalePrice
                            : item.activePrice;
                return { ...item, priceType, activePrice };
            })
        );
    };

    const updateReturnCustomPrice = (productId: string, customPrice: number) => {
        setReturnCart((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, priceType: "custom", activePrice: customPrice }
                    : item
            )
        );
    };

    // جلب المنتجات عند فتح الشاشة لتأمين عمليات الفحص بالليزر
    useEffect(() => {
        if (isAuthenticated) {
            fetchProducts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    // ── Barcode submit ────────────────────────────────────────────────────────
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const query = barcode.trim();
        if (!query) {
            barcodeInputRef.current?.focus();
            return;
        }

        // البحث عن المنتج بواسطة الـ sku أو الاسم
        const product = products?.find(
            (p) => p.sku === query || p.name.toLowerCase().includes(query.toLowerCase())
        ) as ReturnProduct | undefined;

        if (!product) {
            showError("المنتج غير مسجل بالسيستم");
            setBarcode("");
            barcodeInputRef.current?.focus();
            return;
        }

        addToReturnCart(product);

        showSuccess(`تم إضافة ${product.name} للمرتجع`);
        setBarcode("");
        barcodeInputRef.current?.focus();
    };

    // ── Submit Return to Backend ──────────────────────────────────────────────
    const handleConfirmReturn = async () => {
        if (returnCart.length === 0) {
            showError("يرجى تحديد عناصر للإرجاع أولاً");
            barcodeInputRef.current?.focus();
            return;
        }

        if (!returnReason.trim()) {
            showError("يرجى إدخال سبب الإرجاع");
            reasonInputRef.current?.focus();
            return;
        }

        setIsProcessing(true);
        try {
            const cashierId = currentUser?.id || currentUser?._id || undefined;

            const payload: ReturnSaleFormData = {
                cashierId,
                returnType: "direct",
                originalInvoiceNumber: "DIRECT-RETURN", // مخصصة للمرتجعات المباشرة الحرة بدون فاتورة مرجعية
                itemsToReturn: returnCart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    activePrice: item.activePrice,
                    priceType: item.priceType,
                })),
            };

            // تنفيذ الـ Thunk الخاص بحفظ الفاتورة بالـ Database
            const result = await dispatch(createReturnSale(payload));

            if (result.meta.requestStatus === "fulfilled") {
                setReturnCart([]);
                showSuccess("✅ تم تسجيل عملية المرتجع الفوري بنجاح وتحديث جرد المخزن");
            } else {
                showError((result.payload as string) || "فشل تسجيل المرتجع بالسيرفر");
            }
        } catch (err) {
            console.error(err);
            showError("حدث خطأ غير متوقع أثناء معالجة المرتجع");
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Auth guard ────────────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-slate-100 gap-4" dir="rtl">
                <AlertCircle className="w-12 h-12 text-rose-400 animate-bounce" />
                <h2 className="text-xl font-bold text-white">يرجى تسجيل الدخول</h2>
                <p className="text-slate-400">عليك تسجيل الدخول أولاً للوصول إلى شاشة المرتجعات</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 min-h-screen bg-[#0f172a] text-slate-100 font-sans" dir="rtl">

            {/* ── Header ── */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-rose-400">إدارة المرتجعات الفورية</h1>
                    <p className="text-sm text-slate-400">إرجاع المنتجات وتحديث المخزون ودرج الكاشير تلقائياً</p>
                </div>
                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 text-sm">
                    شاشة المرتجعات
                </Badge>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── Barcode Card (Left Section) ── */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-[#1e293b] border-slate-800 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-200 font-semibold text-lg">
                                <Barcode className="w-5 h-5 text-rose-400" />
                                اسحب باركود الصنف المرتجع
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
                                <Input
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    placeholder="اضرب بالاسكانر هنا لقراءة المنتج المراد إرجاعه..."
                                    className="flex-1 text-center font-mono text-lg bg-[#0f172a] border-slate-700 text-white placeholder-slate-500 focus:border-rose-500 focus:ring-rose-500"
                                    autoFocus
                                />
                                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white px-6 shrink-0">
                                    إرجاع الصنف
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Return Basket (Right Section - Dynamic Sidebar) ── */}
                <div className="space-y-4">
                    <Card className="bg-[#1e293b] border-slate-800 shadow-2xl sticky top-6">
                        <CardHeader className="border-b border-slate-800 pb-3">
                            <CardTitle className="flex items-center gap-2 text-slate-200 font-semibold text-lg">
                                <RefreshCw className="w-5 h-5 text-rose-400" />
                                قائمة الأصناف المرتجعة
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-4">
                            {returnCart.length === 0 ? (
                                <div className="text-center text-slate-500 py-12 flex flex-col items-center justify-center gap-2">
                                    <RefreshCw className="w-8 h-8 text-slate-600 stroke-1 animate-pulse" />
                                    <p className="text-sm">لم يتم اختيار أصناف مرتجعة بعد</p>
                                </div>
                            ) : (
                                <>
                                    {/* Items List Dynamic Container */}
                                    <div className="space-y-3 max-h-95 overflow-y-auto pl-1 custom-scrollbar">
                                        {returnCart.map((item) => (
                                            <div
                                                key={item.productId}
                                                className="flex flex-col p-3 bg-[#0f172a] rounded-xl border border-slate-800 space-y-2"
                                            >
                                                {/* Header Line: Item Title + Computed Price */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>

                                                        {/* Interactive Pricing Controls */}
                                                        <div className="space-y-2 mt-1.5">
                                                            <select
                                                                value={item.priceType}
                                                                onChange={(e) => {
                                                                    const newType = e.target.value as "sale" | "wholesale" | "custom";
                                                                    updateReturnPriceType(item.productId, newType);
                                                                }}
                                                                className="w-full bg-[#1e293b] text-xs text-rose-300 rounded border border-slate-700 px-2 py-1 outline-none cursor-pointer focus:border-rose-500"
                                                            >
                                                                <option value="sale">قطاعي ({item.salePrice} ج.م)</option>
                                                                <option value="wholesale">جملة ({item.wholesalePrice} ج.م)</option>
                                                                <option value="custom">سعر مخصص</option>
                                                            </select>

                                                            {/* Dynamic Custom Price Fields */}
                                                            {item.priceType === "custom" && (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={item.activePrice === 0 ? "" : item.activePrice}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value.trim();
                                                                            const customPrice = parseFloat(value);

                                                                            if (value === "") {
                                                                                updateReturnCustomPrice(item.productId, 0);
                                                                            } else if (!isNaN(customPrice) && customPrice >= 0) {
                                                                                updateReturnCustomPrice(item.productId, customPrice);
                                                                            }
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            const value = parseFloat(e.target.value);
                                                                            if (!e.target.value.trim() || value === 0 || isNaN(value)) {
                                                                                updateReturnPriceType(item.productId, "sale");
                                                                            }
                                                                        }}
                                                                        placeholder="أدخل السعر"
                                                                        className="flex-1 h-7 bg-[#0f172a] border border-amber-600 text-amber-300 text-xs px-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-left font-mono rounded"
                                                                    />
                                                                    <span className="text-xs font-mono text-amber-400">ج.م</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Card Side Total Price */}
                                                    <p className={`font-bold text-sm shrink-0 mt-0.5 ${item.priceType === "custom" ? "text-amber-400" : "text-rose-400"}`}>
                                                        {(item.activePrice * item.quantity).toLocaleString()} ج.م
                                                    </p>
                                                </div>

                                                {/* Footer Line: Quantity Actions & Basket Removal */}
                                                <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/60">
                                                    <div className="flex items-center gap-1.5 bg-[#1e293b] p-1 rounded-lg border border-slate-700">
                                                        <button
                                                            type="button"
                                                            className="w-7 h-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center justify-center transition-colors"
                                                            onClick={() => updateReturnQuantity(item.productId, item.quantity - 1)}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-bold text-white font-mono">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            className="w-7 h-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center justify-center transition-colors"
                                                            onClick={() => updateReturnQuantity(item.productId, item.quantity + 1)}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant="text"
                                                        className="w-8 h-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-0 flex items-center justify-center rounded-lg"
                                                        onClick={() => removeFromReturnCart(item.productId)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* <Separator className="bg-slate-800" /> */}

                                    {/* Financial Aggregate Summary */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-slate-400 text-sm font-medium">إجمالي المبلغ المراد رده:</span>
                                            <span className="text-2xl font-black text-rose-400 font-mono">
                                                {returnTotal.toLocaleString()}{" "}
                                                <span className="text-xs font-normal">ج.م</span>
                                            </span>
                                        </div>

                                        {/* Direct submission to update global store state */}
                                        <Button
                                            type="button"
                                            onClick={handleConfirmReturn}
                                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2 py-2.5 text-base"
                                            disabled={isProcessing || returnCart.length === 0}
                                        >
                                            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                            تأكيد إرجاع البضاعة وصرف المبلغ
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ReturnInterface;

