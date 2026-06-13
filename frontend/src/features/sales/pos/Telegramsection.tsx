import React from "react";
import { MessageCircle } from "lucide-react";
import { Input } from "../../../components/ui/Input";

interface TelegramSectionProps {
    phone: string;
    onChange: (phone: string) => void;
    disabled?: boolean;
}

const TelegramSection: React.FC<TelegramSectionProps> = ({ phone, onChange, disabled }) => (
    <div className="p-4 bg-gradient-to-br from-[#1a2f4a] to-[#1a1f35] rounded-lg border border-cyan-700/30 shadow-lg shadow-cyan-900/20">
        <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-cyan-300">إرسال الفاتورة عبر التليجرام</h4>
        </div>

        <label className="block text-xs text-slate-300 font-semibold mb-1">رقم الهاتف</label>
        <Input
            type="tel"
            placeholder="01234567890 أو +201234567890"
            value={phone}
            onChange={(e) => onChange(e.target.value)}
            className="bg-[#0f172a] border-slate-700 text-white placeholder-slate-500 text-sm focus:border-cyan-500"
            disabled={disabled}
        />
        <p className="text-xs text-slate-500 mt-2">
            اتركه فارغاً لتخطي الإرسال · يجب أن يكون الرقم مرتبطاً بحساب تليجرام
        </p>
    </div>
);

export default TelegramSection;