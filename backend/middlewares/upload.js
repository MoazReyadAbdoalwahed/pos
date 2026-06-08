/**
 * 📁 Upload Middleware with Multer & Cloudinary
 * مدخل الرفع مع Multer و Cloudinary
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ════════════════════════════════════════════════════════════════════════
// 📂 Configure Local Storage (Temporary)
// ════════════════════════════════════════════════════════════════════════

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-originalname
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// ════════════════════════════════════════════════════════════════════════
// 🖼️ File Type & Size Validation
// ════════════════════════════════════════════════════════════════════════

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`❌ نوع الملف غير مدعوم: ${file.mimetype}`), false);
    }
};

// ════════════════════════════════════════════════════════════════════════
// 🚀 Create Upload Middleware
// ════════════════════════════════════════════════════════════════════════

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    }
});

// ════════════════════════════════════════════════════════════════════════
// 🔧 Single File Upload Middleware
// ════════════════════════════════════════════════════════════════════════

export const uploadSingleFile = upload.single('file');

// ════════════════════════════════════════════════════════════════════════
// 🔧 Multiple Files Upload Middleware
// ════════════════════════════════════════════════════════════════════════

export const uploadMultipleFiles = upload.array('files', 10); // Max 10 files

// ════════════════════════════════════════════════════════════════════════
// 🔧 Fields Upload Middleware (Mixed fields)
// ════════════════════════════════════════════════════════════════════════

export const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'attachments', maxCount: 5 },
    { name: 'document', maxCount: 1 }
]);

// ════════════════════════════════════════════════════════════════════════
// 🛡️ Error Handler Middleware
// ════════════════════════════════════════════════════════════════════════

export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                success: false,
                message: '❌ الملف كبير جداً (الحد الأقصى: 50MB)'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: '❌ تم تجاوز عدد الملفات المسموحة'
            });
        }
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || '❌ خطأ في رفع الملف'
        });
    }

    next();
};

// ════════════════════════════════════════════════════════════════════════
// 🧹 Cleanup Uploaded Files
// ════════════════════════════════════════════════════════════════════════

export const deleteUploadedFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ تم حذف الملف: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ خطأ في حذف الملف: ${error.message}`);
    }
};

// ════════════════════════════════════════════════════════════════════════
// 📤 Get Local File Path
// ════════════════════════════════════════════════════════════════════════

export const getLocalFilePath = (filename) => {
    return path.join(uploadsDir, filename);
};

// ════════════════════════════════════════════════════════════════════════
// 📍 Get Uploads Directory
// ════════════════════════════════════════════════════════════════════════

export const getUploadsDir = () => uploadsDir;

// Default export
export default upload;