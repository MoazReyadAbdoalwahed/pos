import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
    {
        purchaseInvoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },
        supplierName: {
            type: String,
            required: true,
        },
        purchaseDate: {
            type: Date,
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                sku: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                puchasePrice: {
                    type: Number,
                    required: true,
                },
                suggestedSalePrice: {
                    type: Number,
                    required: true,
                },
                suggestedWholesalePrice: {
                    type: Number,
                    required: true,
                },
            }
        ],
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);
const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
