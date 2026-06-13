import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
    Product,
    ProductFormData,
    ProductUpdateFormData,
    ProductDetail
} from "../../../types/product";
import { AxiosError } from "axios";
import { axiosInstance } from "../../../api/axiosInstance";

// تحويل المعرفات المسترجعة من السيرفر بشكل نظيف من _id إلى id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformProduct = (product: any): Product => ({
    ...product,
    id: product._id || product.id,
});

export const getAllproducts = createAsyncThunk<Product[], void>(
    'products/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/products/');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response.data.products.map((p: any) => transformProduct(p));
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch products');
        }
    }
);

export const getProductById = createAsyncThunk<ProductDetail, string>(
    'products/getById',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/products/${productId}`);
            return transformProduct(response.data.product);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch product details');
        }
    }
);

export const createProduct = createAsyncThunk<Product, ProductFormData>(
    'products/create',
    async (productData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/products/add', productData);
            return transformProduct(response.data.product);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to create product');
        }
    }
);

export const updateProduct = createAsyncThunk<Product, { id: string; data: ProductUpdateFormData }>(
    'products/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/products/${id}`, data);
            return transformProduct(response.data.product);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to update product');
        }
    }
);

export const deleteProduct = createAsyncThunk<string, string>(
    'products/delete',
    async (productId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/products/${productId}`);
            return productId;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to delete product');
        }
    }
);