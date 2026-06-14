import React, { useEffect, useState } from "react";
import {
    TrendingUp,
    ShoppingCart,
    Package,
    Warehouse,
    BarChart3,
    Send,
    RefreshCw,
    AlertTriangle,
    Loader2,
    Phone,
    CalendarRange,
    ArrowDownLeft,
    ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useToast } from "../../../hooks/use-toast";
import { useDashboard } from "../hook/useDashboard";
import { useTelegram } from "../../telegram/hook/useTelegram";

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    accent: string; // tailwind text color class
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, accent, loading }) => (
    <Card className="bg-[#131c2e] border-slate-800/60 shadow-xl">
        <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-slate-400 text-sm mb-2 truncate">{label}</p>
                    {loading ? (
                        <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse" />
                    ) : (
                        <p className={`text-2xl font-black font-mono ${accent}`}>
                            {typeof value === "number" ? Math.round(value).toLocaleString() : value}
                            {unit && <span className="text-sm font-normal text-slate-400 mr-1">{unit}</span>}
                        </p>
                    )}
                </div>
                <div className={`p-2.5 rounded-xl bg-slate-800/60 ${accent}`}>
                    {icon}
                </div>
            </div>
        </CardContent>
    </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// Low Stock Row
// ─────────────────────────────────────────────────────────────────────────────

interface LowStockRowProps {
    name: string;
    stock: number;
    sku?: string;
    categoryName?: string;
    categoryColor?: string;
}

const LowStockRow: React.FC<LowStockRowProps> = ({ name, stock, sku, categoryColor }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
        <div className="flex items-center gap-3 min-w-0">
            <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: categoryColor ?? "#6B7280" }}
            />
            <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{name}</p>
                {sku && <p className="text-xs text-slate-500 font-mono">{sku}</p>}
            </div>
        </div>
        <Badge
            variant={stock === 0 ? "destructive" : "secondary"}
            className={`shrink-0 font-mono text-xs ${stock === 0
                ? "bg-red-500/15 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}
        >
            {stock} قطعة
        </Badge>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
    const {
        loading,
        error,
        totalSales,
        totalProfit,
        totalPurchases,
        salesCount,
        purchaseCount,
        totalProductsCount,
        totalStockPieces,
        returnsAmount,
        returnsCount,
        lowStockWarnings,
        lowStockCount,
        fetchStats,
    } = useDashboard();

    const { triggerReport, loading: telegramLoading, errors: telegramErrors } = useTelegram();
    const { toast } = useToast();
    const showSuccess = (msg: string) => toast({ title: msg });
    const showError = (msg: string) => toast({ title: msg, variant: "destructive" });

    // ── Date filter state ──────────────────────────────────────────────────
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // ── Telegram state ─────────────────────────────────────────────────────
    const [telegramPhone, setTelegramPhone] = useState("");
    const [isSending, setIsSending] = useState(false);

    // ── Fetch on mount ─────────────────────────────────────────────────────
    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilter = () => {
        if (!startDate && !endDate) {
            showError("يرجى إدخال تاريخ واحد على الأقل");
            return;
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            showError("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
            return;
        }

        // Convert mm/dd/yyyy to ISO format yyyy-mm-dd
        const convertToISO = (dateStr: string) => {
            if (!dateStr) return undefined;
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const [mm, dd, yyyy] = parts;
                return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            }
            return dateStr; // return as-is if already in correct format
        };

        const isoStartDate = convertToISO(startDate);
        const isoEndDate = convertToISO(endDate);

        fetchStats({ startDate: isoStartDate, endDate: isoEndDate });
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        fetchStats();
    };

    // ── Telegram report message ────────────────────────────────────────────
    const buildTelegramMessage = () =>
        `📊 التقرير اليومي:\n` +
        `✅ عدد المبيعات: ${salesCount}\n` +
        `✅ إجمالي الإيرادات: ${totalSales.toLocaleString()} ج.م\n` +
        `✅ صافي الربح: ${totalProfit.toLocaleString()} ج.م\n` +
        `✅ متوسط قيمة المرداود: ${returnsAmount.toLocaleString()} ج.م\n` +
        `✅ عدد المرتجعات: ${returnsCount}\n` +
        `✅ إجمالي المشتريات: ${totalPurchases.toLocaleString()} ج.م\n` +
        `✅ عدد فواتير الشراء: ${purchaseCount}\n` +
        `📦 المنتجات: ${totalProductsCount} | المخزون: ${totalStockPieces} قطعة\n` +
        `⚠️ تحذيرات المخزون: ${lowStockCount}`;

    const handleSendTelegram = async () => {
        if (!telegramPhone.trim()) {
            showError("يرجى إدخال رقم الهاتف");
            return;
        }

        setIsSending(true);
        try {
            const payload = {
                dailyStats: {
                    totalSalesToday: totalSales,
                    totalRevenue: totalSales,
                    totalNetProfit: totalProfit,
                    avgTransactionValue: salesCount > 0 ? totalSales / salesCount : 0,
                }
            };

            const result = await triggerReport(payload);

            if (result.type.endsWith('/fulfilled')) {
                showSuccess("✅ تم إرسال التقرير بنجاح!");
                setTelegramPhone("");
            } else if (result.type.endsWith('/rejected')) {
                showError(`❌ ${telegramErrors.triggerReport || 'فشل إرسال التقرير'}`);
            }
        } catch (err) {
            showError("حدث خطأ أثناء إرسال التقرير");
        } finally {
            setIsSending(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0d1627] text-slate-100 p-4 md:p-6 space-y-6 font-sans" dir="rtl">

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-7 h-7 text-violet-400" />
                    <div>
                        <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
                        <p className="text-xs text-slate-500">ملخص أداء المبيعات والمخزون</p>
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    disabled={loading}
                    title="تحديث البيانات"
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* ── Error banner ──────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm" role="alert">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* ── Date filter ───────────────────────────────────────────────── */}
            <Card className="bg-[#131c2e] border-slate-800/60 shadow-xl">
                <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="flex items-center gap-2 text-slate-200 text-base font-semibold">
                        <ClipboardList className="w-4 h-4 text-violet-400" />
                        تخصيص فلاتر البحث وإعداد التقرير
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        {/* Report type */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">نوع ومجال التقرير</label>
                            <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition">
                                <option value="general">لوحة تحكم عامة</option>
                                <option value="sales">تقرير المبيعات</option>
                                <option value="purchases">تقرير المشتريات</option>
                                <option value="returns">تقرير المرتجعات</option>
                                <option value="inventory">تقرير المخزون</option>
                            </select>
                        </div>

                        {/* Start date */}
                        <div>
                            <label className="flex text-xs text-slate-400 mb-1.5 items-center gap-1">
                                <CalendarRange className="w-3.5 h-3.5" />
                                تاريخ البداية
                            </label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white focus:ring-violet-500/30 focus:border-violet-500"
                            />
                        </div>

                        {/* End date */}
                        <div>
                            <label className="flex text-xs text-slate-400 mb-1.5 items-center gap-1">
                                <CalendarRange className="w-3.5 h-3.5" />
                                تاريخ النهاية
                            </label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white focus:ring-violet-500/30 focus:border-violet-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-start mt-4">
                        <Button
                            onClick={handleFilter}
                            disabled={loading}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-6 text-sm"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                            تطبيق الفلتر
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Primary stats ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="إجمالي المبيعات"
                    value={totalSales}
                    unit="ج.م"
                    icon={<TrendingUp className="w-5 h-5" />}
                    accent="text-emerald-400"
                    loading={loading}
                />
                <StatCard
                    label="إجمالي الأرباح"
                    value={totalProfit}
                    unit="ج.م"
                    icon={<BarChart3 className="w-5 h-5" />}
                    accent="text-violet-400"
                    loading={loading}
                />
                <StatCard
                    label="عدد المبيعات"
                    value={salesCount}
                    icon={<ClipboardList className="w-5 h-5" />}
                    accent="text-sky-400"
                    loading={loading}
                />
                <StatCard
                    label="إجمالي المشتريات"
                    value={totalPurchases}
                    unit="ج.م"
                    icon={<ShoppingCart className="w-5 h-5" />}
                    accent="text-amber-400"
                    loading={loading}
                />
            </div>

            {/* ── Secondary stats ───────────────────────────────────────────── */}
            <Card className="bg-[#131c2e] border-slate-800/60 shadow-xl">
                <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="flex items-center gap-2 text-slate-200 text-base font-semibold">
                        <Package className="w-4 h-4 text-amber-400" />
                        ملخص البيانات
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                        <div className="bg-slate-800/40 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-xs mb-1">عدد المنتجات</p>
                            <p className="text-2xl font-black text-white font-mono">
                                {loading ? "—" : totalProductsCount.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-slate-800/40 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-xs mb-1">إجمالي المخزون</p>
                            <p className="text-2xl font-black text-sky-300 font-mono">
                                {loading ? "—" : `${totalStockPieces.toLocaleString()} قطعة`}
                            </p>
                        </div>

                        <div className="bg-slate-800/40 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-xs mb-1">عدد الشحنات الواردة</p>
                            <p className="text-2xl font-black text-amber-300 font-mono">
                                {loading ? "—" : purchaseCount.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-slate-800/40 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-xs mb-1">إجمالي المرتجعات</p>
                            <p className="text-2xl font-black text-rose-400 font-mono">
                                {loading ? "—" : `${returnsAmount.toLocaleString()} ج.م`}
                            </p>
                        </div>

                        <div className="bg-slate-800/40 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-xs mb-1">عدد المرتجعات</p>
                            <p className="text-2xl font-black text-rose-300 font-mono">
                                {loading ? "—" : returnsCount.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-slate-800/40 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-xs mb-1 flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                تحذيرات المخزون
                            </p>
                            <p className={`text-2xl font-black font-mono ${lowStockCount > 0 ? "text-amber-400" : "text-slate-400"}`}>
                                {loading ? "—" : lowStockCount}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Low stock warnings ────────────────────────────────────────── */}
            {lowStockWarnings.length > 0 && (
                <Card className="bg-[#131c2e] border-amber-500/20 shadow-xl">
                    <CardHeader className="pb-2 pt-4 px-5">
                        <CardTitle className="flex items-center gap-2 text-amber-400 text-base font-semibold">
                            <AlertTriangle className="w-4 h-4" />
                            أصناف تحتاج تجديد في المخزون
                            <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-xs mr-auto">
                                {lowStockWarnings.length} صنف
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <div className="max-h-52 overflow-y-auto space-y-0 pr-1">
                            {lowStockWarnings.map((item) => (
                                <LowStockRow
                                    key={item._id}
                                    name={item.name}
                                    stock={item.stock}
                                    sku={item.sku}
                                    categoryName={item.category?.name}
                                    categoryColor={item.category?.color}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Telegram report ───────────────────────────────────────────── */}
            <Card className="bg-[#131c2e] border-slate-800/60 shadow-xl">
                <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="flex items-center gap-2 text-slate-200 text-base font-semibold">
                        <Send className="w-4 h-4 text-sky-400" />
                        إرسال التقرير اليومي للتليجرام
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-4">
                    {/* Phone input */}
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="flex text-xs text-slate-400 mb-1.5 items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                رقم الهاتف
                            </label>
                            <Input
                                type="tel"
                                placeholder="مثال: 01234567890 أو +201234567890"
                                value={telegramPhone}
                                onChange={(e) => setTelegramPhone(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:ring-sky-500/30 focus:border-sky-500"
                                dir="ltr"
                            />
                            <p className="text-xs text-slate-600 mt-1">💡 أدخل رقم الهاتف المسجل في النظام</p>
                        </div>
                        <Button
                            onClick={handleSendTelegram}
                            disabled={isSending || loading || telegramLoading.triggerReport}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-5 whitespace-nowrap"
                        >
                            {isSending || telegramLoading.triggerReport ? (
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                            ) : (
                                <Send className="w-4 h-4 ml-2" />
                            )}
                            إرسال التقرير الآن
                        </Button>
                    </div>

                    {/* Preview of message */}
                    <div className="bg-[#0d1627] border border-slate-800 rounded-xl p-4 space-y-1 text-xs font-mono text-slate-300 leading-relaxed" dir="rtl">
                        <p className="text-slate-500 text-xs mb-2 font-sans">📄 سيتم إرسال:</p>
                        {buildTelegramMessage().split("\n").map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};

export default DashboardPage;

