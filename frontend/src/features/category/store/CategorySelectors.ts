import type { RootState } from "../../../store/store";

export const selectCategories = (state: RootState) => state.category.categories;
export const selectCategoryLoading = (state: RootState) => state.category.loading;
export const selectCategoryError = (state: RootState) => state.category.error;
export const selectCategoryById = (state: RootState, id: string) => state.category.categories.find(cat => cat.id === id);
export const selectCategoryByName = (state: RootState, name: string) => state.category.categories.find(cat => cat.name === name);
