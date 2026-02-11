// --- TABS & UI LOGIC ---
const menuItems = document.querySelectorAll('.admin-menu-item');
const productSection = document.getElementById('productSection');
const newsSection = document.getElementById('newsSection');
const serviceSection = document.getElementById('servicesSection');
// Config section ID is not robustly defined in HTML, handled dynamically or needs ID. 
// Assuming configSection variable is not strictly needed globally if we find it dynamically, 
// OR we should fix HTML to have an ID. For now, let's keep it safe.

// Helper to reset all views
function resetTabs() {
    productSection.style.display = 'none';
    newsSection.style.display = 'none';
    serviceSection.style.display = 'none';
    const configSection = document.getElementById('configSection');
    if (configSection) configSection.style.display = 'none';
    menuItems.forEach(item => item.classList.remove('active'));
}

function switchTab(tabName) {
    // 1. Reset All
    resetTabs();

    // 2. Activate Target
    if (tabName === 'product') {
        productSection.style.display = 'block';
        menuItems[0].classList.add('active');
        loadProducts();
    } else if (tabName === 'services' || tabName === 'service') {
        serviceSection.style.display = 'block';
        menuItems[1].classList.add('active');
        loadServices();
    } else if (tabName === 'news') {
        newsSection.style.display = 'block';
        menuItems[2].classList.add('active');
        loadNews();
    } else if (tabName === 'config') {
        const configContainer = document.getElementById('configSection');
        if (configContainer) configContainer.style.display = 'block';
        menuItems[3].classList.add('active');
        loadConfig();
    }
}

// Debug Logger (Silent)
function logToScreen(msg) {
    console.log(`[Admin] ${msg}`);
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    logToScreen("Admin DOM Content Loaded.");

    // Check if Firebase globals exist immediately
    if (typeof firebase === 'undefined') {
        logToScreen("CRITICAL ERROR: Firebase SDK not loaded!");
        return;
    } else {
        logToScreen("Firebase SDK detected.");
    }

    setTimeout(() => {
        logToScreen("Checking for window.db...");
        if (window.db) {
            logToScreen("DB Found. Switching to 'product' tab...");
            try {
                switchTab('product');
            } catch (err) {
                logToScreen("ERROR in switchTab: " + err.message);
            }
        } else {
            logToScreen("ERROR: window.db is undefined! Check firebase-config.js");
            alert("Lỗi: Không kết nối được Firebase DB. Vui lòng tải lại trang.");
        }
    }, 1000); // Increased buffer to 1000ms
});


// --- SHARED HELPER: IMAGE UPLOAD ---
const MAX_WIDTH = 800;

const fileToBase64 = (file) => {
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

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress
            };
        };
        reader.onerror = error => reject(error);
    });
};

async function handleImageUpload(file, currentUrl, btnRef) {
    if (!file) return currentUrl; // No new file, keep old URL

    // FORCE BASE64 (Fixing Upload Issues)
    try {
        if (btnRef) btnRef.innerText = "Đang xử lý ảnh...";
        const base64Url = await fileToBase64(file);
        return base64Url;
    } catch (e) {
        console.error("Image processing failed:", e);
        alert("Lỗi xử lý ảnh: " + e.message);
        return currentUrl;
    }
}

// --- 2. PRODUCT MANAGEMENT ---
const addProductForm = document.getElementById('addProductForm');
const adminProductList = document.getElementById('adminProductList');
const submitProductBtn = document.getElementById('submitProductBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');

// Toggle Edit Mode vs Add Mode
function setProductEditMode(isEdit) {
    const editIdInput = document.getElementById('editProductId');
    if (!isEdit) {
        addProductForm.reset();
        editIdInput.value = '';
        formTitle.innerText = "Thêm Sản Phẩm Mới";
        submitProductBtn.innerText = "Lưu Sản Phẩm";
        cancelEditBtn.style.display = 'none';
    } else {
        formTitle.innerText = "Sửa Sản Phẩm";
        submitProductBtn.innerText = "Cập Nhật";
        cancelEditBtn.style.display = 'inline-block';
    }
}

cancelEditBtn.addEventListener('click', () => {
    setProductEditMode(false);
});

// Load Products with Pagination
let lastProductVisible = null;
const PRODUCTS_PER_PAGE = 20;

