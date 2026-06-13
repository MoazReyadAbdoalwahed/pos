import { useAppDispatch, useAppSelector } from '../../../hooks/storeHooks';
import {
    createSale,
    createReturnSale,
    getAllSales
} from "../store/thunksales";

import {
    selectSales,
    selectSalesError,
    selectSalesLoading,
    selectSelectedSale,
    selectSaleById,
    selectSalesByInvoiceNumber,
    selectReturnSales,
    selectSalesByPaymentMethod,
    selectSalesByDateRange,
    selectTotalSalesAmount,
    selectTotalNetProfit,
    selectTotalCost,
    selectCartItemCount,
    selectCartTotalPrice,
    selectCartEmpty
} from "../store/salesSelectors";
import type { SaleFormData, ReturnSaleFormData } from "../../../types/sales";

export const useSales = () => {
    const dispatch = useAppDispatch();
    const sales = useAppSelector(selectSales);
    const loading = useAppSelector(selectSalesLoading);
    const error = useAppSelector(selectSalesError);
    const selectedSale = useAppSelector(selectSelectedSale);
    const useSaleById = (id: string) => {
        return useAppSelector(state => selectSaleById(state, id));
    }
    const useSalesByInvoiceNumber = (invoiceNumber: string) => {
        return useAppSelector(state => selectSalesByInvoiceNumber(state, invoiceNumber));
    }
    const useReturnSales = () => {
        return useAppSelector(selectReturnSales);
    }
    const useSalesByPaymentMethod = (paymentMethod: string) => {
        return useAppSelector(state => selectSalesByPaymentMethod(state, paymentMethod));
    }
    const useSalesByDateRange = (startDate: string, endDate: string) => {
        return useAppSelector(state => selectSalesByDateRange(state, startDate, endDate));
    }
    const useTotalSalesAmount = () => {
        return useAppSelector(selectTotalSalesAmount);
    }
    const useTotalNetProfit = () => {
        return useAppSelector(selectTotalNetProfit);
    }
    const useTotalCost = () => {
        return useAppSelector(selectTotalCost);
    }
    const useCartItemCount = () => {
        return useAppSelector(selectCartItemCount);
    }
    const useCartTotalPrice = () => {
        return useAppSelector(selectCartTotalPrice);
    }
    const useCartEmpty = () => {
        return useAppSelector(selectCartEmpty);
    }

    const create = (saleData: SaleFormData) => {
        return dispatch(createSale(saleData));
    }

    const createReturn = (returnData: ReturnSaleFormData) => {
        return dispatch(createReturnSale(returnData));
    }

    const fetchAll = () => {
        return dispatch(getAllSales());
    }

    return {
        sales,
        loading,
        error,
        selectedSale,
        useSaleById,
        useSalesByInvoiceNumber,
        useReturnSales,
        useSalesByPaymentMethod,
        useSalesByDateRange,
        useTotalSalesAmount,
        useTotalNetProfit,
        useTotalCost,
        useCartItemCount,
        useCartTotalPrice,
        useCartEmpty,
        create,
        createReturn,
        fetchAll
    }
}

