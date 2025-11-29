-- 傘テーブルの拡張（既存のテーブルにカラムを追加）
-- 既存テーブルがある場合は ALTER TABLE を使用

-- 傘の種類カラムを追加
ALTER TABLE umbrellas ADD COLUMN IF NOT EXISTS umbrella_type VARCHAR(50) DEFAULT '長傘';

-- 傘の状態管理カラムを追加（通常、メンテナンス中、破損、紛失）
ALTER TABLE umbrellas ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT '正常' CHECK (condition IN ('正常', 'メンテナンス中', '破損', '紛失'));

-- QRコード用のユニークID（既にidがあるので不要だが、明示的に追加する場合）
-- ALTER TABLE umbrellas ADD COLUMN IF NOT EXISTS qr_code VARCHAR(100) UNIQUE;

-- 傘の説明・特徴を追加
ALTER TABLE umbrellas ADD COLUMN IF NOT EXISTS description TEXT;

-- 更新日時を追加
ALTER TABLE umbrellas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- status列の制約を拡張してメンテナンス中も含める
ALTER TABLE umbrellas DROP CONSTRAINT IF EXISTS umbrellas_status_check;
ALTER TABLE umbrellas ADD CONSTRAINT umbrellas_status_check 
    CHECK (status IN ('available', 'rented', 'maintenance', 'broken'));

-- 傘の貸出履歴テーブルに報告メモを追加
ALTER TABLE umbrella_rentals ADD COLUMN IF NOT EXISTS report_note TEXT;

-- 傘の貸出履歴にユーザーIDを追加（将来的な拡張用）
-- ALTER TABLE umbrella_rentals ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- サンプル傘データ
INSERT INTO umbrellas (name, color, size, umbrella_type, condition, note, description, status) VALUES
('赤い傘1号', '赤', '大', '長傘', '正常', '会社玄関に配置', '大きめの赤い傘です', 'available'),
('青い折りたたみA', '青', '小', '折りたたみ傘', '正常', '軽量タイプ', 'コンパクトな折りたたみ傘', 'available'),
('黒い傘2号', '黒', '中', '長傘', '正常', '', 'スタンダードな黒傘', 'available'),
('透明傘3号', '透明', '中', 'ビニール傘', '正常', '視界良好', '透明なビニール傘', 'available'),
('緑の折りたたみB', '緑', '小', '折りたたみ傘', '正常', '自動開閉', '自動開閉機能付き', 'available')
ON CONFLICT DO NOTHING;
