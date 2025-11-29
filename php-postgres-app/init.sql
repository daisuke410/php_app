-- データベース初期化スクリプト

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('admin', 'general')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 書籍テーブル
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(20),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    genre VARCHAR(50),
    publisher VARCHAR(255),
    publish_date DATE,
    owner_type VARCHAR(50) NOT NULL,
    location VARCHAR(50) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    image_url TEXT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 傘テーブル
CREATE TABLE IF NOT EXISTS umbrellas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL CHECK (size IN ('大', '中', '小')),
    note TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 書籍貸出履歴テーブル
CREATE TABLE IF NOT EXISTS book_rentals (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    borrower VARCHAR(100) NOT NULL,
    rental_date DATE NOT NULL,
    return_date DATE,
    expected_return_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 傘貸出履歴テーブル
CREATE TABLE IF NOT EXISTS umbrella_rentals (
    id SERIAL PRIMARY KEY,
    umbrella_id INTEGER REFERENCES umbrellas(id) ON DELETE CASCADE,
    borrower VARCHAR(100) NOT NULL,
    rental_date DATE NOT NULL,
    return_date DATE,
    expected_return_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 書籍レビューテーブル
CREATE TABLE IF NOT EXISTS book_reviews (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初期ユーザーデータ
--INSERT INTO users (name, email, password, type) VALUES
--INSERT INTO users (name, email, type) VALUES ('test', 'test@example.com', 'user')
--('管理者', 'admin@test.com', 'admin', 'admin'),
--('一般ユーザー', 'user@test.com', 'user', 'general')
--ON CONFLICT (email) DO NOTHING;

-- サンプル書籍データ
INSERT INTO books (isbn, title, author, genre, publisher, publish_date, owner_type, location, owner, image_url, description, status) VALUES
('978-4-7741-9763-1', 'リーダブルコード', 'Dustin Boswell', '技術', '技術評論社', '2012-06-23', '会社所有', '豊洲', '会社', 'https://m.media-amazon.com/images/I/51MgH8Jmr+L._SY445_SX342_.jpg', 'より良いコードを書くためのシンプルで実践的なテクニック集。', 'available'),
('9784798189765', 'プログラミング言語大全', '黒川利明', '技術', '翔泳社', '2024-03-13', '会社所有', '豊洲', '会社', '', '世界のプログラミング言語を網羅的に解説した一冊。', 'available'),
('9784478119488', 'エフォートレス思考', 'グレッグ・マキューン', 'ビジネス', 'ダイヤモンド社', '2021-12-08', '会社所有', '豊洲', '会社', '', '努力を最小化して成果を最大化する方法を解説。', 'available'),
('9784866367293', 'ハック思考', '須藤憲司', 'ビジネス', 'NewsPicksパブリッシング', '2020-02-06', '会社所有', '豊洲', '会社', '', '最短距離で目標を達成するための思考法。', 'available'),
('9784322144901', '新しい会計の教科書', '田中靖浩', 'ビジネス', 'きんざい', '2020-11-25', '会社所有', '豊洲', '会社', '', '会計の基礎から応用まで体系的に学べる一冊。', 'available')
ON CONFLICT DO NOTHING;
