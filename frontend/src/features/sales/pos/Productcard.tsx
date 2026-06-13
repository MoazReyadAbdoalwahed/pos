import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import type { Product } from "../../../types/product";

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
}

const StockBadge: React.FC<{ stock: number }> = ({ stock }) => {
    if (stock === 0)
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs">نفد</Badge>;
    if (stock === 1)
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs animate-pulse">آخر قطعة!</Badge>;
    return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">متوفر: {stock}</Badge>;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
    const unavailable = product.stock === 0;

    return (
        <Card
            className={`cursor-pointer transition-all duration-200 border-slate-800 bg-[#0f172a]/80 hover:bg-[#0f172a] hover:border-slate-600 shadow-md ${unavailable ? "opacity-50 cursor-not-allowed border-rose-950" : ""
                }`}
            onClick={() => !unavailable && onClick(product)}
        >
            <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="mb-3">
                    <h3 className="font-bold text-white text-base mb-1">{product.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">BC: {product.sku ?? "N/A"}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-black text-indigo-400">
                        {product.salePrice.toLocaleString()} ج.م
                    </span>
                    <StockBadge stock={product.stock} />
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductCard;