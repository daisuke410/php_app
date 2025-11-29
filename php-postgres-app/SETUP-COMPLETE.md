# 🎉 BookBrella セットアップ完了ガイド

## ✅ 作成したファイル一覧

### バックエンド（PHP + PostgreSQL）
- ✅ `init.sql` - データベース初期化スクリプト
- ✅ `src/db.php` - データベース接続クラス
- ✅ `src/api.php` - REST API
- ✅ `src/init_db.php` - DB初期化実行スクリプト
- ✅ `docker-compose.yml` - Docker設定（更新版）
- ✅ `.devcontainer/Dockerfile` - PHPコンテナ設定（更新版）

### フロントエンド（JavaScript）
- ✅ `src/js-core.js` - API通信とユーティリティ
- ✅ `src/js-auth.js` - 認証とナビゲーション
- ✅ `src/js-books.js` - 書籍管理
- ✅ `src/js-scanner.js` - バーコードスキャナー
- ✅ `src/js-umbrellas.js` - 傘管理
- ✅ `src/js-users.js` - ユーザー管理

### ドキュメント
- ✅ `README_DATABASE.md` - データベース詳細ガイド
- ✅ `src/JS-FILES-README.md` - JavaScript統合ガイド

## 🚀 セットアップ手順

### ステップ1: index.htmlの修正

1. `src/index.html`を開く
2. **既存の`<script>`タグ内のJavaScriptコードを削除**
   - `// Data Storage`から`init();`までのコード全体
3. **`</body>`タグの直前**に以下を追加：

```html
<!-- BookBrella JavaScript -->
<script src="js-core.js"></script>
<script src="js-auth.js"></script>
<script src="js-books.js"></script>
<script src="js-scanner.js"></script>
<script src="js-umbrellas.js"></script>
<script src="js-users.js"></script>
</body>
</html>
```

### ステップ2: Dockerコンテナの起動

```bash
cd C:\Users\snoop\OneDrive\デスクトップ\php\php-postgres-app

# 既存のコンテナとボリュームを削除
docker-compose down -v

# コンテナを再ビルドして起動
docker-compose up -d --build

# ログを確認
docker-compose logs -f
```

### ステップ3: データベースの確認

データベースは自動的に初期化されます。確認方法：

```bash
# データベースに接続
docker-compose exec db psql -U appuser -d appdb

# テーブル一覧を表示
\dt

# 終了
\q
```

### ステップ4: アプリケーションにアクセス

ブラウザで以下にアクセス：

**メインアプリ**: http://localhost:8000/index.html

**初期ログイン情報**:
- 管理者: `admin@test.com` / `admin`
- 一般ユーザー: `user@test.com` / `user`

または「開発用ログイン（管理者）」ボタンをクリック

## 🎯 機能確認チェックリスト

### 基本機能
- [ ] ログインできる
- [ ] メニュー画面が表示される
- [ ] 「ヨムっと」「カサっと」に遷移できる

### 書籍管理
- [ ] サンプル書籍5冊が表示される
- [ ] 書籍詳細が見られる
- [ ] 書籍を登録できる
- [ ] ISBNで検索できる
- [ ] 書籍を編集できる
- [ ] 書籍を削除できる
- [ ] 書籍を貸出・返却できる
- [ ] レビューを追加できる

### 傘管理
- [ ] 傘を登録できる（管理者のみ）
- [ ] 傘を貸出・返却できる
- [ ] QRコードを表示できる

### ユーザー管理（管理者のみ）
- [ ] ユーザー一覧が表示される
- [ ] 新規ユーザーを登録できる

## 🔧 トラブルシューティング

### 問題1: 接続エラーが出る

```bash
# PostgreSQLコンテナの状態確認
docker-compose ps

# ログ確認
docker-compose logs db
docker-compose logs php

# 完全リセット
docker-compose down -v
docker-compose up -d --build
```

### 問題2: JavaScriptエラーが出る

1. ブラウザのデベロッパーツール（F12）を開く
2. Consoleタブでエラーを確認
3. `js-core.js`が最初に読み込まれているか確認
4. キャッシュをクリア（Ctrl + Shift + R）

### 問題3: 書籍が表示されない

```bash
# データベース内容を確認
docker-compose exec db psql -U appuser -d appdb -c "SELECT COUNT(*) FROM books;"

# データがない場合は再初期化
docker-compose exec php php /workspace/init_db.php
```

### 問題4: APIエラーが出る

```bash
# PHPエラーログを確認
docker-compose exec php tail -f /var/log/apache2/error.log
```

## 📊 データベース構造

### テーブル
- **users** - ユーザー情報
- **books** - 書籍情報
- **umbrellas** - 傘情報
- **book_rentals** - 書籍貸出履歴
- **umbrella_rentals** - 傘貸出履歴
- **book_reviews** - 書籍レビュー

詳細は`README_DATABASE.md`を参照してください。

## 🎨 追加機能

### ISBNバーコードスキャン
- 書籍登録画面で「バーコードをスキャン」ボタンをクリック
- カメラでISBNバーコードを読み取る
- 自動的に書籍情報を取得

### ISBN一括登録
- 書籍一覧で「ISBN一括登録」をクリック
- ISBNコードを改行区切りで入力
- 自動的に複数の書籍を登録

### エクスポート/インポート
- 書籍データをCSV形式でエクスポート
- CSVまたはJSONからインポート

## 🌟 次のステップ

1. **カスタマイズ**
   - ジャンルを追加
   - 拠点を変更
   - デザインを調整

2. **機能追加**
   - メール通知
   - 予約機能
   - 統計ダッシュボード

3. **本番デプロイ**
   - セキュリティ強化（パスワードのハッシュ化）
   - HTTPS対応
   - バックアップ設定

## 📞 サポート

問題が解決しない場合は、以下を確認してください：

1. Dockerが起動しているか
2. ポート8000と5432が使用可能か
3. ファイルのパスが正しいか
4. ブラウザのキャッシュをクリアしたか

## 🎊 完了！

これでBookBrellaの完全な開発環境が整いました！
書籍と傘の管理を楽しんでください！

---

**作成日**: 2024年
**バージョン**: 1.0（PostgreSQL対応版）