function loadProducts(isNextPage = false) {
    logToScreen("Function loadProducts called.");
    if (!adminProductList) {
        logToScreen("ERROR: adminProductList element not found!");
        return;
    }

    if (!isNextPage) {
        adminProductList.innerHTML = '<p style="text-align: center; color: #999;">Đang tải (JS Active)...</p>';
        lastProductVisible = null; // Reset cursor
    }

    let query = db.collection("products").orderBy("createdAt", "desc").limit(PRODUCTS_PER_PAGE);

    if (isNextPage && lastProductVisible) {
        query = query.startAfter(lastProductVisible);
    }

    query.get().then((querySnapshot) => {
        logToScreen(`Firestore response received. Docs: ${querySnapshot.size}`);

        if (!isNextPage) {
            adminProductList.innerHTML = '';
        } else {
            // Remove old "Load More" button if exists
            const oldBtn = document.getElementById('btnLoadMoreProducts');
            if (oldBtn) oldBtn.remove();
        }

        if (querySnapshot.empty && !isNextPage) {
            adminProductList.innerHTML = '<p style="text-align: center; padding: 1rem;">Chưa có sản phẩm nào.</p>';
            return;
        }

        // Update cursor
        lastProductVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        let html = '';
        querySnapshot.forEach((doc) => {
            const p = doc.data();
            // Encode data for safe passing to edit function
            const dataSafe = encodeURIComponent(JSON.stringify({ ...p, id: doc.id }));

            html += `
            <div class="product-list-item">
                <img src="${p.image || 'https://via.placeholder.com/60'}" alt="${p.name}" class="w-24 h-24 object-cover rounded-md border border-gray-200" onerror="this.src='https://via.placeholder.com/60'">
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${p.name}</div>
                    <div style="color: #666; font-size: 0.9em;">${p.category || 'Chưa phân loại'} - ${p.price || 'Liên hệ'}</div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${dataSafe}')">Sửa</button>
                    <button class="btn btn-sm" style="background: #ff4444; color: white; margin-left: 5px;" onclick="deleteProduct('${doc.id}')">Xóa</button>
                </div>
            </div>`;
        });

        // Append new items
        const div = document.createElement('div');
        div.innerHTML = html;
        while (div.firstChild) {
            adminProductList.appendChild(div.firstChild);
        }

        // Add "Load More" button if we got a full page
        if (querySnapshot.size === PRODUCTS_PER_PAGE) {
            const loadMoreBtn = document.createElement('div');
            loadMoreBtn.id = 'btnLoadMoreProducts';
            loadMoreBtn.className = 'text-center py-4';
            loadMoreBtn.innerHTML = `<button onclick="loadProducts(true)" class="text-sago-600 font-medium hover:underline">Xem thêm sản phẩm cũ hơn <i class="fas fa-chevron-down"></i></button>`;
            adminProductList.appendChild(loadMoreBtn);
        }

    }).catch((error) => {
        console.error("Error loading products: ", error);
        if (!isNextPage) adminProductList.innerHTML = '<p style="color: red; text-align: center;">Lỗi tải dữ liệu.</p>';
    });
}

// Add/Update Product
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalText = submitProductBtn.innerText;
    submitProductBtn.disabled = true;
    submitProductBtn.innerText = 'Đang xử lý...';

    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('productName').value;
    const desc = document.getElementById('productDescription').value;
    const price = document.getElementById('productPrice').value;
    const category = document.getElementById('productCategory').value;
    const imageInput = document.getElementById('productImageFile');
    const imageUrlInput = document.getElementById('productImage');

    let finalImageUrl = imageUrlInput.value;

    try {
        // Upload image if file selected
        if (imageInput.files[0]) {
            submitProductBtn.innerText = 'Đang tải ảnh...';
            finalImageUrl = await handleImageUpload(imageInput.files[0], finalImageUrl, submitProductBtn);
        }

        const productData = {
            name: name,
            description: desc,
            price: price,
            category: category,
            image: finalImageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            // Update
            await db.collection("products").doc(id).update(productData);
            alert("Cập nhật sản phẩm thành công!");
            setProductEditMode(false);
        } else {
            // Add New
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("products").add(productData);
            alert("Thêm sản phẩm thành công!");
            addProductForm.reset();
        }
        loadProducts();

    } catch (error) {
        console.error("Error saving product: ", error);
        alert("Lỗi: " + error.message);
    } finally {
        submitProductBtn.disabled = false;
        submitProductBtn.innerText = originalText;
    }
});

