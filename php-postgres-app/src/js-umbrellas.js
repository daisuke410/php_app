// BookBrella - 傘管理機能（拡張版）

let qrVideo = null;
let qrCanvas = null;
let qrCtx = null;
let qrScanning = false;
let umbrellaStats = null;

// API呼び出しヘルパー関数
async function apiCall(action, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`api.php?action=${action}`, options);
    return await response.json();
}

// ========================================
// データロード・表示関連
// ========================================

async function loadUmbrellas() {
    try {
        const result = await apiCall('get_umbrellas', 'GET');
        if (result.success) {
            umbrellas = result.umbrellas.map(u => ({
                ...u,
                umbrellaType: u.umbrellaType || u.umbrella_type || '長傘',
                condition: u.condition || '正常'
            }));
            await loadUmbrellaStats();
            displayUmbrellas();
            updateCurrentRentals();
        }
    } catch (error) {
        console.error('傘の読み込みエラー:', error);
    }
}

async function loadUmbrellaStats() {
    try {
        const result = await apiCall('get_umbrella_stats', 'GET');
        if (result.success) {
            umbrellaStats = result.stats;
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('統計情報の読み込みエラー:', error);
    }
}

function updateStatsDisplay() {
    if (!umbrellaStats) return;

    document.getElementById('stats-total').textContent = umbrellaStats.total || 0;
    document.getElementById('stats-available').textContent = umbrellaStats.available || 0;
    document.getElementById('stats-rented').textContent = umbrellaStats.rented || 0;
    document.getElementById('stats-overdue').textContent = umbrellaStats.overdueRentals?.length || 0;
}

function displayUmbrellas(filtered = null) {
    const toDisplay = filtered || umbrellas;
    const list = document.getElementById('umbrellas-list');

    list.innerHTML = toDisplay.map(umbrella => {
        const isOverdue = checkIfOverdue(umbrella);
        const conditionBadge = getConditionBadge(umbrella.condition);

        return `
        <div class="umbrella-item" style="cursor: pointer;" onclick="showUmbrellaDetail(${umbrella.id})">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h3 style="margin: 0;">${umbrella.name}</h3>
                ${conditionBadge}
            </div>
            <p><strong>種類:</strong> ${umbrella.umbrellaType}</p>
            <p><strong>色:</strong> ${umbrella.color} | <strong>サイズ:</strong> ${umbrella.size}</p>
            ${umbrella.description ? `<p><strong>特徴:</strong> ${umbrella.description}</p>` : ''}
            <p><strong>ステータス:</strong> 
                <span class="${umbrella.status === 'available' ? 'status-available' : 'status-rented'}">
                    ${umbrella.status === 'available' ? '貸出可' : '貸出中'}
                </span>
                ${isOverdue ? '<span style="background:var(--autumn-rust); color:white; padding:2px 8px; border-radius:10px; font-size:0.8rem; margin-left:5px;">返却遅延</span>' : ''}
            </p>
            ${umbrella.rentals && umbrella.rentals.length > 0 ? `
                <div style="background: rgba(184, 118, 83, 0.1); padding: 10px; border-radius: 6px; margin: 10px 0;">
                    <p style="margin: 3px 0;"><strong>貸出者:</strong> ${umbrella.rentals[0].borrower}</p>
                    <p style="margin: 3px 0;"><strong>返却予定:</strong> ${umbrella.rentals[0].returnDate || '未設定'}</p>
                </div>
            ` : ''}
            <div style="margin-top: 10px;">
                <button class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 12px;" onclick="event.stopPropagation(); showUmbrellaQR(${umbrella.id})">QR表示</button>
            </div>
        </div>
        `;
    }).join('');
}

function checkIfOverdue(umbrella) {
    if (umbrella.status !== 'rented' || !umbrella.rentals || umbrella.rentals.length === 0) {
        return false;
    }
    const rental = umbrella.rentals[0];
    if (!rental.returnDate) return false;

    const today = new Date();
    const returnDate = new Date(rental.returnDate);
    return returnDate < today;
}

function getConditionBadge(condition) {
    const badges = {
        '正常': '<span style="background:var(--autumn-sage); color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem;">正常</span>',
        'メンテナンス中': '<span style="background:var(--autumn-clay); color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem;">メンテナンス中</span>',
        '破損': '<span style="background:var(--autumn-rust); color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem;">破損</span>',
        '紛失': '<span style="background:var(--autumn-charcoal); color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem;">紛失</span>'
    };
    return badges[condition] || '';
}

function updateCurrentRentals() {
    const rentedUmbrellas = umbrellas.filter(u => u.status === 'rented');
    const list = document.getElementById('current-rentals-list');

    if (rentedUmbrellas.length === 0) {
        list.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">現在貸出中の傘はありません</p>';
        return;
    }

    list.innerHTML = rentedUmbrellas.map(u => {
        const isOverdue = checkIfOverdue(u);
        const rental = u.rentals[0];

        return `
        <div style="border-left: 4px solid ${isOverdue ? 'var(--autumn-rust)' : 'var(--autumn-copper)'}; padding: 12px; margin-bottom: 12px; background: rgba(0,0,0,0.02); border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <strong style="font-size: 1.1rem;">${u.name}</strong>
                    <span style="color: #666; margin-left: 10px;">${u.umbrellaType}</span>
                    ${isOverdue ? '<span style="background:var(--autumn-rust); color:white; padding:2px 10px; border-radius:10px; font-size:0.75rem; margin-left:10px;">遅延</span>' : ''}
                </div>
            </div>
            <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">
                <p style="margin: 0;"><strong>貸出者:</strong> ${rental.borrower}</p>
                <p style="margin: 0;"><strong>貸出日:</strong> ${rental.date}</p>
                <p style="margin: 0;"><strong>返却予定:</strong> ${rental.returnDate || '未設定'}</p>
            </div>
        </div>
        `;
    }).join('');
}

// ========================================
// 傘詳細表示
// ========================================

function showUmbrellaDetail(umbrellaId) {
    const umbrella = umbrellas.find(u => u.id === umbrellaId);
    if (!umbrella) return;

    const content = `
        <h2>${umbrella.name}</h2>
        <p><strong>種類:</strong> ${umbrella.umbrellaType}</p>
        <p><strong>色:</strong> ${umbrella.color}</p>
        <p><strong>サイズ:</strong> ${umbrella.size}</p>
        <p><strong>コンディション:</strong> ${umbrella.condition}</p>
        ${umbrella.description ? `<p><strong>説明:</strong> ${umbrella.description}</p>` : ''}
        ${umbrella.note ? `<p><strong>備考:</strong> ${umbrella.note}</p>` : ''}
        <p><strong>ステータス:</strong> ${umbrella.status === 'available' ? '貸出可' : '貸出中'}</p>
        
        ${umbrella.status === 'rented' && umbrella.rentals && umbrella.rentals.length > 0 ? `
            <div style="background: rgba(184, 118, 83, 0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="margin-top: 0;">現在の貸出情報</h4>
                <p><strong>貸出者:</strong> ${umbrella.rentals[0].borrower}</p>
                <p><strong>貸出日:</strong> ${umbrella.rentals[0].date}</p>
                <p><strong>返却予定日:</strong> ${umbrella.rentals[0].returnDate || '未設定'}</p>
            </div>
        ` : ''}
        
        <div class="book-detail-actions">
            ${umbrella.status === 'available' ?
            `<button class="btn btn-primary" onclick="closeModal('umbrella-detail-modal'); showUmbrellaRentalModal(${umbrella.id})">貸出</button>` :
            `<button class="btn btn-success" onclick="returnUmbrellaFromDetail(${umbrella.id})">返却</button>`
        }
            <button class="btn btn-secondary" onclick="showUmbrellaQR(${umbrella.id})">QRコード表示</button>
            ${currentUser && currentUser.type === 'admin' ? `
                <button class="btn btn-secondary" onclick="closeModal('umbrella-detail-modal'); showUmbrellaEditModal(${umbrella.id})">編集</button>
                <div class="delete-link" onclick="deleteUmbrella(${umbrella.id})">この傘を削除</div>
            ` : ''}
        </div>
        
        ${umbrella.history && umbrella.history.length > 0 ? `
            <div class="reviews-section">
                <h3 style="color: var(--color-primary); margin-bottom: 15px;">貸出履歴 (${umbrella.history.length}件)</h3>
                ${umbrella.history.slice(0, 5).map(h => `
                    <div class="review-item">
                        <p><strong>貸出者:</strong> ${h.borrower}</p>
                        <p><strong>貸出日:</strong> ${h.rentalDate} ~ <strong>返却日:</strong> ${h.returnDate || '未返却'}</p>
                        ${h.reportNote ? `<p><strong>報告:</strong> ${h.reportNote}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    document.getElementById('umbrella-detail-content').innerHTML = content;
    openModal('umbrella-detail-modal');
}

async function returnUmbrellaFromDetail(umbrellaId) {
    await returnUmbrella(umbrellaId);
    closeModal('umbrella-detail-modal');
}

// ========================================
// CRUD操作
// ========================================

function showUmbrellaRegisterModal() {
    console.log('showUmbrellaRegisterModal called');
    try {
        if (!currentUser || currentUser.type !== 'admin') {
            alert('傘の登録は管理者のみ可能です');
            return;
        }

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
            else console.warn(`Element not found: ${id}`);
        };

        setVal('umbrella-name', '');
        setVal('umbrella-type', '長傘');
        setVal('umbrella-color', '');

        const colorCustom = document.getElementById('umbrella-color-custom');
        if (colorCustom) {
            colorCustom.style.display = 'none';
            colorCustom.value = '';
        }

        setVal('umbrella-size', '中');
        setVal('umbrella-condition', '正常');
        setVal('umbrella-description', '');
        setVal('umbrella-note', '');

        if (typeof window.openModal === 'function') {
            window.openModal('umbrella-register-modal');
        } else {
            console.error('openModal function not found');
            // フォールバック
            const modal = document.getElementById('umbrella-register-modal');
            if (modal) modal.style.display = 'block';
        }
    } catch (e) {
        console.error('Error in showUmbrellaRegisterModal:', e);
        alert('エラーが発生しました: ' + e.message);
    }
}

async function registerUmbrella() {
    const colorSelect = document.getElementById('umbrella-color').value;
    const colorCustom = document.getElementById('umbrella-color-custom').value;
    const finalColor = colorSelect === 'その他' ? colorCustom : colorSelect;

    const umbrellaData = {
        name: document.getElementById('umbrella-name').value,
        umbrellaType: document.getElementById('umbrella-type').value,
        color: finalColor,
        size: document.getElementById('umbrella-size').value,
        condition: document.getElementById('umbrella-condition').value,
        description: document.getElementById('umbrella-description').value,
        note: document.getElementById('umbrella-note').value
    };

    try {
        const result = await apiCall('register_umbrella', 'POST', umbrellaData);
        if (result.success) {
            await loadUmbrellas();
            closeModal('umbrella-register-modal');
        }
    } catch (error) {
        alert('傘の登録に失敗しました');
    }
}

function showUmbrellaEditModal(umbrellaId) {
    const umbrella = umbrellas.find(u => u.id === umbrellaId);
    if (!umbrella) return;

    document.getElementById('edit-umbrella-id').value = umbrella.id;
    document.getElementById('edit-umbrella-name').value = umbrella.name;
    document.getElementById('edit-umbrella-type').value = umbrella.umbrellaType;
    document.getElementById('edit-umbrella-color').value = umbrella.color;
    document.getElementById('edit-umbrella-size').value = umbrella.size;
    document.getElementById('edit-umbrella-condition').value = umbrella.condition;
    document.getElementById('edit-umbrella-description').value = umbrella.description || '';
    document.getElementById('edit-umbrella-note').value = umbrella.note || '';

    openModal('umbrella-edit-modal');
}

async function updateUmbrella() {
    const umbrellaData = {
        id: parseInt(document.getElementById('edit-umbrella-id').value),
        name: document.getElementById('edit-umbrella-name').value,
        umbrellaType: document.getElementById('edit-umbrella-type').value,
        color: document.getElementById('edit-umbrella-color').value,
        size: document.getElementById('edit-umbrella-size').value,
        condition: document.getElementById('edit-umbrella-condition').value,
        description: document.getElementById('edit-umbrella-description').value,
        note: document.getElementById('edit-umbrella-note').value
    };

    try {
        const result = await apiCall('update_umbrella', 'POST', umbrellaData);
        if (result.success) {
            await loadUmbrellas();
            closeModal('umbrella-edit-modal');
        }
    } catch (error) {
        alert('傘情報の更新に失敗しました');
    }
}

async function deleteUmbrella(umbrellaId) {
    if (!confirm('この傘を削除してもよろしいですか？')) return;

    try {
        const result = await apiCall('delete_umbrella', 'POST', { id: umbrellaId });
        if (result.success) {
            await loadUmbrellas();
            closeModal('umbrella-detail-modal');
        }
    } catch (error) {
        alert('傘の削除に失敗しました');
    }
}

// ========================================
// 貸出・返却
// ========================================

function showUmbrellaRentalModal(umbrellaId) {
    document.getElementById('umbrella-rental-id').value = umbrellaId;
    document.getElementById('umbrella-borrower').value = currentUser.name;

    // デフォルトで1週間後を設定
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('umbrella-return-date').value = nextWeek.toISOString().split('T')[0];

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
            closeModal('umbrella-rental-modal');
        }
    } catch (error) {
        alert('貸出処理に失敗しました');
    }
}

async function returnUmbrella(umbrellaId) {
    const reportNote = prompt('返却時の報告（任意）:\n例: 問題なし、骨が折れている、など');

    try {
        const result = await apiCall('return_umbrella', 'POST', {
            umbrellaId,
            reportNote: reportNote || null
        });
        if (result.success) {
            await loadUmbrellas();
        }
    } catch (error) {
        alert('返却処理に失敗しました');
    }
}

// ========================================
// フィルター機能
// ========================================

function filterUmbrellas() {
    const type = document.getElementById('filter-umbrella-type').value;
    const status = document.getElementById('filter-umbrella-status').value;
    const condition = document.getElementById('filter-umbrella-condition').value;

    let filtered = umbrellas;

    if (type) {
        filtered = filtered.filter(u => u.umbrellaType === type);
    }
    if (status) {
        filtered = filtered.filter(u => u.status === status);
    }
    if (condition) {
        filtered = filtered.filter(u => u.condition === condition);
    }

    displayUmbrellas(filtered);
}

function clearUmbrellaFilters() {
    document.getElementById('filter-umbrella-type').value = '';
    document.getElementById('filter-umbrella-status').value = '';
    document.getElementById('filter-umbrella-condition').value = '';
    displayUmbrellas();
}

// ========================================
// 統計情報
// ========================================

