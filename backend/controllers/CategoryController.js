import Category from '../models/categoryModel.js';


// Create a new category

const createCategory = async (req, res) => {
    try {
        const { name, description = "", color = "#000000" } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });

        }

        const existingCategory = await Category.findOne({ name: name.trim() });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        const category = new Category({
            name: name.trim(),
            description,
            color
        });

        await category.save();
        const savedCategory = category.toObject();
        savedCategory.id = savedCategory._id.toString();
        res.status(201).json({ message: 'Category created successfully', category: savedCategory });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Failed to create category', error: error.message });
    }
};

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({ message: 'Categories fetched successfully', categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
    }
};

// Get a category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category fetched successfully', category });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Failed to fetch category', error: error.message });
    }
};

// Update a category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color } = req.body;
        const updateData = {};

        if (name) {
            updateData.name = name.trim();
        }
        if (description !== undefined) {
            updateData.description = description;
        }
        if (color) {
            updateData.color = color;
        }

        if (name) {
            const existingCategory = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }

        }

        const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({
            message: 'Category updated successfully', category: {
                ...updatedCategory.toObject(),
                id: updatedCategory._id.toString(),
            }
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Failed to update category', error: error.message });
    }
};

// Delete a category 

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Failed to delete category', error: error.message });
    }
};

export { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };