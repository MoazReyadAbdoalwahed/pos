import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { axiosInstance } from "../../../api/axiosInstance";
import type {
    CreateCategoryRequest,
    UpdateCategoryRequest,
    GetCategoriesResponse,
    CreateCategoryResponse,
    UpdateCategoryResponse,
    DeleteCategoryResponse,
} from "../../../types/category";




export const createCategory = createAsyncThunk<CreateCategoryResponse, CreateCategoryRequest>(
    'category/create',
    async (categoryData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/categories/add', categoryData);
            const category = response.data.category;
            return {
                category: {
                    ...category,
                    id: category._id || category.id,
                }
            };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to create category');
        }
    }
);


export const getAllCategories = createAsyncThunk<GetCategoriesResponse>(
    'category/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/categories/');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedCategories = response.data.categories.map((cat: any) => ({
                ...cat,
                id: cat._id || cat.id,
            }));
            return {
                categories: transformedCategories
            };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch categories');
        }
    }
);

export const updateCategory = createAsyncThunk<UpdateCategoryResponse, { id: string; data: UpdateCategoryRequest }>(
    'category/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/categories/${id}`, data);
            const category = response.data.category;
            return {
                category: {
                    ...category,
                    id: category._id || category.id,
                }
            };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to update category');
        }
    }
);

export const deleteCategory = createAsyncThunk<DeleteCategoryResponse, string>(
    'category/delete',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.delete(`/categories/${id}`);
            return {
                ...response.data,
                id: id
            };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || 'Failed to delete category');
        }
    }
);