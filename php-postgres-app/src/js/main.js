// Data Storage
let users = [
    { id: 1, name: '管理者', email: 'admin@test.com', password: 'admin', type: 'admin' },
    { id: 2, name: '一般ユーザー', email: 'user@test.com', password: 'user', type: 'general' }
];
let books = [];
let umbrellas = [];
let currentUser = null;
let barcodeScanner = null;
let qrScanner = null;


// Modal functions
function openModal(modalId) {
    console.log('Opening modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('Modal not found:', modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        // モーダルの背景をクリックした場合、そのモーダルを閉じる
        const modalId = event.target.id;
        if (modalId) {
            closeModal(modalId);
        }
    }
}

// Initialize
async function init() {
    showLoginPage();
    await loadBooks();
    await loadUmbrellas(); // 傘データも読み込む
}

async function loadBooks() {
    try {
        const response = await fetch('../api.php?action=get_books');
        const result = await response.json();
        if (result.success) {
            books = result.books.map(book => ({
                ...book,
                date: book.publishDate || book.publish_date, // フロントエンドで使うプロパティ名に合わせる
                imageUrl: book.imageUrl || book.image_url,
                ownerType: book.ownerType || book.owner_type
            }));
            displayBooks();
        }
    } catch (error) {
        console.error('書籍の読み込みエラー:', error);
        // エラー時はサンプルデータをロードするなどのフォールバックがあってもいいが、
        // 今回はDB連携が目的なのでエラーを表示するだけに留めるか、空にする。
        // loadSampleBooks(); // 必要なら残す
    }
}

// function loadSampleBooks() { ... } // Removed to use DB data

// Authentication
function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        showMainApp();
        showMenu();
    } else {
        alert('ログインに失敗しました');
    }
}

function devLogin() {
    // 開発用：管理者で自動ログイン
    currentUser = users.find(u => u.type === 'admin');
    showMainApp();
    showMenu();
}

function devLoginGeneral() {
    // 開発用：一般ユーザーで自動ログイン
    currentUser = users.find(u => u.type === 'general');
    showMainApp();
    showMenu();
}

function logout() {
    currentUser = null;
    closeHamburgerMenu();

    // ユーザー情報表示を隠す
    const userInfoDisplay = document.getElementById('user-info-display');
    if (userInfoDisplay) {
        userInfoDisplay.style.display = 'none';
    }

    showLoginPage();
}

function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('menu-page').classList.remove('active');
    document.getElementById('global-hamburger').style.display = 'none';
}

function showMainApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    // ユーザー情報の表示
    if (currentUser) {
        const userInfoDisplay = document.getElementById('user-info-display');
        const userNameDisplay = document.getElementById('user-name-display');
        const userRoleDisplay = document.getElementById('user-role-display');

        if (userInfoDisplay && userNameDisplay && userRoleDisplay) {
            userNameDisplay.textContent = currentUser.name;
            userRoleDisplay.textContent = currentUser.type === 'admin' ? '(管理者)' : '(一般)';
            userInfoDisplay.style.display = 'block';
        }
    }

    if (currentUser.type === 'admin') {
        document.getElementById('admin-users-btn').classList.remove('hidden');
        document.getElementById('hamburger-users-btn').classList.remove('hidden');

        // 傘管理者セクションの表示
        const umbrellaAdminSection = document.getElementById('umbrella-admin-section');
        if (umbrellaAdminSection) {
            umbrellaAdminSection.style.display = 'block';
        }
    } else {
        // 一般ユーザーの場合は非表示
        const umbrellaAdminSection = document.getElementById('umbrella-admin-section');
        if (umbrellaAdminSection) {
            umbrellaAdminSection.style.display = 'none';
        }
    }
}

function showMenu() {
    document.getElementById('menu-page').classList.add('active');
    document.getElementById('books-section').classList.add('hidden');
    document.getElementById('umbrellas-section').classList.add('hidden');
    document.getElementById('users-section').classList.add('hidden');
}

