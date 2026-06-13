// types/Dashboard.ts

// ─── Low stock product shape ───────────────────────────────────────────────
export interface LowStockWarning {
    _id: string;
    name: string;
    stock: number;
    sku?: string;
    category?: {
        name: string;
        color: string;
    };
}

// ─── Category distribution shape ──────────────────────────────────────────
export interface CategoryStat {
    _id: string;
    productsCount: number;
    stockPieces: number;
    categoryName: string;
    categoryColor: string;
}

// ─── Summary shape — matches backend response exactly ─────────────────────
export interface DashboardSummary {
    totalSales: number;
    totalProfit: number;
    totalPurchases: number;
    salesCount: number;
    purchasesCount: number;
    totalProductsCount: number;
    totalStockPieces: number;
    returnsAmount: number;
    returnsCount: number;
    returnsProfit: number;
}

// ─── Full dashboard response from GET /dashboards ─────────────────────────
// Backend returns ONE object: { success, summary, categoryStats, lowStockWarnings }
// NOT an array — this is the root fix
export interface DashboardResponse {
    success: boolean;
    summary: DashboardSummary;
    categoryStats: CategoryStat[];
    lowStockWarnings: LowStockWarning[];
}