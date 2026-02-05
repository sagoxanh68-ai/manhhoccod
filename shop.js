// shop.js - Handle Shop Logic

const productGrid = document.querySelector('.product-grid');

function formatPrice(price) {
    if (!price) return 'Liên hệ';
    // Handle simplified numbering
    const num = parseInt(String(price).replace(/\D/g, ''));
    if (isNaN(num)) return price;
    return num.toLocaleString('vi-VN') + 'đ';
}

function renderProducts(categoryFilter = null) {
    productGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">Đang tải sản phẩm...</p>';

    let query = db.collection("products");

    if (categoryFilter) {
        // Note: Adding orderBy here requires a composite index in Firestore.
        // To avoid errors for now, we won't sort by time when filtering.
        // If you create an index, you can uncomment the next line:
        // query = query.where("category", "==", categoryFilter).orderBy("createdAt", "desc");
        query = query.where("category", "==", categoryFilter);
    } else {
        query = query.orderBy("createdAt", "desc");
    }

    query.get().then((querySnapshot) => {
        productGrid.innerHTML = ''; // Clear loading text

        if (querySnapshot.empty) {
            productGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">Chưa có sản phẩm nào.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            // Fallback image if missing or error
            const imgUrl = product.image || 'https://via.placeholder.com/300?text=No+Image';

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            // Click on card to go to detail
            productCard.innerHTML = `
                <div class="product-img-wrapper">
                    <a href="chi-tiet-san-pham.html?id=${doc.id}">
                        <img src="${imgUrl}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/300?text=Error'">
                    </a>
                </div>
                <div class="product-info">
                    <h4 class="product-title"><a href="chi-tiet-san-pham.html?id=${doc.id}" style="text-decoration: none; color: inherit;">${product.name}</a></h4>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div style="display: flex; gap: 5px; margin-top: 10px;">
                        <a href="chi-tiet-san-pham.html?id=${doc.id}" class="btn btn-sm btn-outline-primary" 
                           style="flex: 1; text-align: center; border: 1px solid var(--primary-color); background: white; color: var(--primary-color);">
                           Chi Tiết
                        </a>
                        <!-- <button class="btn btn-sm btn-primary" onclick="addToCart('${product.name}')" style="width: 40px;"><i class="fas fa-cart-plus"></i></button> -->
                    </div>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    }).catch((error) => {
        console.error("Error getting products: ", error);
        productGrid.innerHTML = `<div style="text-align: center; width: 100%; grid-column: 1/-1; color: red;">
            <p>Lỗi tải dữ liệu: ${error.message}</p>
            <p>Nếu bạn là Admin, hãy kiểm tra Console (F12) để xem link tạo Index.</p>
        </div>`;
    });
}

function addToCart(productName) {
    alert(`Đã thêm "${productName}" vào giỏ hàng! (Chức năng Demo)`);
}

// Handle Category Hash Links (Simple Client-side Filter)
function handleHashChange() {
    const hash = window.location.hash.substring(1); // Remove '#'
    console.log("Filtering by:", hash);

    // Map nice URLs to concise DB values if needed, or just use 1:1
    // In Admin we set: cay-noi-that, cay-ban-cong, xuong-rong, chau-cay
    // In Menu we need to match these.

    if (hash && hash !== 'top') {
        renderProducts(hash);

        // Update Title
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
            'gia-the': 'Giá Thể Trồng Cây'
        };
        const title = categoryTitles[hash] || 'Sản Phẩm Theo Danh Mục';
        const titleEl = document.querySelector('.section-title');
        if (titleEl) titleEl.innerText = title;
    } else {
        renderProducts(null); // Show all
        const titleEl = document.querySelector('.section-title');
        if (titleEl) titleEl.innerText = 'Tất Cả Sản Phẩm';
    }
}

// Initial Load & Hash Change
document.addEventListener('DOMContentLoaded', () => {
    handleHashChange(); // Check hash immediately on load
});

window.addEventListener('hashchange', handleHashChange);
