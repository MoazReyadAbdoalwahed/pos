/**
 * ☁️ Cloudinary Configuration
 * ✅ Fixed: removed hardcoded cloud_name, api_key, api_secret fallbacks
 *    All credentials must now come from .env only
 */

import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ════════════════════════════════════════════════════════════════════════
// Guard: fail fast if credentials are missing
// ════════════════════════════════════════════════════════════════════════
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error(
        "❌ CRITICAL: Cloudinary credentials are missing from .env!\n" +
        "   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
}

// ════════════════════════════════════════════════════════════════════════
// Cloudinary Configuration
// ════════════════════════════════════════════════════════════════════════
cloudinary.v2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

// ════════════════════════════════════════════════════════════════════════
// Upload Function (رفع ملف واحد)
// ════════════════════════════════════════════════════════════════════════
export const uploadImageToCloudinary = async (filePath, options = {}) => {
    try {
        console.log(`📤 جاري رفع الصورة إلى Cloudinary: ${filePath}`);

        const result = await cloudinary.v2.uploader.upload(filePath, {
            resource_type: "image",
            folder: "akram_shop/marketing",
            quality: "auto",
            fetch_format: "auto",
            ...options
        });

        console.log(`✅ تم رفع الصورة بنجاح: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error(`❌ خطأ في رفع الصورة: ${error.message}`);
        throw new Error(`فشل رفع الصورة إلى Cloudinary: ${error.message}`);
    }
};

// ════════════════════════════════════════════════════════════════════════
// Batch Upload (رفع عدة صور)
// ════════════════════════════════════════════════════════════════════════
export const uploadMultipleImagesToCloudinary = async (filePaths) => {
    try {
        console.log(`📤 جاري رفع ${filePaths.length} صورة إلى Cloudinary...`);

        const imageUrls = await Promise.all(
            filePaths.map(async (filePath) => {
                const result = await cloudinary.v2.uploader.upload(filePath, {
                    resource_type: "image",
                    folder: "akram_shop/marketing",
                    quality: "auto",
                    fetch_format: "auto"
                });
                return result.secure_url;
            })
        );

        console.log(`✅ تم رفع جميع الصور بنجاح`);
        return imageUrls;
    } catch (error) {
        console.error(`❌ خطأ في رفع الصور: ${error.message}`);
        throw new Error(`فشل رفع الصور إلى Cloudinary: ${error.message}`);
    }
};

// ════════════════════════════════════════════════════════════════════════
// Delete Image (حذف صورة من Cloudinary)
// ════════════════════════════════════════════════════════════════════════
export const deleteImageFromCloudinary = async (publicId) => {
    try {
        console.log(`🗑️ جاري حذف الصورة: ${publicId}`);

        const result = await cloudinary.v2.uploader.destroy(publicId);

        if (result.result === "ok") {
            console.log(`✅ تم حذف الصورة بنجاح`);
            return true;
        } else {
            throw new Error("فشل حذف الصورة");
        }
    } catch (error) {
        console.error(`❌ خطأ في حذف الصورة: ${error.message}`);
        throw new Error(`فشل حذف الصورة من Cloudinary: ${error.message}`);
    }
};

export default cloudinary.v2;