// Edit Product Trigger
function editProduct(encodedData) {
    const p = JSON.parse(decodeURIComponent(encodedData));

    document.getElementById('editProductId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productDescription').value = p.description;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productImage').value = p.image || '';

    setProductEditMode(true);
    // Scroll to form
    addProductForm.scrollIntoView({ behavior: 'smooth' });
}

// Delete Product
function deleteProduct(id) {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
        db.collection("products").doc(id).delete().then(() => {
            loadProducts();
        }).catch((error) => {
            console.error("Error removing document: ", error);
            alert("Lỗi khi xóa: " + error.message);
        });
    }
}


// --- 2.5 NEWS MANAGEMENT ---
const addNewsForm = document.getElementById('addNewsForm');
const adminNewsList = document.getElementById('adminNewsList');
const submitNewsBtn = document.getElementById('submitNewsBtn');
const cancelNewsEditBtn = document.getElementById('cancelNewsEditBtn');
const newsFormTitle = document.getElementById('newsFormTitle');

// Toggle News Edit Mode
function setNewsEditMode(isEdit) {
    const editIdInput = document.getElementById('editNewsId');
    if (!isEdit) {
        addNewsForm.reset();
        editIdInput.value = '';
        newsFormTitle.innerText = "Thêm Tin Tức Mới";
        submitNewsBtn.innerText = "Đăng Bài";
        cancelNewsEditBtn.style.display = 'none';
    } else {
        newsFormTitle.innerText = "Sửa Tin Tức";
        submitNewsBtn.innerText = "Cập Nhật";
        cancelNewsEditBtn.style.display = 'inline-block';
    }
}

cancelNewsEditBtn.addEventListener('click', () => {
    setNewsEditMode(false);
});

// Load News with Pagination
let lastNewsVisible = null;
const NEWS_PER_PAGE = 10;

function loadNews(isNextPage = false) {
    if (!adminNewsList) return;

    if (!isNextPage) {
        adminNewsList.innerHTML = '<p style="text-align: center; color: #999;">Đang tải...</p>';
        lastNewsVisible = null;
    }

    let query = db.collection("news").orderBy("createdAt", "desc").limit(NEWS_PER_PAGE);

    if (isNextPage && lastNewsVisible) {
        query = query.startAfter(lastNewsVisible);
    }

    query.get().then((querySnapshot) => {
        if (!isNextPage) adminNewsList.innerHTML = '';
        else {
            const oldBtn = document.getElementById('btnLoadMoreNews');
            if (oldBtn) oldBtn.remove();
        }

        if (querySnapshot.empty && !isNextPage) {
            adminNewsList.innerHTML = '<p style="text-align: center; padding: 1rem;">Chưa có bài viết nào.</p>';
            return;
        }

        lastNewsVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        let html = '';
        querySnapshot.forEach((doc) => {
            const n = doc.data();
            const dataSafe = encodeURIComponent(JSON.stringify({ ...n, id: doc.id }));

            html += `
            <div class="product-list-item">
                <img src="${n.image || 'https://via.placeholder.com/60'}" alt="${n.title}" onerror="this.src='https://via.placeholder.com/60'">
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${n.title}</div>
                    <div style="color: #666; font-size: 0.9em; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${n.excerpt || ''}</div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="editNews('${dataSafe}')">Sửa</button>
                    <button class="btn btn-sm" style="background: #ff4444; color: white; margin-left: 5px;" onclick="deleteNews('${doc.id}')">Xóa</button>
                </div>
            </div>`;
        });

        const div = document.createElement('div');
        div.innerHTML = html;
        while (div.firstChild) adminNewsList.appendChild(div.firstChild);

        if (querySnapshot.size === NEWS_PER_PAGE) {
            const loadMoreBtn = document.createElement('div');
            loadMoreBtn.id = 'btnLoadMoreNews';
            loadMoreBtn.className = 'text-center py-4';
            loadMoreBtn.innerHTML = `<button onclick="loadNews(true)" class="text-sago-600 font-medium hover:underline">Xem thêm tin cũ hơn <i class="fas fa-chevron-down"></i></button>`;
            adminNewsList.appendChild(loadMoreBtn);
        }

    }).catch((error) => {
        console.error("Error loading news: ", error);
        if (!isNextPage) adminNewsList.innerHTML = '<p style="color: red; text-align: center;">Lỗi tải dữ liệu.</p>';
    });
}

