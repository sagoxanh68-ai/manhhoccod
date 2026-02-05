// admin.js - Handle Admin Logic

// 1. Add Product Logic
const addProductForm = document.getElementById('addProductForm');

const MAX_WIDTH = 800; // Resize large images for Base64

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = addProductForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;

    const name = document.getElementById('productName').value;
    const priceStr = document.getElementById('productPrice').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value;

    // Image Handling
    const imageFile = document.getElementById('productImageFile').files[0];
    const imageUrlInput = document.getElementById('productImage').value;

    if (!name || !priceStr) {
        alert("Vui lòng điền tên và giá sản phẩm!");
        return;
    }

    if (!imageFile && !imageUrlInput) {
        alert("Vui lòng chọn ảnh hoặc dán link ảnh!");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Đang xử lý...";

    // Helper to add data to Firestore
    const addToFirestore = (finalImageUrl) => {
        return db.collection("products").add({
            name: name,
            price: priceStr,
            category: category,
            image: finalImageUrl,
            description: description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    // Helper: Resize and Convert to Base64
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

    try {
        let finalImageUrl = imageUrlInput;
        console.log("Start processing product. Name:", name, "Price:", priceStr);

        if (imageFile) {
            console.log("File detected:", imageFile.name);
            submitBtn.innerText = "Đang thử tải ảnh lên Storage...";
            try {
                // Try Firebase Storage first
                const storageRef = storage.ref('products/' + Date.now() + '-' + imageFile.name);
                // Create a timeout promise that rejects after 5 seconds
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Upload timed out")), 5000)
                );

                // Race the upload against the timeout
                await Promise.race([storageRef.put(imageFile), timeoutPromise]);
                finalImageUrl = await storageRef.getDownloadURL();
            } catch (storageError) {
                console.warn("Storage upload failed, falling back to Base64", storageError);
                // Alert the user but continue
                // alert("Lưu ý: Không thể tải ảnh lên Storage (do chưa cấu hình quyền). Hệ thống sẽ tự động chuyển sang chế độ nén ảnh Base64. Quá trình này có thể mất vài giây.");

                submitBtn.innerText = "Chuyển sang chế độ lưu trực tiếp (Base64)...";
                // Fallback to Base64
                finalImageUrl = await fileToBase64(imageFile);
            }
        }

        await addToFirestore(finalImageUrl);
        alert("Đã thêm sản phẩm thành công!");
        addProductForm.reset();
        // Reset file input label if custom
        const fileLabel = document.querySelector('.custom-file-label');
        if (fileLabel) fileLabel.innerText = "Chọn ảnh...";

        loadProducts();

    } catch (error) {
        console.error("CRITICAL ERROR in Add Product:", error);
        alert(`LỖI CHI TIẾT:\n${error.message}\n\nHãy chụp ảnh màn hình thông báo này và gửi cho kỹ thuật viên.`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    }
});

// 2. Load Products Logic
function loadProducts() {
    const listContainer = document.getElementById('adminProductList');
    listContainer.innerHTML = '<p style="text-align: center; color: #999;">Đang tải...</p>';

    db.collection("products").orderBy("createdAt", "desc").get().then((querySnapshot) => {
        let html = '';

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Chưa có sản phẩm nào trên Database.</p>';
            return;
        }

        const categoryTitles = {
            // Cửa Hàng
            'cay-trong-nha': 'Cây Trồng Trong Nhà',
            'cay-san-vuon': 'Cây Trồng Sân Vườn',
            'cay-cong-trinh': 'Cây Công Trình',
            'cay-an-trai': 'Cây Trồng Ăn Trái',
            // Danh Mục Sản Phẩm
            'cay-xanh': 'Sản Phẩm Cây Xanh',
            'ban-cong': 'Sản Phẩm Cây Ban Công',
            'chau-xi-mang': 'Chậu Xi Măng Đá Mài',
            'chau-composite': 'Chậu Composite',
            'gia-the': 'Giá Thể Trồng Cây',

            // Legacy
            'cay-noi-that': 'Cây Nội Thất (Cũ)',
            'cay-ban-cong': 'Cây Ban Công (Cũ)',
            'xuong-rong': 'Xương Rồng (Cũ)',
            'chau-cay': 'Chậu Cây (Cũ)',
            'cay-van-phong': 'Cây Văn Phòng (Cũ)'
        };

        const formatPrice = (price) => {
            if (!price) return 'Liên hệ';
            const num = parseInt(String(price).replace(/\D/g, ''));
            if (isNaN(num)) return price;
            return num.toLocaleString('vi-VN') + 'đ';
        };

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const id = doc.id;
            const categoryName = categoryTitles[product.category] || product.category;

            html += `
                <div class="product-list-item">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/60'">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0;">${product.name}</h4>
                        <span style="color: #d32f2f; font-weight: bold;">${formatPrice(product.price)}</span>
                        <span style="background: #eee; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 10px;">
                            ${categoryName}
                        </span>
                    </div>
                    <button class="btn btn-sm" style="background: #ff4444; color: white;" onclick="deleteProduct('${id}')">Xóa</button>
                </div>
            `;
        });

        listContainer.innerHTML = html;
    });
}

// 3. Delete Product Logic
function deleteProduct(id) {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
        db.collection("products").doc(id).delete().then(() => {
            console.log("Document successfully deleted!");
            loadProducts(); // Refresh list
        }).catch((error) => {
            console.error("Error removing document: ", error);
            alert("Lỗi xóa: " + error.message);
        });
    }
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
