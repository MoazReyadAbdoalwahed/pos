import React from "react";
import { Megaphone, BarChart3, Users, Send, Settings, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/Tabs";
import Button from "../../../components/ui/Button";

interface TelegramHeaderProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onCreateCampaign?: () => void;
}

const TelegramHeader: React.FC<TelegramHeaderProps> = ({
    activeTab = "campaigns",
    onTabChange,
    onCreateCampaign,
}) => {
    return (
        <div className="space-y-4" dir="rtl">
            {/* Main Header Section */}
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-800/60 rounded-xl p-4">
                {/* Title & Description */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-purple-400" />
                        </div>
                        <h1 className="text-xl font-bold text-white">نظام إدارة التسويق الكامل</h1>
                    </div>
                    <p className="text-xs text-slate-400 mr-13">
                        إرسل المنتجات والتقارير والرسائل الإعلانية للعملاء والموظفين بكفاءة
                    </p>
                </div>

                {/* Action Button */}
                <Button
                    onClick={onCreateCampaign}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 whitespace-nowrap shadow-lg shadow-purple-500/20"
                >
                    <Plus className="w-4 h-4 ml-2" />
                    حملة جديدة
                </Button>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid grid-cols-8 gap-2 h-auto bg-slate-900/60 border border-slate-800/60 p-2 rounded-lg w-full">
                    <TabsTrigger value="campaigns" className="flex flex-col gap-1">
                        <Megaphone className="w-4 h-4" />
                        <span className="text-xs">الحملات</span>
                    </TabsTrigger>

                    <TabsTrigger value="reports" className="flex flex-col gap-1">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs">التقارير</span>
                    </TabsTrigger>

                    <TabsTrigger value="broadcasts" className="flex flex-col gap-1">
                        <Send className="w-4 h-4" />
                        <span className="text-xs">الإرسال</span>
                    </TabsTrigger>

                    <TabsTrigger value="contacts" className="flex flex-col gap-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">التواصل</span>
                    </TabsTrigger>

                    <TabsTrigger value="linked" className="flex flex-col gap-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">المرتبطين</span>
                    </TabsTrigger>

                    <TabsTrigger value="invoices" className="flex flex-col gap-1">
                        <Send className="w-4 h-4" />
                        <span className="text-xs">الفواتير</span>
                    </TabsTrigger>

                    <TabsTrigger value="returns" className="flex flex-col gap-1">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs">المرتجعات</span>
                    </TabsTrigger>

                    <TabsTrigger value="settings" className="flex flex-col gap-1">
                        <Settings className="w-4 h-4" />
                        <span className="text-xs">الإعدادات</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab Contents */}
                <TabsContent value="campaigns" className="space-y-4">
                    {/* Content will be passed as children */}
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    {/* Reports content */}
                </TabsContent>

                <TabsContent value="broadcasts" className="space-y-4">
                    {/* Broadcasts content */}
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4">
                    {/* Contacts content */}
                </TabsContent>

                <TabsContent value="linked" className="space-y-4">
                    {/* Linked users content */}
                </TabsContent>

                <TabsContent value="invoices" className="space-y-4">
                    {/* Invoices content */}
                </TabsContent>

                <TabsContent value="returns" className="space-y-4">
                    {/* Returns content */}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    {/* Settings content */}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TelegramHeader;
