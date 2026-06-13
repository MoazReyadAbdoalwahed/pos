// hooks/useDashboard.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/storeHooks';
import { fetchDashboards } from '../store/thunkDashboard';
import { resetDashboard } from '../store/DashboardSlice';
import type { FetchDashboardParams } from '../store/thunkDashboard';
import {
    selectDashboardLoading,
    selectDashboardError,
    selectDashboardData,
    selectTotalSales,
    selectTotalProfit,
    selectTotalPurchases,
    selectSalesCount,
    selectPurchaseCount,
    selectTotalProductsCount,
    selectTotalStockPieces,
    selectReturnsAmount,
    selectReturnsCount,
    selectLowStockWarnings,
    selectCategoryStats,
    selectLowStockCount,
} from '../store/DashboardSelectors';

export const useDashboard = () => {
    const dispatch = useAppDispatch();

    // ── State ──────────────────────────────────────────────────────────────
    const loading = useAppSelector(selectDashboardLoading);
    const error = useAppSelector(selectDashboardError);
    const data = useAppSelector(selectDashboardData);
    const totalSales = useAppSelector(selectTotalSales);
    const totalProfit = useAppSelector(selectTotalProfit);
    const totalPurchases = useAppSelector(selectTotalPurchases);
    const salesCount = useAppSelector(selectSalesCount);
    const purchaseCount = useAppSelector(selectPurchaseCount);
    const totalProductsCount = useAppSelector(selectTotalProductsCount);
    const totalStockPieces = useAppSelector(selectTotalStockPieces);
    const returnsAmount = useAppSelector(selectReturnsAmount);
    const returnsCount = useAppSelector(selectReturnsCount);
    const lowStockWarnings = useAppSelector(selectLowStockWarnings);
    const categoryStats = useAppSelector(selectCategoryStats);
    const lowStockCount = useAppSelector(selectLowStockCount);

    // ── Actions ────────────────────────────────────────────────────────────
    const fetchStats = useCallback(
        (params?: FetchDashboardParams) => dispatch(fetchDashboards(params)),
        [dispatch]
    );

    const reset = useCallback(() => dispatch(resetDashboard()), [dispatch]);

    return {
        // raw data
        data,
        // ui state
        loading,
        error,
        // summary numbers
        totalSales,
        totalProfit,
        totalPurchases,
        salesCount,
        purchaseCount,
        totalProductsCount,
        totalStockPieces,
        returnsAmount,
        returnsCount,
        // lists
        lowStockWarnings,
        categoryStats,
        lowStockCount,
        // actions
        fetchStats,
        reset,
    };
};