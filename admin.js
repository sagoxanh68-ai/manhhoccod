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
    document.getElementById('configForm').parentElement.style.display = 'none'; // Config is wrapped in a div in the snippet I saw, let's check. 
    // Actually, looking at previous admin.html code:
    // Config was just a form inside a div, but didn't have a wrapper ID 'configSection' in the snippet I saw earlier? 
    // Wait, let's check admin.html for config wrapper.
    menuItems.forEach(item => item.classList.remove('active'));
}

function switchTab(tabName) {
    // 1. Reset All
    productSection.style.display = 'none';
    if (newsSection) newsSection.style.display = 'none';
    if (serviceSection) serviceSection.style.display = 'none';
    if (document.getElementById('configForm')) document.getElementById('configForm').parentElement.style.display = 'none';

    menuItems.forEach(i => i.classList.remove('active'));

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
        const configContainer = document.getElementById('configSection'); // Use correct ID
        if (configContainer) configContainer.style.display = 'block';
        menuItems[3].classList.add('active');
        loadConfig();
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial tab to 'product' or the first one
    switchTab('product');
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

    // Try Storage first
    try {
        if (btnRef) btnRef.innerText = "Đang tải ảnh lên Cloud...";

        const storageRef = firebase.storage().ref('uploads/' + Date.now() + '-' + file.name);
        // 5s Timeout for Storage
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));

        await Promise.race([storageRef.put(file), timeoutPromise]);
        return await storageRef.getDownloadURL();

    } catch (e) {
        console.warn("Storage upload failed/timed out. using Base64 fallback.");
        if (btnRef) btnRef.innerText = "Chuyển sang chế độ nén ảnh (Base64)...";
        return await fileToBase64(file);
    }
}


// --- 1. PRODUCT MANAGEMENT ---
const addProductForm = document.getElementById('addProductForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Reset Form State
function resetProductForm() {
    addProductForm.reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('formTitle').innerText = 'Thêm Sản Phẩm Mới';
    document.getElementById('submitProductBtn').innerText = 'Lưu Sản Phẩm';
    cancelEditBtn.style.display = 'none';
}

cancelEditBtn.addEventListener('click', resetProductForm);

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitProductBtn');
    submitBtn.disabled = true;
    const originalText = submitBtn.innerText;

    try {
        const id = document.getElementById('editProductId').value;
        const name = document.getElementById('productName').value;
        const price = document.getElementById('productPrice').value;
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value;

        const imageFile = document.getElementById('productImageFile').files[0];
        const imageUrlInput = document.getElementById('productImage').value;

        // Validation
        if (!name || !price) throw new Error("Vui lòng nhập tên và giá!");
        if (!id && !imageFile && !imageUrlInput) throw new Error("Vui lòng chọn ảnh!");

        // Determine Image URL
        // If editing and no new image provided, keep existing (we need to fetch it or pass it? 
        // Actually, for simplicity, if input is empty we assume keep old, but we need current val.
        // Let's rely on handleImageUpload logic: passes currentUrl if file is null.
        // BUT currentUrl comes from input value? No, file input is clear. 
        // Logic: If file -> upload. If urlInput -> use it. If neither -> Keep old (only for Edit).

        // For 'Keep Old', we usually store the old URL in the URL input when clicking 'Edit'
        let finalImageUrl = imageUrlInput;
        if (imageFile) {
            finalImageUrl = await handleImageUpload(imageFile, imageUrlInput, submitBtn);
        }

        const productData = {
            name, price, category, description,
            image: finalImageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            // Update
            await db.collection("products").doc(id).update(productData);
            alert("Cập nhật sản phẩm thành công!");
        } else {
            // Create
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("products").add(productData);
            alert("Thêm sản phẩm thành công!");
        }

        resetProductForm();
        loadProducts();

    } catch (error) {
        alert("Lỗi: " + error.message);
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
});

