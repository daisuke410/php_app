// BookBrella - 傘管理機能

let qrVideo = null;
let qrCanvas = null;
let qrCtx = null;
let qrScanning = false;

async function loadUmbrellas() {
    try {
        const result = await apiCall('get_umbrellas', 'GET');
        if (result.success) {
            umbrellas = result.umbrellas;
        }
    } catch (error) {
        console.error('傘の読み込みエラー:', error);
    }
}

function displayUmbrellas() {
    const umbrellasList = document.getElementById('umbrellas-list');
    const stats = document.getElementById('umbrellas-stats');
    
    stats.textContent = `登録傘数: ${umbrellas.length}本`;
    
    umbrellasList.innerHTML = umbrellas.map(umbrella => {
        const latestRental = umbrella.rentals && umbrella.rentals.length > 0 
            ? umbrella.rentals[umbrella.rentals.length - 1] 
            : null;
        
        return `
        <div class="umbrella-item">
            <h3>${umbrella.name}</h3>
            <p><strong>色:</strong> ${umbrella.color}</p>
            <p><strong>サイズ:</strong> ${umbrella.size}</p>
            <p><strong>備考:</strong> ${umbrella.note || ''}</p>
            <p><strong>ステータス:</strong> ${umbrella.status === 'available' ? '貸出可' : '貸出中'}</p>
            ${umbrella.status === 'rented' && latestRental ? `
                <div style="background: rgba(184, 118, 83, 0.1); padding: 10px; border-radius: 6px; margin: 10px 0; border-left: 3px solid var(--autumn-copper);">
                    <p style="margin: 5px 0;"><strong>貸出者:</strong> ${latestRental.borrower}</p>
                    <p style="margin: 5px 0;"><strong>貸出日:</strong> ${latestRental.date}</p>
                    <p style="margin: 5px 0;"><strong>返却予定日:</strong> ${latestRental.returnDate}</p>
                </div>
            ` : ''}
            <div class="umbrella-qr-section">
                <button class="btn btn-secondary" onclick="showUmbrellaQR(${umbrella.id})" style="font-size: 0.9rem; padding: 8px 16px; margin-right: 10px;">QRコード表示</button>
            </div>
            ${umbrella.status === 'available' ? 
                `<button class="btn btn-primary" onclick="showUmbrellaRentalModal(${umbrella.id})">貸出</button>` :
                `<button class="btn btn-success" onclick="returnUmbrella(${umbrella.id})">返却</button>`
            }
        </div>
    `;
    }).join('');
}

function showUmbrellaRegisterModal() {
    if (!currentUser || currentUser.type !== 'admin') {
        alert('傘の登録は管理者のみ可能です');
        return;
    }
    
    document.getElementById('umbrella-name').value = '';
    document.getElementById('umbrella-color').value = '';
    document.getElementById('umbrella-color-custom').style.display = 'none';
    document.getElementById('umbrella-color-custom').value = '';
    document.getElementById('umbrella-size').value = '大';
    document.getElementById('umbrella-note').value = '';
    openModal('umbrella-register-modal');
}

async function registerUmbrella() {
    const colorSelect = document.getElementById('umbrella-color').value;
    const colorCustom = document.getElementById('umbrella-color-custom').value;
    const finalColor = colorSelect === 'その他' ? colorCustom : colorSelect;
    
    const umbrellaData = {
        name: document.getElementById('umbrella-name').value,
        color: finalColor,
        size: document.getElementById('umbrella-size').value,
        note: document.getElementById('umbrella-note').value
    };
    
    try {
        const result = await apiCall('register_umbrella', 'POST', umbrellaData);
        if (result.success) {
            await loadUmbrellas();
            displayUmbrellas();
            closeModal('umbrella-register-modal');
            alert('傘を登録しました');
        }
    } catch (error) {
        alert('傘の登録に失敗しました');
    }
}

function showUmbrellaRentalModal(umbrellaId) {
    document.getElementById('umbrella-rental-id').value = umbrellaId;
    document.getElementById('umbrella-borrower').value = currentUser.name;
    document.getElementById('umbrella-return-date').value = '';
    openModal('umbrella-rental-modal');
}

async function rentUmbrella() {
    const rentalData = {
        umbrellaId: parseInt(document.getElementById('umbrella-rental-id').value),
        borrower: document.getElementById('umbrella-borrower').value,
        returnDate: document.getElementById('umbrella-return-date').value
    };
    
    try {
        const result = await apiCall('rent_umbrella', 'POST', rentalData);
        if (result.success) {
            await loadUmbrellas();
            displayUmbrellas();
            closeModal('umbrella-rental-modal');
            alert('貸出処理が完了しました');
        }
    } catch (error) {
        alert('貸出処理に失敗しました');
    }
}

async function returnUmbrella(umbrellaId) {
    try {
        const result = await apiCall('return_umbrella', 'POST', { umbrellaId });
        if (result.success) {
            await loadUmbrellas();
            displayUmbrellas();
            alert('返却処理が完了しました');
        }
    } catch (error) {
        alert('返却処理に失敗しました');
    }
}

// QRコード機能
function showQRScanner() {
    document.getElementById('qr-scanner-container').classList.add('hidden');
    document.getElementById('start-qr-scan-btn').classList.remove('hidden');
    document.getElementById('stop-qr-scan-btn').classList.add('hidden');
    document.getElementById('qr-scan-status').textContent = '';
    openModal('qr-modal');
}

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
    .then(function(stream) {
        qrVideo.srcObject = stream;
        qrVideo.onloadedmetadata = function() {
            qrVideo.play();
            qrScanning = true;
            document.getElementById('qr-scan-status').textContent = 'QRコードを検出中...';
            detectQRCode();
        };
    })
    .catch(function(err) {
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
    }, function(result) {
        if (result && result.codeResult) {
            const qrData = result.codeResult.code;
            console.log('QRコード検出:', qrData);
            
            try {
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

async function processUmbrellaQR(umbrellaId) {
    const umbrella = umbrellas.find(u => u.id === umbrellaId);
    if (!umbrella) {
        alert('傘が見つかりません');
        return;
    }
    
    stopQRScanner();
    closeModal('qr-modal');
    
    if (umbrella.status === 'available') {
        showUmbrellaRentalModal(umbrellaId);
    } else {
        if (confirm(`傘「${umbrella.name}」を返却しますか？`)) {
            await returnUmbrella(umbrellaId);
        }
    }
}

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
    
    QRCode.toCanvas(document.createElement('canvas'), qrData, {
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        margin: 2
    }, function(error, canvas) {
        if (error) {
            console.error('QRコード生成エラー:', error);
            alert('QRコードの生成に失敗しました');
        } else {
            document.getElementById('qr-code-canvas-container').appendChild(canvas);
            openModal('qr-display-modal');
        }
    });
}
