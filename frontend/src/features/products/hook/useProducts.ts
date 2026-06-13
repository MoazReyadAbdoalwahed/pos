import { useAppSelector, useAppDispatch } from "../../../hooks/storeHooks"
import {
    createProduct,
    getAllproducts,
    updateProduct,
    deleteProduct,
    getProductById
} from "../store/Thunkproducts"
import {
    selectSelectedProduct,
    selectProductsLoading,
    selectProductsError,
    selectAllProducts,
    selectOutOfStockProducts,
    selectLowStockProducts,
    selectTotalProductsCount,
    selectTotalStockCount
} from "../store/productSelectors";
import type { ProductUpdateFormData, ProductFormData } from "../../../types/product";

export const useProducts = () => {
    const dispatch = useAppDispatch();
    const products = useAppSelector(selectSelectedProduct);
    const loading = useAppSelector(selectProductsLoading);
    const error = useAppSelector(selectProductsError);
    const selectedAllProduct = useAppSelector(selectAllProducts);
    const outOfStockProducts = useAppSelector(selectOutOfStockProducts);
    const lowStockProducts = useAppSelector(selectLowStockProducts);
    const totalProductsCount = useAppSelector(selectTotalProductsCount);
    const totalStockCount = useAppSelector(selectTotalStockCount);

    const getProductByIdd = (id: string) => {
        return dispatch(getProductById(id));
    }

    const create = (productData: ProductFormData) => {
        return dispatch(createProduct(productData));
    }

    const fetchAll = () => {
        return dispatch(getAllproducts());
    }

    const updateProductData = (id: string, productData: ProductUpdateFormData) => {
        return dispatch(updateProduct({ id, data: productData }));
    }

    const remove = (id: string) => {
        return dispatch(deleteProduct(id));
    }

    return {
        products,
        loading,
        error,
        selectedAllProduct,
        outOfStockProducts,
        lowStockProducts,
        totalProductsCount,
        totalStockCount,
        getProductByIdd,
        create,
        fetchAll,
        update: updateProductData,
        remove
    }
}