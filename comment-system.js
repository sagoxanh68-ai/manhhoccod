/**
 * Comment System for Sago Xanh
 * Handles fetching and posting comments/reviews to Firebase Firestore
 */

class CommentSystem {
    constructor(config) {
        this.contextId = config.contextId; // Product ID or Article ID
        this.containerId = config.containerId; // DOM ID to render comments
        this.collectionName = "reviews"; // Firestore collection

        this.init();
    }

    init() {
        this.renderForm();
        this.loadComments();
    }

    renderForm() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const formHtml = `
            <div class="comment-system-wrapper">
                <h3>Đánh Giá & Bình Luận</h3>
                
                <form id="comment-form" class="comment-form">
                    <div class="form-group">
                        <label for="reviewer-name">Tên của bạn:</label>
                        <input type="text" id="reviewer-name" required placeholder="Nhập tên của bạn">
                    </div>
                    
                    <div class="form-group">
                        <label>Đánh giá:</label>
                        <div class="star-rating">
                            <input type="radio" id="star5" name="rating" value="5" checked /><label for="star5" title="5 sao"><i class="fas fa-star"></i></label>
                            <input type="radio" id="star4" name="rating" value="4" /><label for="star4" title="4 sao"><i class="fas fa-star"></i></label>
                            <input type="radio" id="star3" name="rating" value="3" /><label for="star3" title="3 sao"><i class="fas fa-star"></i></label>
                            <input type="radio" id="star2" name="rating" value="2" /><label for="star2" title="2 sao"><i class="fas fa-star"></i></label>
                            <input type="radio" id="star1" name="rating" value="1" /><label for="star1" title="1 sao"><i class="fas fa-star"></i></label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="review-content">Nội dung:</label>
                        <textarea id="review-content" rows="4" required placeholder="Chia sẻ cảm nghĩ của bạn..."></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary">Gửi Đánh Giá</button>
                    <div id="comment-status" class="status-message"></div>
                </form>

                <div id="comments-list" class="comments-list">
                    <!-- Comments will be loaded here -->
                    <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Đang tải bình luận...</div>
                </div>
            </div>
        `;

        container.innerHTML = formHtml;

        // Add Event Listener
        document.getElementById('comment-form').addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async loadComments() {
        const listContainer = document.getElementById('comments-list');

        try {
            const snapshot = await db.collection(this.collectionName)
                .where("contextId", "==", this.contextId)
                .orderBy("timestamp", "desc")
                .get();

            if (snapshot.empty) {
                listContainer.innerHTML = '<p class="no-comments">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>';
                return;
            }

            let commentsHtml = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('vi-VN') : 'Mới đây';
                const stars = this.generateStars(data.rating);

                commentsHtml += `
                    <div class="comment-item">
                        <div class="comment-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="comment-body">
                            <div class="comment-header">
                                <span class="comment-author">${this.escapeHtml(data.name)}</span>
                                <span class="comment-date"><i class="far fa-clock"></i> ${date}</span>
                            </div>
                            <div class="comment-rating">${stars}</div>
                            <div class="comment-text">${this.escapeHtml(data.content)}</div>
                        </div>
                    </div>
                `;
            });

            listContainer.innerHTML = commentsHtml;

        } catch (error) {
            console.error("Error loading comments:", error);
            listContainer.innerHTML = '<p class="error-msg">Không thể tải bình luận lúc này.</p>';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const nameInput = document.getElementById('reviewer-name');
        const contentInput = document.getElementById('review-content');
        const ratingInput = document.querySelector('input[name="rating"]:checked');
        const statusDiv = document.getElementById('comment-status');
        const btn = e.target.querySelector('button');

        const name = nameInput.value.trim();
        const content = contentInput.value.trim();
        const rating = ratingInput ? parseInt(ratingInput.value) : 5;

        if (!name || !content) {
            this.showStatus('Vui lòng điền đầy đủ thông tin.', 'error');
            return;
        }

        // Disable button
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

        try {
            await db.collection(this.collectionName).add({
                contextId: this.contextId,
                name: name,
                content: content,
                rating: rating,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.showStatus('Cảm ơn bạn đã đánh giá!', 'success');

            // Reset form
            nameInput.value = '';
            contentInput.value = '';

            // Reload comments
            this.loadComments();

        } catch (error) {
            console.error("Error submitting comment:", error);
            this.showStatus('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Gửi Đánh Giá';
        }
    }

    generateStars(rating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fas fa-star filled"></i>';
            } else {
                starsHtml += '<i class="far fa-star empty"></i>';
            }
        }
        return starsHtml;
    }

    showStatus(msg, type) {
        const el = document.getElementById('comment-status');
        el.textContent = msg;
        el.className = `status-message ${type}`;
        setTimeout(() => {
            el.textContent = '';
            el.className = 'status-message';
        }, 3000);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
