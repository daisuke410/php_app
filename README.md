# PHP PostgreSQL Application

書籍と傘のレンタル管理システム

## 環境構築

### Gitpod / Ona 環境

このリポジトリは Gitpod と Ona の両方に対応しています。devcontainer の設定により、自動的に環境が構築されます。

#### Gitpod で起動

以下のリンクからアクセス：
```
https://gitpod.io/#https://github.com/daisuke410/php_app
```

#### Ona 環境で起動

Ona でリポジトリを開くと、自動的に devcontainer が起動し、PostgreSQL と PHP がセットアップされます。

## 手動でサーバーを起動する場合

devcontainer 内で以下のコマンドを実行：

```bash
cd /workspaces/php_app/php-postgres-app
export DB_HOST=localhost
export DB_NAME=appdb
export DB_USER=appuser
export DB_PASSWORD=password
php -d xdebug.mode=off -S 0.0.0.0:8080 -t src
```

ブラウザで `http://localhost:8080` にアクセスしてください。

## データベースの初期化

データベースを再初期化する場合：

```bash
cd /workspaces/php_app/php-postgres-app
export DB_HOST=localhost
export DB_NAME=appdb
export DB_USER=appuser
export DB_PASSWORD=password
php -d xdebug.mode=off src/init_db.php
php -d xdebug.mode=off src/run_migration.php
```

## PostgreSQL の設定

### データベースに接続

```bash
psql -U appuser -d appdb -h localhost
# パスワード: password
```

### 管理者として接続

```bash
psql -U postgres -h localhost
```

## トラブルシューティング

### PHP スクリプトが応答しない場合

Xdebug が原因の可能性があります。すべての PHP コマンドに `-d xdebug.mode=off` オプションを追加してください。

### データベース権限エラー

PostgreSQL 15 以降では、スキーマ権限の設定が必要です：

```bash
psql -U postgres -h localhost
```

PostgreSQL 内で：

```sql
\c appdb
GRANT ALL ON SCHEMA public TO appuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO appuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO appuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO appuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO appuser;
\q
```

### テーブルが存在しないエラー

データベースを初期化してください：

```bash
php -d xdebug.mode=off src/init_db.php
php -d xdebug.mode=off src/run_migration.php
```

## 技術スタック

- PHP 8.3
- PostgreSQL 15+
- PDO (PostgreSQL 拡張)
- Vanilla JavaScript
- CSS

## ディレクトリ構造

```
php-postgres-app/
├── src/
│   ├── api.php              # REST API エンドポイント
│   ├── db.php               # データベース接続設定
│   ├── init_db.php          # データベース初期化スクリプト
│   ├── run_migration.php    # マイグレーション実行
│   ├── index.html           # メインページ
│   ├── login.html           # ログインページ
│   └── js-*.js              # JavaScript ファイル
├── init.sql                 # データベーススキーマ
└── .devcontainer/
    ├── devcontainer.json    # Devcontainer 設定
    └── Dockerfile.combined  # Docker イメージ定義
```

## 機能

- ユーザー認証（ログイン/ログアウト）
- 書籍管理
  - 書籍の登録
  - 書籍の貸出・返却
  - 書籍のレビュー
- 傘管理
  - 傘の登録
  - 傘の貸出・返却

## ライセンス

MIT
