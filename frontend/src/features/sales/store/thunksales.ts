import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
    Sale,
    SaleFormData, ReturnSaleFormData
} from "../../../types/sales";
import { axiosInstance } from "../../../api/axiosInstance";
import { AxiosError } from "axios";


export const getAllSales = createAsyncThunk<Sale[], void, { rejectValue: string }>(
    'sales/getAllSales',
    async (_, { rejectWithValue }) => {
        try {
            console.log('🔄 Fetching sales from /sales endpoint...');
            const response = await axiosInstance.get('/sales');
            console.log('📦 Raw response:', response.data);

            // Backend returns { message: '...', invoices: [...] }
            const invoices = response.data.invoices || response.data;
            console.log('📋 Extracted invoices:', invoices);

            if (!Array.isArray(invoices)) {
                console.error('❌ Invoices is not an array:', typeof invoices, invoices);
                return [];
            }

            console.log('✅ Successfully fetched', invoices.length, 'sales');
            return invoices;
        } catch (error) {
            console.error('❌ Error fetching sales:', error);
            const axiosError = error as AxiosError<{ message: string }>;
            const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Failed to fetch sales';
            console.error('Error details:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

export const createSale = createAsyncThunk<Sale, SaleFormData, { rejectValue: string }>(
    'sales/createSale',
    async (saleData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/sales/add', saleData);
            return response.data as Sale;
        }
        catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to create sale');
        }
    }
);

export const createReturnSale = createAsyncThunk<Sale, ReturnSaleFormData, { rejectValue: string }>(
    'sales/createReturnSale',
    async (returnData, { rejectWithValue }) => {
        try {
            console.log('🔄 Submitting return invoice...');
            console.log('📤 Return data:', returnData);

            const response = await axiosInstance.post('/sales/return-invoice', returnData);
            console.log('📦 Return response:', response.data);

            return response.data as Sale;
        }
        catch (error) {
            console.error('❌ Error creating return sale:', error);
            const axiosError = error as AxiosError<{ message: string; error?: string }>;
            const errorMessage =
                axiosError.response?.data?.message ||
                axiosError.response?.data?.error ||
                axiosError.message ||
                'Failed to create return sale';
            console.error('Error details:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);
