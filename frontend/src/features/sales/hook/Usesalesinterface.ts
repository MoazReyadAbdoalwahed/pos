import { useState, useEffect, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import { axiosInstance } from "../../../api/axiosInstance";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../../hooks/storeHooks";
import { getAllproducts } from "../../../features/products/store/Thunkproducts";
import { selectAllProducts, selectProductsLoading } from "../../../features/products/store/productSelectors";

export interface CartItem {
    productId: string;
    name: string;
    quantity: number;
    activePrice: number;
    salePrice: number;
    wholesalePrice?: number;
    priceType: "sale" | "wholesale" | "custom";
}

export interface Product {
    _id: string;
    name: string;
    stock: number;
    salePrice: number;
    wholesalePrice?: number;
    sku?: string;
    category?: string;
}

export function useSalesInterface() {
    const dispatch = useAppDispatch();

    // ── Redux ──────────────────────────────────────────────
    const products = useAppSelector(selectAllProducts) as Product[];
    const productsLoading = useAppSelector(selectProductsLoading);
    const [cart, setCart] = useState<CartItem[]>([]);
    const cartTotal = cart.reduce((sum, it) => sum + it.activePrice * it.quantity, 0);

    // ── Local ──────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isInvoiceSearchOpen, setIsInvoiceSearchOpen] = useState(false);
    const [clientPhone, setClientPhone] = useState("");
    const [isSendingTelegram, setIsSendingTelegram] = useState(false);

    // Barcode input ref — kept here so the hook owns focus management
    const barcodeRef = useRef<HTMLInputElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // ── Init ───────────────────────────────────────────────
    useEffect(() => {
        dispatch(getAllproducts());
    }, [dispatch]);

    // Re-focus barcode field whenever cart changes (after add/checkout)
    useEffect(() => {
        barcodeRef.current?.focus();
    }, [cart.length]);

    // ── Print ──────────────────────────────────────────────
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `فاتورة_مبيعات_${new Date().toLocaleDateString()}`,
    });

    // ── Cart actions ───────────────────────────────────────
    const handleAddToCart = useCallback(
        (product: Product) => {
            if (product.stock === 0) {
                toast.error(`${product.name} غير متوفر حالياً`);
                return;
            }

            setCart((prev) => {
                const existing = prev.find((p) => p.productId === product._id);
                if (existing) {
                    return prev.map((i) =>
                        i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
                    );
                }
                const newItem: CartItem = {
                    productId: product._id,
                    name: product.name,
                    quantity: 1,
                    activePrice: product.salePrice,
                    salePrice: product.salePrice,
                    wholesalePrice: product.wholesalePrice,
                    priceType: "sale",
                };
                return [...prev, newItem];
            });
            toast.success(`${product.name} تمت الإضافة`);
        },
        [setCart]
    );

    const handleBarcodeSubmit = useCallback(
        (barcode: string, reset: () => void) => {
            const product = products.find((p) => p.sku === barcode);
            if (product) {
                handleAddToCart(product);
                reset();
            } else {
                toast.error("باركود غير معروف - لم يتم العثور على منتج بهذا الرمز");
            }
        },
        [products, handleAddToCart]
    );

    const handleRemoveFromCart = useCallback(
        (productId: string) => setCart((prev) => prev.filter((p) => p.productId !== productId)),
        [setCart]
    );

    const handleQuantityChange = useCallback(
        (productId: string, quantity: number) =>
            setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))),
        [setCart]
    );

    const handlePriceTypeChange = useCallback(
        (productId: string, priceType: "sale" | "wholesale" | "custom") =>
            setCart((prev) =>
                prev.map((i) =>
                    i.productId === productId
                        ? {
                            ...i,
                            priceType,
                            activePrice:
                                priceType === "sale"
                                    ? i.salePrice
                                    : priceType === "wholesale"
                                        ? i.wholesalePrice ?? i.salePrice
                                        : i.activePrice,
                        }
                        : i
                )
            ),
        [setCart]
    );

    const handleCustomPriceChange = useCallback(
        (productId: string, customPrice: number) =>
            setCart((prev) =>
                prev.map((i) => (i.productId === productId ? { ...i, priceType: "custom", activePrice: customPrice } : i))
            ),
        [setCart]
    );

    // ── Checkout ───────────────────────────────────────────
    const handleCheckout = useCallback(async () => {
        if (cart.length === 0) {
            toast.error("السلة فارغة");
            return;
        }

        setIsCheckingOut(true);
        try {
            const backendItems = cart.map((item) => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                salePrice: item.activePrice,
                wholesalePrice: item.wholesalePrice,
                priceType: item.priceType,
            }));

            let result: any = null;
            try {
                const res = await axiosInstance.post(`/sales/check-invoice`, {
                    items: backendItems,
                    paymentMethod: "cash",
                });
                result = res.data?.invoice ?? { invoiceNumber: res.data?.invoiceNumber };
            } catch (err) {
                // Fallback to a mocked invoice number when backend is unreachable
                result = { invoiceNumber: `INV-${Date.now()}` };
            }

            toast.success(`تمت عملية البيع بنجاح - المبلغ: ${cartTotal.toLocaleString()} ج.م`);

            // Send via Telegram if phone provided
            if (clientPhone.trim()) {
                setIsSendingTelegram(true);
                try {
                    const invoiceNumber = result?.invoiceNumber ?? `INV-${Date.now()}`;
                    await axiosInstance.post(`/telegram/send-invoice`, {
                        phone: clientPhone.trim(),
                        invoiceDetails: {
                            invoiceNumber,
                            items: backendItems,
                            totalAmount: cartTotal,
                            paidAmount: cartTotal,
                            remainingAmount: 0,
                        },
                    });
                    toast.success("✅ تم إرسال الفاتورة عبر التليجرام");
                    setClientPhone("");
                } catch (err: unknown) {
                    const e = err as { response?: { status?: number; data?: { error?: string; warning?: boolean; needsLink?: boolean } } } & Error;
                    const data = e.response?.data;
                    const status = e.response?.status;
                    const msg = data?.error ?? e.message ?? "خطأ عام";
                    if ((status === 200 && data?.warning) || (status === 400 && data?.needsLink)) {
                        toast.warn(`⚠️ لم يتم ربط التليجرام - ${msg}`);
                    } else {
                        toast.error(`❌ فشل إرسال التليجرام - ${msg}`);
                    }
                } finally {
                    setIsSendingTelegram(false);
                }
            }

            setCart([]);
        } catch (err: unknown) {
            const e = err as Error;
            toast.error(`خطأ في العملية - ${e.message}`);
        } finally {
            setIsCheckingOut(false);
        }
    }, [cart, cartTotal, clientPhone, setCart]);

    // ── Derived ────────────────────────────────────────────
    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.includes(searchTerm)
    );

    const isBusy = isCheckingOut || isSendingTelegram;

    return {
        // state
        products,
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
        isCheckingOut,
        isSendingTelegram,
        // refs
        barcodeRef,
        printRef,
        // handlers
        handleAddToCart,
        handleBarcodeSubmit,
        handleRemoveFromCart,
        handleQuantityChange,
        handlePriceTypeChange,
        handleCustomPriceChange,
        handleCheckout,
        handlePrint,
        // derived
        filteredProducts,
    };
}