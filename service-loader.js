// service-loader.js
// Fetches services from Firestore and appends them to the "Dịch Vụ" dropdown

document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();

    // Find the Service Dropdown (It's inside the nav-item containing "Dịch Vụ")
    // We look for the link text "Dịch Vụ" to find the parent, then the dropdown-content
    const navLinks = document.querySelectorAll('.nav-link');
    let serviceDropdown = null;

    navLinks.forEach(link => {
        if (link.innerText.includes('Dịch Vụ')) {
            serviceDropdown = link.nextElementSibling;
        }
    });

    if (!serviceDropdown) return;

    // Fetch Services
    db.collection('services').orderBy('createdAt', 'desc').get().then(snap => {
        if (snap.empty) return;

        // Add a separator if services exist
        const separator = document.createElement('hr');
        separator.style.margin = '5px 0';
        separator.style.border = '0';
        separator.style.borderTop = '1px solid #eee';
        serviceDropdown.appendChild(separator);

        snap.forEach(doc => {
            const s = doc.data();
            const link = document.createElement('a');
            link.href = `chi-tiet-dich-vu.html?id=${doc.id}`;
            link.innerText = s.title;
            serviceDropdown.appendChild(link);
        });
    }).catch(err => console.error("Error loading dynamic services:", err));
});
