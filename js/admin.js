// Admin Logic for Aluminum Company
const ADMIN_PASSWORD = "124";
let editId = null;
let editSlideId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    const productForm = document.getElementById('add-product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSubmit();
        });
    }

    const slideForm = document.getElementById('add-slide-form');
    if (slideForm) {
        slideForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSlideSubmit();
        });
    }
});

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tab + '-tab').classList.remove('hidden');
    event.currentTarget.classList.add('active');

    if (tab === 'products') renderAdminProducts();
    if (tab === 'slides') renderAdminSlides();
}

async function handleSlideSubmit() {
    const btn = document.getElementById('btn-add-slide');
    const fileInput = document.getElementById('s-file');
    const title = document.getElementById('s-title').value;
    const link = document.getElementById('s-link').value;
    const mediaType = document.getElementById('s-media-type').value;

    const progressContainer = document.getElementById('s-progress-container');
    const progressBar = document.getElementById('s-progress-bar');
    const progressText = document.getElementById('s-progress-text');

    btn.disabled = true;
    btn.innerText = 'جاري المعالجة...';

    try {
        let media_url = '';
        let fileId = '';

        if (fileInput.files.length > 0) {
            progressContainer.classList.remove('hidden');
            const uploadResult = await uploadFile(fileInput.files[0], (percent) => {
                progressBar.style.width = percent + '%';
                progressText.innerText = percent + '%';
            });
            media_url = uploadResult.url;
            fileId = uploadResult.fileId;
        }

        const slideData = {
            title: title,
            category_link: link,
            media_type: mediaType
        };

        if (media_url) {
            slideData.media_url = media_url;
            slideData.file_id = fileId;
        }

        if (editSlideId) {
            await databases.updateDocument(config.DATABASE_ID, config.SLIDES_COLLECTION_ID, editSlideId, slideData);
            alert('تم التحديث بنجاح');
            editSlideId = null;
        } else {
            if (!media_url) {
                alert('يرجى اختيار صورة أولاً');
                btn.disabled = false;
                btn.innerText = 'إضافة للبنر';
                return;
            }
            await addSlideToDB(slideData);
            alert('تمت إضافة الصورة للبنر بنجاح');
        }

        document.getElementById('add-slide-form').reset();
        btn.innerText = 'إضافة للبنر';
        
        // تأخير بسيط ليتمكن المستخدم من رؤية اكتمال التحميل
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
        }, 1000);

        await renderAdminSlides();
    } catch (error) {
        alert('خطأ: ' + error.message);
        progressContainer.classList.add('hidden');
    }

    btn.disabled = false;
}

