import { createSlice } from '@reduxjs/toolkit';
import { getAllproducts, getProductById, createProduct, updateProduct, deleteProduct } from "./Thunkproducts";
import type { ProductState } from "../../../types/product";

const initialState: ProductState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearSelectedProduct(state) {
            state.selectedProduct = null;
        },
        clearProductErrors(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // getAllproducts
            .addCase(getAllproducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllproducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(getAllproducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // getProductById
            .addCase(getProductById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getProductById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedProduct = action.payload;
            })
            .addCase(getProductById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // createProduct
            .addCase(createProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.loading = false;
                // حقن كائن الكائن الكامل المسترجع مباشرة لعدم تصفير بيانات الفواتير والموردين بالواجهة
                state.products.push(action.payload);
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // updateProduct
            .addCase(updateProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.products.findIndex(product => product.id === action.payload.id);
                if (index !== -1) {
                    state.products[index] = action.payload; // تحديث بكامل الكائن
                }
                if (state.selectedProduct && state.selectedProduct.id === action.payload.id) {
                    state.selectedProduct = action.payload;
                }
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // deleteProduct
            .addCase(deleteProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.loading = false;
                // action.payload is a string (MongoDB ObjectId), not a number
                state.products = state.products.filter(product => product.id !== action.payload);
                if (state.selectedProduct && state.selectedProduct.id === action.payload) {
                    state.selectedProduct = null;
                }
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearSelectedProduct, clearProductErrors } = productSlice.actions;
export default productSlice.reducer;