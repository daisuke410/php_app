// BookBrella - ユーザー管理機能

async function loadUsers() {
    try {
        const result = await apiCall('get_users', 'GET');
        if (result.success) {
            users = result.users;
        }
    } catch (error) {
        console.error('ユーザーの読み込みエラー:', error);
    }
}

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
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-type').value = 'general';
    openModal('register-modal');
}

async function registerUser() {
    const userData = {
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        type: document.getElementById('register-type').value
    };
    
    try {
        const result = await apiCall('register_user', 'POST', userData);
        if (result.success) {
            closeModal('register-modal');
            alert('ユーザーを登録しました');
            
            if (currentUser && currentUser.type === 'admin') {
                await loadUsers();
                displayUsers();
            }
        }
    } catch (error) {
        alert('ユーザーの登録に失敗しました');
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
    reader.onload = async function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const line of lines) {
            if (line.trim()) {
                const [name, email, password, type] = line.split(',').map(s => s.trim());
                
                try {
                    await apiCall('register_user', 'POST', { name, email, password, type });
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }
        }
        
        await loadUsers();
        displayUsers();
        closeModal('csv-modal');
        alert(`CSVインポートが完了しました\n成功: ${successCount}件\nエラー: ${errorCount}件`);
    };
    
    reader.readAsText(file);
}