// Add/Update News
addNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalText = submitNewsBtn.innerText;
    submitNewsBtn.disabled = true;
    submitNewsBtn.innerText = 'Đang đăng...';

    const id = document.getElementById('editNewsId').value;
    const title = document.getElementById('newsTitle').value;
    const excerpt = document.getElementById('newsExcerpt').value;
    const content = document.getElementById('newsContent').value;
    const imageInput = document.getElementById('newsImageFile');
    const imageUrlInput = document.getElementById('newsImage');

    let finalImageUrl = imageUrlInput.value;

    try {
        if (imageInput.files[0]) {
            submitNewsBtn.innerText = 'Đang tải ảnh...';
            finalImageUrl = await handleImageUpload(imageInput.files[0], finalImageUrl, submitNewsBtn);
        }

        const newsData = {
            title: title,
            excerpt: excerpt,
            content: content,
            image: finalImageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await db.collection("news").doc(id).update(newsData);
            alert("Cập nhật bài viết thành công!");
            setNewsEditMode(false);
        } else {
            newsData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("news").add(newsData);
            alert("Đăng bài thành công!");
            addNewsForm.reset();
        }
        loadNews();

    } catch (error) {
        console.error("Error saving news: ", error);
        alert("Lỗi: " + error.message);
    } finally {
        submitNewsBtn.disabled = false;
        submitNewsBtn.innerText = originalText;
    }
});

// Edit News Trigger
function editNews(encodedData) {
    const n = JSON.parse(decodeURIComponent(encodedData));

    document.getElementById('editNewsId').value = n.id;
    document.getElementById('newsTitle').value = n.title;
    document.getElementById('newsExcerpt').value = n.excerpt;
    document.getElementById('newsContent').value = n.content;
    document.getElementById('newsImage').value = n.image || '';

    setNewsEditMode(true);
    addNewsForm.scrollIntoView({ behavior: 'smooth' });
}

// Delete News
function deleteNews(id) {
    if (confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
        db.collection("news").doc(id).delete().then(() => {
            loadNews();
        }).catch((error) => {
            console.error("Error removing news: ", error);
            alert("Lỗi khi xóa: " + error.message);
        });
    }
}

// --- 3. HELPER: INLINE IMAGE INSERTION ---
async function insertContentImage(fileInputId, textareaId, btnId) {
    const fileInput = document.getElementById(fileInputId);
    const textarea = document.getElementById(textareaId);
    const btn = document.getElementById(btnId);
    const originalContent = btn.innerHTML;

    if (!fileInput.files[0]) {
        alert("Vui lòng chọn ảnh cần chèn!");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "Đang tải ảnh lên...";
        btn.style.opacity = "0.7";

        const file = fileInput.files[0];
        // Create a reference to 'article_images' folder with a unique name
        const storageRef = firebase.storage().ref();
        const fileName = `article_images/${Date.now()}_${file.name}`;
        const imageRef = storageRef.child(fileName);

        // Upload file
        await imageRef.put(file);

        // Get Download URL
        const url = await imageRef.getDownloadURL();

        // Create HTML tag
        const imgTag = `\n<img src="${url}" alt="Hình ảnh bài viết" style="max-width: 100%; height: auto;">\n`;

        // Insert into textarea at cursor position
        if (textarea.selectionStart || textarea.selectionStart == '0') {
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, startPos)
                + imgTag
                + textarea.value.substring(endPos, textarea.value.length);
        } else {
            textarea.value += imgTag;
        }

        alert("Đã chèn ảnh thành công!");
        fileInput.value = '';

    } catch (error) {
        console.error("Insert img error:", error);
        alert("Lỗi tải ảnh: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
        btn.style.opacity = "1";
    }
}

// Event Listeners for Insert Buttons
document.getElementById('btnInsertProductImg').addEventListener('click', () => {
    insertContentImage('productContentImageFile', 'productDescription', 'btnInsertProductImg');
});

