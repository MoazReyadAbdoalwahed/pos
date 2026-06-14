import { useState, useEffect, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { axiosInstance } from "../../../api/axiosInstance";
import { useToast } from "../../../hooks/use-toast";
import { useAppDispatch, useAppSelector } from "../../../hooks/storeHooks";
import { getAllproducts } from "../../../features/products/store/Thunkproducts";
import { selectAllProducts, selectProductsLoading } from "../../../features/products/store/productSelectors";
import type { Product } from "../../../types/product";
import { normalizeSku } from "../../../lib/utils";

export interface CartItem {
    productId: string;
    name: string;
    quantity: number;
    activePrice: number;
    salePrice: number;
    wholesalePrice?: number;
    priceType: "sale" | "wholesale" | "custom";
}

export function useSalesInterface() {
    const dispatch = useAppDispatch();
    const { toast } = useToast();

    // ── Redux ──────────────────────────────────────────────
    const products = useAppSelector(selectAllProducts);
    const productsLoading = useAppSelector(selectProductsLoading);
    const currentUser = useAppSelector(state => state.auth.user);
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
                toast({ title: `${product.name} غير متوفر حالياً`, variant: "destructive" });
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
            toast({ title: `${product.name} تمت الإضافة` });
        },
        [setCart, toast]
    );

    const handleBarcodeSubmit = useCallback(
        (barcode: string, reset: () => void) => {
            const normalizedBarcode = normalizeSku(barcode);
            const product = products.find((p) => normalizeSku(p.sku || p._id) === normalizedBarcode);
            if (product) {
                handleAddToCart(product);
                reset();
                return;
            }

            toast({ title: "باركود غير معروف - لم يتم العثور على منتج بهذا الرمز", variant: "destructive" });
            reset();
        },
        [products, handleAddToCart, toast]
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
            toast({ title: "السلة فارغة", variant: "destructive" });
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
                ...(item.priceType === 'custom' ? { customPrice: item.activePrice } : {}),
            }));

            const res = await axiosInstance.post(`/sales/check-invoice`, {
                items: backendItems,
                paymentMethod: "cash",
                cashierName: currentUser?.name,
            });

            const invoiceNumber = res.data?.invoice?.invoiceNumber ?? res.data?.invoiceNumber;
            if (!invoiceNumber) {
                throw new Error('لم يتم إنشاء الفاتورة بنجاح');
            }

            toast({ title: `تمت عملية البيع بنجاح - المبلغ: ${cartTotal.toLocaleString()} ج.م` });

            // تحديث قائمة المنتجات بعد خصم المخزون فوراً
            await dispatch(getAllproducts());

            // Send via Telegram if phone provided
            if (clientPhone.trim()) {
                setIsSendingTelegram(true);
                try {
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
                    toast({ title: "✅ تم إرسال الفاتورة عبر التليجرام" });
                    setClientPhone("");
                } catch (err: unknown) {
                    const e = err as { response?: { status?: number; data?: { error?: string; warning?: boolean; needsLink?: boolean } } } & Error;
                    const data = e.response?.data;
                    const status = e.response?.status;
                    const msg = data?.error ?? e.message ?? "خطأ عام";
                    if ((status === 200 && data?.warning) || (status === 400 && data?.needsLink)) {
                        toast({ title: `⚠️ لم يتم ربط التليجرام - ${msg}`, variant: "destructive" });
                    } else {
                        toast({ title: `❌ فشل إرسال التليجرام - ${msg}`, variant: "destructive" });
                    }
                } finally {
                    setIsSendingTelegram(false);
                }
            }

            setCart([]);
        } catch (err: unknown) {
            const e = err as Error;
            toast({ title: `خطأ في العملية - ${e.message}`, variant: "destructive" });
        } finally {
            setIsCheckingOut(false);
        }
    }, [cart, cartTotal, clientPhone, currentUser, dispatch, setCart, toast]);

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