import { createSlice } from '@reduxjs/toolkit';
import { getAllSales, createSale, createReturnSale } from "./thunksales";
import type { SaleState } from "../../../types/sales";

const initialState: SaleState = {
    sales: [],
    selectedSale: null,
    loading: false,
    error: null
};

const saleSlice = createSlice({
    name: 'sales',
    initialState,
    reducers: {
        clearSelectedSale(state) {
            state.selectedSale = null;
        },
        clearSaleErrors(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // getAllSales
            .addCase(getAllSales.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllSales.fulfilled, (state, action) => {
                state.loading = false;
                state.sales = action.payload;
            })
            .addCase(getAllSales.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // createSale
            .addCase(createSale.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSale.fulfilled, (state, action) => {
                state.loading = false;
                state.sales.push(action.payload);
            })
            .addCase(createSale.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // createReturnSale
            .addCase(createReturnSale.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createReturnSale.fulfilled, (state, action) => {
                state.loading = false;
                state.sales.push(action.payload);
            })
            .addCase(createReturnSale.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearSelectedSale, clearSaleErrors } = saleSlice.actions;
export default saleSlice.reducer;