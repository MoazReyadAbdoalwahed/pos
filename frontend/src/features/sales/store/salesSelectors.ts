import type { RootState } from '../../../store/store';

export const selectSales = (state: RootState) => {
    const sales = state.sales.sales;
    // Ensure we always return an array, even if the API returns something unexpected
    return Array.isArray(sales) ? sales : [];
};
export const selectSelectedSale = (state: RootState) => state.sales.selectedSale;
export const selectSalesLoading = (state: RootState) => state.sales.loading;
export const selectSalesError = (state: RootState) => state.sales.error;

export const selectSaleById = (state: RootState, saleId: string) => {
    return state.sales.sales.find(sale => sale.id === saleId) || null;
}

export const selectSalesByInvoiceNumber = (state: RootState, invoiceNumber: string) => {
    return state.sales.sales.filter(sale => sale.invoiceNumber === invoiceNumber);
}

export const selectReturnSales = (state: RootState) => {
    return state.sales.sales.filter(sale => sale.invoiceType === 'return');
}

export const selectSalesByPaymentMethod = (state: RootState, paymentMethod: string) => {
    return state.sales.sales.filter(sale => sale.paymentMethod === paymentMethod);
}

export const selectSalesByDateRange = (state: RootState, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return state.sales.sales.filter(sale => {
        const createdAt = new Date(sale.createdAt);
        return createdAt >= start && createdAt <= end;
    }
    );
}

//invoice aggregates

export const selectTotalSalesAmount = (state: RootState) => {
    return state.sales.sales.reduce((total, sale) => total + sale.totalAmount, 0);
}

export const selectTotalNetProfit = (state: RootState) => {
    return state.sales.sales.reduce((total, sale) => total + sale.netProfit, 0);
}

export const selectTotalCost = (state: RootState) => {
    return state.sales.sales.reduce((total, sale) => total + sale.totalCost, 0);
}

// cart selectors
export const selectCartItemCount = (state: RootState) => {
    if (!state.sales.selectedSale) return 0;
    return state.sales.selectedSale.items.reduce((count, item) => count + item.quantity, 0);
}

export const selectCartTotalPrice = (state: RootState) => {
    if (!state.sales.selectedSale) return 0;
    return state.sales.selectedSale.items.reduce((total, item) => total + item.totalItemPrice, 0);
}

export const selectCartEmpty = (state: RootState) => {
    if (!state.sales.selectedSale) return true;
    return state.sales.selectedSale.items.length === 0;
}


