import React, { useEffect, useState, useRef } from "react";
import { Loader2, Printer, Receipt, RotateCcw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Input } from "../../../components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/Dialog";
import Button from "../../../components/ui/Button";
import { useToast } from "../../../hooks/use-toast";
import { useAppSelector, useAppDispatch } from "../../../hooks/storeHooks";
import { selectSales } from "../store/salesSelectors";
import type { Sale } from "../../../types/sales";
import { useApproval } from "../../RerurnApproval/hook/useApproval";

// import ThermalReceipt from "./ThermalReceipt";

import { useSalesInterface } from "../hook/Usesalesinterface";
import BarcodeScanner from "../pos/Barcodescanner";
import ThermalReceipt from "../pos/ThermalReceipt";
import ProductCard from "../pos/Productcard";
import CartItemRow from "../pos/Cartitemrow";
import TelegramSection from "../pos/Telegramsection";

const SalesInterface: React.FC = () => {
    const {
        productsLoading,
        cart,
        cartTotal,
        searchTerm,
        setSearchTerm,
        clientPhone,
        setClientPhone,
        isInvoiceSearchOpen,
        setIsInvoiceSearchOpen,
        isBusy,
        isSendingTelegram,
        barcodeRef,
        printRef,
        handleAddToCart,
        handleBarcodeSubmit,
        handleRemoveFromCart,
        handleQuantityChange,
        handlePriceTypeChange,
        handleCustomPriceChange,
        handleCheckout,
        handlePrint,
        filteredProducts,
    } = useSalesInterface();

    const { toast } = useToast();
    const showSuccess = (msg: string) => toast({ title: msg });
    const showError = (msg: string) => toast({ title: msg, variant: "destructive" });

    const { submitReturnRequest } = useApproval();

    const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
    const [searchAttempted, setSearchAttempted] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
    const [returnReason, setReturnReason] = useState("");
    const invoiceInputRef = useRef<HTMLInputElement>(null);
    const reasonInputRef = useRef<HTMLTextAreaElement>(null);
    const [returnPriceType, setReturnPriceType] = useState<"sale" | "wholesale" | "custom">("sale");
    const [returnQuantity, setReturnQuantity] = useState(1);
    const [customReturnPrice, setCustomReturnPrice] = useState<number | null>(null);
    const sales = useAppSelector(selectSales);
    const searchResults = React.useMemo(
        () =>
            invoiceSearchQuery.trim()
                ? sales.filter((sale) => sale.invoiceNumber === invoiceSearchQuery.trim())
                : [],
        [sales, invoiceSearchQuery]
    );

    // Calculate refund amount based on price type
    const calculateRefundAmount = React.useMemo(() => {
        if (!selectedInvoice) return 0;

        let totalAmount = 0;
        for (const item of selectedInvoice.items) {
            let itemPrice = item.salesPrice; // default to sale price

            if (returnPriceType === "wholesale" && item.wholesalePrice) {
                itemPrice = item.wholesalePrice;
            } else if (returnPriceType === "custom" && customReturnPrice !== null) {
                itemPrice = customReturnPrice;
            }

            totalAmount += itemPrice * item.quantity;
        }
        return totalAmount;
    }, [selectedInvoice, returnPriceType, customReturnPrice]);

    const handleInvoiceSearch = (event?: React.FormEvent) => {
        event?.preventDefault();
        const query = invoiceSearchQuery.trim();

        if (!query) {
            showError("يرجى إدخال رقم الفاتورة للبحث");
            setSearchAttempted(true);
            setSelectedInvoice(null);
            invoiceInputRef.current?.focus();
            return;
        }

        setSearchAttempted(true);

        if (searchResults.length === 0) {
            showError("لم يتم العثور على فاتورة بهذا الرقم");
            setSelectedInvoice(null);
            invoiceInputRef.current?.focus();
            return;
        }

        const foundInvoice = searchResults[0];
        setSelectedInvoice(foundInvoice);
        setReturnReason("");
        setReturnQuantity(1);
        setReturnPriceType("sale");
        showSuccess(`تم العثور على فاتورة ${foundInvoice.invoiceNumber}`);
    };

    const handleSendReturnRequest = async () => {
        if (!selectedInvoice) return;
        if (!returnReason.trim()) {
            showError("يرجى إدخال سبب الإرجاع");
            return;
        }

        try {
            await submitReturnRequest({
                invoiceId: selectedInvoice._id,
                items: selectedInvoice.items.map(item => {
                    let itemPrice = item.salesPrice;
                    let wholesalePrice = item.wholesalePrice || item.salesPrice;

                    if (returnPriceType === "wholesale" && item.wholesalePrice) {
                        itemPrice = item.wholesalePrice;
                    } else if (returnPriceType === "custom" && customReturnPrice !== null) {
                        itemPrice = customReturnPrice;
                    }

                    return {
                        productId: item.productId,
                        name: item.name,
                        quantity: item.quantity,
                        salesPrice: itemPrice,
                        wholesalePrice,
                        totalItemPrice: item.quantity * itemPrice,
                        priceType: returnPriceType
                    };
                }),
                totalRefundAmount: calculateRefundAmount,
                reason: returnReason.trim()
            });

            showSuccess(`تم إرسال طلب الإرجاع للفاتورة ${selectedInvoice.invoiceNumber}`);
            setIsInvoiceSearchOpen(false);
            setSelectedInvoice(null);
            setInvoiceSearchQuery("");
            setSearchAttempted(false);
            setReturnReason("");
            setReturnQuantity(1);
            setReturnPriceType("sale");
            setCustomReturnPrice(null);
        } catch (error) {
            console.error(error);
            showError("فشل إرسال طلب الإرجاع");
        }
    };

    const handleSearchAnotherInvoice = () => {
        setSelectedInvoice(null);
        setInvoiceSearchQuery("");
        setSearchAttempted(false);
        setReturnReason("");
        setReturnQuantity(1);
        setReturnPriceType("sale");
        setCustomReturnPrice(null);

        setTimeout(() => invoiceInputRef.current?.focus(), 0);
    };

    useEffect(() => {
        if (isInvoiceSearchOpen) {
            setTimeout(() => invoiceInputRef.current?.focus(), 0);
        }
    }, [isInvoiceSearchOpen]);

    return (
        <div className="space-y-6 p-6 min-h-screen bg-[#0f172a] text-slate-100" dir="rtl">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">نقطة البيع</h1>
                    <p className="text-sm text-slate-400">إدارة المبيعات والمخزون</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => setIsInvoiceSearchOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        طلب إرجاع
                    </Button>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 text-sm">
                        {productsLoading ? "جاري التحميل..." : "متصل بالمخزن"}
                    </Badge>
                </div>
            </div>

            {/* ── Main Grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Products ─────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Barcode scanner — owns its own RHF instance */}
                    <BarcodeScanner
                        barcodeRef={barcodeRef}
                        disabled={isBusy || productsLoading}
                        onSubmit={handleBarcodeSubmit}
                    />

                    {/* Product grid */}
                    <Card className="bg-[#1e293b] border-slate-800 shadow-xl">
                        <CardHeader className="space-y-3">
                            <CardTitle className="flex items-center gap-2 text-slate-200 font-semibold text-lg">
                                <Search className="w-5 h-5 text-indigo-400" />
                                المنتجات المتاحة
                            </CardTitle>
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ابحث باسم المنتج أو رقم الباركود..."
                                className="bg-[#0f172a] border-slate-700 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
                                disabled={productsLoading}
                            />
                        </CardHeader>
                        <CardContent>
                            {productsLoading && filteredProducts.length === 0 ? (
                                <div className="flex items-center justify-center py-12 gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                    <p className="text-slate-400">جاري تحميل المنتجات...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredProducts.map((product) => (
                                        <ProductCard
                                            key={product._id}
                                            product={product}
                                            onClick={handleAddToCart}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right: Cart ────────────────────────────────── */}
                <div>
                    <Card className="bg-[#1e293b] border-slate-800 shadow-2xl sticky top-6">
                        <CardHeader className="border-b border-slate-800 pb-3">
                            <CardTitle className="flex items-center gap-2 text-slate-200 font-semibold text-lg">
                                <Receipt className="w-5 h-5 text-emerald-400" />
                                سلة المشتريات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">

                            {cart.length === 0 ? (
                                <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-2">
                                    <Receipt className="w-8 h-8 text-slate-600 stroke-1" />
                                    <p className="text-sm">السلة فارغة</p>
                                </div>
                            ) : (
                                <>
                                    {/* Cart items */}
                                    <div className="space-y-3 max-h-95 overflow-y-auto pr-1">
                                        {cart.map((item) => (
                                            <CartItemRow
                                                key={item.productId}
                                                item={item}
                                                onRemove={handleRemoveFromCart}
                                                onQuantityChange={handleQuantityChange}
                                                onPriceTypeChange={handlePriceTypeChange}
                                                onCustomPriceChange={handleCustomPriceChange}
                                            />
                                        ))}
                                    </div>

                                    <hr className="border-t border-slate-800" />

                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-slate-400 text-sm">إجمالي الحساب:</span>
                                        <span className="text-2xl font-black text-emerald-400 font-mono">
                                            {cartTotal.toLocaleString()}{" "}
                                            <span className="text-xs font-normal">ج.م</span>
                                        </span>
                                    </div>

                                    {/* Telegram */}
                                    <TelegramSection
                                        phone={clientPhone}
                                        onChange={setClientPhone}
                                        disabled={isBusy}
                                    />

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() => handlePrint()}
                                            className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white font-medium"
                                            disabled={isBusy || cart.length === 0}
                                        >
                                            <Printer className="w-4 h-4 ml-2" />
                                            طباعة
                                        </Button>
                                        <Button
                                            onClick={handleCheckout}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20"
                                            disabled={isBusy || cart.length === 0}
                                        >
                                            {isBusy && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                            {isSendingTelegram ? "إرسال..." : "إتمام البيع"}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Hidden Thermal Receipt for print action ───────────────────── */}
            <div style={{ position: "absolute", left: -9999, top: -9999, width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
                <ThermalReceipt ref={printRef} cart={cart} total={cartTotal} />
            </div>

            {/* ── Return modal ───────────────────────────────────── */}
            <Dialog open={isInvoiceSearchOpen} onOpenChange={setIsInvoiceSearchOpen}>
                <DialogContent className="max-w-2xl bg-[#1e293b] border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-white">
                            بحث فاتورة طلب إرجاع
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            أدخل رقم الفاتورة لبدء طلب الإرجاع.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedInvoice ? (
                        <div className="p-6 space-y-4">
                            <div className="rounded-3xl border border-slate-800 bg-[#0f172a] p-5 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">طلب إرجاع المنتجات</h3>
                                        <p className="text-sm text-slate-400">فاتورة مرجعية لبدء طلب الإرجاع</p>
                                    </div>
                                    <span className="text-sm text-slate-300">{selectedInvoice.invoiceNumber}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                                    <div className="space-y-1">
                                        <p className="text-slate-400">الإجمالي</p>
                                        <p className="text-white font-semibold">{selectedInvoice.totalAmount.toLocaleString()} ج.م</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400">التاريخ</p>
                                        <p className="text-white font-semibold">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400">طريقة الدفع</p>
                                        <p className="text-white font-semibold">{selectedInvoice.paymentMethod}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400">نوع الفاتورة</p>
                                        <p className="text-white font-semibold">{selectedInvoice.invoiceType === "return" ? "مرتجع" : "بيع"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
                                <h4 className="text-sm font-semibold text-slate-200">المنتجات المتاحة للإرجاع</h4>
                                <div className="space-y-3">
                                    {selectedInvoice.items.map((item, index) => (
                                        <div key={index} className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-[#111827] p-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-white">{item.name}</span>
                                                <span className="text-sm text-slate-400">الكمية: {item.quantity}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-400">
                                                <span>السعر</span>
                                                <span className="text-slate-100">{item.salesPrice.toLocaleString()} ج.م</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm text-slate-300">سبب الإرجاع</label>
                                <textarea
                                    ref={reasonInputRef}
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    placeholder="أدخل سبب الإرجاع هنا"
                                    className="w-full min-h-25 rounded-2xl border border-slate-700 bg-[#0f172a] p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-slate-300">نوع سعر الاسترجاع</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: "سعر البيع", value: "sale" },
                                        { label: "سعر الجملة", value: "wholesale" },
                                        { label: "سعر مخصص", value: "custom" },
                                    ].map((option) => (
                                        <Button
                                            key={option.value}
                                            type="button"
                                            variant={returnPriceType === option.value ? "primary" : "secondary"}
                                            onClick={() => setReturnPriceType(option.value as "sale" | "wholesale" | "custom")}
                                            className="min-w-30"
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </div>

                                {returnPriceType === "custom" && (
                                    <Input
                                        type="number"
                                        value={customReturnPrice ?? ""}
                                        onChange={(e) => setCustomReturnPrice(parseFloat(e.target.value) || null)}
                                        placeholder="أدخل السعر المخصص"
                                        className="w-full bg-[#0f172a] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500"
                                    />
                                )}
                            </div>

                            <div className="rounded-3xl border border-slate-800 bg-[#111827] p-4 text-slate-100">
                                <div className="flex justify-between items-center text-sm text-slate-400">
                                    <span>إجمالي المبلغ المسترجع</span>
                                    <span className="font-semibold text-white">
                                        {calculateRefundAmount.toLocaleString()} ج.م
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleSearchAnotherInvoice}
                                    className="w-full sm:w-auto"
                                >
                                    بحث عن فاتورة أخرى
                                </Button>
                                <div className="flex flex-1 gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setIsInvoiceSearchOpen(false)}
                                        className="w-full"
                                    >
                                        إغلاق
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSendReturnRequest}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        إرسال طلب الإرجاع
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleInvoiceSearch} className="p-6 space-y-4">
                            <Input
                                ref={invoiceInputRef}
                                value={invoiceSearchQuery}
                                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                                placeholder="رقم الفاتورة أو رقم الإيصال"
                                className="bg-[#0f172a] border-slate-700 text-slate-100 placeholder-slate-500"
                            />
                            {searchAttempted && (
                                <p className="text-sm text-slate-300">
                                    {searchResults.length > 0
                                        ? `تم العثور على ${searchResults.length} فاتورة.`
                                        : "لم يتم العثور على فاتورة بعد البحث."}
                                </p>
                            )}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setIsInvoiceSearchOpen(false)}
                                    className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                >
                                    إغلاق
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    بحث
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SalesInterface;

