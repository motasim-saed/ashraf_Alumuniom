// Initialize Appwrite
const client = new Appwrite.Client();
client
    .setEndpoint(config.ENDPOINT)
    .setProject(config.PROJECT_ID);

const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);
const account = new Appwrite.Account(client);

/**
 * Fetch all products from Appwrite
 */
async function fetchProducts() {
    try {
        const response = await databases.listDocuments(
            config.DATABASE_ID,
            config.COLLECTION_ID
        );
        
        return response.documents.map(doc => ({
            id: doc.$id,
            title: doc.title,
            description: doc.description,
            category: doc.category,
            old_price: doc.old_price,
            new_price: doc.new_price,
            media_url: doc.media_url,
            media_type: doc.media_type,
            file_id: doc.file_id
        }));
    } catch (error) {
        console.error('Appwrite Fetch Error:', error);
        if (error.message.includes('fetch')) {
            console.warn('نصيحة: تأكد من إضافة موقعك في قسم Platforms في Appwrite Settings.');
        }
        return [];
    }
}

/**
 * Upload file to Appwrite Storage with Intelligent Compression
 */
async function uploadFile(file, onProgress) {
    let fileToUpload = file;

    try {
        // 1. Intelligent Compression for Images
        if (file.type.startsWith('image/')) {
            console.log('جاري ضغط الصورة...');
            fileToUpload = await compressImage(file);
        }
        
        // 2. Logging for Videos
        if (file.type.startsWith('video/')) {
            console.log('جاري معالجة الفيديو للرفع...');
            // ملاحظة: ضغط الفيديو يتطلب FFmpeg.wasm وهو ثقيل جداً للمتصفح
            // حالياً نقوم برفعه مباشرة مع ضمان أفضل أداء
        }

        const response = await storage.createFile(
            config.BUCKET_ID,
            Appwrite.ID.unique(),
            fileToUpload,
            [], // Permissions
            (progress) => {
                if (onProgress) {
                    onProgress(Math.round(progress.progress));
                }
            }
        );
        
        const url = storage.getFileView(config.BUCKET_ID, response.$id);
        return { url, fileId: response.$id };
    } catch (error) {
        console.error('Upload Error:', error);
        throw new Error('فشل الرفع: ' + (error.message || 'خطأ في الشبكة'));
    }
}

/**
 * Helper function to compress images using Canvas
 */
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // تقليل الأبعاد إذا كانت ضخمة جداً (أكبر من 1920 بكسل) مع الحفاظ على النسبة
                const max_size = 1920;
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // التحويل إلى WebP بجودة 85% (توازن ممتاز بين الحجم والدقة)
                canvas.toBlob((blob) => {
                    if (blob) {
                        // إعادة تسمية الملف ليكون بامتداد webp
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file); // فشل الضغط، ارفع الأصلي
                    }
                }, 'image/webp', 0.85);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

/**
 * Add a new product to Appwrite
 */
async function addProductToDB(product) {
    try {
        const response = await databases.createDocument(
            config.DATABASE_ID,
            config.COLLECTION_ID,
            Appwrite.ID.unique(),
            product
        );
        return response.$id;
    } catch (error) {
        // console.error('Error adding product:', error.message);
        alert('فشل إضافة المنتج: ' + error.message);
        return null;
    }
}

/**
 * Update an existing product
 */
async function updateProductInDB(id, updatedData) {
    try {
        await databases.updateDocument(
            config.DATABASE_ID,
            config.COLLECTION_ID,
            id,
            updatedData
        );
        return true;
    } catch (error) {
        // console.error('Error updating product:', error.message);
        return false;
    }
}

/**
 * Delete a product from Appwrite
 */
async function deleteProductFromDB(id, fileId) {
    try {
        // 1. Delete from Database
        await databases.deleteDocument(
            config.DATABASE_ID,
            config.COLLECTION_ID,
            id
        );
        
        // 2. Delete from Storage if fileId exists
        if (fileId) {
            await storage.deleteFile(config.BUCKET_ID, fileId);
        }
        return true;
    } catch (error) {
        // console.error('Error deleting product:', error.message);
        return false;
    }
}
/**
 * Fetch all slides from Appwrite
 */
async function fetchSlides() {
    try {
        const response = await databases.listDocuments(
            config.DATABASE_ID,
            config.SLIDES_COLLECTION_ID
        );
        
        return response.documents.map(doc => ({
            id: doc.$id,
            title: doc.title,
            category_link: doc.category_link,
            media_url: doc.media_url,
            media_type: doc.media_type,
            file_id: doc.file_id
        }));
    } catch (error) {
        // console.error('Appwrite Slides Fetch Error:', error);
        return [];
    }
}

/**
 * Add a new slide to Appwrite
 */
async function addSlideToDB(slide) {
    try {
        const response = await databases.createDocument(
            config.DATABASE_ID,
            config.SLIDES_COLLECTION_ID,
            Appwrite.ID.unique(),
            slide
        );
        return response.$id;
    } catch (error) {
        // console.error('Error adding slide:', error.message);
        return null;
    }
}

/**
 * Delete a slide from Appwrite
 */
async function deleteSlideFromDB(id, fileId) {
    try {
        await databases.deleteDocument(
            config.DATABASE_ID,
            config.SLIDES_COLLECTION_ID,
            id
        );
        if (fileId) {
            await storage.deleteFile(config.BUCKET_ID, fileId);
        }
        return true;
    } catch (error) {
        // console.error('Error deleting slide:', error.message);
        return false;
    }
}

/**
 * Fetch all materials from Appwrite
 */
async function fetchMaterials() {
    try {
        const response = await databases.listDocuments(
            config.DATABASE_ID,
            config.MATERIALS_COLLECTION_ID
        );
        
        return response.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            type: doc.type,
            old_price: doc.old_price,
            new_price: doc.new_price,
            media_url: doc.media_url,
            file_id: doc.file_id
        }));
    } catch (error) {
        return [];
    }
}

/**
 * Add a new material to Appwrite
 */
async function addMaterialToDB(material) {
    try {
        const response = await databases.createDocument(
            config.DATABASE_ID,
            config.MATERIALS_COLLECTION_ID,
            Appwrite.ID.unique(),
            material
        );
        return response.$id;
    } catch (error) {
        alert('فشل إضافة الخامة: ' + error.message);
        return null;
    }
}

/**
 * Delete a material from Appwrite
 */
async function deleteMaterialFromDB(id, fileId) {
    try {
        await databases.deleteDocument(
            config.DATABASE_ID,
            config.MATERIALS_COLLECTION_ID,
            id
        );
        if (fileId) {
            await storage.deleteFile(config.BUCKET_ID, fileId);
        }
        return true;
    } catch (error) {
        return false;
    }
}
