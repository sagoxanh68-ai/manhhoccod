// home-service-loader.js
// Dynamically loads the top 3 latest services for the Homepage

document.addEventListener('DOMContentLoaded', () => {
    const serviceGrid = document.querySelector('.services-grid');
    if (!serviceGrid) return;

    const db = firebase.firestore();

    // Fetch limit 6, ordered by creation date
    db.collection('services')
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get()
        .then(snap => {
            if (snap.empty) {
                // If no dynamic services, we might want to keep the static ones or show a message?
                // Plan: Clear static content and show message, OR if mixed, append?
                // Requirement: User said "it's hardcoded", so we should probably clear hardcoded and show dynamic.
                // However, preserving "Default" services if database is empty is a nice fallback.
                // Let's check if we have data. If yes, clear grid and append.
                return;
            }

            // Clear existing static content if we have dynamic data
            serviceGrid.innerHTML = '';

            snap.forEach(doc => {
                const s = doc.data();
                const card = document.createElement('a');
                card.href = `chi-tiet-dich-vu.html?id=${doc.id}`;
                card.className = 'service-card';
                card.style.textDecoration = 'none';
                card.style.color = 'inherit';
                card.style.display = 'block';

                const imgUrl = s.image || 'images/service-garden.png'; // Fallback

                card.innerHTML = `
                    <img src="${imgUrl}" alt="${s.title}"
                        style="height: 200px; width: 100%; object-fit: cover; margin-bottom: 1rem; border-radius: 4px;">
                    <h3 class="service-title">${s.title}</h3>
                    <p style="color: var(--text-light); font-size: 0.9rem;">${s.excerpt || ''}</p>
                `;

                serviceGrid.appendChild(card);
            });

        })
        .catch(err => {
            console.error("Error loading home services:", err);
            // Optionally leave static content if error
        });
});
