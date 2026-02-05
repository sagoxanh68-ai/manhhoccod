// config-loader.js - Dynamic UI Loader

function applyConfig() {
    // 1. Try to get from LocalStorage for speed
    const cachedConfig = localStorage.getItem('sago_config');
    if (cachedConfig) {
        updateUI(JSON.parse(cachedConfig));
    }

    // 2. Fetch fresh from Firebase (Background)
    db.collection('settings').doc('general').get().then(doc => {
        if (doc.exists) {
            const config = doc.data();
            updateUI(config);
            localStorage.setItem('sago_config', JSON.stringify(config));
        }
    }).catch(err => console.error("Config Load Error:", err));
}

function updateUI(config) {
    if (!config) return;

    // --- 0. LOGO ---
    // FORCE USE of the professional logo (Prioritize over Admin momentarily to fix old logo)
    const logoUrl = 'images/logo-sago-xanh.png';
    // const logoUrl = config.logo || 'images/logo-sago-xanh.png';

    if (logoUrl) {
        const logoModules = document.querySelectorAll('.logo-container');
        logoModules.forEach(container => {
            // Replace content with Image wrapped in Link
            container.innerHTML = `
                <a href="index.html" style="display: block;">
                    <img src="${logoUrl}" alt="Logo" style="height: 90px; width: auto; object-fit: contain;">
                </a>
            `;
        });
    }

    // --- 1. HERO BANNER (Smart Routing) ---
    const path = window.location.pathname;
    let targetImage = config.heroImage_home; // Default

    // Logic to select image based on Page
    if (path.includes('gioi-thieu')) {
        targetImage = config.heroImage_about || targetImage;
    } else if (path.includes('dich-vu')) {
        targetImage = config.heroImage_services || targetImage;
    } else if (path.includes('cua-hang')) {
        targetImage = config.heroImage_shop || targetImage;
    } else if (path.includes('tin-tuc') || path.includes('chi-tiet-tin')) {
        targetImage = config.heroImage_news || targetImage;
    } else if (path.includes('lien-he')) {
        targetImage = config.heroImage_contact || targetImage;
    }

    // Apply selected image
    if (targetImage) {
        const heroes = document.querySelectorAll('.hero, .page-hero');
        heroes.forEach(el => {
            el.style.backgroundImage = `url('${targetImage}')`;
        });
    }

    // --- 2. PHONE NUMBER ---
    if (config.contactPhone) {
        // Update all tel: links
        const telLinks = document.querySelectorAll('a[href^="tel:"]');
        telLinks.forEach(link => {
            link.href = `tel:${config.contactPhone.replace(/\./g, '')}`;
            // If text content looks like a phone number, update it
            if (link.innerText.match(/[\d\.]+/)) {
                link.innerText = config.contactPhone;
            }
        });

        // Update Header Label
        const headerLabel = document.querySelector('.header-contact-label');
        if (headerLabel) {
            headerLabel.innerText = `Hotline 24/7: ${config.contactPhone}`;
        }
    }

    // --- 3. EMAIL ---
    if (config.contactEmail) {
        // Simple text replacement for elements containing email pattern
        // Or specific spans if we tagged them. For now, general update:
        const spans = document.querySelectorAll('span, p, a');
        spans.forEach(el => {
            if (el.innerText.includes('@') && el.innerText.includes('gmail.com')) {
                // Be careful not to break HTML
                if (el.children.length === 0 || (el.children.length === 1 && el.querySelector('i'))) {
                    // Only update leaf nodes or nodes with just an icon
                    if (el.innerHTML.includes('<i')) {
                        const icon = el.querySelector('i').outerHTML;
                        el.innerHTML = `${icon} ${config.contactEmail}`;
                    } else {
                        el.innerText = config.contactEmail;
                    }
                }
            }
        });
    }

    // --- 4. ADDRESS ---
    if (config.contactAddress) {
        const addressNodes = document.querySelectorAll('span, p, li');
        addressNodes.forEach(el => {
            // Heuristic: Identify address by keyword "TCH 36" or "Q.12" to be safe
            if ((el.innerText.includes('TCH 36') || el.innerText.includes('Trung Mỹ Tây')) && el.children.length === 0) {
                el.innerText = config.contactAddress;
            }
            // For footer list items with icon
            if ((el.innerText.includes('TCH 36') || el.innerText.includes('Trung Mỹ Tây')) && el.querySelector('i')) {
                const icon = el.querySelector('i').outerHTML;
                el.innerHTML = `${icon} ${config.contactAddress}`;
            }
        });
    }

    // --- 5. ZALO ---
    if (config.zaloLink) {
        const zaloBtns = document.querySelectorAll('.zalo-btn');
        zaloBtns.forEach(btn => btn.href = config.zaloLink);
    }
}

// Init
document.addEventListener('DOMContentLoaded', applyConfig);
