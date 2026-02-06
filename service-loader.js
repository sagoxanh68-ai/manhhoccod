// service-loader.js
// Fetches services from Firestore and appends them to the "Dịch Vụ" dropdown

document.addEventListener('DOMContentLoaded', () => {
    console.log("Service Loader Initialized...");
    const db = firebase.firestore();

    // Retry logic in case DOM is slow (though DOMContentLoaded should be enough)
    const findDropdown = () => {
        const navLinks = document.querySelectorAll('.nav-link');
        let dropdown = null;

        for (const link of navLinks) {
            // Check text content safely
            if (link.textContent && link.textContent.includes('Dịch Vụ')) {
                dropdown = link.nextElementSibling;
                if (dropdown && dropdown.classList.contains('dropdown-content')) {
                    return dropdown;
                }
            }
        }
        return null;
    };

    const serviceDropdown = findDropdown();

    if (!serviceDropdown) {
        console.warn("Service Dropdown not found in DOM.");
        return;
    }

    // Fetch Services
    db.collection('services').orderBy('createdAt', 'desc').get().then(snap => {
        console.log(`Found ${snap.size} services.`);

        if (snap.empty) return;

        // Clear dropdown content to ensure no static leftovers or duplicates
        // However, if we want to run this script safely on multiple pages, stripping content might be risky if we target the wrong element.
        // But since we are cleaning HTML, we can just append.
        // Actually, the user wants ONLY dynamic services. 
        // So we should probably clear the dropdown first IF it has static content?
        // But the task is to remove static content from HTML. So dropdown will be empty.
        // So we just append. And NO separator.

        snap.forEach(doc => {
            const s = doc.data();
            // Check if link already exists to avoid duplicates (hot reload or multiple runs)
            if (!serviceDropdown.querySelector(`a[href*="${doc.id}"]`)) {
                const link = document.createElement('a');
                link.href = `chi-tiet-dich-vu.html?id=${doc.id}`;
                link.innerText = s.title;
                // Remove inline styles to let CSS handle hover effects like other menus
                serviceDropdown.appendChild(link);
            }
        });
    }).catch(err => console.error("Error loading dynamic services:", err));
});