function showSection(section) {
    document.getElementById('menu-page').classList.remove('active');
    document.getElementById('books-section').classList.add('hidden');
    document.getElementById('umbrellas-section').classList.add('hidden');
    document.getElementById('users-section').classList.add('hidden');

    if (section === 'books') {
        document.getElementById('books-section').classList.remove('hidden');
        displayBooks();
    } else if (section === 'umbrellas') {
        document.getElementById('umbrellas-section').classList.remove('hidden');
        displayUmbrellas();
    } else if (section === 'users') {
        document.getElementById('users-section').classList.remove('hidden');
        displayUsers();
    }
}

// Books
function displayBooks(filteredBooks = null) {
    const booksToDisplay = filteredBooks || books;
    const booksList = document.getElementById('books-list');
    const stats = document.getElementById('books-stats');

    stats.textContent = `登録書籍数: ${books.length}冊`;

    booksList.innerHTML = booksToDisplay.map(book => `
        <div class="book-item" onclick="showBookDetail(${book.id})">
            <img src="${book.imageUrl || 'https://via.placeholder.com/150x220/8a9a7b/ffffff?text=No+Image'}" 
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

    // タイトル部分一致
    if (title) {
        filtered = filtered.filter(b => b.title.toLowerCase().includes(title));
    }

    // ジャンル
    if (genre) {
        filtered = filtered.filter(b => b.genre === genre);
    }

    // 評価
    if (rating) {
        filtered = filtered.filter(b => {
            const avgRating = getAverageRating(b);
            return avgRating >= parseInt(rating);
        });
    }

    // 概要部分一致
    if (description) {
        filtered = filtered.filter(b =>
            b.description && b.description.toLowerCase().includes(description)
        );
    }

    // 出版年
    if (year) {
        filtered = filtered.filter(b => {
            if (!b.date) return false;
            const bookYear = parseInt(b.date.substring(0, 4));
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
    const sum = book.reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / book.reviews.length;
}

function showBookDetail(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const avgRating = getAverageRating(book);
    const stars = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));

    const content = `
        <h2>${book.title}</h2>
        <img src="${book.imageUrl || 'https://via.placeholder.com/200x280'}" 
             style="max-width: 200px; height: auto; margin: 15px 0; border-radius: 8px;">
        <p><strong>著者:</strong> ${book.author}</p>
        <p><strong>ジャンル:</strong> ${book.genre}</p>
        <p><strong>出版社:</strong> ${book.publisher}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>所有者:</strong> ${book.ownerType} - ${book.owner}</p>
        <p><strong>拠点:</strong> ${book.location}</p>
        <p><strong>ステータス:</strong> ${book.status === 'available' ? '貸出可' : '貸出中'}</p>
        <p><strong>平均評価:</strong> ${stars} (${avgRating.toFixed(1)})</p>
        ${book.description ? `<p><strong>概要:</strong> ${book.description}</p>` : ''}

        <div class="book-detail-actions">
            ${book.ownerType === '個人所有（貸出不可）' ?
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
                        <span>${r.name}</span>
                        <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
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
    toggleOwnerField();
    openModal('book-register-modal');
}

function showEditBookModal(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('edit-book-title').value = book.title;
    document.getElementById('edit-book-author').value = book.author;
    document.getElementById('edit-book-genre').value = book.genre;
    document.getElementById('edit-book-publisher').value = book.publisher;
    document.getElementById('edit-book-date').value = book.date || book.publishDate || '';
    document.getElementById('edit-book-image-url').value = book.imageUrl || book.image_url || '';
    document.getElementById('edit-book-description').value = book.description || '';
    document.getElementById('edit-book-owner-type').value = book.ownerType;
    document.getElementById('edit-book-location').value = book.location;
    document.getElementById('edit-book-owner').value = book.owner;

    openModal('book-edit-modal');
}

async function updateBook() {
    const id = parseInt(document.getElementById('edit-book-id').value);

    const bookData = {
        id: id,
        title: document.getElementById('edit-book-title').value,
        author: document.getElementById('edit-book-author').value,
        genre: document.getElementById('edit-book-genre').value,
        publisher: document.getElementById('edit-book-publisher').value,
        date: document.getElementById('edit-book-date').value,
        imageUrl: document.getElementById('edit-book-image-url').value,
        description: document.getElementById('edit-book-description').value,
        ownerType: document.getElementById('edit-book-owner-type').value,
        location: document.getElementById('edit-book-location').value,
        owner: document.getElementById('edit-book-owner').value
    };

    try {
        const response = await fetch('../api.php?action=update_book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookData)
        });
        const result = await response.json();

        if (result.success) {
            const index = books.findIndex(b => b.id === id);
            if (index !== -1) {
                // APIからの返り値をマージし、プロパティ名の違いを吸収
                books[index] = {
                    ...books[index],
                    ...result.book,
                    date: result.book.publish_date,
                    imageUrl: result.book.image_url,
                    ownerType: result.book.owner_type
                };
            }
            displayBooks();
            closeModal('book-edit-modal');
        } else {
            alert('更新に失敗しました: ' + (result.error || '不明なエラー'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('通信エラーが発生しました');
    }
}

async function deleteBook(bookId) {
    if (confirm('この書籍を削除してもよろしいですか?')) {
        try {
            const response = await fetch('../api.php?action=delete_book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookId })
            });
            const result = await response.json();

            if (result.success) {
                books = books.filter(b => b.id !== bookId);
                displayBooks();
                closeModal('book-detail-modal'); // モーダルを閉じる
            } else {
                alert('削除に失敗しました: ' + (result.error || '不明なエラー'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('通信エラーが発生しました');
        }
    }
}

let video = null;
let barcodeCanvas = null;
let barcodeCtx = null;
let barcodeStreaming = false;
let autoShutterCooldown = false;
let lastBarcodeDetected = null;

function startBarcodeScanner() {
    const container = document.getElementById('scanner-container');
    container.classList.remove('hidden');

    // video要素を作成（非表示）
    if (!video) {
        video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.style.display = 'none';
        document.body.appendChild(video);
    }

    barcodeCanvas = document.getElementById('barcode-canvas');
    barcodeCtx = barcodeCanvas.getContext('2d');

    // canvasサイズを設定
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    barcodeCanvas.width = containerWidth;
    barcodeCanvas.height = containerHeight;

    // カメラ起動
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 960 }
        }
    })
        .then(function (stream) {
            video.srcObject = stream;
            video.onloadedmetadata = function () {
                video.play();
                barcodeStreaming = true;
                barcodeScanner = true;
                detectBarcode();
            };
        })
        .catch(function (err) {
            console.error('カメラエラー:', err);
            alert('カメラの起動に失敗しました');
            container.classList.add('hidden');
        });
}

function drawBarcodeVideoToCanvas() {
    if (!video.videoWidth || !video.videoHeight) return;

    const cw = barcodeCanvas.width;
    const ch = barcodeCanvas.height;
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // 4:3アスペクト比に調整
    const targetAspect = 4 / 3;
    const videoAspect = vw / vh;

    let sx, sy, sw, sh;
    if (videoAspect > targetAspect) {
        sh = vh;
        sw = vh * targetAspect;
        sx = (vw - sw) / 2;
        sy = 0;
    } else {
        sw = vw;
        sh = vw / targetAspect;
        sx = 0;
        sy = (vh - sh) / 2;
    }

    barcodeCtx.clearRect(0, 0, cw, ch);
    barcodeCtx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
}

function detectBarcode() {
    if (!barcodeStreaming) return;
    if (!video || video.readyState < 2) {
        requestAnimationFrame(detectBarcode);
        return;
    }

    drawBarcodeVideoToCanvas();

    // Quaggaでバーコード検出（検出精度向上）
    Quagga.decodeSingle({
        src: barcodeCanvas.toDataURL(),
        numOfWorkers: 0,
        inputStream: {
            size: barcodeCanvas.width,
            singleChannel: false
        },
        locator: {
            patchSize: "large",
            halfSample: false
        },
        decoder: {
            readers: ["ean_reader", "ean_8_reader"],
            multiple: false
        },
        locate: true,
        frequency: 5
    }, function (result) {
        if (result && result.codeResult) {
            const code = result.codeResult.code;

            // ISBNチェック（978または979で始まる）
            if ((code.startsWith('978') || code.startsWith('979')) && !autoShutterCooldown) {
                console.log('有効なISBN検出:', code);

                // オートシャッター（バーコード検出したら即実行）
                autoShutterCooldown = true;
                lastBarcodeDetected = code;

                document.getElementById('book-isbn').value = code;
                stopBarcodeScanner();
                searchBookByISBN();

                setTimeout(function () {
                    autoShutterCooldown = false;
                }, 1000);
                return;
            }
        }

        if (barcodeStreaming) {
            requestAnimationFrame(detectBarcode);
        }
    });
}

function stopBarcodeScanner() {
    barcodeStreaming = false;
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    const container = document.getElementById('scanner-container');
    container.classList.add('hidden');
}

async function searchBookByISBN() {
    const isbn = document.getElementById('book-isbn').value.replace(/-/g, '');
    if (!isbn) return;

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const bookInfo = data.items[0].volumeInfo;
            document.getElementById('book-title').value = bookInfo.title || '';
            document.getElementById('book-author').value = bookInfo.authors ? bookInfo.authors.join(', ') : '';
            document.getElementById('book-publisher').value = bookInfo.publisher || '';

            if (bookInfo.publishedDate) {
                document.getElementById('book-date').value = bookInfo.publishedDate;
            }

            // 書籍画像URLを保存（隠しフィールドに）
            if (bookInfo.imageLinks && bookInfo.imageLinks.thumbnail) {
                document.getElementById('book-image-url').value = bookInfo.imageLinks.thumbnail.replace('http://', 'https://');
            }

            // 書籍の概要を保存
            if (bookInfo.description) {
                document.getElementById('book-description').value = bookInfo.description;
            }

            alert('書籍情報を取得しました');
        } else {
            alert('書籍情報が見つかりませんでした');
        }
    } catch (error) {
        console.error('ISBN検索エラー:', error);
        alert('書籍情報の取得に失敗しました');
    }
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
        const response = await fetch('../api.php?action=register_book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        const result = await response.json();

        if (result.success) {
            const newBook = {
                ...result.book,
                date: result.book.publish_date,
                imageUrl: result.book.image_url,
                ownerType: result.book.owner_type,
                rentals: [],
                reviews: []
            };
            books.unshift(newBook);
            displayBooks();
            closeModal('book-register-modal');
        } else {
            alert('登録に失敗しました: ' + (result.error || '不明なエラー'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('通信エラーが発生しました');
    }
}

function showRentalModal(bookId) {
    document.getElementById('rental-book-id').value = bookId;
    document.getElementById('rental-borrower').value = currentUser.name;
    closeModal('book-detail-modal');
    openModal('book-rental-modal');
}

function rentBook() {
    const bookId = parseInt(document.getElementById('rental-book-id').value);
    const book = books.find(b => b.id === bookId);

    if (book) {
        book.status = 'rented';
        book.rentals.push({
            borrower: currentUser.name,
            date: new Date().toISOString().split('T')[0],
            returnDate: document.getElementById('rental-return-date').value
        });

        displayBooks();
        closeModal('book-rental-modal');
        alert('貸出処理が完了しました');
    }
}

function returnBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (book) {
        book.status = 'available';
        displayBooks();
        closeModal('book-detail-modal');
        alert('返却処理が完了しました');
    }
}

function showReviewModal(bookId) {
    document.getElementById('review-book-id').value = bookId;
    document.getElementById('review-name').value = currentUser.name;
    closeModal('book-detail-modal');
    openModal('review-modal');
}

async function addReview() {
    const bookId = parseInt(document.getElementById('review-book-id').value);

    const reviewData = {
        bookId: bookId,
        name: document.getElementById('review-name').value,
        rating: parseInt(document.getElementById('review-rating').value),
        comment: document.getElementById('review-comment').value
    };

    try {
        const response = await fetch('../api.php?action=add_review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        const result = await response.json();

        if (result.success) {
            const book = books.find(b => b.id === bookId);
            if (book) {
                if (!book.reviews) book.reviews = [];
                book.reviews.push({
                    ...result.review,
                    name: result.review.reviewer_name, // フロントエンドのプロパティ名に合わせる
                    date: result.review.review_date
                });
            }
            closeModal('review-modal');
            alert('レビューを追加しました');
            // 詳細モーダルを再度開いて更新されたレビューを表示する場合
            // showBookDetail(bookId); 
        } else {
            alert('レビューの追加に失敗しました: ' + (result.error || '不明なエラー'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('通信エラーが発生しました');
    }
}

// Umbrellas - 機能はjs-umbrellas.jsに移行済み


// QR Scanner Functions
function startQRScanner() {
    const container = document.getElementById('qr-scanner-container');
    container.classList.remove('hidden');
    document.getElementById('start-qr-scan-btn').classList.add('hidden');
    document.getElementById('stop-qr-scan-btn').classList.remove('hidden');

    if (!qrVideo) {
        qrVideo = document.createElement('video');
        qrVideo.setAttribute('autoplay', '');
        qrVideo.setAttribute('muted', '');
        qrVideo.setAttribute('playsinline', '');
        qrVideo.style.display = 'none';
        document.body.appendChild(qrVideo);
    }

    qrCanvas = document.getElementById('qr-canvas');
    qrCtx = qrCanvas.getContext('2d');

    const containerRect = container.getBoundingClientRect();
    qrCanvas.width = containerRect.width;
    qrCanvas.height = containerRect.height;

    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 640 }
        }
    })
        .then(function (stream) {
            qrVideo.srcObject = stream;
            qrVideo.onloadedmetadata = function () {
                qrVideo.play();
                qrScanning = true;
                document.getElementById('qr-scan-status').textContent = 'QRコードを検出中...';
                detectQRCode();
            };
        })
        .catch(function (err) {
            console.error('QRスキャナーエラー:', err);
            alert('カメラの起動に失敗しました');
            container.classList.add('hidden');
            document.getElementById('start-qr-scan-btn').classList.remove('hidden');
            document.getElementById('stop-qr-scan-btn').classList.add('hidden');
        });
}

function stopQRScanner() {
    qrScanning = false;
    if (qrVideo && qrVideo.srcObject) {
        qrVideo.srcObject.getTracks().forEach(track => track.stop());
        qrVideo.srcObject = null;
    }

    document.getElementById('qr-scanner-container').classList.add('hidden');
    document.getElementById('start-qr-scan-btn').classList.remove('hidden');
    document.getElementById('stop-qr-scan-btn').classList.add('hidden');
    document.getElementById('qr-scan-status').textContent = '';
}

function drawQRVideoToCanvas() {
    if (!qrVideo.videoWidth || !qrVideo.videoHeight) return;

    const cw = qrCanvas.width;
    const ch = qrCanvas.height;
    const vw = qrVideo.videoWidth;
    const vh = qrVideo.videoHeight;

    // 正方形にクロップ
    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;

    qrCtx.clearRect(0, 0, cw, ch);
    qrCtx.drawImage(qrVideo, sx, sy, size, size, 0, 0, cw, ch);
}

function detectQRCode() {
    if (!qrScanning) return;
    if (!qrVideo || qrVideo.readyState < 2) {
        requestAnimationFrame(detectQRCode);
        return;
    }

    drawQRVideoToCanvas();

    // QuaggaでQRコード検出
    Quagga.decodeSingle({
        src: qrCanvas.toDataURL(),
        numOfWorkers: 0,
        inputStream: {
            size: qrCanvas.width,
            singleChannel: false
        },
        locator: {
            patchSize: "large",
            halfSample: false
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"],
            multiple: false
        },
        locate: true
    }, function (result) {
        if (result && result.codeResult) {
            const qrData = result.codeResult.code;
            console.log('QRコード検出:', qrData);

            try {
                // QRコードデータの解析
                const umbrellaData = JSON.parse(qrData);
                if (umbrellaData.type === 'umbrella' && umbrellaData.id) {
                    processUmbrellaQR(umbrellaData.id);
                } else {
                    document.getElementById('qr-scan-status').textContent = '無効なQRコードです';
                }
            } catch (e) {
                document.getElementById('qr-scan-status').textContent = '無効なQRコード形式です';
            }
        } else if (qrScanning) {
            requestAnimationFrame(detectQRCode);
        }
    });
}

function processUmbrellaQR(umbrellaId) {
    const umbrella = umbrellas.find(u => u.id === umbrellaId);
    if (!umbrella) {
        alert('傘が見つかりません');
        return;
    }

    stopQRScanner();
    closeModal('qr-modal');

    if (umbrella.status === 'available') {
        // 貸出処理
        showUmbrellaRentalModal(umbrellaId);
    } else {
        // 返却処理
        if (confirm(`傘「${umbrella.name}」を返却しますか？`)) {
            returnUmbrella(umbrellaId);
        }
    }
}

// QR Code Generation
function showUmbrellaQR(umbrellaId) {
    const umbrella = umbrellas.find(u => u.id === umbrellaId);
    if (!umbrella) {
        alert('傘が見つかりません');
        return;
    }

    const qrData = JSON.stringify({
        type: 'umbrella',
        id: umbrellaId,
        name: umbrella.name,
        timestamp: Date.now()
    });

    const displayContent = document.getElementById('qr-display-content');
    displayContent.innerHTML = `
        <h3>${umbrella.name}</h3>
        <div id="qr-code-canvas-container"></div>
        <p style="margin-top: 15px;"><strong>傘ID:</strong> ${umbrellaId}</p>
        <p><strong>色:</strong> ${umbrella.color}</p>
        <p><strong>サイズ:</strong> ${umbrella.size}</p>
        <p><strong>ステータス:</strong> ${umbrella.status === 'available' ? '貸出可' : '貸出中'}</p>
    `;

    // QRコード生成
    QRCode.toCanvas(document.createElement('canvas'), qrData, {
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        margin: 2
    }, function (error, canvas) {
        if (error) {
            console.error('QRコード生成エラー:', error);
            alert('QRコードの生成に失敗しました');
        } else {
            document.getElementById('qr-code-canvas-container').appendChild(canvas);
            openModal('qr-display-modal');
        }
    });
}

// Users
function displayUsers() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = users.map(user => `
        <div class="card" style="margin-bottom: 15px;">
            <p><strong>名前:</strong> ${user.name}</p>
            <p><strong>メール:</strong> ${user.email}</p>
            <p><strong>タイプ:</strong> ${user.type === 'admin' ? '管理者' : '一般ユーザー'}</p>
        </div>
    `).join('');
}

function showRegisterModal() {
    openModal('register-modal');
}

function registerUser() {
    const newUser = {
        id: users.length + 1,
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        type: document.getElementById('register-type').value
    };

    users.push(newUser);
    closeModal('register-modal');
    alert('ユーザーを登録しました');

    if (currentUser && currentUser.type === 'admin') {
        displayUsers();
    }
}

function showCSVModal() {
    openModal('csv-modal');
}

function importCSV() {
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('ファイルを選択してください');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n');

        lines.forEach(line => {
            if (line.trim()) {
                const [name, email, password, type] = line.split(',');
                users.push({
                    id: users.length + 1,
                    name: name.trim(),
                    email: email.trim(),
                    password: password.trim(),
                    type: type.trim()
                });
            }
        });

        displayUsers();
        closeModal('csv-modal');
        alert('CSVインポートが完了しました');
    };

    reader.readAsText(file);
}

