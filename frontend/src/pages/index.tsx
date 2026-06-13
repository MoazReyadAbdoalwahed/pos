import { useState, useEffect, useMemo } from 'react';
import {
    ShoppingCart, Package, FileText, BarChart3,
    Receipt, Users, Megaphone, LayoutGrid
} from 'lucide-react';
import Login from '../features/auth/components/Login';
import EmployeeManagement from '../features/auth/components/EmployeMangement';
import CategoryManagement from '../features/category/components/CategoryManagement';
import ProductManagement from '../features/products/components/ProductManagement';
import { useAuth } from '../features/auth/hooks/useAuth';
import SalesInvoices from "../features/sales/components/SalesInvoices";
import SalesInterface from "../features/sales/components/SalesInterface";
import ReturnInterface from "../features/sales/components/ReturnInterface";
import PurchaseInvoices from "../features/Purchases/components/PurchaseInvoices";
import ApprovalReturn from "../features/RerurnApproval/components/ApprovalReturn";
import Dashboard from "../features/Dashboard/components/Dashboard";
import Markting from "../features/telegram/components/Markting";
import Header from '../components/Header';
import { hasTabAccess } from '../lib/rolePermissions';

// ── أيقونات التبويبات ──
const tabIcons: Record<string, React.ReactNode> = {
    sales: <ShoppingCart className="w-4 h-4" />,
    products: <Package className="w-4 h-4" />,
    categories: <LayoutGrid className="w-4 h-4" />,
    'sales-invoices': <Receipt className="w-4 h-4" />,
    'return-invoices': <FileText className="w-4 h-4" />,
    'return-approval': <FileText className="w-4 h-4" />,
    invoices: <FileText className="w-4 h-4" />,
    reports: <BarChart3 className="w-4 h-4" />,
    employees: <Users className="w-4 h-4" />,
    marketing: <Megaphone className="w-4 h-4" />,
    dashboard: <LayoutGrid className="w-4 h-4" />,
};

export default function Home() {
    const { isAuthenticated, userRole } = useAuth();
    const [activeTab, setActiveTab] = useState('sales');
    const [isInitialized, setIsInitialized] = useState(false);

    // ── 1. قائمة كل التبويبات المتاحة ──
    const allTabs = useMemo(() => [
        { value: 'sales', label: 'السلة' },
        { value: 'products', label: 'إدارة المنتجات' },
        { value: 'categories', label: 'الفئات' },
        { value: 'sales-invoices', label: 'فواتير المبيعات' },
        { value: 'return-invoices', label: 'مرتجعات' },
        { value: 'return-approval', label: 'موافقة مرتجعات' },
        { value: 'invoices', label: 'فواتير الشراء' },
        // { value: 'reports', label: 'التقارير والتحليلات' },
        { value: 'employees', label: 'الموظفين' },
        { value: 'dashboard', label: 'لوحة التحكم' },
        ...(hasTabAccess('marketing', userRole || '')
            ? [{ value: 'marketing', label: 'الحملات التسويقية' }]
            : []
        ),
    ], [userRole]);

    // ── 2. تصفية التبويبات المتاحة للمستخدم الحالي ──
    const visibleTabs = useMemo(() => {
        return allTabs.filter((tab) => hasTabAccess(tab.value, userRole || ""));
    }, [allTabs, userRole]);

    // ── 3. إصلاح حماية التبويب النشط عند تغيير الدور ──
    useEffect(() => {
        if (!isInitialized) {
            setIsInitialized(true);
            return;
        }
        if (activeTab && !hasTabAccess(activeTab, userRole || "")) {
            setActiveTab("sales");
        }
    }, [userRole, isInitialized]);

    // ── Auth gate ─────────────────────────────────────────────────────────────
    if (!isAuthenticated) return <Login />;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                {/* Tab Navigation */}
                <div className="overflow-x-auto mb-6">
                    <div
                        className="inline-grid w-full bg-slate-900/50 border border-slate-800 h-auto p-1 rounded-xl shadow-lg gap-1"
                        style={{
                            gridTemplateColumns: `repeat(${Math.min(visibleTabs.length, 6)}, minmax(110px, 1fr))`
                        }}
                        dir="rtl"
                    >
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`flex flex-col gap-1 items-center justify-center py-2 px-2 rounded-lg transition-all whitespace-nowrap text-sm font-medium ${activeTab === tab.value
                                    ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                            >
                                {tabIcons[tab.value]}
                                <span className="text-[11px]">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6 focus-visible:outline-none focus-visible:ring-0">
                    {activeTab === 'sales' && <SalesInterface />}
                    {activeTab === 'products' && <ProductManagement />}
                    {activeTab === 'categories' && <CategoryManagement />}
                    {activeTab === 'sales-invoices' && <SalesInvoices />}
                    {activeTab === 'return-invoices' && <ReturnInterface />}
                    {activeTab === 'return-approval' && <ApprovalReturn />}
                    {activeTab === 'invoices' && <PurchaseInvoices />}
                    {activeTab === 'employees' && <EmployeeManagement />}
                    {activeTab === 'marketing' && <Markting />}
                    {activeTab === 'dashboard' && <Dashboard />}
                </div>
            </div>
        </div>
    );
}