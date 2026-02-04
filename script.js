/* script.js */
document.addEventListener('DOMContentLoaded', () => {

    // Header Scroll Effect
    const header = document.querySelector('.header');

    // Check if we are on a page that needs an always-colored header (e.g. subpages)
    // But our CSS handles subpages by adding inline styles. 
    // This scroll effect is mainly for the home page transparency.

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active'); // For potential icon change

            // Toggle icon between bars and times (close)
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileToggle.querySelector('i').classList.remove('fa-times');
                mobileToggle.querySelector('i').classList.add('fa-bars');
            }
        }
    });

    // Add to Cart Interaction
    const cartBtns = document.querySelectorAll('.product-actions .fa-shopping-bag, .add-to-cart-btn');

    cartBtns.forEach(btn => {
        btn.parentElement.addEventListener('click', (e) => {
            // Check if it was the icon clicked or the wrapper
            // Simple visual feedback
            alert('Đã thêm sản phẩm vào giỏ hàng!');
        });
    });

    // Smooth Scroll for Anchor Links (if any remain)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    // Inject Floating Contact Buttons (if not present)
    if (!document.querySelector('.floating-contact')) {
        const contactDiv = document.createElement('div');
        contactDiv.className = 'floating-contact';
        contactDiv.innerHTML = `
            <a href="https://zalo.me/0793889518" target="_blank" class="contact-btn zalo-btn">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png" 
                     alt="Zalo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                <span class="contact-tooltip">Chat Zalo</span>
            </a>
            <a href="tel:0793889518" class="contact-btn call-btn">
                <i class="fas fa-phone-alt"></i>
                <span class="contact-tooltip">Gọi Ngay</span>
            </a>
        `;
        document.body.appendChild(contactDiv);
    }
});
