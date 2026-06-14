import React from "react";
import BarcodeReact from "react-barcode";
import QRCode from "react-qr-code";
import type { Sale as SalesInvoice } from "../../../types/sales";

type PrintCartItem = {
    productId?: string;
    name: string;
    quantity: number;
    activePrice: number;
    priceType: "sale" | "wholesale" | "custom";
};

interface ThermalReceiptProps {
    cart?: PrintCartItem[];
    total?: number;
    invoice?: SalesInvoice | null;
    userName?: string | null;
    formatDateTime?: (isoString: string) => { date: string; time: string };
}

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.36-.36a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
);

const PinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

// const FacebookIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink: 0 }}>
//         <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
//     </svg>
// );

const Divider = () => (
    <div style={{ borderTop: "1px dashed #bbb", margin: "5px 0" }} />
);

const ThermalReceipt = React.forwardRef<HTMLDivElement, ThermalReceiptProps>(
    ({ cart = [], total = 0, invoice = null, userName = null, formatDateTime }, ref) => {

        const shopName = "الكابتن لقطع غيار الموتوسيكلات";
        const phone1 = "01004812109";
        const address = "الروضة – امام مسجد الرحمة ";
        // const facebookUrl = "https://www.facebook.com/share/1UT1ZGev6Y/?mibextid=wwXIfr";
        const [generatedReceiptId] = React.useState(() => `INV-${Date.now()}`);
        const receiptId = invoice?.invoiceNumber ?? generatedReceiptId;

        const currentDate = invoice
            ? (formatDateTime?.(invoice.createdAt)?.date ?? new Date().toLocaleDateString("en-US"))
            : new Date().toLocaleDateString("en-US");

        const currentTime = invoice
            ? (formatDateTime?.(invoice.createdAt)?.time ?? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }))
            : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

        const isInvoice = Boolean(invoice);

        return (
            <div
                ref={ref}
                dir="rtl"
                className="thermal-invoice-container"
                style={{
                    fontFamily: "Tahoma, Arial, sans-serif",
                    fontSize: "12px",
                    backgroundColor: "#fff",
                    color: "#111",
                    width: "80mm",
                    maxWidth: "80mm",
                    margin: "0 auto",
                    padding: "6px 8px",
                    lineHeight: 1.55,
                    boxSizing: "border-box"
                }}
            >
                {/* ══ كود الـ CSS السحري الجديد لمنع تكرار الصفحات وإلغاء التقسيم تماماً ══ */}
                <style>{`
                    @media print {
                        @page {
                            margin: 0mm !important;
                            size: 80mm auto !important;
                        }

                        html, body {
                            margin: 0mm !important;
                            padding: 0mm !important;
                            width: 80mm !important;
                            height: auto !important;
                            background: #fff !important;
                            color: #000 !important;
                            overflow: visible !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        /* منع انقسام حاوية الفاتورة الأساسية لأكثر من صفحة */
                        .thermal-invoice-container {
                            width: 80mm !important;
                            height: auto !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            overflow: hidden !important;
                        }

                        /* إجبار صفوف المنتجات على البقاء متصلة ومنع انقسام الجدول */
                        .invoice-items-wrapper, .invoice-item-row {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            page-break-after: auto !important;
                            break-after: auto !important;
                        }

                        body::-webkit-scrollbar {
                            display: none;
                        }
                    }
                `}</style>

                {/* ══ HEADER ══ */}
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#999", marginBottom: "5px" }}>
                        ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦
                    </div>

                    <div style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        borderTop: "2.5px solid #111",
                        borderBottom: "2.5px solid #111",
                        padding: "5px 0 4px",
                        marginBottom: "8px",
                    }}>
                        {shopName}
                    </div>

                    <div style={{
                        direction: "rtl",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        gap: "4px",
                        fontSize: "10px",
                        color: "#333",
                        marginBottom: "7px",
                    }}>
                        <PinIcon />
                        <span style={{ textAlign: "right", lineHeight: 1.5 }}>{address}</span>
                    </div>

                    <div style={{ borderTop: "1px solid #ddd", margin: "0 20px 7px" }} />

                    <div style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                <PhoneIcon />
                                <WhatsAppIcon />
                            </div>
                            <span style={{ letterSpacing: "1px", fontWeight: "bold" }}>{phone1}</span>
                        </div>

                        {/* <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                            <WhatsAppIcon />
                            <span style={{ letterSpacing: "1px", fontWeight: "bold" }}>{phone2}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                            <WhatsAppIcon />
                            <span style={{ letterSpacing: "1px", fontWeight: "bold" }}>{phone3}</span>
                        </div> */}
                    </div>

                    <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#999", marginTop: "7px" }}>
                        ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦
                    </div>
                </div>

                <Divider />

                {/* ══ META ══ */}
                <div style={{ fontSize: "11px", marginBottom: "5px" }}>
                    {[
                        { label: "التاريخ:", value: currentDate, small: false },
                        { label: "الوقت:", value: currentTime, small: false },
                        { label: "رقم الفاتورة:", value: receiptId, small: true },
                        { label: "حالة السداد:", value: "✓ كاش (نقدي)", small: false },
                        { label: "المسؤول:", value: userName || invoice?.cashierName || "غير محدد", small: false },
                    ].map(({ label, value, small }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "1px" }}>
                            <span style={{ color: "#666" }}>{label}</span>
                            <span style={{ fontWeight: "bold", fontSize: small ? "10px" : "11px" }}>{value}</span>
                        </div>
                    ))}
                </div>

                <Divider />

                {/* ══ ITEMS ══ */}
                <div className="invoice-items-wrapper" style={{ marginBottom: "4px" }}>
                    <div style={{
                        display: "flex",
                        fontWeight: "bold",
                        fontSize: "11px",
                        borderBottom: "1.5px solid #222",
                        paddingBottom: "3px",
                        marginBottom: "3px",
                    }}>
                        <span style={{ flex: "1 1 50%", textAlign: "right" }}>الصنف</span>
                        <span style={{ flex: "0 0 16%", textAlign: "center" }}>كمية</span>
                        <span style={{ flex: "0 0 34%", textAlign: "left" }}>الإجمالي</span>
                    </div>

                    {isInvoice
                        ? invoice!.items.map((item, idx) => (
                            <div key={item.productId || idx} className="invoice-item-row" style={{
                                display: "flex",
                                alignItems: "center",
                                fontSize: "11px",
                                padding: "3px 0",
                                borderBottom: "1px dotted #ccc",
                            }}>
                                <span style={{ flex: "1 1 50%", textAlign: "right", wordBreak: "break-word" }}>
                                    {item.name}
                                </span>
                                <span style={{ flex: "0 0 16%", textAlign: "center", fontWeight: "bold" }}>
                                    {item.quantity}
                                </span>
                                <span style={{ flex: "0 0 34%", textAlign: "left" }}>
                                    {Math.round(item.totalItemPrice || 0).toLocaleString()}
                                </span>
                            </div>
                        ))
                        : cart.map((item, idx) => (
                            <div key={item.productId || idx} className="invoice-item-row" style={{
                                display: "flex",
                                alignItems: "center",
                                fontSize: "11px",
                                padding: "3px 0",
                                borderBottom: "1px dotted #ccc",
                            }}>
                                <span style={{ flex: "1 1 50%", textAlign: "right", wordBreak: "break-word" }}>
                                    {item.name}
                                </span>
                                <span style={{ flex: "0 0 16%", textAlign: "center", fontWeight: "bold" }}>
                                    {item.quantity}
                                </span>
                                <span style={{ flex: "0 0 34%", textAlign: "left" }}>
                                    {Math.round(item.activePrice * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                </div>

                {/* ══ TOTAL ══ */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    fontWeight: "bold",
                    borderTop: "2.5px solid #111",
                    borderBottom: "2.5px solid #111",
                    padding: "5px 0",
                    marginBottom: "10px",
                }}>
                    <span>{isInvoice ? "إجمالي الفاتورة:" : "الإجمالي الصافي:"}</span>
                    <span>{Math.round(isInvoice ? invoice?.totalAmount ?? 0 : total).toLocaleString()} ج.م</span>
                </div>

                {/* ══ BARCODE ══ */}
                <div style={{ textAlign: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <BarcodeReact
                            value={receiptId}
                            width={1}
                            height={30}
                            displayValue={false}
                            background="#ffffff"
                            lineColor="#000000"
                        />
                    </div>
                    <div style={{ fontSize: "9px", color: "#777", marginTop: "2px" }}>{receiptId}</div>
                </div>

                <Divider />

                {/* ══ FACEBOOK QR ══ */}
                {/* <div style={{ textAlign: "center", margin: "6px 0" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                    }}>
                        <FacebookIcon />
                        <span>تابعونا على فيسبوك</span>
                    </div> */}
                {/* <div style={{ display: "flex", justifyContent: "center" }}>
                        <QRCode value={facebookUrl} size={50} bgColor="#ffffff" fgColor="#000000" level="M" />
                    </div>
                </div> */}

                <Divider />

                {/* ══ FOOTER ══ */}
                <div style={{ textAlign: "center", marginTop: "6px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "bold" }}>شكرًا لزيارتكم ✦</div>
                    <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>يسعدنا خدمتكم دائماً</div>
                    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#bbb", marginTop: "6px" }}>
                        ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                    </div>
                </div>

            </div>
        );
    }
);

ThermalReceipt.displayName = "ThermalReceipt";

export default ThermalReceipt;