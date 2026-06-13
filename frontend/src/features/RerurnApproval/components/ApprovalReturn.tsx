import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Eye,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    DollarSign,
    Filter,
} from "lucide-react";

// ── UI primitives ──────────────────────────────────────────────────────────
import Button from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Input } from "../../../components/ui/Input";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../../../components/ui/Table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../../components/ui/Dialog";
import { Card, CardContent } from "../../../components/ui/Card";

// ── Auth / Permission ──────────────────────────────────────────────────────
import { useAppSelector } from "../../../hooks/storeHooks";
import { selectUserRole } from "../../auth/store/authselectors";

// ── Domain hook (Redux) ────────────────────────────────────────────────────
import { useApproval } from "../hook/useApproval";
import type { ReturnStatus } from "../../../types/ApprovalReturn";

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════
type FilterValue = "all" | ReturnStatus;

interface ApproveFormValues {
    approvalNotes: string;
    totalRefundAmount: number;
}

interface RejectFormValues {
    rejectionReason: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Local ReturnRequest shape (matches server populated response)
// ════════════════════════════════════════════════════════════════════════════
interface ReturnItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    wholesalePrice?: number;
    totalItemPrice: number;
    priceType?: "sale" | "wholesale" | "custom";
}

interface ReturnRequest {
    _id: string;
    invoiceId: { _id: string; invoiceNumber: string; totalAmount: number };
    items: ReturnItem[];
    totalRefundAmount: number;
    reason: string;
    status: ReturnStatus;
    cashierId: { _id: string; name: string; username: string };
    approverUserId?: { _id: string; name: string };
    approvalDate?: string;
    approvalNotes?: string;
    createdAt: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Status Badge helper
// ════════════════════════════════════════════════════════════════════════════
const statusConfig: Record<ReturnStatus, {
    variant: "outline";
    icon: typeof Clock;
    label: string;
    className: string;
}> = {
    pending: {
        variant: "outline",
        icon: Clock,
        label: "قيد الانتظار",
        className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    },
    approved: {
        variant: "outline",
        icon: CheckCircle2,
        label: "موافق عليه",
        className: "border-green-500/30 bg-green-500/10 text-green-400",
    },
    rejected: {
        variant: "outline",
        icon: XCircle,
        label: "مرفوض",
        className: "border-red-500/30 bg-red-500/10 text-red-400",
    },
};

const StatusBadge: React.FC<{ status: ReturnStatus }> = ({ status }) => {
    const cfg = statusConfig[status];
    const Icon = cfg.icon;
    return (
        <Badge variant={cfg.variant} className={`gap-1.5 ${cfg.className}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </Badge>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// Approve Dialog
// ════════════════════════════════════════════════════════════════════════════
interface ApproveDialogProps {
    returnId: string;
    originalAmount: number;
    isOpen: boolean;
    isProcessing: boolean;
    onClose: () => void;
    onSubmit: (id: string, notes: string) => void;
}

const ApproveDialog: React.FC<ApproveDialogProps> = ({
    returnId,
    originalAmount,
    isOpen,
    isProcessing,
    onClose,
    onSubmit,
}) => {
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<ApproveFormValues>({
        defaultValues: { approvalNotes: "", totalRefundAmount: originalAmount },
    });

    const currentAmount = useWatch({ control, name: "totalRefundAmount" });
    const isModified = Number(currentAmount) !== originalAmount;

    const onValid = (data: ApproveFormValues) => {
        onSubmit(returnId, data.approvalNotes);
        reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader className="border-b border-slate-800 pb-4">
                    <DialogTitle className="text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        تأكيد الموافقة على المرتجع
                    </DialogTitle>
                    <DialogDescription>
                        يمكنك إضافة ملاحظة قبل الاعتماد
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onValid)} className="p-6 space-y-5">
                    {/* Refund amount (display only — not sent to server) */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-indigo-400" />
                            المبلغ المسترجع
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                step="0.01"
                                {...register("totalRefundAmount", {
                                    required: "المبلغ مطلوب",
                                    min: { value: 0.01, message: "يجب أن يكون أكبر من صفر" },
                                })}
                                className="flex-1"
                                dir="ltr"
                            />
                            <span className="text-slate-400 text-sm shrink-0">ر.س</span>
                        </div>
                        {isModified && (
                            <p className="text-xs text-yellow-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                المبلغ الأصلي: {originalAmount.toLocaleString()} ر.س
                            </p>
                        )}
                        {errors.totalRefundAmount && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.totalRefundAmount.message}
                            </p>
                        )}
                    </div>

                    {/* Notes (optional) */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            ملاحظات{" "}
                            <span className="text-slate-500 font-normal">(اختياري)</span>
                        </label>
                        <textarea
                            {...register("approvalNotes")}
                            rows={2}
                            placeholder="أضف ملاحظة للكاشير..."
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isProcessing}
                            loadingSpinner={
                                <span className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" /> جاري الاعتماد...
                                </span>
                            }
                            icon={CheckCircle2}
                            iconPosition="left"
                        >
                            اعتماد المرتجع
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            إلغاء
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// Reject Dialog
// ════════════════════════════════════════════════════════════════════════════
interface RejectDialogProps {
    returnId: string;
    isOpen: boolean;
    isProcessing: boolean;
    onClose: () => void;
    onSubmit: (id: string, reason: string) => void;
}

const RejectDialog: React.FC<RejectDialogProps> = ({
    returnId,
    isOpen,
    isProcessing,
    onClose,
    onSubmit,
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RejectFormValues>({ defaultValues: { rejectionReason: "" } });

    const onValid = (data: RejectFormValues) => {
        onSubmit(returnId, data.rejectionReason);
        reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader className="border-b border-slate-800 pb-4">
                    <DialogTitle className="text-white flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        تأكيد رفض طلب المرتجع
                    </DialogTitle>
                    <DialogDescription>
                        سبب الرفض مطلوب ويُرسل للكاشير لمراجعته
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onValid)} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-red-400" />
                            سبب الرفض <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            {...register("rejectionReason", {
                                required: "سبب الرفض مطلوب",
                                minLength: { value: 5, message: "الحد الأدنى 5 أحرف" },
                            })}
                            rows={3}
                            placeholder="اذكر سبباً واضحاً..."
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition"
                        />
                        {errors.rejectionReason && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.rejectionReason.message}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button
                            type="submit"
                            variant="danger"
                            fullWidth
                            isLoading={isProcessing}
                            loadingSpinner={
                                <span className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" /> جاري الرفض...
                                </span>
                            }
                            icon={XCircle}
                            iconPosition="left"
                        >
                            رفض الطلب
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            إلغاء
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// Items detail table inside expanded row
// ════════════════════════════════════════════════════════════════════════════
const ItemsTable: React.FC<{ items: ReturnRequest["items"] }> = ({ items }) => (
    <div className="rounded-lg border border-slate-700/50 overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">السعر</TableHead>
                    <TableHead className="text-center">النوع</TableHead>
                    <TableHead className="text-left">الإجمالي</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item, idx) => (
                    <TableRow key={idx}>
                        <TableCell className="font-medium text-slate-200 text-right">
                            {item.name}
                        </TableCell>
                        <TableCell className="text-center text-slate-300">
                            {item.quantity}
                        </TableCell>
                        <TableCell className="text-center text-slate-300" dir="ltr">
                            {item.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                            {item.priceType && item.priceType !== "sale" ? (
                                <Badge
                                    variant="secondary"
                                    className="text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                                >
                                    {item.priceType === "wholesale" ? "جملة" : "مخصص"}
                                </Badge>
                            ) : (
                                <span className="text-slate-500 text-xs">عادي</span>
                            )}
                        </TableCell>
                        <TableCell className="text-left text-indigo-400 font-semibold" dir="ltr">
                            {item.totalItemPrice.toLocaleString()} ر.س
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);

// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════
const ReturnApprovalComponent: React.FC = () => {
    const userRole = useAppSelector(selectUserRole);

    // ── simple permission check without importing the hook ───────────────
    const canApproveReturnRequest = userRole === "admin" || userRole === "manager";

    const {
        pendingReturns,
        returnHistory,
        loading,
        error,
        pendingReturnsCount,
        fetchPending,
        fetchHistory,
        approveReturn,
        rejectReturn,
    } = useApproval();

    // ── local UI state ───────────────────────────────────────────────────
    const [filter, setFilter] = useState<FilterValue>("pending");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [approveTarget, setApproveTarget] = useState<ReturnRequest | null>(null);
    const [rejectTarget, setRejectTarget] = useState<ReturnRequest | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // ── data resolution ──────────────────────────────────────────────────
    const displayed: ReturnRequest[] =
        filter === "all"
            ? [
                ...(pendingReturns as unknown as ReturnRequest[]),
                ...(returnHistory as unknown as ReturnRequest[]),
            ]
            : filter === "pending"
                ? (pendingReturns as unknown as ReturnRequest[])
                : (returnHistory as unknown as ReturnRequest[]).filter(
                    (r) => r.status === filter
                );

    // ── fetch on filter change ───────────────────────────────────────────
    useEffect(() => {
        if (filter === "pending") {
            fetchPending();
        } else {
            fetchHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const handleRefresh = () => {
        if (filter === "pending") fetchPending();
        else fetchHistory();
    };

    // ════════════════════════════════════════════════════════════════════
    // ✅ FIX 2: approve — NO handleRefresh() after dispatch.
    // The slice already moves the item from pendingReturns → returnHistory
    // on fulfilled, so calling handleRefresh() would fire a second request.
    // ════════════════════════════════════════════════════════════════════
    const handleApprove = async (id: string, approvalNotes: string) => {
        setProcessingId(id);
        try {
            await approveReturn(id, { approvalNotes });
            setApproveTarget(null);
            setExpandedId(null);
            // ❌ removed: handleRefresh() — was causing the double request
        } finally {
            setProcessingId(null);
        }
    };

    // ════════════════════════════════════════════════════════════════════
    // ✅ FIX 2: reject — same fix, no second fetch after dispatch
    // ════════════════════════════════════════════════════════════════════
    const handleReject = async (id: string, rejectionReason: string) => {
        setProcessingId(id);
        try {
            await rejectReturn(id, { rejectionReason });
            setRejectTarget(null);
            setExpandedId(null);
            // ❌ removed: handleRefresh() — was causing the double request
        } finally {
            setProcessingId(null);
        }
    };

    // ── guard ────────────────────────────────────────────────────────────
    if (!canApproveReturnRequest) {
        return (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
                <p className="text-red-300 font-semibold">
                    ليس لديك صلاحية الوصول إلى صفحة الموافقات.
                </p>
            </div>
        );
    }

    // ── stats ────────────────────────────────────────────────────────────
    const approvedCount = (returnHistory as unknown as ReturnRequest[]).filter(
        (r) => r.status === "approved"
    ).length;
    const rejectedCount = (returnHistory as unknown as ReturnRequest[]).filter(
        (r) => r.status === "rejected"
    ).length;

    // ════════════════════════════════════════════════════════════════════
    // Render
    // ════════════════════════════════════════════════════════════════════
    return (
        <div className="space-y-6" dir="rtl">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        نظام موافقة المرتجعات
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        إدارة طلبات المرتجعات والموافقة عليها
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        iconPosition="left"
                        onClick={handleRefresh}
                        disabled={loading}
                        className={loading ? "[&_svg]:animate-spin" : ""}
                        title="تحديث"
                    />
                    <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterValue)}
                            className="bg-transparent text-sm text-slate-300 outline-none cursor-pointer"
                        >
                            <option value="pending">قيد الانتظار</option>
                            <option value="all">الكل</option>
                            <option value="approved">الموافق عليه</option>
                            <option value="rejected">المرفوض</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "قيد الانتظار", value: pendingReturnsCount, color: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/5" },
                    { label: "موافق عليه", value: approvedCount, color: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/5" },
                    { label: "مرفوض", value: rejectedCount, color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/5" },
                ].map((stat) => (
                    <Card key={stat.label} className={`border ${stat.border} ${stat.bg} bg-slate-800/30`}>
                        <CardContent className="p-4">
                            <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="text-red-400 text-sm">{error}</span>
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-slate-400 mt-3 text-sm">جاري التحميل...</p>
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && displayed.length === 0 && (
                <div className="text-center py-14 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                        {filter === "pending"
                            ? "لا توجد طلبات قيد الانتظار حالياً"
                            : "لا توجد طلبات مرتجعات"}
                    </p>
                </div>
            )}

            {/* ── List ── */}
            {!loading && displayed.length > 0 && (
                <div className="space-y-3">
                    {displayed.map((ret) => {
                        const isExpanded = expandedId === ret._id;
                        return (
                            <Card
                                key={ret._id}
                                className="border border-slate-700/50 bg-slate-800/50 overflow-hidden hover:border-slate-600/50 transition-colors"
                            >
                                {/* Row header */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/20 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : ret._id)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <StatusBadge status={ret.status} />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-white text-sm truncate">
                                                فاتورة:{" "}
                                                <span className="text-indigo-400">
                                                    {ret.invoiceId?.invoiceNumber ?? "—"}
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {ret.cashierId?.name ?? "—"} •{" "}
                                                {new Date(ret.createdAt).toLocaleDateString("ar-SA")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <p className="font-bold text-indigo-400 text-sm" dir="ltr">
                                            {ret.totalRefundAmount.toLocaleString()} ر.س
                                        </p>
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                            : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="border-t border-slate-700/50 bg-slate-900/30 p-4 space-y-4">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">السبب</p>
                                            <p className="text-slate-300 text-sm">{ret.reason}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">المنتجات المرتجعة</p>
                                            <ItemsTable items={ret.items} />
                                        </div>

                                        {ret.approverUserId && (
                                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
                                                <p>
                                                    <span className="font-semibold text-slate-300">
                                                        {ret.status === "approved" ? "اعتمد بواسطة" : "رُفض بواسطة"}:
                                                    </span>{" "}
                                                    {ret.approverUserId.name}
                                                    {ret.approvalDate && (
                                                        <span className="text-slate-500">
                                                            {" "}— {new Date(ret.approvalDate).toLocaleDateString("ar-SA")}
                                                        </span>
                                                    )}
                                                </p>
                                                {ret.approvalNotes && (
                                                    <p className="italic text-slate-500">{ret.approvalNotes}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions — pending only */}
                                        {ret.status === "pending" && (
                                            <div className="flex gap-3 pt-2 border-t border-slate-700/50">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    icon={CheckCircle2}
                                                    iconPosition="left"
                                                    onClick={(e) => { e.stopPropagation(); setApproveTarget(ret); }}
                                                    disabled={!!processingId}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                                >
                                                    موافقة
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    icon={XCircle}
                                                    iconPosition="left"
                                                    onClick={(e) => { e.stopPropagation(); setRejectTarget(ret); }}
                                                    disabled={!!processingId}
                                                    className="flex-1"
                                                >
                                                    رفض
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Approve Dialog ── */}
            {approveTarget && (
                <ApproveDialog
                    returnId={approveTarget._id}
                    originalAmount={approveTarget.totalRefundAmount}
                    isOpen={!!approveTarget}
                    isProcessing={processingId === approveTarget._id}
                    onClose={() => setApproveTarget(null)}
                    onSubmit={handleApprove}
                />
            )}

            {/* ── Reject Dialog ── */}
            {rejectTarget && (
                <RejectDialog
                    returnId={rejectTarget._id}
                    isOpen={!!rejectTarget}
                    isProcessing={processingId === rejectTarget._id}
                    onClose={() => setRejectTarget(null)}
                    onSubmit={handleReject}
                />
            )}
        </div>
    );
};

export default ReturnApprovalComponent;