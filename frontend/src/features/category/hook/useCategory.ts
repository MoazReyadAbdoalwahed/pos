import { useAppDispatch, useAppSelector } from "../../../hooks/storeHooks"
import {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
} from "../store/thunkCategory"
import {
    selectCategories,
    selectCategoryLoading,
    selectCategoryError
} from "../store/CategorySelectors";
import type { CreateCategoryRequest, UpdateCategoryRequest } from "../../../types/category";

export const useCategory = () => {
    const dispatch = useAppDispatch();
    const categories = useAppSelector(selectCategories);
    const loading = useAppSelector(selectCategoryLoading);
    const error = useAppSelector(selectCategoryError);

    const getCategoryById = (id: string) => categories.find(cat => cat.id === id);
    const getCategoryByName = (name: string) => categories.find(cat => cat.name === name);

    const create = (categoryData: CreateCategoryRequest) => {
        return dispatch(createCategory(categoryData));
    }
    const fetchAll = () => {
        return dispatch(getAllCategories());
    }
    const update = (id: string, categoryData: UpdateCategoryRequest) => {
        return dispatch(updateCategory({ id, data: categoryData }));
    }
    const remove = (id: string) => {
        return dispatch(deleteCategory(id));
    }

    return {
        categories,
        loading,
        error,
        getCategoryById,
        getCategoryByName,
        create,
        fetchAll,
        update,
        remove
    }
}
