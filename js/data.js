// Initialize Appwrite
const client = new Appwrite.Client();
client
    .setEndpoint(config.ENDPOINT)
    .setProject(config.PROJECT_ID);

const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);

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
 * Upload file to Appwrite Storage with Progress
 */
async function uploadFile(file, onProgress) {
    try {
        const response = await storage.createFile(
            config.BUCKET_ID,
            Appwrite.ID.unique(),
            file,
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
