import React, { useRef } from "react";
import {
    Megaphone, ImagePlus, X, Send, Sparkles,
    CheckCircle2, XCircle, Users, Clock, AlertCircle,
    Loader2, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { useMarketingCampaign } from "../hook/Usemarketingcampaign";
import type { CampaignResult } from "../hook/Usemarketingcampaign";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Single history card */
const CampaignHistoryCard: React.FC<{ item: CampaignResult }> = ({ item }) => (
    <div className="group flex items-start gap-3 p-3 rounded-xl bg-[#13103a]/60 border border-purple-900/30 hover:border-purple-600/40 transition-all duration-200">
        {item.imageUrl ? (
            <img
                src={item.imageUrl}
                alt="campaign"
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-purple-900/40"
            />
        ) : (
            <div className="w-10 h-10 rounded-lg bg-purple-900/30 border border-purple-900/40 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4 text-purple-400" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 truncate leading-relaxed">{item.message}</p>
            <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> {item.sent} تم
                </span>
                {item.failed > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-rose-400">
                        <XCircle className="w-3 h-3" /> {item.failed} فشل
                    </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-slate-500 mr-auto">
                    <Clock className="w-3 h-3" /> {item.sentAt}
                </span>
            </div>
        </div>
    </div>
);

/** Stat pill */
const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({
    icon, label, value, color
}) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${color}`}>
        {icon}
        <div>
            <p className="text-xs text-slate-400 leading-none mb-0.5">{label}</p>
            <p className="text-sm font-bold text-white font-mono">{value}</p>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const MarketingCampaigns: React.FC = () => {
    const {
        register,
        handleSubmit,
        formErrors,
        isValid,
        charCount,
        imageFile,
        imagePreview,
        fileInputRef,
        handleImageSelect,
        handleDrop,
        handleDragOver,
        clearImage,
        isSending,
        broadcastError,
        lastResult,
        history,
    } = useMarketingCampaign();

    const MAX_CHARS = 4096;
    const charPercent = Math.min((charCount / MAX_CHARS) * 100, 100);
    const charColor = charCount > MAX_CHARS * 0.9 ? "text-rose-400" : charCount > MAX_CHARS * 0.7 ? "text-amber-400" : "text-slate-500";

    return (
        <div
            className="min-h-screen bg-[#0b0920] text-slate-100 p-6 font-sans"
            dir="rtl"
        >
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">الحملات التسويقية</h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            أرسل العروض والخصومات مباشرة لجميع العملاء المشتركين — بضغطة واحدة
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Main grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── RIGHT: Campaign history ───────────────────────────────── */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-[#110e30] border-purple-900/30 shadow-xl shadow-purple-950/20">
                        <CardHeader className="pb-3 border-b border-purple-900/20">
                            <CardTitle className="flex items-center justify-between text-slate-200 text-base font-semibold">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                    حالة الحملة
                                </span>
                                {history.length > 0 && (
                                    <Badge className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs">
                                        {history.length} حملة
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {/* Last result stats */}
                            {lastResult?.results && (
                                <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-purple-900/20">
                                    <StatPill
                                        icon={<Users className="w-3.5 h-3.5 text-blue-400" />}
                                        label="إجمالي"
                                        value={lastResult.results.total}
                                        color="bg-blue-500/5 border-blue-500/20"
                                    />
                                    <StatPill
                                        icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                        label="تم الإرسال"
                                        value={lastResult.results.sent}
                                        color="bg-emerald-500/5 border-emerald-500/20"
                                    />
                                </div>
                            )}

                            {history.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-900/20 border border-purple-900/30 flex items-center justify-center">
                                        <Megaphone className="w-6 h-6 text-purple-600 stroke-1" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400 font-medium">لا توجد حملات في هذه الجلسة</p>
                                        <p className="text-xs text-slate-600 mt-1">أطلق حملتك الأولى!</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                    {history.map((item) => (
                                        <CampaignHistoryCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}

                            {/* Tips */}
                            <div className="mt-4 pt-4 border-t border-purple-900/20">
                                <p className="text-xs text-purple-400 font-semibold mb-2">نصائح سريعة</p>
                                <ul className="space-y-1.5 text-[11px] text-slate-500 leading-relaxed">
                                    <li className="flex items-start gap-1.5">
                                        <Sparkles className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                                        استخدم "نص عريض" لإبراز العروض المهمة
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Sparkles className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                                        أضف Emoji لزيادة التفاعل مع الرسالة 🎯
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Sparkles className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                                        البوستر الإعلاني يرفع نسبة الفتح بشكل كبير
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Sparkles className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                                        تجنب الإرسال في ساعات متأخرة من الليل
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── LEFT: Campaign form ───────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <Card className="bg-[#110e30] border-purple-900/30 shadow-xl shadow-purple-950/20">
                        <CardHeader className="pb-4 border-b border-purple-900/20">
                            <CardTitle className="flex items-center gap-2 text-slate-200 text-base font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                إنشاء حملة جديدة
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-6" noValidate>

                                {/* ── Image upload ───────────────────────────── */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        بوستر الإعلان
                                        <span className="text-slate-500 font-normal mr-1">(اختياري)</span>
                                    </label>

                                    {imagePreview ? (
                                        /* Preview */
                                        <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-[#0b0920]">
                                            <img
                                                src={imagePreview}
                                                alt="معاينة البوستر"
                                                className="w-full max-h-52 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <button
                                                type="button"
                                                onClick={clearImage}
                                                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-rose-500/80 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="absolute bottom-3 right-3">
                                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                                                    <CheckCircle2 className="w-3 h-3 ml-1 inline" />
                                                    {imageFile?.name}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Drop zone */
                                        <div
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed border-purple-800/50 bg-purple-950/10 hover:border-purple-600/60 hover:bg-purple-950/20 cursor-pointer transition-all duration-200 group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center group-hover:bg-purple-900/50 transition-colors">
                                                <ImagePlus className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-slate-300">
                                                    اضغط لاختيار صورة{" "}
                                                    <span className="text-purple-400 font-medium">أو اسحبها هنا</span>
                                                </p>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    10MB كحد أقصى · PNG, JPG, WEBP
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
                                    />
                                </div>

                                {/* ── Message textarea ───────────────────────── */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-slate-300">
                                            نص الرسالة التسويقية
                                        </label>
                                        <span className={`text-xs font-mono ${charColor} transition-colors`}>
                                            {charCount} / {MAX_CHARS.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            {...register("message", {
                                                required: "نص الرسالة مطلوب",
                                                minLength: { value: 5, message: "الرسالة قصيرة جداً" },
                                                maxLength: { value: MAX_CHARS, message: `الحد الأقصى ${MAX_CHARS} حرف` },
                                            })}
                                            rows={6}
                                            placeholder="اكتب تفاصيل عرضك هنا... يمكنك استخدام Emoji 🎉 والنص بشكل **عريض** أو _مائل_"
                                            className={`w-full px-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 bg-[#0b0920] border resize-none outline-none transition-all duration-200 leading-relaxed
                                                focus:ring-2 focus:ring-purple-500/30
                                                ${formErrors.message
                                                    ? "border-rose-500/60 focus:border-rose-500"
                                                    : "border-purple-900/40 focus:border-purple-600/60"
                                                }`}
                                        />
                                        {/* Progress bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-purple-900/20 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${charCount > MAX_CHARS * 0.9 ? "bg-rose-500" : "bg-purple-500"}`}
                                                style={{ width: `${charPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {formErrors.message && (
                                        <p className="mt-1.5 flex items-center gap-1.5 text-rose-400 text-xs">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            {formErrors.message.message}
                                        </p>
                                    )}
                                </div>

                                {/* ── Broadcast error ───────────────────────── */}
                                {broadcastError && (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                        <XCircle className="w-4 h-4 shrink-0" />
                                        {broadcastError}
                                    </div>
                                )}

                                {/* ── Success summary ───────────────────────── */}
                                {lastResult?.success && lastResult.results && (
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <div className="text-sm">
                                            <p className="text-emerald-300 font-medium">تم إرسال الحملة بنجاح 🎉</p>
                                            <p className="text-emerald-500 text-xs mt-0.5">
                                                {lastResult.results.sent} من {lastResult.results.total} عميل تلقوا الرسالة
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ── Submit button ─────────────────────────── */}
                                <button
                                    type="submit"
                                    disabled={isSending || !isValid}
                                    className="w-full relative flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-base text-white transition-all duration-200
                                        bg-gradient-to-l from-purple-700 via-violet-600 to-purple-600
                                        hover:from-purple-600 hover:via-violet-500 hover:to-purple-500
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        shadow-lg shadow-purple-900/40
                                        active:scale-[0.99]"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>جاري الإرسال...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            <span>إطلاق الحملة التسويقية الآن</span>
                                            <span className="text-lg">🚀</span>
                                        </>
                                    )}
                                    {/* Shimmer on hover */}
                                    {!isSending && (
                                        <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                                    )}
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MarketingCampaigns;