import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/Dialog";
import Button from "../../../components/ui/Button";
import type { Product } from "../../../types/product";
import { Printer, Barcode, QrCode, X } from "lucide-react";
import QRCode from "react-qr-code";
import BarcodeReact from "react-barcode";

interface ProductLabelModalProps {
    product: Product;
}

const ProductLabelModal: React.FC<ProductLabelModalProps> = ({ product }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [labelMode, setLabelMode] = useState<"qrcode" | "barcode">("qrcode");
    const [copiesCount, setCopiesCount] = useState<number>(1);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `label-${product?.sku || product?._id || "product"}`,
        onBeforePrint: () => Promise.resolve(),
    });

    if (!product) return null;

    const labelValue = product.sku || product._id || "00000000";

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 h-8"
                onClick={() => setIsOpen(true)}
            >
                <Barcode className="w-3 h-3 ml-1" />
                ملصق
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-xl bg-[#1e293b] border-slate-800 text-slate-100" dir="rtl">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-3">
                            <DialogTitle className="text-white font-bold text-lg">طباعة ملصق المنتج</DialogTitle>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-700 text-slate-200 hover:bg-slate-800"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-400">اختر نوع الملصق</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={labelMode === "qrcode" ? "secondary" : "outline"}
                                    className={labelMode === "qrcode" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-slate-300 border-slate-700"}
                                    onClick={() => setLabelMode("qrcode")}
                                >
                                    <QrCode className="w-3.5 h-3.5 ml-1" />
                                    QR
                                </Button>
                                <Button
                                    size="sm"
                                    variant={labelMode === "barcode" ? "secondary" : "outline"}
                                    className={labelMode === "barcode" ? "bg-rose-600 hover:bg-rose-700 text-white" : "text-slate-300 border-slate-700"}
                                    onClick={() => setLabelMode("barcode")}
                                >
                                    <Barcode className="w-3.5 h-3.5 ml-1" />
                                    باركود
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-[#0f172a] p-4 shadow-inner shadow-slate-950/50">
                            <div className="mx-auto w-full max-w-[220px] rounded-3xl bg-white p-4 text-slate-950 shadow-xl">
                                <div className="flex flex-col gap-2 text-center">
                                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">ملصق المنتج</div>
                                    <div className="text-base font-black text-slate-900 leading-tight truncate w-full">{product.name}</div>
                                    <div className="text-xs text-slate-500">SKU / باركود</div>
                                    <div className="font-mono text-[12px] text-slate-700 break-words">{labelValue}</div>
                                </div>

                                <div className="mt-4 flex justify-center py-3 w-full overflow-hidden px-3">
                                    {labelMode === "qrcode" ? (
                                        <div className="bg-white p-2 rounded-xl">
                                            <QRCode value={labelValue} size={120} bgColor="#ffffff" fgColor="#111827" />
                                        </div>
                                    ) : (
                                        <div className="flex justify-center items-center w-full overflow-hidden bg-white p-2 rounded-xl">
                                            <BarcodeReact
                                                value={labelValue}
                                                format="CODE128"
                                                lineColor="#000000"
                                                width={1.2}
                                                height={25}
                                                displayValue={false}
                                                margin={0}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 justify-between sm:justify-start">
                                <span className="text-sm text-slate-300 font-medium">عدد الملصقات المطلوبة:</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={copiesCount}
                                    onChange={(e) => setCopiesCount(Math.max(1, Number(e.target.value)))}
                                    className="w-20 h-9 p-1 border border-slate-700 bg-slate-950 rounded-xl text-white text-center font-bold focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button
                                    className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-5 rounded-xl"
                                    onClick={handlePrint}
                                >
                                    <Printer className="w-4 h-4 ml-2" />
                                    طباعة ({copiesCount}) {copiesCount > 1 ? "ملصقات" : "ملصق"}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-slate-700 hover:bg-slate-800 text-slate-300 h-10 rounded-xl"
                                    onClick={() => setIsOpen(false)}
                                >
                                    إغلاق
                                </Button>
                            </div>
                        </div>

                        <div style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
                            <div
                                ref={printRef}
                                dir="rtl"
                                style={{ display: "flex", flexDirection: "column", gap: 0, margin: 0, padding: 0 }}
                            >
                                <style>{`
                  @media print {
                    @page {
                      size: 50mm 30mm !important;
                      margin: 0 !important;
                    }
                    html, body {
                      width: 50mm !important;
                      height: 30mm !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      background: #fff !important;
                      overflow: hidden !important;
                      box-sizing: border-box !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    .label-item {
                      page-break-after: always !important;
                      page-break-inside: avoid !important;
                      break-after: page !important;
                      width: 50mm !important;
                      height: 30mm !important;
                      padding: 1.5mm 2mm !important;
                      box-sizing: border-box !important;
                      margin: 0 !important;
                      overflow: hidden !important;
                    }
                  }
                `}</style>
                                {Array.from({ length: copiesCount }, (_, idx) => (
                                    <div
                                        key={idx}
                                        className="label-item"
                                        style={{
                                            width: "50mm",
                                            height: "30mm",
                                            padding: "1.5mm 2mm",
                                            boxSizing: "border-box",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            backgroundColor: "#fff",
                                            color: "#000",
                                            fontFamily: "Arial, sans-serif",
                                            margin: 0,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: "bold",
                                                textAlign: "center",
                                                marginBottom: "1px",
                                                width: "100%",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                lineHeight: "1.2",
                                            }}
                                        >
                                            {product.name}
                                        </div>
                                        <div style={{ fontSize: "7px", color: "#444", fontFamily: "monospace", marginBottom: "2px" }}>
                                            {labelValue}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                width: "100%",
                                                maxHeight: "16mm",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {labelMode === "qrcode" ? (
                                                <QRCode value={labelValue} size={45} bgColor="#ffffff" fgColor="#000000" />
                                            ) : (
                                                <div
                                                    style={{
                                                        transform: "scale(0.9)",
                                                        transformOrigin: "top center",
                                                        width: "100%",
                                                        display: "flex",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <BarcodeReact
                                                        value={labelValue}
                                                        format="CODE128"
                                                        lineColor="#000000"
                                                        width={1.0}
                                                        height={22}
                                                        displayValue={false}
                                                        margin={0}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProductLabelModal;
