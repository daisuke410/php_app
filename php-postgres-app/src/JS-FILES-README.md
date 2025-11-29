# BookBrella JavaScript ファイル構成

## 📁 JavaScriptファイル一覧

以下のJavaScriptファイルを**この順番で**index.htmlから読み込んでください：

1. **js-core.js** - API通信とユーティリティ関数
2. **js-auth.js** - 認証とナビゲーション
3. **js-books.js** - 書籍管理機能
4. **js-scanner.js** - ISBNバーコードスキャナーと一括登録
5. **js-umbrellas.js** - 傘管理機能
6. **js-users.js** - ユーザー管理機能

## 📝 index.htmlへの追加方法

index.htmlの`</body>`タグの直前に、以下のscriptタグを追加してください：

```html
<!-- BookBrella JavaScript -->
<script src="js-core.js"></script>
<script src="js-auth.js"></script>
<script src="js-books.js"></script>
<script src="js-scanner.js"></script>
<script src="js-umbrellas.js"></script>
<script src="js-users.js"></script>
```

## 🗑️ 削除する既存コード

index.htmlの`<script>`タグ内にある既存のJavaScriptコード（`// Data Storage`から`init();`まで）を**すべて削除**してください。

## ✅ 完了後の確認

1. ブラウザのデベロッパーツール（F12）を開く
2. Consoleタブでエラーがないことを確認
3. http://localhost:8000/index.html にアクセス
4. ログイン機能が動作することを確認

## 📋 各ファイルの役割

### js-core.js
- APICall関数（API通信の基本）
- グローバル変数の定義
- モーダル制御関数
- トグル関数
- CSV解析関数
- イベントリスナー設定

### js-auth.js
- ログイン/ログアウト
- 画面遷移
- セクション切り替え

### js-books.js
- 書籍一覧表示
- 書籍登録・編集・削除
- 書籍貸出・返却
- レビュー機能
- エクスポート/インポート

### js-scanner.js
- ISBNバーコードスキャナー
- ISBN検索（Google Books API）
- 一括登録機能

### js-umbrellas.js
- 傘一覧表示
- 傘登録
- 傘貸出・返却
- QRコード生成・スキャン

### js-users.js
- ユーザー一覧表示
- ユーザー登録
- CSVインポート

## 🔧 トラブルシューティング

### エラー: "apiCall is not defined"
→ js-core.jsが読み込まれていません。scriptタグの順番を確認してください。

### エラー: "currentUser is not defined"
→ グローバル変数が定義されていません。js-core.jsを最初に読み込んでください。

### 機能が動作しない
→ ブラウザのキャッシュをクリアして再読み込みしてください（Ctrl + Shift + R）

## 📦 ファイル配置

```
php-postgres-app/
└── src/
    ├── index.html
    ├── index.php
    ├── api.php
    ├── db.php
    ├── init_db.php
    ├── js-core.js
    ├── js-auth.js
    ├── js-books.js
    ├── js-scanner.js
    ├── js-umbrellas.js
    └── js-users.js
```
