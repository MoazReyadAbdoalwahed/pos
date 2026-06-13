// store/DashboardSlice.ts

import { createSlice } from '@reduxjs/toolkit';
import { fetchDashboards } from './thunkDashboard';
import type { DashboardResponse } from '../../../types/Dashboard';

interface DashboardState {
    data: DashboardResponse | null; // ✅ single object, not an array
    loading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    data: null,
    loading: false,
    error: null,
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        // Allow manual reset (useful when switching date filters)
        resetDashboard: (state) => {
            state.data = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboards.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboards.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchDashboards.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? 'Failed to fetch dashboard';
            });
    },
});

export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;