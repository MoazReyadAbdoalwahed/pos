import { LogOut, Calculator } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Badge } from './ui/Badge';

const Header = () => {
    const { username, userRole, logout, isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    // الحصول على لون الـ badge بناءً على الدور
    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-red-500/10 border-red-500/20 text-red-400',
            manager: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
            cashier: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        };
        return colors[role] || 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    };

    // الحصول على نص الدور بصيغة واضحة
    const getRoleDisplayName = (role: string) => {
        const displayNames: Record<string, string> = {
            admin: 'إدارة نظام',
            manager: 'مدير',
            cashier: 'أمين صندوق',
        };
        return displayNames[role] || role;
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between" dir="rtl">
                    {/* Left Side - Logo and Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-900/30">
                            <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-wide">
                                نظام نقطة البيع المتكامل
                            </h1>
                            <p className="text-xs text-slate-400">إدارة ذكية وشاملة للمبيعات والمخزون المحلي</p>
                        </div>
                    </div>

                    {/* Right Side - User Info and Logout */}
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium">
                            متصل بالمخزن
                        </Badge>
                        <Badge
                            variant="outline"
                            className={`border px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(userRole || '')}`}
                        >
                            {username} • {getRoleDisplayName(userRole || '')}
                        </Badge>
                        <button
                            onClick={logout}
                            title="تسجيل الخروج"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            خروج
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
