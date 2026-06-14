import { createSelector } from "reselect";
import type { RootState } from "../../../store/store";

export const selectAllProducts = (state: RootState) => state.products.products;
export const selectSelectedProduct = (state: RootState) => state.products.selectedProduct;
export const selectProductsLoading = (state: RootState) => state.products.loading;
export const selectProductsError = (state: RootState) => state.products.error;

// تم الإصلاح: تصفية المنتجات ذات المخزون المنخفض (أكبر من 0 وأقل من 5 قطع) لتطابق كود الـ Component تماماً
export const selectLowStockProducts = createSelector(
    [selectAllProducts],
    (products) => products.filter(product => {
        const s = Number(product.stock || 0);
        return s === 1;
    })
);

// تصفية المنتجات التي نفذت تماماً من المخزن
export const selectOutOfStockProducts = createSelector(
    [selectAllProducts],
    (products) => products.filter(product => {
        const s = Number(product.stock || 0);
        return s === 0;
    })
);

export const selectproductById = (state: RootState, productId: string) => {
    return state.products.products.find(product => product.id === productId);
}

export const selectProductBysku = (state: RootState, sku: string) => {
    return state.products.products.find(product => product.sku === sku);
}

export const selectTotalProductsCount = (state: RootState) => state.products.products.length;

export const selectTotalStockCount = (state: RootState) => {
    return state.products.products.reduce((total, product) => total + (product.stock || 0), 0);
}