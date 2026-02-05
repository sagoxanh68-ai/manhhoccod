// sidebar.js - Handle Sidebar Dynamic Content

document.addEventListener('DOMContentLoaded', () => {
    loadSidebarProducts();
    loadSidebarNews();
});

async function loadSidebarProducts() {
    const container = document.getElementById('sidebar-products');
    if (!container) return; // Exit if not found

    container.innerHTML = '<p class="text-center" style="font-size:0.9rem; color:#666;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</p>';

    try {
        // Fetch 5 latest products
        const snapshot = await db.collection("products")
            .orderBy("createdAt", "desc")
            .limit(5)
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<p style="font-size:0.9rem;">Chưa có sản phẩm nào.</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const p = doc.data();
            const price = p.price ? parseInt(String(p.price).replace(/\D/g, '')).toLocaleString('vi-VN') + 'đ' : 'Liên hệ';
            const img = p.image || 'https://via.placeholder.com/60';

            html += `
                <a href="chi-tiet-san-pham.html?id=${doc.id}" class="mini-product">
                    <img src="${img}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/60'">
                    <div class="mini-product-info">
                        <h4 class="mini-product-title">${p.name}</h4>
                        <span class="mini-product-price">${price}</span>
                    </div>
                </a>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error("Sidebar Products Error:", error);
        container.innerHTML = '<p style="font-size:0.9rem; color:red;">Lỗi tải dữ liệu.</p>';
    }
}

async function loadSidebarNews() {
    const container = document.getElementById('sidebar-news');
    if (!container) return;

    container.innerHTML = '<p class="text-center" style="font-size:0.9rem; color:#666;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</p>';

    try {
        // Fetch 5 latest news
        const snapshot = await db.collection("news")
            .orderBy("createdAt", "desc")
            .limit(5)
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<p style="font-size:0.9rem;">Chưa có bài viết.</p>';
            return;
        }

        let html = '<ul class="recent-posts-list">';
        snapshot.forEach(doc => {
            const n = doc.data();
            const date = n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : '';

            html += `
                <li>
                    <a href="chi-tiet-tin-tuc.html?id=${doc.id}">
                        ${n.title}
                        <span class="post-date" style="display:block; font-size:0.8rem; color:#888; margin-top:2px;">
                            <i class="far fa-calendar-alt"></i> ${date}
                        </span>
                    </a>
                </li>
            `;
        });
        html += '</ul>';

        container.innerHTML = html;

    } catch (error) {
        console.error("Sidebar News Error:", error);
        // Fallback for missing index error (if not indexed yet)
        container.innerHTML = '<p style="font-size:0.9rem; color:#999;">Không thể tải bài viết mới nhất.</p>';
    }
}
