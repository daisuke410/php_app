// BookBrella - 書籍管理機能

async function loadBooks() {
    try {
        const result = await apiCall('get_books', 'GET');
        if (result.success) {
            books = result.books;
        }
    } catch (error) {
        console.error('書籍の読み込みエラー:', error);
    }
}

function displayBooks(filteredBooks = null) {
    const booksToDisplay = filteredBooks || books;
    const booksList = document.getElementById('books-list');
    const stats = document.getElementById('books-stats');
    
    stats.textContent = `登録書籍数: ${books.length}冊`;
    
    booksList.innerHTML = booksToDisplay.map(book => `
        <div class="book-item" onclick="showBookDetail(${book.id})">
            <img src="${book.image_url || book.imageUrl || 'https://via.placeholder.com/150x220/8a9a7b/ffffff?text=No+Image'}" 
                 alt="${book.title}" class="book-cover">
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
            <div class="book-status ${book.status === 'available' ? 'status-available' : 'status-rented'}">
                ${book.status === 'available' ? '貸出可' : '貸出中'}
            </div>
        </div>
    `).join('');
}

function filterBooks() {
    const title = document.getElementById('filter-title').value.toLowerCase();
    const genre = document.getElementById('filter-genre').value;
    const rating = document.getElementById('filter-rating').value;
    const description = document.getElementById('filter-description').value.toLowerCase();
    const year = document.getElementById('filter-year').value;
    
    let filtered = books;
    
    if (title) {
        filtered = filtered.filter(b => b.title.toLowerCase().includes(title));
    }
    
    if (genre) {
        filtered = filtered.filter(b => b.genre === genre);
    }
    
    if (rating) {
        filtered = filtered.filter(b => {
            const avgRating = getAverageRating(b);
            return avgRating >= parseInt(rating);
        });
    }
    
    if (description) {
        filtered = filtered.filter(b => 
            b.description && b.description.toLowerCase().includes(description)
        );
    }
    
    if (year) {
        filtered = filtered.filter(b => {
            const dateField = b.publish_date || b.date;
            if (!dateField) return false;
            const bookYear = parseInt(dateField.substring(0, 4));
            return bookYear === parseInt(year);
        });
    }
    
    displayBooks(filtered);
}

function clearFilters() {
    document.getElementById('filter-title').value = '';
    document.getElementById('filter-genre').value = '';
    document.getElementById('filter-rating').value = '';
    document.getElementById('filter-description').value = '';
    document.getElementById('filter-year').value = '';
    displayBooks();
}

function getAverageRating(book) {
    if (!book.reviews || book.reviews.length === 0) return 0;
    const sum = book.reviews.reduce((acc, r) => acc + parseInt(r.rating), 0);
    return sum / book.reviews.length;
}

function showBookDetail(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const avgRating = getAverageRating(book);
    const stars = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));
    
    const ownerType = book.owner_type || book.ownerType;
    const imageUrl = book.image_url || book.imageUrl;
    
    const content = `
        <h2>${book.title}</h2>
        <img src="${imageUrl || 'https://via.placeholder.com/200x280'}" 
             style="max-width: 200px; height: auto; margin: 15px 0; border-radius: 8px;">
        <p><strong>著者:</strong> ${book.author}</p>
        <p><strong>ジャンル:</strong> ${book.genre}</p>
        <p><strong>出版社:</strong> ${book.publisher}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>所有者:</strong> ${ownerType} - ${book.owner}</p>
        <p><strong>拠点:</strong> ${book.location}</p>
        <p><strong>ステータス:</strong> ${book.status === 'available' ? '貸出可' : '貸出中'}</p>
        <p><strong>平均評価:</strong> ${stars} (${avgRating.toFixed(1)})</p>
        ${book.description ? `<p><strong>概要:</strong> ${book.description}</p>` : ''}
        
        <div class="book-detail-actions">
            ${ownerType === '個人所有（貸出不可）' ? 
                `<p style="color: #999; font-style: italic;">※ この書籍は貸出不可です</p>` :
                book.status === 'available' ? 
                    `<button class="btn btn-primary" onclick="showRentalModal(${book.id})">貸出</button>` : 
                    `<button class="btn btn-success" onclick="returnBook(${book.id})">返却</button>`
            }
            <button class="btn btn-secondary" onclick="showReviewModal(${book.id})">レビュー追加</button>
            <button class="btn btn-secondary" onclick="showEditBookModal(${book.id})">編集</button>
            <div class="delete-link" onclick="deleteBook(${book.id})">この書籍を削除</div>
        </div>
        
        <div class="reviews-section">
            <h3 style="color: var(--color-primary); margin-bottom: 15px;">レビュー (${book.reviews.length}件)</h3>
            ${book.reviews.map(r => `
                <div class="review-item">
                    <div class="review-header">
                        <span>${r.reviewer_name || r.name}</span>
                        <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                    </div>
                    <div>${r.comment}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('book-detail-content').innerHTML = content;
    openModal('book-detail-modal');
}

