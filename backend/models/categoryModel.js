import mongoose from 'mongoose';



const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#000000'
    }

}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;