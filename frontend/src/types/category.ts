export interface Category {
    id: string;
    name: string;
    description?: string;
    color?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryRequest {
    name: string;
    description?: string;
    color?: string;
}

export interface UpdateCategoryRequest {
    name?: string;
    description?: string;
    color?: string;
}

export interface CategoryState {
    categories: Category[];
    loading: boolean;
    error: string | null;
}

export interface GetCategoriesResponse {
    categories: Category[];
}

export interface CreateCategoryResponse {
    category: Category;
}

export interface UpdateCategoryResponse {
    category: Category;
}
export interface DeleteCategoryResponse {
    message: string;
    id: string;
}
export interface GetCategoryResponse {
    category: Category;
}
