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
        return <Badge className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">نفذ</Badge>;
    if (stock === 1)
        return <Badge className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">وشك النفاذ: قطعة واحدة</Badge>;
    return <Badge className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">متوفر: {stock} قطع</Badge>;
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
                    <h3 className="font-bold text-white text-base mb-1 truncate">{product.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">BC: {product.sku ?? "N/A"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div className="rounded-2xl bg-slate-900/80 p-3">
                        <p className="text-slate-400">سعر القطاعي</p>
                        <p className="font-semibold text-indigo-400">{product.salePrice.toLocaleString()} ج.م</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 p-3">
                        <p className="text-slate-400">سعر الجملة</p>
                        <p className="font-semibold text-emerald-400">{product.wholesalePrice.toLocaleString()} ج.م</p>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <StockBadge stock={product.stock} />
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductCard;