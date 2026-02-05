document.addEventListener('DOMContentLoaded', () => {
    console.log("Home script loaded. Waiting for Firebase...");

    // Helper to safe-get db
    const getDb = () => {
        if (window.db) return window.db;
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            return firebase.firestore();
        }
        return null;
    };

    const runHomeLogic = () => {
        const dbInstance = getDb();
        const productGrid = document.getElementById('home-product-grid');
        const newsGrid = document.getElementById('homeNewsGrid');

        if (!dbInstance) {
            console.error("Firebase DB not found even after wait.");
            const fatalError = '<p class="text-center" style="grid-column: 1/-1; color: red;">Lỗi kết nối máy chủ / DB Undefined. Vui lòng tải lại trang.</p>';
            if (productGrid) productGrid.innerHTML = fatalError;
            if (newsGrid) newsGrid.innerHTML = fatalError;
            return;
        }

        console.log("Firebase DB found. Loading data...");

        // Helper to format price
        const formatPrice = (price) => {
            if (!price) return 'Liên hệ';
            const num = parseInt(String(price).replace(/\D/g, ''));
            if (isNaN(num)) return price;
            return num.toLocaleString('vi-VN') + 'đ';
        };

        // 2. Load Products
        if (productGrid) {
            dbInstance.collection("products")
                .orderBy("createdAt", "desc")
                .limit(4)
                .get()
                .then((querySnapshot) => {
                    productGrid.innerHTML = '';
                    if (querySnapshot.empty) {
                        productGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Chưa có sản phẩm nào.</p>';
                        return;
                    }

                    let html = '';
                    querySnapshot.forEach((doc) => {
                        const p = doc.data();
                        const imgUrl = p.image || 'https://via.placeholder.com/300?text=No+Image';
                        html += `
                            <div class="product-card">
                                <div class="product-img-wrapper">
                                    <a href="chi-tiet-san-pham.html?id=${doc.id}">
                                        <img src="${imgUrl}" alt="${p.name}" class="product-img" onerror="this.src='https://via.placeholder.com/300?text=Error'">
                                    </a>
                                </div>
                                <div class="product-info">
                                    <h4 class="product-title"><a href="chi-tiet-san-pham.html?id=${doc.id}" style="text-decoration: none; color: inherit;">${p.name}</a></h4>
                                    <div class="product-price">${formatPrice(p.price)}</div>
                                    <div style="margin-top: 10px;">
                                        <a href="chi-tiet-san-pham.html?id=${doc.id}" class="btn btn-sm btn-outline-primary" 
                                           style="display: block; width:100%; text-align: center; border: 1px solid var(--primary-color); background: white; color: var(--primary-color); padding: 5px;">
                                           Chi Tiết
                                        </a>
                                    </div>
                                </div>
                            </div>`;
                    });
                    productGrid.innerHTML = html;
                })
                .catch(err => {
                    console.error("Product Load Error:", err);
                    productGrid.innerHTML = `<p class="text-center" style="color: red; grid-column: 1/-1;">Lỗi danh sách sản phẩm: ${err.message}</p>`;
                });
        }

        // 3. Load News
        if (newsGrid) {
            dbInstance.collection("news")
                .orderBy("createdAt", "desc")
                .limit(3)
                .get()
                .then((querySnapshot) => {
                    newsGrid.innerHTML = '';
                    if (querySnapshot.empty) {
                        newsGrid.innerHTML = '<p class="text-center" style="width: 100%; color: #666;">Chưa có bài viết nào.</p>';
                        return;
                    }

                    let html = '';
                    querySnapshot.forEach((doc) => {
                        const n = doc.data();
                        html += `
                        <div style="box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; background: white; display: flex; flex-direction: column;">
                            <img src="${n.image || 'https://via.placeholder.com/400x200'}" 
                                 style="height: 200px; width: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/400?text=Error'">
                            <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
                                <h4 style="margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${n.title}</h4>
                                <p style="color: #666; font-size: 0.9rem; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${n.excerpt || ''}</p>
                                <a href="chi-tiet-tin-tuc.html?id=${doc.id}" style="color: var(--primary-color); font-weight: 600; margin-top: 1rem;">Đọc thêm <i class="fas fa-arrow-right"></i></a>
                            </div>
                        </div>`;
                    });
                    newsGrid.innerHTML = html;
                })
                .catch(err => {
                    console.error("News Load Error:", err);
                    newsGrid.innerHTML = `<p class="text-center" style="color: red; width: 100%;">Lỗi tin tức: ${err.message}</p>`;
                });
        }
    };

    // Retry mechanic if firebase is a bit slow
    if (getDb()) {
        runHomeLogic();
    } else {
        setTimeout(runHomeLogic, 500); // Wait 500ms and try again
    }
});
