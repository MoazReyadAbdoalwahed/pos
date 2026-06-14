import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import {
    Receipt,
    FileText,
    Calendar,
    User,
    Printer,
    Loader2,
    Search,
    PackageX,
    AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Input } from "../../../components/ui/Input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../../components/ui/Dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHead,
    TableRow,
} from "../../../components/ui/Table";
import Button from "../../../components/ui/Button";
import { useSales } from "../hook/useSales";

// Types
interface SaleItem {
    productId?: string;
    name: string;
    quantity: number;
    salesPrice: number;
    totalItemPrice: number;
}

interface SalesInvoice {
    _id: string;
    id: string;
    invoiceNumber: string;
    items?: SaleItem[];
    totalAmount?: number;
    createdAt: string;
    invoiceType?: 'sales' | 'return';
    cashierName?: string | null;
}

interface SalesInvoicesProps {
    onPrint?: (invoice: SalesInvoice) => void;
}

const SalesInvoices: React.FC<SalesInvoicesProps> = ({
    onPrint,
}) => {
    // ──── Redux State from useSales Hook ────
    const { sales, loading, error, fetchAll } = useSales();

    // ──── Local State ────
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

    const componentRef = useRef<HTMLDivElement>(null);
    const isReturnInvoice = selectedInvoice?.invoiceType === "return";

    // ──── Fetch invoices on mount ────
    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: selectedInvoice
            ? `فاتورة-${selectedInvoice.invoiceNumber}`
            : "فاتورة",
    });

    const formatDateTime = (isoString: string) => {
        if (!isoString) return { date: "", time: "" };
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString("en-US"),
            time: d.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }),
        };
    };

    // ──── فلترة الفواتير بناءً على نص البحث ────
    const filteredInvoices = (sales || []).filter((invoice) => {
        const invoiceNumStr = String(invoice.invoiceNumber || "");
        const matchesNumber = invoiceNumStr
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesItems = (invoice.items ?? []).some((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return matchesNumber || matchesItems;
    });

    return (
        <div className="space-y-6 text-slate-100" dir="rtl">
            {/* 🔴 Error Banner */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                        <p className="text-red-300 font-semibold text-sm">خطأ في جلب الفواتير</p>
                        <p className="text-red-300/70 text-xs mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* 1️⃣ الهيدر العلوي لملخص الفواتير */}
            <Card className="bg-[#1e293b] border-slate-800 shadow-lg">
                <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0 flex-wrap gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-white text-lg font-bold">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            سجل فواتير المبيعات
                        </CardTitle>
                        <p className="text-xs text-slate-400">
                            مراجعة وطباعة فواتير الخزينة الحالية
                        </p>
                    </div>
                    <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold px-3 py-1 text-sm">
                        إجمالي المحصلة: {(sales || []).length} فاتورة
                    </Badge>
                </CardHeader>
            </Card>

            {/* 2️⃣ شريط البحث */}
            <Card className="bg-[#1e293b] border-slate-800 shadow-md">
                <CardContent className="pt-4 pb-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث برقم الفاتورة، أو اسم السلعة المباعة داخلياً..."
                            className="pr-10 bg-[#0f172a] border-slate-700 text-slate-200 placeholder-slate-500 focus:border-indigo-500 transition-all text-right"
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 3️⃣ عرض قائمة الفواتير */}
            <Card className="bg-[#1e293b] border-slate-800 shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-slate-200 text-sm font-bold">
                        <Receipt className="w-4 h-4 text-slate-400" />
                        العمليات الأخيرة المكتملة{" "}
                        {searchTerm && `(نتائج البحث: ${filteredInvoices.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-sm">جاري جلب الفواتير من السيرفر...</p>
                        </div>
                    ) : (sales || []).length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-600 stroke-1" />
                            <p className="text-sm">لا توجد فواتير مبيعات مسجلة في الوردية الحالية</p>
                            <p className="text-xs text-slate-500 mt-1">
                                تظهر البيانات هنا مباشرة بعد تأكيد الدفع في الكاشير
                            </p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <PackageX className="w-12 h-12 mx-auto mb-3 text-slate-600 stroke-1" />
                            <p className="text-sm">
                                لم يتم العثور على أي فواتير تطابق نص البحث: "{searchTerm}"
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredInvoices.map((invoice, index) => {
                                const { date, time } = formatDateTime(invoice.createdAt);
                                const totalItems = (invoice.items ?? []).reduce(
                                    (acc, item) => acc + item.quantity,
                                    0
                                );
                                const isInvoiceReturn = invoice.invoiceType === "return";

                                return (
                                    <Card
                                        key={`${invoice._id ?? invoice.id ?? invoice.invoiceNumber ?? index}`}
                                        className="bg-[#0f172a] border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer shadow-sm group"
                                        onClick={() => {
                                            setSelectedInvoice(invoice);
                                            setIsInvoiceDialogOpen(true);
                                        }}
                                    >
                                        <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                isInvoiceReturn
                                                                    ? "text-rose-400 border-rose-500/20 bg-rose-500/5 font-mono text-xs"
                                                                    : "text-indigo-400 border-indigo-500/20 bg-indigo-500/5 font-mono text-xs"
                                                            }
                                                        >
                                                            {invoice.invoiceNumber}
                                                        </Badge>
                                                        <span
                                                            className={
                                                                isInvoiceReturn
                                                                    ? "text-xs text-rose-300 font-medium"
                                                                    : "text-xs text-slate-400 font-medium"
                                                            }
                                                        >
                                                            {totalItems}{" "}
                                                            {isInvoiceReturn ? "قطع مسترجعة" : "قطع مباعة"}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar
                                                                className={
                                                                    isInvoiceReturn
                                                                        ? "w-3.5 h-3.5 text-rose-400"
                                                                        : "w-3.5 h-3.5 text-slate-500"
                                                                }
                                                            />
                                                            {date} • {time}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User
                                                                className={
                                                                    isInvoiceReturn
                                                                        ? "w-3.5 h-3.5 text-rose-400"
                                                                        : "w-3.5 h-3.5 text-slate-500"
                                                                }
                                                            />
                                                            <span
                                                                className={
                                                                    isInvoiceReturn
                                                                        ? "text-slate-300"
                                                                        : "text-slate-400"
                                                                }
                                                            >
                                                                كاشير: اكرم بصلة
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-left min-w-25">
                                                    <div
                                                        className={
                                                            isInvoiceReturn
                                                                ? "text-base font-black text-rose-400 font-mono"
                                                                : "text-base font-black text-emerald-400 font-mono"
                                                        }
                                                    >
                                                        {Math.round(invoice.totalAmount ?? 0).toLocaleString()}{" "}
                                                        ج.م
                                                    </div>
                                                    <span
                                                        className={
                                                            isInvoiceReturn
                                                                ? "text-[10px] text-rose-300 underline opacity-0 group-hover:opacity-100 transition-opacity block mt-1"
                                                                : "text-[10px] text-indigo-400 underline opacity-0 group-hover:opacity-100 transition-opacity block mt-1"
                                                        }
                                                    >
                                                        عرض الفاتورة ←
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 4️⃣ نافذة تفاصيل الفاتورة (Modal) */}
            <Dialog
                open={isInvoiceDialogOpen}
                onOpenChange={setIsInvoiceDialogOpen}
            >
                <DialogContent
                    className="max-w-3xl bg-[#1e293b] border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto"
                    dir="rtl"
                >
                    <DialogHeader>
                        <DialogTitle className="flex flex-wrap items-center gap-2 text-white font-bold text-lg border-b border-slate-800 pb-3">
                            <Receipt
                                className={
                                    isReturnInvoice
                                        ? "w-5 h-5 text-rose-400"
                                        : "w-5 h-5 text-indigo-400"
                                }
                            />
                            <span>
                                {isReturnInvoice
                                    ? "تفاصيل إيصال المرتجع الرقمي"
                                    : "تفاصيل إيصال الدفع الرقمي"}
                            </span>
                            {isReturnInvoice && (
                                <Badge className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-1 text-xs font-semibold">
                                    مرتجع
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            نافذة منبثقة تعرض تفاصيل الفاتورة الرقمية وإمكانية طباعتها حرارياً.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvoice && (
                        <div className="space-y-6 pt-2 px-6 pb-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#0f172a] border border-slate-800/60 rounded-xl font-sans">
                                <div>
                                    <span className="text-[11px] text-slate-500 block mb-0.5">
                                        رقم الفاتورة
                                    </span>
                                    <p className="font-mono font-bold text-xs text-slate-200">
                                        {selectedInvoice.invoiceNumber}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block mb-0.5">
                                        تاريخ المعاملة
                                    </span>
                                    <p className="font-bold text-xs text-slate-200">
                                        {formatDateTime(selectedInvoice.createdAt).date}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block mb-0.5">
                                        توقيت القيد
                                    </span>
                                    <p className="font-mono text-xs text-slate-200">
                                        {formatDateTime(selectedInvoice.createdAt).time}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block mb-0.5">
                                        المسؤول القائم
                                    </span>
                                    <p className="font-bold text-xs text-slate-200">
                                        {selectedInvoice.cashierName || 'غير محدد'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-300 mb-3">
                                    بيان السلع والأسعار
                                </h3>
                                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0f172a]">
                                    <Table dir="rtl">
                                        <TableHeader className="bg-slate-900/50 border-b border-slate-800">
                                            <TableRow className="border-b border-slate-800 hover:bg-transparent">
                                                <TableHead className="text-right text-slate-400 text-xs font-bold">
                                                    اسم السلعة
                                                </TableHead>
                                                <TableHead className="text-center text-slate-400 text-xs font-bold w-28">
                                                    السعر المفرد
                                                </TableHead>
                                                <TableHead className="text-center text-slate-400 text-xs font-bold w-20">
                                                    الكمية
                                                </TableHead>
                                                <TableHead className="text-left text-slate-400 text-xs font-bold w-28">
                                                    الإجمالي الفرعي
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(selectedInvoice.items ?? []).map((item: SaleItem, index) => (
                                                <TableRow
                                                    key={item.productId || index}
                                                    className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
                                                >
                                                    <TableCell className="font-medium text-xs text-white text-right">
                                                        {item.name}
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono text-xs text-slate-300">
                                                        {Math.round(item.salesPrice || 0).toLocaleString()} ج.م
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono text-xs text-indigo-400 font-bold">
                                                        {item.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-left font-mono text-xs text-slate-200 font-semibold">
                                                        {Math.round(item.totalItemPrice || 0).toLocaleString()} ج.م
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2">
                                <div className="bg-white p-3 rounded-lg flex items-center justify-center overflow-hidden max-w-full">
                                    <Barcode
                                        value={String(selectedInvoice.invoiceNumber)}
                                        width={1.4}
                                        height={45}
                                        displayValue={false}
                                        background="#ffffff"
                                        lineColor="#000000"
                                    />
                                </div>
                                <span className="text-[11px] text-slate-400 font-sans">
                                    رمز باركود المعاملة المباشر
                                </span>
                            </div>

                            <div className="border-t border-slate-800 pt-4">
                                <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                                    <span className="text-sm font-bold text-slate-300">
                                        {isReturnInvoice
                                            ? "المبلغ الإجمالي المسترد:"
                                            : "المبلغ الإجمالي الصافي:"}
                                    </span>
                                    <span
                                        className={
                                            isReturnInvoice
                                                ? "text-xl font-black text-rose-400 font-mono"
                                                : "text-xl font-black text-emerald-400 font-mono"
                                        }
                                    >
                                        {Math.round(selectedInvoice.totalAmount ?? 0).toLocaleString()}{" "}
                                        ج.م
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 flex-wrap sm:flex-nowrap">
                                <Button
                                    className={`flex-1 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 ${isReturnInvoice
                                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        }`}
                                    onClick={() => {
                                        handlePrint();
                                        onPrint?.(selectedInvoice);
                                    }}
                                >
                                    <Printer className="w-4 h-4" />
                                    {isReturnInvoice
                                        ? "أمر طباعة إيصال المرتجع (Thermal)"
                                        : "أمر طباعة الإيصال الفوري (Thermal)"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white font-semibold text-xs h-9 transition-all w-full sm:w-auto"
                                    onClick={() => setIsInvoiceDialogOpen(false)}
                                >
                                    إغلاق النافذة
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* المكون المخفي المخصص للطباعة الحرارية */}
            <div
                style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
                aria-hidden="true"
                ref={componentRef}
            >
                {/* Add your ThermalReceipt component here */}
            </div>
        </div>
    );
};

export default SalesInvoices;