function editSlide(id, title, link, mediaType) {
    editSlideId = id;
    document.getElementById('s-title').value = title;
    document.getElementById('s-link').value = link || '';
    document.getElementById('s-media-type').value = mediaType || 'image';
    document.getElementById('s-file').required = false;
    document.getElementById('btn-add-slide').innerText = 'حفظ التعديلات';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function renderAdminSlides() {
    const slides = await fetchSlides();
    const tbody = document.getElementById('admin-slide-list');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">جاري التحميل...</td></tr>';

    if (slides.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">لا توجد صور في البنر.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    slides.forEach((s) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="الصورة">
                ${s.media_type === 'video' 
                    ? `<div style="width: 80px; height: 50px; background: #333; display: flex; align-items: center; justify-content: center; border-radius: 10px;"><i class="fas fa-video"></i></div>` 
                    : `<img src="${s.media_url}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 10px;">`}
            </td>
            <td data-label="العنوان">${s.title}</td>
            <td data-label="إجراءات">
                <button class="btn-edit" style="color: #3b82f6; margin-left: 15px; border:none; background:none; cursor:pointer;" onclick="editSlide('${s.id}', '${s.title}', '${s.category_link}', '${s.media_type}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" style="border:none; background:none;" onclick="handleDeleteSlide('${s.id}', '${s.file_id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleDeleteSlide(id, fileId) {
    if (confirm('هل تريد حذف هذه الصورة من البنر؟')) {
        const success = await deleteSlideFromDB(id, fileId);
        if (success) {
            alert('تم الحذف');
            await renderAdminSlides();
        }
    }
}


function login() {
    const pass = document.getElementById('admin-pass').value;
    if (pass === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdmin', 'true');
        checkAuth();
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function logout() {
    sessionStorage.removeItem('isAdmin');
    window.location.reload();
}

function checkAuth() {
    const isAdmin = sessionStorage.getItem('isAdmin');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    if (isAdmin === 'true') {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        renderAdminProducts();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
}

async function renderAdminProducts() {
    const products = await fetchProducts();
    const tbody = document.getElementById('admin-product-list');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">جاري التحميل...</td></tr>';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">لا توجد منتجات.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    products.forEach((p) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="الصورة">
                ${p.media_type === 'video' 
                    ? `<i class="fas fa-video"></i>` 
                    : `<img src="${p.media_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">`}
            </td>
            <td data-label="الاسم">${p.title}</td>
            <td data-label="التصنيف">${config.CATEGORIES[p.category] || p.category}</td>
            <td data-label="السعر">${p.new_price || p.old_price}</td>
            <td data-label="إجراءات">
                <button class="btn-edit" style="color: #3b82f6; margin-left: 15px; border:none; background:none; cursor:pointer;" onclick="editProduct('${p.id}', '${p.title}', '${p.description}', '${p.category}', '${p.old_price}', '${p.new_price}', '${p.media_type}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" style="border:none; background:none;" onclick="handleDelete('${p.id}', '${p.file_id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleSubmit() {
    const btn = document.querySelector('.btn-add');
    const fileInput = document.getElementById('p-file');
    
    const progressContainer = document.getElementById('p-progress-container');
    const progressBar = document.getElementById('p-progress-bar');
    const progressText = document.getElementById('p-progress-text');

    // القيم المدخلة
    const oldPrice = parseFloat(document.getElementById('p-old-price').value) || 0;
    const newPriceVal = document.getElementById('p-new-price').value;
    const newPrice = parseFloat(newPriceVal) || 0;

    // التحقق من السعر الجديد
    if (newPriceVal && newPrice >= oldPrice) {
        alert('خطأ: السعر الجديد يجب أن يكون أقل من السعر القديم');
        return;
    }

    btn.disabled = true;
    btn.innerText = 'جاري المعالجة...';

    try {
        let media_url = '';
        let fileId = '';

        if (fileInput.files.length > 0) {
            progressContainer.classList.remove('hidden');
            const uploadResult = await uploadFile(fileInput.files[0], (percent) => {
                progressBar.style.width = percent + '%';
                progressText.innerText = percent + '%';
            });
            media_url = uploadResult.url;
            fileId = uploadResult.fileId;
        }

        const productData = {
            title: document.getElementById('p-title').value,
            description: document.getElementById('p-desc').value,
            category: document.getElementById('p-category').value,
            old_price: document.getElementById('p-old-price').value,
            new_price: document.getElementById('p-new-price').value,
            media_type: document.getElementById('p-media-type').value
        };

        if (media_url) {
            productData.media_url = media_url;
            productData.file_id = fileId;
        }

        if (editId) {
            await updateProductInDB(editId, productData);
            alert('تم تحديث المنتج بنجاح');
            editId = null;
        } else {
            if (!media_url) {
                alert('يرجى اختيار ملف أولاً');
                btn.disabled = false;
                btn.innerText = 'إضافة المنتج';
                return;
            }
            await addProductToDB(productData);
            alert('تمت إضافة المنتج بنجاح');
        }

        document.getElementById('add-product-form').reset();
        btn.innerText = 'إضافة المنتج';
        
        // تأخير بسيط ليتمكن المستخدم من رؤية اكتمال التحميل
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
        }, 1000);

        await renderAdminProducts();
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
        progressContainer.classList.add('hidden');
    }

    btn.disabled = false;
}

function editProduct(id, title, desc, category, oldP, newP, mediaType) {
    editId = id;
    document.getElementById('p-title').value = title;
    document.getElementById('p-desc').value = desc === 'undefined' ? '' : desc;
    document.getElementById('p-category').value = category;
    document.getElementById('p-old-price').value = oldP;
    document.getElementById('p-new-price').value = newP === 'undefined' ? '' : newP;
    document.getElementById('p-media-type').value = mediaType;
    
    document.getElementById('p-file').required = false; // لا يشترط ملف جديد عند التعديل
    document.querySelector('.btn-add').innerText = 'حفظ التعديلات';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleDelete(id, fileId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من قاعدة البيانات؟')) {
        const success = await deleteProductFromDB(id, fileId);
        if (success) {
            alert('تم الحذف بنجاح');
            await renderAdminProducts();
        } else {
            alert('فشل الحذف، حاول مرة أخرى');
        }
    }
}