// Hamburger Menu Toggle
function toggleHamburgerMenu() {
    const modal = document.getElementById('hamburger-menu-modal');
    const hamburger = document.getElementById('global-hamburger');
    modal.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function closeHamburgerMenu() {
    const modal = document.getElementById('hamburger-menu-modal');
    const hamburger = document.getElementById('global-hamburger');
    modal.classList.remove('active');
    hamburger.classList.remove('active');
}

function navigateFromHamburger(section) {
    closeHamburgerMenu();
    if (section === 'menu') {
        showMenu();
    } else {
        showSection(section);
    }
}

function showAboutModal() {
    openModal('about-modal');
}

// Modal Controls
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');

    // カメラを停止
    if (modalId === 'book-register-modal' && barcodeScanner) {
        stopBarcodeScanner();
        barcodeScanner = null;
    } else if (modalId === 'qr-modal' && qrScanning) {
        stopQRScanner();
    }
}

// 傘の色の選択変更イベント
document.addEventListener('DOMContentLoaded', function () {
    const umbrellaColorSelect = document.getElementById('umbrella-color');
    if (umbrellaColorSelect) {
        umbrellaColorSelect.addEventListener('change', function () {
            const customInput = document.getElementById('umbrella-color-custom');
            if (this.value === 'その他') {
                customInput.style.display = 'block';
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
            }
        });
    }
});