function loadProducts() {
    const list = document.getElementById('adminProductList');
    list.innerHTML = '<p style="text-align:center">Đang tải...</p>';

    db.collection("products").orderBy("createdAt", "desc").get().then(snap => {
        if (snap.empty) {
            list.innerHTML = '<p style="text-align:center">Chưa có dữ liệu.</p>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const p = doc.data();
            // Encode data for safety in onclick
            const dataSafe = encodeURIComponent(JSON.stringify({ ...p, id: doc.id }));

            html += `
                <div class="product-list-item">
                    <img src="${p.image || 'https://via.placeholder.com/60'}" onerror="this.src='https://via.placeholder.com/60'">
                    <div style="flex:1">
                        <h4>${p.name}</h4>
                        <span style="color:#d32f2f; font-weight:bold">${p.price}</span>
                        <small style="margin-left:10px; background:#eee; padding:2px 5px">${p.category}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${dataSafe}')">Sửa</button>
                        <button class="btn btn-sm" style="background:#ff4444; color:white; margin-left:5px" onclick="deleteProduct('${doc.id}')">Xóa</button>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    });
}

function editProduct(encodedData) {
    const p = JSON.parse(decodeURIComponent(encodedData));

    document.getElementById('editProductId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productDescription').value = p.description || '';
    document.getElementById('productImage').value = p.image || '';

    // Scroll to form
    document.getElementById('productSection').scrollIntoView({ behavior: 'smooth' });

    // UI Changes
    document.getElementById('formTitle').innerText = 'Chỉnh Sửa Sản Phẩm: ' + p.name;
    document.getElementById('submitProductBtn').innerText = 'Cập Nhật Ngay';
    cancelEditBtn.style.display = 'inline-block';
}

function deleteProduct(id) {
    if (confirm('Bạn có chắc chắn xóa?')) {
        db.collection('products').doc(id).delete().then(loadProducts);
    }
}


// --- 2. NEWS MANAGEMENT ---
const addNewsForm = document.getElementById('addNewsForm');
const cancelNewsEditBtn = document.getElementById('cancelNewsEditBtn');

function resetNewsForm() {
    addNewsForm.reset();
    document.getElementById('editNewsId').value = '';
    document.getElementById('newsFormTitle').innerText = 'Thêm Tin Tức Mới';
    document.getElementById('submitNewsBtn').innerText = 'Đăng Bài';
    cancelNewsEditBtn.style.display = 'none';
}

cancelNewsEditBtn.addEventListener('click', resetNewsForm);

addNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitNewsBtn');
    submitBtn.disabled = true;
    const originalText = submitBtn.innerText;

    try {
        const id = document.getElementById('editNewsId').value;
        const title = document.getElementById('newsTitle').value;
        const excerpt = document.getElementById('newsExcerpt').value;
        const content = document.getElementById('newsContent').value;

        const imageFile = document.getElementById('newsImageFile').files[0];
        const imageUrlInput = document.getElementById('newsImage').value;

        if (!title) throw new Error("Tiêu đề là bắt buộc!");

        let finalImageUrl = imageUrlInput;
        if (imageFile) {
            finalImageUrl = await handleImageUpload(imageFile, imageUrlInput, submitBtn);
        }

        const newsData = {
            title, excerpt, content,
            image: finalImageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await db.collection("news").doc(id).update(newsData);
            alert("Cập nhật tin tức thành công!");
        } else {
            newsData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("news").add(newsData);
            alert("Đăng tin thành công!");
        }

        resetNewsForm();
        loadNews();

    } catch (e) {
        alert("Lỗi: " + e.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
});

function loadNews() {
    const list = document.getElementById('adminNewsList');
    list.innerHTML = '<p style="text-align:center">Đang tải...</p>';

    db.collection("news").orderBy("createdAt", "desc").get().then(snap => {
        if (snap.empty) {
            list.innerHTML = '<p style="text-align:center">Chưa có bài viết.</p>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const n = doc.data();
            const dataSafe = encodeURIComponent(JSON.stringify({ ...n, id: doc.id }));

            html += `
                <div class="product-list-item">
                    <img src="${n.image || 'https://via.placeholder.com/60'}" onerror="this.src='https://via.placeholder.com/60'">
                    <div style="flex:1">
                        <h4>${n.title}</h4>
                        <p style="font-size:0.8rem; color:#666; margin:0">${n.excerpt || ''}</p>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="editNews('${dataSafe}')">Sửa</button>
                        <button class="btn btn-sm" style="background:#ff4444; color:white; margin-left:5px" onclick="deleteNews('${doc.id}')">Xóa</button>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    });
}

function editNews(encodedData) {
    const n = JSON.parse(decodeURIComponent(encodedData));

    document.getElementById('editNewsId').value = n.id;
    document.getElementById('newsTitle').value = n.title;
    document.getElementById('newsExcerpt').value = n.excerpt;
    document.getElementById('newsContent').value = n.content;
    document.getElementById('newsImage').value = n.image || '';

    document.getElementById('newsSection').scrollIntoView({ behavior: 'smooth' });

    document.getElementById('newsFormTitle').innerText = 'Sửa Bài Viết';
    document.getElementById('submitNewsBtn').innerText = 'Cập Nhật';
    cancelNewsEditBtn.style.display = 'inline-block';
}

function deleteNews(id) {
    if (confirm('Xóa bài viết này?')) {
        db.collection('news').doc(id).delete().then(loadNews);
    }
}

// --- 3. HELPER: INLINE IMAGE INSERTION ---
async function insertContentImage(fileInputId, textareaId, btnId) {
    const fileInput = document.getElementById(fileInputId);
    const textarea = document.getElementById(textareaId);
    const btn = document.getElementById(btnId);
    const originalText = btn.innerHTML;

    if (!fileInput.files[0]) {
        alert("Vui lòng chọn ảnh cần chèn!");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải lên...';

        const file = fileInput.files[0];
        const ref = storage.ref(`content_images/${Date.now()}_${file.name}`);
        await ref.put(file);
        const url = await ref.getDownloadURL();

        // Insert into textarea
        const imgTag = `\n<img src="${url}" alt="Ảnh minh họa" style="width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">\n`;

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
        btn.innerHTML = originalText;
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
