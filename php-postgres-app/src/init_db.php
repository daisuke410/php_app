<?php
// データベース初期化スクリプト
require_once 'db.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // init.sqlファイルを読み込んで実行
    $sql = file_get_contents(__DIR__ . '/../init.sql');
    
    if ($sql === false) {
        die("❌ init.sqlファイルが見つかりません\n");
    }
    
    $db->exec($sql);
    
    echo "✅ データベースの初期化が完了しました！\n";
    echo "📊 テーブル: users, books, umbrellas, book_rentals, umbrella_rentals, book_reviews\n";
    echo "👤 初期ユーザー:\n";
    echo "   - 管理者: admin@test.com / admin\n";
    echo "   - 一般ユーザー: user@test.com / user\n";
    echo "📚 サンプル書籍: 5冊登録済み\n";
    
} catch (Exception $e) {
    echo "❌ エラー: " . $e->getMessage() . "\n";
    exit(1);
}
?>
