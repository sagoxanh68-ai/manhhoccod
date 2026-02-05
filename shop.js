// shop.js - Handle Shop Logic

const productGrid = document.querySelector('.product-grid');

function formatPrice(price) {
    if (!price) return 'Liên hệ';
    // Handle simplified numbering
    const num = parseInt(String(price).replace(/\D/g, ''));
    if (isNaN(num)) return price;
    return num.toLocaleString('vi-VN') + 'đ';
}

function renderProducts(filter = null, isSearch = false) {
    productGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">Đang tải sản phẩm...</p>';

    let query = db.collection("products");

    if (!isSearch && filter) {
        // Category Filter
        query = query.where("category", "==", filter);
    } else {
        // Load all for search or no filter
        query = query.orderBy("createdAt", "desc");
    }

    query.get().then((querySnapshot) => {
        console.log(`Loaded ${querySnapshot.size} products from DB.`);
        productGrid.innerHTML = ''; // Clear loading text

        // Convert to array for filtering if needed
        let products = [];
        querySnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // Apply Search Filter (Client-side)
        if (isSearch && filter) {
            // Helper to remove accents for better search
            const removeAccents = (str) => {
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            };

            const searchKey = removeAccents(filter);

            products = products.filter(p => {
                if (!p.name) return false;
                const productName = removeAccents(p.name);
                return productName.includes(searchKey);
            });
        }

        if (products.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">Không tìm thấy sản phẩm nào.</p>';
            return;
        }

        products.forEach((product) => {
            // Fallback image if missing or error
            const imgUrl = product.image || 'https://via.placeholder.com/300?text=No+Image';

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            // Click on card to go to detail
            productCard.innerHTML = `
                <div class="product-img-wrapper">
                    <a href="chi-tiet-san-pham.html?id=${product.id}">
                        <img src="${imgUrl}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/300?text=Error'">
                    </a>
                </div>
                <div class="product-info">
                    <h4 class="product-title"><a href="chi-tiet-san-pham.html?id=${product.id}" style="text-decoration: none; color: inherit;">${product.name}</a></h4>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div style="display: flex; gap: 5px; margin-top: 10px;">
                        <a href="chi-tiet-san-pham.html?id=${product.id}" class="btn btn-sm btn-outline-primary" 
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

// Handle Category Hash Links (Simple Client-side Filter) & Search
function handleHashChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');

    if (searchQuery) {
        console.log("Searching for:", searchQuery);
        renderProducts(searchQuery, true);

        const titleEl = document.querySelector('.section-title');
        if (titleEl) titleEl.innerText = `Kết quả tìm kiếm: "${searchQuery}"`;
        return; // Prioritize search over hash
    }

    const hash = window.location.hash.substring(1); // Remove '#'
    console.log("Filtering by:", hash);

    if (hash && hash !== 'top') {
        renderProducts(hash, false);

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
    handleHashChange(); // Check hash/search immediately on load
});

window.addEventListener('hashchange', handleHashChange);
