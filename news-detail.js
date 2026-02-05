// news-detail.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        document.getElementById('newsContent').innerHTML = '<p class="status-message error">Không tìm thấy bài viết (Thiếu ID).</p>';
        return;
    }

    try {
        // 2. Fetch Data
        const doc = await db.collection("news").doc(id).get();

        if (!doc.exists) {
            document.getElementById('newsContent').innerHTML = '<p class="status-message error">Bài viết không tồn tại hoặc đã bị xóa.</p>';
            return;
        }

        const news = doc.data();

        // 3. Render Content
        document.title = news.title + " - Sago Xanh";
        document.getElementById('newsTitle').innerText = news.title;
        document.getElementById('newsExcerpt').innerText = news.excerpt || '';

        // Update header background if image exists
        if (news.image) {
            document.getElementById('newsHeader').style.backgroundImage = `linear-gradient(rgba(11, 94, 40, 0.8), rgba(11, 94, 40, 0.8)), url('${news.image}')`;
        }

        // Date
        const date = news.createdAt ? new Date(news.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa cập nhật';
        document.getElementById('newsDate').innerHTML = `<i class="far fa-calendar-alt"></i> ${date}`;

        // Content (Rich text support basic)
        // Since we used a simple textarea in Admin, newlines are \n. We should convert them to <br> or <p>
        // But if user pasted HTML, valid.
        // Let's do simple formatting: Split by double newline -> paragraphs
        let contentHtml = news.content;

        // Basic Auto-Format: Support Markdown headings and paragraphs
        if (!contentHtml.trim().startsWith('<')) {
            contentHtml = contentHtml.split('\n').map(para => {
                const trimmed = para.trim();
                if (!trimmed) return '';

                // Support Markdown Headings
                if (trimmed.startsWith('## ')) return `<h2>${trimmed.substring(3)}</h2>`;
                if (trimmed.startsWith('### ')) return `<h3>${trimmed.substring(4)}</h3>`;

                // Default to paragraph
                return `<p>${trimmed}</p>`;
            }).join('');
        }

        const contentContainer = document.getElementById('newsContent');
        contentContainer.innerHTML = contentHtml;

        // --- Auto Generate TOC ---
        const headings = contentContainer.querySelectorAll('h2, h3');
        const tocContainer = document.getElementById('dynamicTOC');
        const tocList = document.getElementById('tocList');

        if (headings.length > 0 && tocContainer) {
            tocContainer.style.display = 'block';
            tocList.innerHTML = '';

            headings.forEach((heading, index) => {
                // Create ID if missing
                if (!heading.id) {
                    heading.id = `toc-item-${index}`;
                }

                const li = document.createElement('li');
                li.style.marginBottom = '8px';

                const a = document.createElement('a');
                a.href = `#${heading.id}`;
                a.innerText = heading.innerText;
                a.style.color = '#333';
                a.style.textDecoration = 'none';
                a.style.transition = 'color 0.2s';

                a.onmouseover = () => a.style.color = 'var(--primary-color)';
                a.onmouseout = () => a.style.color = '#333';

                a.onclick = (e) => {
                    e.preventDefault();
                    document.getElementById(heading.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
                };

                // Indent h3
                if (heading.tagName.toLowerCase() === 'h3') {
                    li.style.marginLeft = '20px';
                    a.style.fontSize = '0.95em';
                }

                li.appendChild(a);
                tocList.appendChild(li);
            });
        }
        // -------------------------


        // 4. Initialize Comments with correct ID
        if (window.CommentSystem) {
            new CommentSystem({
                contextId: id, // Use the real News ID
                containerId: 'comment-section'
            });
        }


    } catch (error) {
        console.error("Error fetching news detail:", error);
        document.getElementById('newsContent').innerHTML = '<p class="status-message error">Lỗi tải dữ liệu. Vui lòng thử lại sau.</p>';
    }
});
