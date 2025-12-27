// 傘関連の新しいJavaScript関数（パート1 - データロード・表示・フィルター関連）

// グローバル変数に追加
let umbrellaStats = null;
let filteredUmbrellas = null;

// 傘データをAPIから取得
async function loadUmbrellas() {
    try {
        const response = await fetch('../api.php?action=get_umbrellas');
        const result = await response.json();
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

// 統計情報を取得
async function loadUmbrellaStats() {
    try {
        const response = await fetch('../api.php?action=get_umbrella_stats');
        const result = await response.json();
        if (result.success) {
            umbrellaStats = result.stats;
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('統計情報の読み込みエラー:', error);
    }
}

// 統計情報を表示
function updateStatsDisplay() {
    if (!umbrellaStats) return;

    document.getElementById('stats-total').textContent = umbrellaStats.total || 0;
    document.getElementById('stats-available').textContent = umbrellaStats.available || 0;
    document.getElementById('stats-rented').textContent = umbrellaStats.rented || 0;
    document.getElementById('stats-overdue').textContent = umbrellaStats.overdueRentals?.length || 0;
}

// 傘一覧を表示
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

// 返却遅延チェック
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

// コンディションバッジを取得
function getConditionBadge(condition) {
    const badges = {
        '正常': '<span style="background:var(--autumn-sage); color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem;">正常</span>',
        'メンテナンス中': '<span style="background:var(--autumn-clay); color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem;">メンテナンス中</span>',
        '破損': '<span style="background:var(--autumn-rust); color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem;">破損</span>',
        '紛失': '<span style="background:var(--autumn-charcoal); color:white; padding:3px 10px; border-radius:12px; font-size:0.8rem;">紛失</span>'
    };
    return badges[condition] || '';
}

// 現在貸出中の傘一覧を更新
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

// フィルター機能
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

// フィルタークリア
function clearUmbrellaFilters() {
    document.getElementById('filter-umbrella-type').value = '';
    document.getElementById('filter-umbrella-status').value = '';
    document.getElementById('filter-umbrella-condition').value = '';
    displayUmbrellas();
}

// トグル関数
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
