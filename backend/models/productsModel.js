import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    wholesalePrice: {
        type: Number,
        required: true,
        default: 0
    },
    purchasePrice: {
        type: Number,
        default: 0
    },
    salePrice: {
        type: Number,
        required: true,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    sku: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
        sparse: true
    },
    supplierName: {
        type: String,
        default: null
    },
    supplierInvoiceNumber: {
        type: String,
        default: null
    },
    supplierInvoiceDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product;