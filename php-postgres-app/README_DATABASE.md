# BookBrella - 書籍と傘の管理システム（PostgreSQL対応版）

書籍と傘を管理するWebアプリケーションです。PHPとPostgreSQLで構築されています。

## 🚀 セットアップ手順

### 1. コンテナの起動

```bash
cd C:\Users\snoop\OneDrive\デスクトップ\php\php-postgres-app

# 既存のコンテナとボリュームを削除（初回またはリセット時）
docker-compose down -v

# コンテナをビルドして起動
docker-compose up -d --build

# ログを確認
docker-compose logs -f
```

### 2. データベースの初期化確認

データベースは`init.sql`により自動的に初期化されます。以下が自動で実行されます：

- **テーブル作成**: users, books, umbrellas, book_rentals, umbrella_rentals, book_reviews
- **初期ユーザー登録**:
  - 管理者: `admin@test.com` / `admin`
  - 一般ユーザー: `user@test.com` / `user`
- **サンプル書籍**: 5冊の技術書・ビジネス書

手動で初期化する場合：
```bash
docker-compose exec php php /workspace/init_db.php
```

### 3. アプリケーションへのアクセス

ブラウザで以下のURLにアクセス：

- **メインアプリ**: http://localhost:8000/index.html
- **API接続テスト**: http://localhost:8000/index.php

## 📁 ファイル構成

```
php-postgres-app/
├── .devcontainer/
│   └── Dockerfile              # PHPコンテナの設定
├── src/
│   ├── index.html              # フロントエンド（BookBrellaアプリ）
│   ├── index.php               # 接続テストページ
│   ├── api.php                 # REST API
│   ├── db.php                  # データベース接続クラス
│   └── init_db.php             # DB初期化スクリプト
├── docker-compose.yml          # Docker Compose設定
├── init.sql                    # データベース初期化SQL
└── README.md                   # このファイル
```

## 🔌 API エンドポイント

### ユーザー関連
- `POST /api.php?action=login` - ログイン
- `POST /api.php?action=register_user` - ユーザー登録
- `GET /api.php?action=get_users` - ユーザー一覧取得

### 書籍関連
- `GET /api.php?action=get_books` - 書籍一覧取得
- `POST /api.php?action=register_book` - 書籍登録
- `POST /api.php?action=update_book` - 書籍情報更新
- `POST /api.php?action=delete_book` - 書籍削除
- `POST /api.php?action=rent_book` - 書籍貸出
- `POST /api.php?action=return_book` - 書籍返却
- `POST /api.php?action=add_review` - レビュー追加

### 傘関連
- `GET /api.php?action=get_umbrellas` - 傘一覧取得
- `POST /api.php?action=register_umbrella` - 傘登録
- `POST /api.php?action=rent_umbrella` - 傘貸出
- `POST /api.php?action=return_umbrella` - 傘返却

## 🗄️ データベーススキーマ

### users テーブル
```sql
id, name, email, password, type(admin/general), created_at
```

### books テーブル
```sql
id, isbn, title, author, genre, publisher, publish_date, 
owner_type, location, owner, image_url, description, 
status(available/rented), created_at
```

### umbrellas テーブル
```sql
id, name, color, size, note, status(available/rented), created_at
```

### book_rentals / umbrella_rentals テーブル
```sql
id, {book/umbrella}_id, borrower, rental_date, return_date, 
expected_return_date, created_at
```

### book_reviews テーブル
```sql
id, book_id, reviewer_name, rating, comment, review_date, created_at
```

## 🔧 トラブルシューティング

### データベース接続エラー

```bash
# PostgreSQLコンテナのログを確認
docker-compose logs db

# コンテナの状態を確認
docker-compose ps

# コンテナを完全にリセット
docker-compose down -v
docker-compose up -d --build
```

### データをリセットしたい

```bash
# ボリュームを含めて削除
docker-compose down -v

# 再起動（init.sqlが自動実行される）
docker-compose up -d
```

### PHPエラーログの確認

```bash
docker-compose exec php tail -f /var/log/apache2/error.log
```

## 🛠️ 開発用コマンド

### PostgreSQLに直接接続

```bash
docker-compose exec db psql -U appuser -d appdb
```

### データベースのバックアップ

```bash
docker-compose exec db pg_dump -U appuser appdb > backup.sql
```

### データベースのリストア

```bash
cat backup.sql | docker-compose exec -T db psql -U appuser appdb
```

## 📊 データベースの状態確認

```bash
# テーブル一覧
docker-compose exec db psql -U appuser -d appdb -c "\dt"

# ユーザー数確認
docker-compose exec db psql -U appuser -d appdb -c "SELECT COUNT(*) FROM users;"

# 書籍数確認
docker-compose exec db psql -U appuser -d appdb -c "SELECT COUNT(*) FROM books;"

# 傘数確認
docker-compose exec db psql -U appuser -d appdb -c "SELECT COUNT(*) FROM umbrellas;"
```

## 🎯 次のステップ

現在、`index.html`はローカルストレージを使用していますが、`api.php`を使用してPostgreSQLと連携するように変更する必要があります。

JavaScriptのfetch APIを使用して、各操作でAPIを呼び出すように修正してください。

例：
```javascript
// ログイン
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const response = await fetch('/api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    if (result.success) {
        currentUser = result.user;
        showMainApp();
    } else {
        alert('ログインに失敗しました');
    }
}
```

## 📝 ライセンス

このプロジェクトは社内用です。
