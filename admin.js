// admin.js - Pro CMS Logic

// --- TABS & UI LOGIC ---
function switchTab(tabName) {
    const productSection = document.getElementById('productSection');
    const newsSection = document.getElementById('newsSection');
    const menuItems = document.querySelectorAll('.admin-menu-item');

    menuItems.forEach(item => item.classList.remove('active'));

    if (tabName === 'product') {
        productSection.style.display = 'block';
        newsSection.style.display = 'none';
        menuItems[0].classList.add('active');
        loadProducts(); // Refresh
    } else {
        productSection.style.display = 'none';
        newsSection.style.display = 'block';
        menuItems[1].classList.add('active');
        loadNews(); // Refresh
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
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
