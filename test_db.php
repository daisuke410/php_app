<?php
/**
 * PostgreSQL接続テスト
 */

// データベース接続情報を環境変数から取得
$host = getenv('DB_HOST') ?: 'db';
$port = getenv('DB_PORT') ?: '5432';
$dbname = getenv('DB_NAME') ?: 'appdb';
$user = getenv('DB_USER') ?: 'postgres';
$password = getenv('DB_PASSWORD') ?: 'postgres';

try {
    // PDOでPostgreSQLに接続
    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    echo "✅ PostgreSQL接続成功！\n\n";

    // PostgreSQLのバージョンを確認
    $version = $pdo->query('SELECT version()')->fetchColumn();
    echo "データベースバージョン:\n{$version}\n\n";

    // テーブル作成
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✅ usersテーブルを作成しました\n\n";

    // データ挿入（存在しない場合のみ）
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email) 
        VALUES (?, ?)
        ON CONFLICT (email) DO NOTHING
    ");
    $stmt->execute(['テストユーザー', 'test@example.com']);
    
    if ($stmt->rowCount() > 0) {
        echo "✅ テストデータを挿入しました\n\n";
    } else {
        echo "ℹ️  テストデータは既に存在します\n\n";
    }

    // データ取得
    $stmt = $pdo->query("SELECT * FROM users ORDER BY id");
    $users = $stmt->fetchAll();

    echo "📊 現在のユーザー一覧:\n";
    echo "ID | 名前 | メールアドレス | 作成日時\n";
    echo str_repeat('-', 80) . "\n";
    foreach ($users as $user) {
        printf(
            "%d | %s | %s | %s\n",
            $user['id'],
            $user['name'],
            $user['email'],
            $user['created_at']
        );
    }

} catch (PDOException $e) {
    echo "❌ データベース接続エラー:\n";
    echo $e->getMessage() . "\n";
    exit(1);
}
