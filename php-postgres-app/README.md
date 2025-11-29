# PHP PostgreSQL Application

このプロジェクトは、PHPとPostgreSQLを使用したシンプルなアプリケーションです。アプリケーションは、PostgreSQLデータベースへの接続を行い、基本的な処理を実行します。

## プロジェクト構成

- `src/index.php`: アプリケーションのエントリーポイント。PHPコードが含まれ、PostgreSQLデータベースへの接続や基本的な処理を行います。
- `.devcontainer/devcontainer.json`: 開発コンテナの設定を定義します。使用するDockerイメージや拡張機能、コンテナの設定を指定します。
- `.devcontainer/Dockerfile`: カスタムDockerイメージを構築するための設定を含みます。PHPとPostgreSQLの環境をセットアップするための命令が記述されています。
- `docker-compose.yml`: Docker Composeの設定を定義します。PHPアプリケーションとPostgreSQLデータベースのサービスを定義し、相互に接続するための設定が含まれています。
- `.gitignore`: Gitで追跡しないファイルやディレクトリを指定します。一般的には、ビルド成果物や環境設定ファイルなどが含まれます。

## セットアップ手順

1. リポジトリをクローンします。
   ```
   git clone <repository-url>
   cd php-postgres-app
   ```

2. DockerとDocker Composeがインストールされていることを確認します。

3. 開発コンテナをビルドして起動します。
   ```
   docker-compose up --build
   ```

4. ブラウザで `http://localhost` にアクセスしてアプリケーションを確認します。

## 使用方法

アプリケーションの使用方法については、`src/index.php` ファイルを参照してください。データベース接続や基本的な処理の実装が含まれています。

## ライセンス

このプロジェクトはMITライセンスの下で提供されています。詳細については、LICENSEファイルを参照してください。