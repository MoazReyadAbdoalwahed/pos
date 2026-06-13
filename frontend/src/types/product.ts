export interface Product {
    id: string;
    _id: string;
    name: string;
    description: string;
    salePrice: number;
    category: string;
    wholesalePrice: number;
    stock: number;
    purchasePrice: number;
    initialStock: number;
    sku: string;
    supplierName: string;
    supplierInvoiceNumber: string;
    supplierInvoiceDate: string;
    createdAt: string;
    updatedAt: string;
}
export interface ProductFormData {
    name: string;
    description: string;
    salePrice: number;
    category: string;
    wholesalePrice: number;
    stock: number;
    purchasePrice: number;
    initialStock: number;
    sku: string;
    supplierName: string;
    supplierInvoiceNumber: string;
    supplierInvoiceDate: string;
}

export interface ProductUpdateFormData {
    name?: string;
    description?: string;
    salePrice?: number;
    category?: string;
    wholesalePrice?: number;
    stock?: number;
    purchasePrice?: number;
    initialStock?: number;
    sku?: string;
    supplierName?: string;
    supplierInvoiceNumber?: string;
    supplierInvoiceDate?: string;
}

export interface ProductListItem {
    id: string;
    name: string;
    salePrice: number;
    category: string;
    stock: number;
    sku?: string;
}

export interface ProductDetail {
    id: string;
    name: string;
    description: string;
    salePrice: number;
    category: string;
    wholesalePrice: number;
    stock: number;
    purchasePrice: number;
    initialStock: number;
    sku: string;
    supplierName: string;
    supplierInvoiceNumber: string;
    supplierInvoiceDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProductState {
    products: ProductListItem[];
    selectedProduct: ProductDetail | null;
    loading: boolean;
    error: string | null;
}
