# PHP + PostgreSQL Development Environment

このプロジェクトは、PHPとPostgreSQLを使った開発環境です。

## 環境構成

- **PHP**: 8.3
- **PostgreSQL**: 16
- **拡張機能**: PDO, pdo_pgsql, pgsql, redis

## セットアップ手順

### 1. Dev Containerを起動

VS Codeで:
1. `F1`キーを押してコマンドパレットを開く
2. "Dev Containers: Reopen in Container"を選択
3. コンテナのビルドと起動を待つ

### 2. データベース接続テスト

コンテナ内のターミナルで:

```bash
php test_db.php
```

成功すると、PostgreSQLへの接続が確認でき、サンプルデータが表示されます。

## データベース接続情報

コンテナ内からの接続:
- **Host**: `db`
- **Port**: `5432`
- **Database**: `appdb`
- **User**: `postgres`
- **Password**: `postgres`

ホストマシンからの接続:
- **Host**: `localhost`
- **Port**: `5432`
- その他は上記と同じ

## 環境変数

以下の環境変数が自動的に設定されています:

```
DB_HOST=db
DB_PORT=5432
DB_NAME=appdb
DB_USER=postgres
DB_PASSWORD=postgres
```

## PHPサーバーの起動

```bash
# ビルトインサーバーを起動
php -S 0.0.0.0:8080
```

ブラウザで `http://localhost:8080` にアクセスできます。

## PostgreSQLクライアントツール

### psqlコマンド

```bash
psql -h db -U postgres -d appdb
```

### VS Code拡張機能

PostgreSQL Client拡張機能がインストールされているので、VS Code内でデータベースを管理できます。

## トラブルシューティング

### データベースに接続できない

1. PostgreSQLコンテナが起動しているか確認:
   ```bash
   docker compose ps
   ```

2. ログを確認:
   ```bash
   docker compose logs db
   ```

### コンテナを再起動

```bash
# Dev Containerを再構築
# VS CodeのコマンドパレットでF1 → "Dev Containers: Rebuild Container"
```

## ディレクトリ構造

```
.
├── .devcontainer/
│   ├── devcontainer.json    # Dev Container設定
│   ├── docker-compose.yml   # Docker Compose設定
│   └── Dockerfile           # PHPコンテナのカスタマイズ
├── test_db.php             # データベース接続テスト
└── README.md               # このファイル
```
