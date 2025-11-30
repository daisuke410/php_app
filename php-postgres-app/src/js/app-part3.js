// 一括登録、エクスポート、インポート機能（app.jsの続き Part3）

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
                
                // APIで書籍を登録
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
        
        // API制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    status.textContent = `完了: 成功 ${successCount}件 / 失敗 ${failCount}件`;
    
    // 書籍リストを再読み込み
    await loadBooks();
    displayBooks();
    
    setTimeout(() => {
        closeModal('bulk-register-modal');
        alert(`一括登録が完了しました\n成功: ${successCount}件\n失敗: ${failCount}件`);
    }, 2000);
}

// Export/Import Functions
async function exportBooks() {
    if (books.length === 0) {
        alert('エクスポートする書籍がありません');
        return;
    }
    
    // CSV形式でエクスポート
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
            
            // データ検証とインポート
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
