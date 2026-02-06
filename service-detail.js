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

// Global error safety
window.addEventListener('error', function (e) {
    console.error("Global Script Error:", e.message);
    const content = document.getElementById('newsContent');
    if (content) content.innerHTML = `<p class="text-center" style="color:red">Lỗi hệ thống: ${e.message}</p>`;
});

function loadServiceDetail(id) {
    console.log("Starting loadServiceDetail for ID:", id);

    // Timeout Promise
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out (10s). Kiểm tra kết nối mạng.")), 10000)
    );

    // Fetch Promise
    const fetchPromise = db.collection('services').doc(id).get();

    // Race them
    Promise.race([fetchPromise, timeout])
        .then(doc => {
            console.log("Firestore response received.");
            if (doc.exists) {
                console.log("Document exists:", doc.id);
                const data = doc.data();

                // Update Meta Tags
                document.title = `${data.title} - Cảnh Quan Sago Xanh`;

                // Update UI Elements
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

                generateTOC();

            } else {
                console.warn("Document not found");
                document.getElementById('newsTitle').innerText = '404';
                document.getElementById('newsExcerpt').innerText = 'Không tìm thấy trang';
                document.getElementById('newsContent').innerHTML = '<p class="text-center">Bài viết không tồn tại hoặc đã bị xóa.</p>';
            }
        }).catch(error => {
            console.error("Error loading service (Catch Block):", error);
            document.getElementById('newsTitle').innerText = 'Lỗi Tải Trang';
            document.getElementById('newsExcerpt').innerText = 'Vui lòng tải lại trang';
            document.getElementById('newsContent').innerHTML = `
            <div class="text-center" style="color: #721c24; background-color: #f8d7da; border-color: #f5c6cb; padding: 20px; border-radius: 5px;">
                <h4>Đã xảy ra lỗi khi tải dữ liệu</h4>
                <p>Chi tiết: ${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top:10px">Tải Lại Trang</button>
            </div>
        `;
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
