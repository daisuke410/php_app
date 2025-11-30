// BookBrella - 認証とナビゲーション

async function init() {
    showLoginPage();
}

// 認証
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const result = await apiCall('login', 'POST', { email, password });
        
        if (result.success) {
            currentUser = result.user;
            showMainApp();
            showMenu();
        } else {
            alert('ログインに失敗しました');
        }
    } catch (error) {
        alert('ログインエラーが発生しました');
    }
}

async function devLogin() {
    try {
        const result = await apiCall('login', 'POST', { 
            email: 'admin@test.com', 
            password: 'admin' 
        });
        
        if (result.success) {
            currentUser = result.user;
            showMainApp();
            showMenu();
        }
    } catch (error) {
        alert('開発ログインに失敗しました');
    }
}

function logout() {
    currentUser = null;
    closeHamburgerMenu();
    showLoginPage();
}

function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('menu-page').classList.remove('active');
}

function showMainApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    if (currentUser.type === 'admin') {
        document.getElementById('admin-users-btn').classList.remove('hidden');
        document.getElementById('admin-umbrella-btn').classList.remove('hidden');
        document.getElementById('hamburger-users-btn').classList.remove('hidden');
    }
}

function showMenu() {
    document.getElementById('menu-page').classList.add('active');
    document.getElementById('books-section').classList.add('hidden');
    document.getElementById('umbrellas-section').classList.add('hidden');
    document.getElementById('users-section').classList.add('hidden');
}

async function showSection(section) {
    document.getElementById('menu-page').classList.remove('active');
    document.getElementById('books-section').classList.add('hidden');
    document.getElementById('umbrellas-section').classList.add('hidden');
    document.getElementById('users-section').classList.add('hidden');
    
    if (section === 'books') {
        document.getElementById('books-section').classList.remove('hidden');
        await loadBooks();
        displayBooks();
    } else if (section === 'umbrellas') {
        document.getElementById('umbrellas-section').classList.remove('hidden');
        await loadUmbrellas();
        displayUmbrellas();
    } else if (section === 'users') {
        document.getElementById('users-section').classList.remove('hidden');
        await loadUsers();
        displayUsers();
    }
}
