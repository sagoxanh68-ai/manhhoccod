// service-detail.js

const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');

    if (!serviceId) {
        document.getElementById('newsContent').innerHTML = '<p class="text-center">Không tìm thấy bài viết.</p>';
        return;
    }

    loadServiceDetail(serviceId);
});

function loadServiceDetail(id) {
    db.collection('services').doc(id).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();

            // Update Meta Tags (Basic)
            document.title = `${data.title} - Cảnh Quan Sago Xanh`;

            // Update UI Elements
            // Note: We are reusing the IDs from the news template to avoid renaming everything in HTML
            // headerTitle -> newsTitle
            // headerExcerpt -> newsExcerpt
            const header = document.getElementById('newsHeader');
            const title = document.getElementById('newsTitle');
            const excerpt = document.getElementById('newsExcerpt');
            const content = document.getElementById('newsContent');
            const date = document.getElementById('newsDate');

            if (data.image) {
                header.style.backgroundImage = `linear-gradient(rgba(11, 94, 40, 0.8), rgba(11, 94, 40, 0.8)), url('${data.image}')`;
            }

            title.innerText = data.title;
            excerpt.innerText = data.excerpt || '';
            content.innerHTML = data.content || '';

            if (data.updatedAt) {
                const dateObj = data.updatedAt.toDate();
                date.innerHTML = `<i class="far fa-clock"></i> Cập nhật: ${dateObj.toLocaleDateString('vi-VN')}`;
            } else if (data.createdAt) {
                const dateObj = data.createdAt.toDate();
                date.innerHTML = `<i class="far fa-clock"></i> ${dateObj.toLocaleDateString('vi-VN')}`;
            }

            // Generate TOC (Reusing existing script.js logic if available, or custom)
            generateTOC();

        } else {
            document.getElementById('newsContent').innerHTML = '<p class="text-center">Bài viết không tồn tại hoặc đã bị xóa.</p>';
        }
    }).catch(error => {
        console.error("Error loading service:", error);
        document.getElementById('newsContent').innerHTML = '<p class="text-center">Lỗi tải dữ liệu.</p>';
    });
}

function generateTOC() {
    const content = document.getElementById('newsContent');
    const headings = content.querySelectorAll('h2, h3');
    const tocBox = document.getElementById('dynamicTOC');
    const tocList = document.getElementById('tocList');

    if (headings.length < 2) {
        tocBox.style.display = 'none';
        return;
    }

    tocBox.style.display = 'block';

    headings.forEach((heading, index) => {
        const id = `toc-${index}`;
        heading.id = id;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${id}`;
        a.innerText = heading.innerText;

        if (heading.tagName === 'H3') {
            li.style.marginLeft = '20px';
            li.style.fontSize = '0.95em';
        }

        a.style.textDecoration = 'none';
        a.style.color = '#333';
        a.style.display = 'block';
        a.style.padding = '5px 0';

        a.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        li.appendChild(a);
        tocList.appendChild(li);
    });
}
