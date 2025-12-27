# PHP PostgreSQL Application

書籍と傘のレンタル管理システム

## 環境構築

### ローカル Windows 環境

#### 1. 必要なソフトウェアのインストール

**PHP 8.3 のインストール**

1. https://windows.php.net/download/ から Thread Safe版をダウンロード
2. `D:\programFile\php` などに解凍
3. 環境変数 PATH に `D:\programFile\php` を追加
4. `php.ini` を設定：
   ```bash
   cd D:\programFile\php
   copy php.ini-development php.ini
   ```
5. `php.ini` を編集して以下を有効化：
   ```ini
   extension_dir = "D:\programFile\php\ext"
   extension=pdo_pgsql
   extension=pgsql
   extension=openssl
   extension=mbstring
   ```

**PostgreSQL のインストール**

1. https://www.postgresql.org/download/windows/ からダウンロード
2. インストール時にポート番号を確認（例: 5434）
3. 環境変数 PATH に `C:\Program Files\PostgreSQL\16\bin` を追加

#### 2. データベースのセットアップ

PostgreSQL に接続してデータベースを作成：

```bash
# PostgreSQL に接続（ポート番号は環境に合わせて変更）
psql -U postgres -h localhost -p 5434

# 以下のSQLを実行
CREATE DATABASE appdb;
CREATE USER appuser WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE appdb TO appuser;

# appdb に接続
\c appdb

# PostgreSQL 15以降で必要なスキーマ権限を付与
GRANT ALL ON SCHEMA public TO appuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO appuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO appuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO appuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO appuser;

# 終了
\q
```

#### 3. アプリケーションの初期化と起動

**データベースの初期化：**

```bash
cd php-postgres-app
init_local.bat
```

**サーバーの起動：**

```bash
start_local.bat
```

ブラウザで `http://localhost:8080` にアクセスしてください。

**注意：** ポート番号が 5434 以外の場合は、`init_local.bat` と `start_local.bat` 内の `DB_PORT` を変更してください。

#### 4. 同じネットワークのiPhoneからアクセスする

**WindowsのIPアドレスを確認：**

```bash
ipconfig /all
```

`IPv4 アドレス` を確認してください（例: `192.168.1.100`）

**Windowsファイアウォールでポート8080を許可：**

管理者権限でコマンドプロンプトを開き、以下を実行：

```bash
netsh advfirewall firewall add rule name="PHP Server 8080" dir=in action=allow protocol=TCP localport=8080
```

**iPhoneからアクセス：**

iPhoneのSafariまたはChromeで以下のURLにアクセス：

```
http://[WindowsのIPアドレス]:8080
```

例: `http://192.168.1.100:8080`

**トラブルシューティング：**

アクセスできない場合は、以下を確認してください：

1. WindowsとiPhoneが同じWi-Fiネットワークに接続されているか
2. ファイアウォール規則が正しく追加されているか確認：
   ```bash
   netsh advfirewall firewall show rule name="PHP Server 8080"
   ```
3. PHPサーバーが `0.0.0.0:8080` で起動しているか確認（`start_local.bat` 使用）

---

### Gitpod / Ona 環境

このリポジトリは Gitpod と Ona の両方に対応しています。devcontainer の設定により、自動的に環境が構築されます。

#### Gitpod で起動

以下のリンクからアクセス：
```
https://gitpod.io/#https://github.com/daisuke410/php_app
```

#### Ona 環境で起動

Ona でリポジトリを開くと、自動的に devcontainer が起動し、PostgreSQL と PHP がセットアップされます。

---

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
