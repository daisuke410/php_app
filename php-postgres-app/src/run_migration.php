<?php
// データベースマイグレーション実行スクリプト
require_once 'db.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // マイグレーションSQLファイルを読み込む
    $sqlFile = __DIR__ . '/umbrella_migration.sql';
    
    if (!file_exists($sqlFile)) {
        die("エラー: umbrella_migration.sql が見つかりません\n");
    }
    
    $sql = file_get_contents($sqlFile);
    
    if ($sql === false) {
        die("エラー: SQLファイルの読み込みに失敗しました\n");
    }
    
    echo "マイグレーションを開始します...\n\n";
    
    // トランザクション開始
    $db->beginTransaction();
    
    try {
        // SQLを実行
        $db->exec($sql);
        
        // コミット
        $db->commit();
        
        echo "✅ マイグレーションが正常に完了しました！\n\n";
        echo "追加された機能:\n";
        echo "- 傘テーブルに umbrella_type カラムを追加\n";
        echo "- 傘テーブルに condition カラムを追加\n";
        echo "- 傘テーブルに description カラムを追加\n";
        echo "- 傘テーブルに updated_at カラムを追加\n";
        echo "- 傘貸出テーブルに report_note カラムを追加\n";
        echo "- サンプル傘データを5件追加\n\n";
        
        // 確認クエリ
        $stmt = $db->query("SELECT COUNT(*) as count FROM umbrellas");
        $result = $stmt->fetch();
        echo "現在の登録傘数: " . $result['count'] . "本\n";
        
    } catch (PDOException $e) {
        // ロールバック
        $db->rollBack();
        echo "❌ エラー: " . $e->getMessage() . "\n";
        echo "\n注意: 一部のカラムは既に存在している可能性があります。\n";
        echo "その場合、このエラーは無視しても問題ありません。\n";
    }
    
} catch (Exception $e) {
    echo "❌ データベース接続エラー: " . $e->getMessage() . "\n";
}
?>
