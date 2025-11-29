// BookBrella - API通信とユーティリティ関数

const API_BASE = '/api.php';

async function apiCall(action, method = 'GET', data = null) {
    const url = `${API_BASE}?action=${action}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// グローバル変数
let users = [];
let books = [];
let umbrellas = [];
let currentUser = null;

// モーダル制御
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    
    if (modalId === 'book-register-modal' && barcodeScanner) {
        stopBarcodeScanner();
        barcodeScanner = null;
    } else if (modalId === 'qr-modal' && qrScanning) {
        stopQRScanner();
    }
}

// トグル関数
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

// ハンバーガーメニュー
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

// CSV解析
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

// イベントリスナー設定
document.addEventListener('DOMContentLoaded', function() {
    const umbrellaColorSelect = document.getElementById('umbrella-color');
    if (umbrellaColorSelect) {
        umbrellaColorSelect.addEventListener('change', function() {
            const customInput = document.getElementById('umbrella-color-custom');
            if (this.value === 'その他') {
                customInput.style.display = 'block';
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
            }
        });
    }
    
    // アプリ初期化
    init();
});
