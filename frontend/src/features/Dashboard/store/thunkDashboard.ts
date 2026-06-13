// store/thunkDashboard.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../../api/axiosInstance';
import type { DashboardResponse } from '../../../types/Dashboard';
import { AxiosError } from 'axios';

// Optional date filter params
export interface FetchDashboardParams {
    startDate?: string; // ISO string e.g. "2025-01-01"
    endDate?: string;
}

// ✅ Returns a single DashboardResponse, not an array
export const fetchDashboards = createAsyncThunk<
    DashboardResponse,
    FetchDashboardParams | void,
    { rejectValue: string }
>(
    'dashboard/fetchDashboards',
    async (params, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.startDate) queryParams.set('startDate', params.startDate);
            if (params?.endDate) queryParams.set('endDate', params.endDate);

            const url = `/dashboard${queryParams.toString() ? `?${queryParams}` : ''}`;
            const response = await axiosInstance.get<DashboardResponse>(url);
            return response.data;
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            // Return the backend's error message, not the generic axios message
            return rejectWithValue(
                err.response?.data?.message || err.message || 'Failed to fetch dashboard'
            );
        }
    }
);