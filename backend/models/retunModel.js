import mongoose from 'mongoose';

const ReturnRequestSchema = new mongoose.Schema({
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale', // الربط بموديل الفواتير الموحد الفعلي لديك لنجاح الـ populate
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            },
            wholesalePrice: {
                type: Number,
                default: 0
            },
            totalItemPrice: {
                type: Number,
                required: true
            },
            priceType: {
                type: String,
                enum: ["sale", "wholesale", "custom"],
                default: "sale"
            }
        }
    ],
    totalRefundAmount: {
        type: Number,
        required: true,
        min: 0
    },
    cashierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    approverUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalDate: {
        type: Date
    },
    approvalNotes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const ReturnRequest = mongoose.model('ReturnRequest', ReturnRequestSchema);
export default ReturnRequest;