// BookBrella - ISBNバーコードスキャナーと一括登録

let video = null;
let barcodeCanvas = null;
let barcodeCtx = null;
let barcodeStreaming = false;
let barcodeScanner = null;
let autoShutterCooldown = false;
let lastBarcodeDetected = null;

function startBarcodeScanner() {
    const container = document.getElementById('scanner-container');
    container.classList.remove('hidden');
    
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
    
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    barcodeCanvas.width = containerWidth;
    barcodeCanvas.height = containerHeight;
    
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            focusMode: { ideal: "continuous" },
            advanced: [
                { focusMode: "continuous" },
                { focusDistance: { ideal: 0.1 } }
            ]
        }
    })
    .then(function(stream) {
        video.srcObject = stream;

        // オートフォーカスを有効化
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();

        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            track.applyConstraints({
                advanced: [{ focusMode: 'continuous' }]
            }).catch(err => console.log('Focus constraint error:', err));
        }

        video.onloadedmetadata = function() {
            video.play();
            barcodeStreaming = true;
            barcodeScanner = true;
            detectBarcode();
        };
    })
    .catch(function(err) {
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
            readers: ["ean_reader", "ean_8_reader", "code_128_reader"],
            multiple: false
        },
        locate: true,
        frequency: 10
    }, function(result) {
        if (result && result.codeResult) {
            const code = result.codeResult.code;
            
            if ((code.startsWith('978') || code.startsWith('979')) && !autoShutterCooldown) {
                console.log('有効なISBN検出:', code);
                
                autoShutterCooldown = true;
                lastBarcodeDetected = code;
                
                document.getElementById('book-isbn').value = code;
                stopBarcodeScanner();
                searchBookByISBN();
                
                setTimeout(function() {
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
            
            if (bookInfo.imageLinks && bookInfo.imageLinks.thumbnail) {
                document.getElementById('book-image-url').value = bookInfo.imageLinks.thumbnail.replace('http://', 'https://');
            }
            
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

// 一括登録
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
                
                const result = await apiCall('register_book', 'POST', bookData);
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } else {
                failCount++;
                console.warn(`ISBN ${isbn}: 書籍情報が見つかりませんでした`);
            }
        } catch (error) {
            failCount++;
            console.error(`ISBN ${isbn}: エラー`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    status.textContent = `完了: 成功 ${successCount}件 / 失敗 ${failCount}件`;
    
    await loadBooks();
    displayBooks();
    
    setTimeout(() => {
        closeModal('bulk-register-modal');
        alert(`一括登録が完了しました\n成功: ${successCount}件\n失敗: ${failCount}件`);
    }, 2000);
}
