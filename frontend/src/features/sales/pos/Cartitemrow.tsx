import React, { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import type { CartItem as CartItemType } from "../hook/Usesalesinterface";

interface CartItemRowProps {
    item: CartItemType;
    onRemove: (id: string) => void;
    onQuantityChange: (id: string, qty: number) => void;
    onPriceTypeChange: (id: string, type: "sale" | "wholesale" | "custom") => void;
    onCustomPriceChange: (id: string, price: number) => void;
}

// Isolated quantity input — local string state prevents Redux re-renders
// from interrupting mid-type edits.
const QuantityInput: React.FC<{
    quantity: number;
    onChange: (qty: number) => void;
}> = ({ quantity, onChange }) => {
    const [display, setDisplay] = useState(String(quantity));
    const [dirty, setDirty] = useState(false);
    const displayValue = dirty ? display : String(quantity);

    return (
        <div className="flex items-center gap-1 bg-[#1e293b] p-1 rounded-lg border border-slate-700">
            <button
                type="button"
                className="w-7 h-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center justify-center transition-colors"
                onClick={() => {
                    const next = Math.max(1, quantity - 1);
                    setDisplay(String(next));
                    setDirty(false);
                    onChange(next);
                }}
            >
                <Minus className="w-3 h-3" />
            </button>
            <input
                type="number"
                min="1"
                value={displayValue}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                    setDisplay(e.target.value);
                    setDirty(true);
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n) && n >= 1) onChange(n);
                }}
                onBlur={() => {
                    const n = parseInt(display, 10);
                    if (isNaN(n) || n < 1) { setDisplay("1"); setDirty(false); onChange(1); }
                    else { setDisplay(String(n)); setDirty(false); }
                }}
                className="w-10 h-7 text-center bg-transparent text-sm font-bold text-white font-mono border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
                type="button"
                className="w-7 h-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center justify-center transition-colors"
                onClick={() => {
                    const next = quantity + 1;
                    setDisplay(String(next));
                    setDirty(false);
                    onChange(next);
                }}
            >
                <Plus className="w-3 h-3" />
            </button>
        </div>
    );
};

const CartItemRow: React.FC<CartItemRowProps> = ({
    item,
    onRemove,
    onQuantityChange,
    onPriceTypeChange,
    onCustomPriceChange,
}) => {
    const isCustom = item.priceType === "custom";
    const [customPriceDisplay, setCustomPriceDisplay] = useState(
        isCustom && item.activePrice > 0 ? String(item.activePrice) : ""
    );
    const [customDirty, setCustomDirty] = useState(false);
    const customDisplayValue = customDirty
        ? customPriceDisplay
        : isCustom && item.activePrice > 0
            ? String(item.activePrice)
            : "";

    const subtotal = (item.activePrice * item.quantity).toLocaleString();

    return (
        <div className="flex flex-col p-3 bg-[#0f172a] rounded-xl border border-slate-800 space-y-2">
            {/* Name + price selector + subtotal */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>

                    <select
                        value={item.priceType}
                        onChange={(e) => {
                            const next = e.target.value as "sale" | "wholesale" | "custom";
                            onPriceTypeChange(item.productId, next);
                            if (next !== "custom") {
                                setCustomPriceDisplay("");
                                setCustomDirty(false);
                            } else {
                                // start editing with current activePrice
                                setCustomPriceDisplay(item.activePrice > 0 ? String(item.activePrice) : "");
                                setCustomDirty(false);
                            }
                        }}
                        className="mt-1 w-full bg-[#1e293b] text-xs text-indigo-300 rounded border border-slate-700 px-2 py-1 outline-none cursor-pointer focus:border-indigo-500"
                    >
                        <option value="sale">قطاعي ({item.salePrice} ج.م)</option>
                        <option value="wholesale">جملة ({item.wholesalePrice} ج.م)</option>
                        <option value="custom">سعر مخصص</option>
                    </select>

                    {isCustom && (
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={customDisplayValue}
                                placeholder="أدخل السعر"
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (/^\d*$/.test(v)) {
                                        setCustomPriceDisplay(v);
                                        setCustomDirty(true);
                                        const n = v === "" ? 0 : parseInt(v, 10);
                                        onCustomPriceChange(item.productId, isNaN(n) ? 0 : n);
                                    }
                                }}
                                onBlur={() => {
                                    const n = customPriceDisplay === "" ? 0 : parseInt(customPriceDisplay, 10);
                                    if (!customPriceDisplay || n === 0 || isNaN(n)) {
                                        onPriceTypeChange(item.productId, "sale");
                                        setCustomDirty(false);
                                    } else {
                                        onCustomPriceChange(item.productId, n);
                                        setCustomDirty(false);
                                    }
                                }}
                                onPaste={(e) => {
                                    const paste = e.clipboardData.getData("text");
                                    if (!/^\d+$/.test(paste)) {
                                        e.preventDefault();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                        e.preventDefault();
                                    }
                                }}
                                className="flex-1 h-7 bg-[#0f172a] border border-amber-600 text-amber-300 text-xs px-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono rounded appearance-none [MozAppearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs font-mono text-amber-400">ج.م</span>
                        </div>
                    )}
                </div>

                <p className={`font-bold text-sm shrink-0 ${isCustom ? "text-amber-400" : "text-indigo-400"}`}>
                    {subtotal} ج.م
                </p>
            </div>

            {/* Quantity + remove */}
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                <QuantityInput
                    quantity={item.quantity}
                    onChange={(qty) => onQuantityChange(item.productId, qty)}
                />
                <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                    onClick={() => onRemove(item.productId)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default CartItemRow;