document.getElementById('btnInsertNewsImg').addEventListener('click', () => {
    insertContentImage('newsContentImageFile', 'newsContent', 'btnInsertNewsImg');
});

// --- 3. CONFIGURATION MANAGEMENT ---
const configForm = document.getElementById('configForm');
const bannerKeys = ['home', 'about', 'services', 'shop', 'news', 'contact'];

// Function to setup preview listeners
function setupBannerPreviews() {
    bannerKeys.forEach(key => {
        const fileInput = document.getElementById(`heroImageFile_${key}`);
        const imgPreview = document.getElementById(`preview_${key}`);
        const placeholder = imgPreview.nextElementSibling;

        if (fileInput) {
            fileInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (evt) {
                        imgPreview.src = evt.target.result;
                        imgPreview.style.display = 'block';
                        if (placeholder) placeholder.style.display = 'none';
                    }
                    reader.readAsDataURL(file);
                }
            });
        }
    });
}
setupBannerPreviews();

// Load Config
function loadConfig() {
    db.collection('settings').doc('general').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();

            // Populate Banners
            bannerKeys.forEach(key => {
                const url = data[`heroImage_${key}`] || '';
                document.getElementById(`heroImageUrl_${key}`).value = url;
                if (url) {
                    const img = document.getElementById(`preview_${key}`);
                    img.src = url;
                    img.style.display = 'block';
                    if (img.nextElementSibling) img.nextElementSibling.style.display = 'none';
                }
            });

            if (data.contactPhone) document.getElementById('contactPhone').value = data.contactPhone;
            if (data.contactEmail) document.getElementById('contactEmail').value = data.contactEmail;
            if (data.contactAddress) document.getElementById('contactAddress').value = data.contactAddress;
            if (data.zaloLink) document.getElementById('zaloLink').value = data.zaloLink;

            // Logo
            if (data.logo) {
                document.getElementById('logoUrl').value = data.logo;
                document.getElementById('logoPreview').src = data.logo;
                document.getElementById('logoPreview').style.display = 'block';
                document.getElementById('logoPreview').nextElementSibling.style.display = 'none';
            }
        }
    }).catch(err => console.error("Error loading config:", err));
}

// Logo Preview
document.getElementById('logoFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('logoPreview').src = e.target.result;
            document.getElementById('logoPreview').style.display = 'block';
            document.getElementById('logoPreview').nextElementSibling.style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
});

// Save Config
configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveConfigBtn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Đang lưu...";

    try {
        const configData = {
            contactPhone: document.getElementById('contactPhone').value,
            contactEmail: document.getElementById('contactEmail').value,
            contactAddress: document.getElementById('contactAddress').value,
            zaloLink: document.getElementById('zaloLink').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Handle Logo
        const logoFile = document.getElementById('logoFile').files[0];
        let logoUrl = document.getElementById('logoUrl').value;
        if (logoFile) {
            btn.innerText = "Đang tải Logo...";
            logoUrl = await handleImageUpload(logoFile, logoUrl, null);
        }
        configData.logo = logoUrl;

        // Handle Banners Upload Sequentially
        for (const key of bannerKeys) {
            const fileInput = document.getElementById(`heroImageFile_${key}`);
            const urlInput = document.getElementById(`heroImageUrl_${key}`);

            let finalUrl = urlInput.value;

            if (fileInput.files.length > 0) {
                // Update button text to show progress
                btn.innerText = `Đang tải ảnh ${key}...`;
                finalUrl = await handleImageUpload(fileInput.files[0], finalUrl, null);
            }

            configData[`heroImage_${key}`] = finalUrl;
        }

        // Use set with merge: true to create if not exists
        await db.collection('settings').doc('general').set(configData, { merge: true });

        alert("Lưu cấu hình thành công! Hãy tải lại trang chủ để thấy thay đổi.");
        loadConfig();

    } catch (error) {
        alert("Lỗi: " + error.message);
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

// --- 4. SERVICE MANAGEMENT ---
const serviceList = document.getElementById('serviceList');
const serviceFormSection = document.getElementById('serviceFormSection');
const serviceForm = document.getElementById('serviceForm');
const serviceFormTitle = document.getElementById('serviceFormTitle');
const submitServiceBtn = document.getElementById('submitServiceBtn');
const cancelServiceEditBtn = document.getElementById('cancelServiceEditBtn');

function showAddServiceForm() {
    serviceForm.reset();
    document.getElementById('editServiceId').value = '';
    document.getElementById('serviceImageUrl').value = '';
    serviceFormSection.style.display = 'block';
    serviceFormTitle.innerText = 'Thêm Dịch Vụ Mới';
    submitServiceBtn.innerText = 'Lưu Dịch Vụ';
    cancelServiceEditBtn.style.display = 'inline-block';
    serviceFormSection.scrollIntoView({ behavior: 'smooth' });
}

function hideServiceForm() {
    serviceFormSection.style.display = 'none';
    serviceForm.reset();
}

serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editServiceId').value;
    const title = document.getElementById('serviceTitle').value;
    const excerpt = document.getElementById('serviceExcerpt').value;
    const content = document.getElementById('serviceContent').value;
    const file = document.getElementById('serviceImageFile').files[0];
    let imageUrl = document.getElementById('serviceImageUrl').value;
    const originalBtnText = submitServiceBtn.innerText;

    if (!title) {
        alert("Vui lòng nhập tên dịch vụ");
        return;
    }

    try {
        submitServiceBtn.disabled = true;
        submitServiceBtn.innerText = "Đang xử lý...";

        if (file) {
            imageUrl = await handleImageUpload(file, imageUrl, submitServiceBtn);
        }

        const serviceData = {
            title,
            excerpt,
            content,
            image: imageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await db.collection('services').doc(id).update(serviceData);
            alert("Cập nhật dịch vụ thành công!");
        } else {
            serviceData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('services').add(serviceData);
            alert("Thêm dịch vụ mới thành công!");
        }

        hideServiceForm();
        loadServices();

    } catch (error) {
        console.error("Error saving service:", error);
        alert("Lỗi: " + error.message);
    } finally {
        submitServiceBtn.disabled = false;
        submitServiceBtn.innerText = originalBtnText;
    }
});