// Toggle search filter visibility
function toggleSearchFilter() {
    const content = document.getElementById('search-filter-content');
    const icon = document.getElementById('search-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Toggle book list visibility
function toggleBookList() {
    const content = document.getElementById('books-list');
    const icon = document.getElementById('booklist-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'grid';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Toggle book register visibility
function toggleBookRegister() {
    const content = document.getElementById('register-content');
    const icon = document.getElementById('register-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Toggle umbrella list visibility
function toggleUmbrellaList() {
    const content = document.getElementById('umbrellas-list');
    const icon = document.getElementById('umbrellalist-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'grid';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Toggle umbrella register visibility
function toggleUmbrellaRegister() {
    const content = document.getElementById('umbrella-register-content');
    const icon = document.getElementById('umbrella-register-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Toggle owner field based on owner type
function toggleOwnerField() {
    const ownerType = document.getElementById('book-owner-type').value;
    const ownerField = document.getElementById('book-owner');

    if (ownerType === '会社所有') {
        ownerField.value = '会社';
        ownerField.disabled = true;
        ownerField.style.backgroundColor = '#e0e0e0';
    } else {
        ownerField.value = currentUser ? currentUser.name : '';
        ownerField.disabled = false;
        ownerField.style.backgroundColor = '';
    }
}

// Toggle bulk owner field based on owner type
function toggleBulkOwnerField() {
    const ownerType = document.getElementById('bulk-owner-type').value;
    const ownerField = document.getElementById('bulk-owner');

    if (ownerType === '会社所有') {
        ownerField.value = '会社';
        ownerField.disabled = true;
        ownerField.style.backgroundColor = '#e0e0e0';
    } else {
        ownerField.value = currentUser ? currentUser.name : '';
        ownerField.disabled = false;
        ownerField.style.backgroundColor = '';
    }
}

// Bulk Register Functions
function showBulkRegisterModal() {
    document.getElementById('bulk-isbn-list').value = '';
    document.getElementById('bulk-owner-type').value = '会社所有';
    document.getElementById('bulk-location').value = '豊洲';
    document.getElementById('bulk-owner').value = '会社';
    document.getElementById('bulk-progress').style.display = 'none';
    toggleBulkOwnerField();
    openModal('bulk-register-modal');
}

async function bulkRegisterBooks() {
    const isbnList = document.getElementById('bulk-isbn-list').value
        .split('\n')
        .map(isbn => isbn.trim().replace(/-/g, ''))
        .filter(isbn => isbn.length > 0);

    if (isbnList.length === 0) {
        alert('ISBNコードを入力してください');
        return;
    }

    const ownerType = document.getElementById('bulk-owner-type').value;
    const location = document.getElementById('bulk-location').value;
    const owner = document.getElementById('bulk-owner').value;

    const progressBar = document.getElementById('bulk-progress-bar');
    const status = document.getElementById('bulk-status');
    const progressContainer = document.getElementById('bulk-progress');

    progressContainer.style.display = 'block';

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < isbnList.length; i++) {
        const isbn = isbnList[i];
        const progress = ((i + 1) / isbnList.length * 100).toFixed(0);

        progressBar.style.width = progress + '%';
        progressBar.textContent = progress + '%';
        status.textContent = `処理中: ${i + 1}/${isbnList.length} - ISBN: ${isbn}`;

        try {
            // Google Books APIから書籍情報を取得
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const bookInfo = data.items[0].volumeInfo;

                const bookData = {
                    isbn: isbn,
                    title: bookInfo.title || 'タイトル不明',
                    author: bookInfo.authors ? bookInfo.authors.join(', ') : '著者不明',
                    genre: 'その他',
                    publisher: bookInfo.publisher || '',
                    date: bookInfo.publishedDate || '',
                    ownerType: ownerType,
                    location: location,
                    owner: owner,
                    imageUrl: bookInfo.imageLinks && bookInfo.imageLinks.thumbnail
                        ? bookInfo.imageLinks.thumbnail.replace('http://', 'https://')
                        : '',
                    description: bookInfo.description || ''
                };

                // データベースに保存
                try {
                    const saveResponse = await fetch('../api.php?action=register_book', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bookData)
                    });
                    const saveResult = await saveResponse.json();

                    if (saveResult.success) {
                        successCount++;
                    } else {
                        failCount++;
                        console.error(`ISBN ${isbn}: データベース保存失敗`, saveResult.error);
                    }
                } catch (saveError) {
                    failCount++;
                    console.error(`ISBN ${isbn}: データベース保存エラー`, saveError);
                }
            } else {
                failCount++;
                console.warn(`ISBN ${isbn}: 書籍情報が見つかりませんでした`);
            }
        } catch (error) {
            failCount++;
            console.error(`ISBN ${isbn}: エラー`, error);
        }

        // API制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    status.textContent = `完了: 成功 ${successCount}件 / 失敗 ${failCount}件`;

    // データベースから最新の書籍リストを再読み込み
    await loadBooks();
    displayBooks();

    setTimeout(() => {
        closeModal('bulk-register-modal');
        alert(`一括登録が完了しました\n成功: ${successCount}件\n失敗: ${failCount}件`);
    }, 2000);
}

// Export/Import Functions
function exportBooks() {
    if (books.length === 0) {
        alert('エクスポートする書籍がありません');
        return;
    }

    // CSV形式でエクスポート
    const csvHeader = 'ISBN,タイトル,著者,ジャンル,出版社,発売日,所有者タイプ,拠点,所有者名,概要\n';
    const csvContent = books.map(book => {
        return [
            book.isbn || '',
            `"${book.title || ''}"`,
            `"${book.author || ''}"`,
            book.genre || '',
            `"${book.publisher || ''}"`,
            book.date || '',
            book.ownerType || '',
            book.location || '',
            `"${book.owner || ''}"`,
            `"${(book.description || '').replace(/"/g, '""')}"`
        ].join(',');
    }).join('\n');

    const csvData = csvHeader + csvContent;

    // ファイルダウンロード
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

function importBooks() {
    const fileInput = document.getElementById('import-file');
    const format = document.getElementById('import-format').value;
    const file = fileInput.files[0];

    if (!file) {
        alert('ファイルを選択してください');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
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

            // データ検証とインポート
            importedBooks.forEach((bookData, index) => {
                try {
                    const newBook = {
                        id: books.length + successCount + 1,
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
                        description: bookData.description || bookData.概要 || '',
                        status: 'available',
                        rentals: [],
                        reviews: []
                    };

                    books.push(newBook);
                    successCount++;
                } catch (error) {
                    console.error(`行 ${index + 1} のインポートエラー:`, error);
                    errorCount++;
                }
            });

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

function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const rowData = {};

        headers.forEach((header, index) => {
            if (values[index] !== undefined) {
                rowData[header] = values[index].replace(/^"|"$/g, '').replace(/""/g, '"');
            }
        });

        data.push(rowData);
    }

    return data;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current);
    return values;
}

// Initialize app
init();

