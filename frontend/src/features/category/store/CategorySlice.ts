import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
} from "./thunkCategory";
import type {
    CategoryState,
    CreateCategoryResponse,
    GetCategoriesResponse,
    UpdateCategoryResponse,
    DeleteCategoryResponse
} from "../../../types/category";

const initialState: CategoryState = {
    categories: [],
    loading: false,
    error: null
}

const CategorySlice = createSlice({
    name: 'category',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Category
            .addCase(createCategory.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(createCategory.fulfilled, (state, action: PayloadAction<CreateCategoryResponse>) => {
                state.categories.push(action.payload.category)
                state.loading = false
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
            // Get All Categories
            .addCase(getAllCategories.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getAllCategories.fulfilled, (state, action: PayloadAction<GetCategoriesResponse>) => {
                state.categories = action.payload.categories
                state.loading = false
            })
            .addCase(getAllCategories.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
                // إذا أرجع السيرفر 404 لأن الداتابيز فارغة، نقوم بتفريغ المصفوفة لكي يعمل الـ Empty State بشكل طبيعي
                if (action.payload === 'No categories found') {
                    state.categories = [];
                }
            })
            // Update Category
            .addCase(updateCategory.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateCategory.fulfilled, (state, action: PayloadAction<UpdateCategoryResponse>) => {
                const index = state.categories.findIndex(cat => cat.id === action.payload.category.id);
                if (index !== -1) {
                    state.categories[index] = action.payload.category;
                }
                state.loading = false
            })
            .addCase(updateCategory.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
            // Delete Category
            .addCase(deleteCategory.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(deleteCategory.fulfilled, (state, action: PayloadAction<DeleteCategoryResponse>) => {
                state.categories = state.categories.filter(cat => cat.id !== action.payload.id);
                state.loading = false
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
    }
})

export const { clearError } = CategorySlice.actions
export default CategorySlice.reducer