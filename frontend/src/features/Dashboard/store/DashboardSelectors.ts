// store/DashboardSelectors.ts

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/store';

// ─── Base ──────────────────────────────────────────────────────────────────
export const selectDashboardLoading = (state: RootState) => state.dashboard.loading;
export const selectDashboardError = (state: RootState) => state.dashboard.error;
export const selectDashboardData = (state: RootState) => state.dashboard.data;

// ─── Summary fields (safe fallback to 0 when not loaded) ──────────────────
export const selectTotalSales = (state: RootState) => state.dashboard.data?.summary.totalSales ?? 0;
export const selectTotalProfit = (state: RootState) => state.dashboard.data?.summary.totalProfit ?? 0;
export const selectTotalPurchases = (state: RootState) => state.dashboard.data?.summary.totalPurchases ?? 0;
export const selectSalesCount = (state: RootState) => state.dashboard.data?.summary.salesCount ?? 0;
export const selectPurchaseCount = (state: RootState) => state.dashboard.data?.summary.purchasesCount ?? 0;
export const selectTotalProductsCount = (state: RootState) => state.dashboard.data?.summary.totalProductsCount ?? 0;
export const selectTotalStockPieces = (state: RootState) => state.dashboard.data?.summary.totalStockPieces ?? 0;
export const selectReturnsAmount = (state: RootState) => state.dashboard.data?.summary.returnsAmount ?? 0;
export const selectReturnsCount = (state: RootState) => state.dashboard.data?.summary.returnsCount ?? 0;
export const selectReturnsProfit = (state: RootState) => state.dashboard.data?.summary.returnsProfit ?? 0;

// ─── Lists (memoized to prevent unnecessary rerenders) ────────────────────
export const selectLowStockWarnings = createSelector(
    (state: RootState) => state.dashboard.data?.lowStockWarnings,
    (lowStockWarnings) => lowStockWarnings ?? []
);

export const selectCategoryStats = createSelector(
    (state: RootState) => state.dashboard.data?.categoryStats,
    (categoryStats) => categoryStats ?? []
);

// ─── Derived ───────────────────────────────────────────────────────────────
export const selectLowStockCount = (state: RootState) =>
    state.dashboard.data?.lowStockWarnings.length ?? 0;