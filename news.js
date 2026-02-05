document.addEventListener('DOMContentLoaded', () => {
    const newsGrid = document.getElementById('newsGrid');

    if (!newsGrid) return;

    db.collection("news").orderBy("createdAt", "desc").get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-style: italic;">Chưa có bài viết nào.</p>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const news = doc.data();
            const date = news.createdAt ? new Date(news.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Mới cập nhật';

            // For now, we link to a generic detail page or we could make the detail page dynamic too.
            // Since the user asked for "update info", ideally we need a dynamic detail page.
            // For this iteration, I'll link to a placeholder dynamic detail logic (later step).
            // Or just `#` for now until we fix the detail page.
            // Actually, let's point to `chi-tiet-tin-tuc.html?id=${doc.id}`

            html += `
                <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: transform 0.3s;">
                    <img src="${news.image || 'https://via.placeholder.com/400x220'}" 
                         alt="${news.title}" style="height: 220px; width: 100%; object-fit: cover;">
                    <div style="padding: 1.5rem;">
                        <span style="color: #888; font-size: 0.85rem; margin-bottom: 0.5rem; display: block;">${date}</span>
                        <h3 style="font-size: 1.3rem; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 3.2em;">${news.title}</h3>
                        <p style="margin-bottom: 1rem; color: #555; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${news.excerpt || ''}</p>
                        <a href="chi-tiet-tin-tuc.html?id=${doc.id}" style="color: var(--primary-color); font-weight: 600;">Xem chi tiết <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            `;
        });

        newsGrid.innerHTML = html;
    }).catch(error => {
        console.error("Error loading news:", error);
        newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Lỗi tải tin tức. Vui lòng tải lại trang.</p>';
    });
});
