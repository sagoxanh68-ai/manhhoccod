// services-page-loader.js
// Dynamically loads all services for the Service Page (dich-vu.html)

document.addEventListener('DOMContentLoaded', () => {
    const serviceContainer = document.querySelector('.section .container');
    if (!serviceContainer) return;

    // Target the container
    const serviceListContainer = document.getElementById('service-list-container');
    if (!serviceListContainer) {
        console.warn("Service list container not found. Make sure to add id='service-list-container' to the main service container.");
        return;
    }

    const db = firebase.firestore();

    // Use Grid Layout Class from style.css
    serviceListContainer.className = 'services-grid';
    serviceListContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Đang tải danh sách dịch vụ...</p>';

    db.collection('services').orderBy('createdAt', 'desc').get().then(snap => {
        serviceListContainer.innerHTML = ''; // Clear loading

        if (snap.empty) {
            serviceListContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Chưa có dịch vụ nào.</p>';
            return;
        }

        snap.forEach(doc => {
            const s = doc.data();
            const imgUrl = s.image || 'images/service-garden.png';

            const card = document.createElement('div');
            card.className = 'service-card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.height = '100%';

            card.innerHTML = `
                <div style="height: 220px; overflow: hidden; border-radius: 4px; margin-bottom: 1rem;">
                    <img src="${imgUrl}" alt="${s.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;"
                    onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                </div>
                <h3 class="service-title" style="font-size: 1.4rem; margin-bottom: 0.5rem;">
                    <a href="chi-tiet-dich-vu.html?id=${doc.id}" style="text-decoration: none; color: inherit;">${s.title}</a>
                </h3>
                <p style="color: #666; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; flex-grow: 1;">${s.excerpt || ''}</p>
                <div style="margin-top: auto;">
                    <a href="chi-tiet-dich-vu.html?id=${doc.id}" class="btn btn-outline-primary" style="width: 100%; text-align: center;">Xem Chi Tiết</a>
                </div>
            `;

            serviceListContainer.appendChild(card);
        });
    }).catch(err => {
        console.error("Error loading services:", err);
        serviceListContainer.innerHTML = '<p class="text-center" style="color:red; grid-column: 1/-1;">Lỗi tải dữ liệu.</p>';
    });
});