function showBookRegisterModal() {
    document.getElementById('book-isbn').value = '';
    document.getElementById('book-title').value = '';
    document.getElementById('book-author').value = '';
    document.getElementById('book-genre').value = '';
    document.getElementById('book-publisher').value = '';
    document.getElementById('book-date').value = '';
    document.getElementById('book-owner-type').value = '会社所有';
    document.getElementById('book-location').value = '豊洲';
    document.getElementById('book-owner').value = '';
    document.getElementById('book-image-url').value = '';
    document.getElementById('book-description').value = '';
    toggleOwnerField();
    openModal('book-register-modal');
}

async function registerBook() {
    const bookData = {
        isbn: document.getElementById('book-isbn').value,
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        genre: document.getElementById('book-genre').value,
        publisher: document.getElementById('book-publisher').value,
        date: document.getElementById('book-date').value,
        ownerType: document.getElementById('book-owner-type').value,
        location: document.getElementById('book-location').value,
        owner: document.getElementById('book-owner').value,
        imageUrl: document.getElementById('book-image-url').value,
        description: document.getElementById('book-description').value
    };
    
    try {
        const result = await apiCall('register_book', 'POST', bookData);
        if (result.success) {
            await loadBooks();
            displayBooks();
            closeModal('book-register-modal');
            alert('書籍を登録しました');
        }
    } catch (error) {
        alert('書籍の登録に失敗しました');
    }
}

function showEditBookModal(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('edit-book-title').value = book.title;
    document.getElementById('edit-book-author').value = book.author;
    document.getElementById('edit-book-genre').value = book.genre;
    document.getElementById('edit-book-publisher').value = book.publisher;
    document.getElementById('edit-book-owner-type').value = book.owner_type || book.ownerType;
    document.getElementById('edit-book-location').value = book.location;
    document.getElementById('edit-book-owner').value = book.owner;
    
    closeModal('book-detail-modal');
    openModal('book-edit-modal');
}

async function updateBook() {
    const bookData = {
        id: parseInt(document.getElementById('edit-book-id').value),
        title: document.getElementById('edit-book-title').value,
        author: document.getElementById('edit-book-author').value,
        genre: document.getElementById('edit-book-genre').value,
        publisher: document.getElementById('edit-book-publisher').value,
        ownerType: document.getElementById('edit-book-owner-type').value,
        location: document.getElementById('edit-book-location').value,
        owner: document.getElementById('edit-book-owner').value
    };
    
    try {
        const result = await apiCall('update_book', 'POST', bookData);
        if (result.success) {
            await loadBooks();
            displayBooks();
            closeModal('book-edit-modal');
            alert('書籍情報を更新しました');
        }
    } catch (error) {
        alert('書籍の更新に失敗しました');
    }
}

async function deleteBook(bookId) {
    if (!confirm('この書籍を削除してもよろしいですか?')) return;
    
    try {
        const result = await apiCall('delete_book', 'POST', { id: bookId });
        if (result.success) {
            await loadBooks();
            displayBooks();
            closeModal('book-detail-modal');
            alert('書籍を削除しました');
        }
    } catch (error) {
        alert('書籍の削除に失敗しました');
    }
}

function showRentalModal(bookId) {
    document.getElementById('rental-book-id').value = bookId;
    document.getElementById('rental-borrower').value = currentUser.name;
    document.getElementById('rental-return-date').value = '';
    closeModal('book-detail-modal');
    openModal('book-rental-modal');
}

async function rentBook() {
    const rentalData = {
        bookId: parseInt(document.getElementById('rental-book-id').value),
        borrower: document.getElementById('rental-borrower').value,
        returnDate: document.getElementById('rental-return-date').value
    };
    
    try {
        const result = await apiCall('rent_book', 'POST', rentalData);
        if (result.success) {
            await loadBooks();
            displayBooks();
            closeModal('book-rental-modal');
            alert('貸出処理が完了しました');
        }
    } catch (error) {
        alert('貸出処理に失敗しました');
    }
}