function loadServices() {
    if (!serviceList) return; // Guard clause
    serviceList.innerHTML = '<p>Đang tải...</p>';
    db.collection('services').orderBy('createdAt', 'desc').get().then(snap => {
        if (snap.empty) {
            serviceList.innerHTML = '<p>Chưa có dịch vụ nào.</p>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const s = doc.data();
            const dataSafe = encodeURIComponent(JSON.stringify({ ...s, id: doc.id }));

            html += `
                <div class="product-list-item">
                    <img src="${s.image || 'https://via.placeholder.com/60'}" onerror="this.src='https://via.placeholder.com/60'">
                    <div style="flex:1">
                        <h4>${s.title}</h4>
                        <p style="font-size:0.8rem; color:#666; margin:0">${s.excerpt || ''}</p>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="editService('${dataSafe}')">Sửa</button>
                        <button class="btn btn-sm" style="background:#ff4444; color:white; margin-left:5px" onclick="deleteService('${doc.id}')">Xóa</button>
                    </div>
                </div>
            `;
        });
        serviceList.innerHTML = html;
    }).catch(err => {
        console.error("Error loading services:", err);
        serviceList.innerHTML = '<p>Lỗi tải danh sách.</p>';
    });
}

function editService(encodedData) {
    const s = JSON.parse(decodeURIComponent(encodedData));

    document.getElementById('editServiceId').value = s.id;
    document.getElementById('serviceTitle').value = s.title;
    document.getElementById('serviceExcerpt').value = s.excerpt;
    document.getElementById('serviceContent').value = s.content;
    document.getElementById('serviceImageUrl').value = s.image || '';

    showAddServiceForm(); // Show form

    document.getElementById('serviceFormTitle').innerText = 'Sửa Dịch Vụ';
    document.getElementById('submitServiceBtn').innerText = 'Cập Nhật';
}

function deleteService(id) {
    if (confirm('Xóa dịch vụ này? Hành động này không thể hoàn tác.')) {
        db.collection('services').doc(id).delete().then(loadServices);
    }
}

// Add event listener for service image insert
const btnInsertServiceImg = document.getElementById('btnInsertServiceImg');
if (btnInsertServiceImg) {
    btnInsertServiceImg.addEventListener('click', () => {
        insertContentImage('serviceContentImageFile', 'serviceContent', 'btnInsertServiceImg');
    });
}
