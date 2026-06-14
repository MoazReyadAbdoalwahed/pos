import mongoose from 'mongoose';

const salesSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    originalInvoiceNumber: { // حقل جديد لربط فاتورة المرتجع بالفاتورة الأصلية
        type: String,
        default: null
    },
    invoiceType: {
        type: String,
        required: true,
        enum: ['sales', 'return'],
        default: 'sales',
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            salesPrice: { type: Number, required: true, min: 0 },
            wholesalePrice: { type: Number, required: true, min: 0 },
            totalItemPrice: { type: Number, required: true, min: 0 },
            priceType: { type: String, enum: ['sale', 'wholesale', 'custom'], default: 'sale' }
        }
    ],
    totalAmount: { type: Number, required: true }, // قيمة الفاتورة (موجب في البيع، سالب في المرتجع)
    totalCost: { type: Number, required: true },   // تكلفة البضاعة (موجب في البيع، سالب في المرتجع)
    netProfit: { type: Number, required: true },   // صافي الربح/الخسارة
    paymentMethod: { type: String, default: 'cash' },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cashierName: { type: String, default: null }, // اسم الموظف المسؤول عن البيع
}, { timestamps: true });

const Sale = mongoose.model('Sale', salesSchema);
export default Sale;