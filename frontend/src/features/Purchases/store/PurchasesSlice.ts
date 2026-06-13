import { createSlice } from '@reduxjs/toolkit';
import type { PurchaseState } from '../../../types/puchase'; // تصحيح الاسم الإملائي
import {
    createPurchaseInvoice,
    getAllPurchasesInvoices,
    getPurchaseInvoiceById,
    updatePurchaseInvoiceThunk, // تم استخدام الاسم الصريح المتوافق مع الـ Thunk
    deletePurchaseInvoice
} from './thunkPurchases';

const initialState: PurchaseState = {
    purchases: [],
    selectedPurchase: null,
    loading: false,
    error: null,
};

const purchasesSlice = createSlice({
    name: 'purchases',
    initialState,
    reducers: {
        clearSelectedPurchase(state) {
            state.selectedPurchase = null;
        },
        clearPurchaseErrors(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // ── Create Purchase Invoice ──────────────────────────────────────
            .addCase(createPurchaseInvoice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPurchaseInvoice.fulfilled, (state, action) => {
                state.loading = false;
                state.purchases.push(action.payload);
            })
            .addCase(createPurchaseInvoice.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Get All Purchases Invoices ────────────────────────────────────
            .addCase(getAllPurchasesInvoices.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllPurchasesInvoices.fulfilled, (state, action) => {
                state.loading = false;
                state.purchases = action.payload;
            })
            .addCase(getAllPurchasesInvoices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Get Purchase Invoice By ID ────────────────────────────────────
            .addCase(getPurchaseInvoiceById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPurchaseInvoiceById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedPurchase = action.payload;
            })
            .addCase(getPurchaseInvoiceById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Update Purchase Invoice ──────────────────────────────────────
            .addCase(updatePurchaseInvoiceThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePurchaseInvoiceThunk.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.purchases.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.purchases[index] = action.payload;
                }
                if (state.selectedPurchase?.id === action.payload.id) {
                    state.selectedPurchase = action.payload;
                }
            })
            .addCase(updatePurchaseInvoiceThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ── Delete Purchase Invoice ──────────────────────────────────────
            .addCase(deletePurchaseInvoice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePurchaseInvoice.fulfilled, (state, action) => {
                state.loading = false;
                state.purchases = state.purchases.filter(p => p.id !== action.payload);
                if (state.selectedPurchase?.id === action.payload) {
                    state.selectedPurchase = null;
                }
            })
            .addCase(deletePurchaseInvoice.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearSelectedPurchase, clearPurchaseErrors } = purchasesSlice.actions;
export default purchasesSlice.reducer;