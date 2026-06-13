import Product from "../models/productsModel.js";
import SalesInvoice from "../models/salesModel.js";
import PurchaseInvoice from "../models/purchaseModel.js";

export const getDashboardStats = async (req, res) => {
    try {
        // 1. استقبال تواريخ الفلترة من الـ Query Params
        const { startDate, endDate } = req.query;

        // بناء كائن الفلترة الزمني ديناميكياً
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate); // من تاريخ
            if (endDate) {
                // لضمان شمول اليوم الأخير بالكامل حتى نهاية الدقيقة 23:59:59.999
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.$lte = end; // إلى تاريخ
            }
        }

        let totalSales = 0;
        let totalProfit = 0;
        let salesCount = 0;
        let returnsAmount = 0;
        let returnsCount = 0;
        let returnsProfit = 0;

        // 2. حساب المبيعات والمرتجع بناءً على الفلتر الزمني (تحسين الأداء بتطبيق الـ match أولاً)
        const salesStats = await SalesInvoice.aggregate([
            // تصفية الفواتير بالتاريخ أولاً قبل التوزيع لتقليص حجم البيانات المستعلمة
            { $match: dateFilter },
            {
                $facet: {
                    sales: [
                        { $match: { invoiceType: "sales" } },
                        {
                            $group: {
                                _id: null,
                                totalSales: { $sum: "$totalAmount" },
                                totalProfit: { $sum: "$netProfit" },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    returns: [
                        { $match: { invoiceType: "return" } },
                        {
                            $group: {
                                _id: null,
                                returnsAmount: { $sum: "$totalAmount" },
                                count: { $sum: 1 },
                                returnsProfit: { $sum: "$netProfit" }
                            }
                        }
                    ]
                }
            }
        ]);

        // استخراج البيانات بأمان مع وضع قيم افتراضية
        if (salesStats && salesStats.length > 0) {
            const salesData = salesStats[0].sales?.[0];
            const returnsData = salesStats[0].returns?.[0];

            if (salesData) {
                totalSales = salesData.totalSales || 0;
                totalProfit = salesData.totalProfit || 0;
                salesCount = salesData.count || 0;
            }
            if (returnsData) {
                returnsAmount = returnsData.returnsAmount || 0;
                returnsCount = returnsData.count || 0;
                returnsProfit = returnsData.returnsProfit || 0;
            }
        }

        // الحسابات الرياضية الصافية
        const netSalesAfterReturns = Math.max(0, Number((totalSales - returnsAmount).toFixed(2)));
        const netSalesCountAfterReturns = Math.max(0, salesCount - returnsCount);

        // الأرباح الصافية (تطرح أرباح المرتجعات المرجوعة للعميل لتعطي الربح الحقيقي للدرج)
        const netProfitAfterReturns = Number((totalProfit - returnsProfit).toFixed(2));

        // 3. حساب المشتريات بناءً على الفلتر الزمني
        let totalPurchases = 0;
        let purchasesCount = 0;

        const purchaseStats = await PurchaseInvoice.aggregate([
            { $match: dateFilter }, // فلترة فواتير المشتريات بالتاريخ المختار
            {
                $group: {
                    _id: null,
                    totalPurchases: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        if (purchaseStats && purchaseStats.length > 0) {
            totalPurchases = purchaseStats[0].totalPurchases || 0;
            purchasesCount = purchaseStats[0].count || 0;
        }

        // 4. جلب الأصناف النواقص (تظل ثابتة للمخزن الحالي لحظياً)
        const lowStockProducts = await Product.find({ stock: { $lt: 5 } })
            .select("name stock sku category")
            .populate("category", "name color")
            .limit(10);

        // 5. جلب إجمالي المنتجات وحجم البضاعة الحالي بالمخزن
        let totalProductsCount = 0;
        let totalStockPieces = 0;

        const inventoryStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalProductsCount: { $sum: 1 },
                    totalStockPieces: { $sum: "$stock" }
                }
            }
        ]);

        if (inventoryStats && inventoryStats.length > 0) {
            totalProductsCount = inventoryStats[0].totalProductsCount || 0;
            totalStockPieces = inventoryStats[0].totalStockPieces || 0;
        } else {
            totalProductsCount = await Product.countDocuments({});
        }

        // 6. توزيع المنتجات الحالي على الفئات (Categories)
        const categoryDistribution = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    productsCount: { $sum: 1 },
                    stockPieces: { $sum: "$stock" }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: {
                    path: "$categoryDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    productsCount: 1,
                    stockPieces: 1,
                    categoryName: { $ifNull: ["$categoryDetails.name", "غير مصنف"] },
                    categoryColor: { $ifNull: ["$categoryDetails.color", "#6B7280"] }
                }
            }
        ]);

        // 7. إرجاع النتيجة الكاملة والمنسقة للفرونت إند
        return res.status(200).json({
            success: true,
            summary: {
                totalSales: netSalesAfterReturns,
                totalProfit: netProfitAfterReturns,
                totalPurchases: Number(totalPurchases.toFixed(2)),
                salesCount: netSalesCountAfterReturns,
                purchasesCount,
                totalProductsCount,
                totalStockPieces,
                returnsAmount: Number(returnsAmount.toFixed(2)),
                returnsCount,
                returnsProfit: Number(returnsProfit.toFixed(2))
            },
            categoryStats: categoryDistribution || [],
            lowStockWarnings: lowStockProducts || []
        });

    } catch (error) {
        console.error("❌ [Dashboard Stats Error]:", error.message);
        return res.status(500).json({
            success: false,
            message: "حدث خطأ غير متوقع أثناء تجميع تقارير الـ Dashboard الزمني",
            error: error.message
        });
    }
};