async function returnBook(bookId) {
    try {
        const result = await apiCall('return_book', 'POST', { bookId });
        if (result.success) {
            await loadBooks();
            displayBooks();
            closeModal('book-detail-modal');
            alert('返却処理が完了しました');
        }
    } catch (error) {
        alert('返却処理に失敗しました');
    }
}

function showReviewModal(bookId) {
    document.getElementById('review-book-id').value = bookId;
    document.getElementById('review-name').value = currentUser.name;
    document.getElementById('review-rating').value = '5';
    document.getElementById('review-comment').value = '';
    closeModal('book-detail-modal');
    openModal('review-modal');
}

async function addReview() {
    const reviewData = {
        bookId: parseInt(document.getElementById('review-book-id').value),
        name: document.getElementById('review-name').value,
        rating: parseInt(document.getElementById('review-rating').value),
        comment: document.getElementById('review-comment').value
    };
    
    try {
        const result = await apiCall('add_review', 'POST', reviewData);
        if (result.success) {
            await loadBooks();
            closeModal('review-modal');
            alert('レビューを追加しました');
        }
    } catch (error) {
        alert('レビューの追加に失敗しました');
    }
}

// エクスポート/インポート
async function exportBooks() {
    if (books.length === 0) {
        alert('エクスポートする書籍がありません');
        return;
    }
    
    const csvHeader = 'ISBN,タイトル,著者,ジャンル,出版社,発売日,所有者タイプ,拠点,所有者名,概要\n';
    const csvContent = books.map(book => {
        const publishDate = book.publish_date || book.date || '';
        const ownerType = book.owner_type || book.ownerType || '';
        
        return [
            book.isbn || '',
            `"${(book.title || '').replace(/"/g, '""')}"`,
            `"${(book.author || '').replace(/"/g, '""')}"`,
            book.genre || '',
            `"${(book.publisher || '').replace(/"/g, '""')}"`,
            publishDate,
            ownerType,
            book.location || '',
            `"${(book.owner || '').replace(/"/g, '""')}"`,
            `"${(book.description || '').replace(/"/g, '""')}"`
        ].join(',');
    }).join('\n');
    
    const csvData = csvHeader + csvContent;
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `books_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`${books.length}件の書籍データをエクスポートしました`);
}

function showImportModal() {
    document.getElementById('import-file').value = '';
    document.getElementById('import-format').value = 'csv';
    openModal('import-modal');
}

async function importBooks() {
    const fileInput = document.getElementById('import-file');
    const format = document.getElementById('import-format').value;
    const file = fileInput.files[0];
    
    if (!file) {
        alert('ファイルを選択してください');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const content = e.target.result;
        let importedBooks = [];
        let successCount = 0;
        let errorCount = 0;
        
        try {
            if (format === 'csv') {
                importedBooks = parseCSV(content);
            } else if (format === 'json') {
                importedBooks = JSON.parse(content);
            }
            
            for (const bookData of importedBooks) {
                try {
                    const newBook = {
                        isbn: bookData.isbn || bookData.ISBN || '',
                        title: bookData.title || bookData.タイトル || 'タイトル不明',
                        author: bookData.author || bookData.著者 || '著者不明',
                        genre: bookData.genre || bookData.ジャンル || 'その他',
                        publisher: bookData.publisher || bookData.出版社 || '',
                        date: bookData.date || bookData.発売日 || '',
                        ownerType: bookData.ownerType || bookData.所有者タイプ || '会社所有',
                        location: bookData.location || bookData.拠点 || '豊洲',
                        owner: bookData.owner || bookData.所有者名 || '会社',
                        imageUrl: bookData.imageUrl || '',
                        description: bookData.description || bookData.概要 || ''
                    };
                    
                    const result = await apiCall('register_book', 'POST', newBook);
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error('書籍のインポートエラー:', error);
                    errorCount++;
                }
            }
            
            await loadBooks();
            displayBooks();
            closeModal('import-modal');
            alert(`インポートが完了しました\n成功: ${successCount}件\nエラー: ${errorCount}件`);
            
        } catch (error) {
            console.error('インポートエラー:', error);
            alert('ファイルの読み込みに失敗しました。ファイル形式を確認してください。');
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}