function showUmbrellaStatsModal() {
    if (!umbrellaStats) {
        alert('統計情報を読み込んでいます...');
        return;
    }

    const content = `
        <div style="margin-bottom: 20px;">
            <h3>基本統計</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 15px 0;">
                <div style="text-align: center; padding: 15px; background: rgba(138, 154, 123, 0.1); border-radius: 8px;">
                    <div style="font-size: 0.9rem; color: #666;">総登録数</div>
                    <div style="font-size: 2rem; font-weight: bold;">${umbrellaStats.total}</div>
                </div>
                <div style="text-align: center; padding: 15px; background: rgba(138, 154, 123, 0.1); border-radius: 8px;">
                    <div style="font-size: 0.9rem; color: #666;">貸出可能</div>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--autumn-sage);">${umbrellaStats.available}</div>
                </div>
                <div style="text-align: center; padding: 15px; background: rgba(184, 118, 83, 0.1); border-radius: 8px;">
                    <div style="font-size: 0.9rem; color: #666;">貸出中</div>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--autumn-copper);">${umbrellaStats.rented}</div>
                </div>
            </div>
        </div>
        
        ${umbrellaStats.popularUmbrellas && umbrellaStats.popularUmbrellas.length > 0 ? `
            <div style="margin-bottom: 20px;">
                <h3>人気の傘（貸出回数順）</h3>
                ${umbrellaStats.popularUmbrellas.map(u => `
                    <div style="padding: 10px; border-bottom: 1px solid #ddd;">
                        <strong>${u.name}</strong>: ${u.rental_count}回
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        ${umbrellaStats.overdueRentals && umbrellaStats.overdueRentals.length > 0 ? `
            <div style="margin-bottom: 20px;">
                <h3 style="color: var(--autumn-rust);">返却遅延中の傘</h3>
                ${umbrellaStats.overdueRentals.map(u => `
                    <div style="padding: 10px; border-left: 3px solid var(--autumn-rust); background: rgba(160, 86, 66, 0.1); margin-bottom: 8px;">
                        <strong>${u.name}</strong><br>
                        貸出者: ${u.borrower}<br>
                        返却予定: ${u.expected_return_date}
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        ${umbrellaStats.monthlyRentals && umbrellaStats.monthlyRentals.length > 0 ? `
            <div>
                <h3>月別貸出数（過去6ヶ月）</h3>
                ${umbrellaStats.monthlyRentals.map(m => `
                    <div style="padding: 10px; border-bottom: 1px solid #ddd;">
                        ${m.month}: ${m.count}回
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    document.getElementById('umbrella-stats-content').innerHTML = content;
    openModal('umbrella-stats-modal');
}

// ========================================
// UIトグル関数
// ========================================

function toggleRentalList() {
    const content = document.getElementById('rental-list-content');
    const icon = document.getElementById('rental-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

function toggleUmbrellaFilter() {
    const content = document.getElementById('umbrella-filter-content');
    const icon = document.getElementById('umbrella-filter-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// ========================================
// QRコード機能
// ========================================

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
    }, function (result) {
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
        <p><strong>種類:</strong> ${umbrella.umbrellaType}</p>
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
