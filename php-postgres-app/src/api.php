<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['action']) ? $_GET['action'] : '';

// JSONデータを取得
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($request) {
        // ===== ユーザー関連 =====
        case 'login':
            if ($method === 'POST') {
                $email = $input['email'] ?? '';
                $password = $input['password'] ?? '';
                
                $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
                $stmt->execute([$email, $password]);
                $user = $stmt->fetch();
                
                if ($user) {
                    echo json_encode(['success' => true, 'user' => $user]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
                }
            }
            break;
            
        case 'register_user':
            if ($method === 'POST') {
                $stmt = $db->prepare("INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?) RETURNING *");
                $stmt->execute([
                    $input['name'],
                    $input['email'],
                    $input['password'],
                    $input['type'] ?? 'general'
                ]);
                $user = $stmt->fetch();
                echo json_encode(['success' => true, 'user' => $user]);
            }
            break;
            
        case 'get_users':
            if ($method === 'GET') {
                $stmt = $db->query("SELECT id, name, email, type, created_at FROM users ORDER BY id");
                $users = $stmt->fetchAll();
                echo json_encode(['success' => true, 'users' => $users]);
            }
            break;
            
        // ===== 書籍関連 =====
        case 'get_books':
            if ($method === 'GET') {
                $stmt = $db->query("
                    SELECT b.*, 
                           COALESCE(json_agg(DISTINCT jsonb_build_object(
                               'id', br.id,
                               'borrower', br.borrower,
                               'date', br.rental_date,
                               'returnDate', br.expected_return_date
                           )) FILTER (WHERE br.id IS NOT NULL AND br.return_date IS NULL), '[]') as rentals,
                           COALESCE(json_agg(DISTINCT jsonb_build_object(
                               'id', r.id,
                               'name', r.reviewer_name,
                               'rating', r.rating,
                               'comment', r.comment,
                               'date', r.review_date
                           )) FILTER (WHERE r.id IS NOT NULL), '[]') as reviews
                    FROM books b
                    LEFT JOIN book_rentals br ON b.id = br.book_id
                    LEFT JOIN book_reviews r ON b.id = r.book_id
                    GROUP BY b.id
                    ORDER BY b.id DESC
                ");
                $books = $stmt->fetchAll();
                
                // JSON文字列を配列に変換
                foreach ($books as &$book) {
                    $book['rentals'] = json_decode($book['rentals'], true);
                    $book['reviews'] = json_decode($book['reviews'], true);
                    $book['ownerType'] = $book['owner_type'];
                    $book['publishDate'] = $book['publish_date'];
                    $book['imageUrl'] = $book['image_url'];
                }
                
                echo json_encode(['success' => true, 'books' => $books]);
            }
            break;
            
        case 'register_book':
            if ($method === 'POST') {
                $stmt = $db->prepare("
                    INSERT INTO books (isbn, title, author, genre, publisher, publish_date, 
                                     owner_type, location, owner, image_url, description, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
                    RETURNING *
                ");
                $stmt->execute([
                    $input['isbn'] ?? '',
                    $input['title'],
                    $input['author'] ?? '',
                    $input['genre'] ?? '',
                    $input['publisher'] ?? '',
                    $input['date'] ?? null,
                    $input['ownerType'] ?? '会社所有',
                    $input['location'] ?? '豊洲',
                    $input['owner'] ?? '会社',
                    $input['imageUrl'] ?? '',
                    $input['description'] ?? ''
                ]);
                $book = $stmt->fetch();
                echo json_encode(['success' => true, 'book' => $book]);
            }
            break;
            
        case 'update_book':
            if ($method === 'POST') {
                $stmt = $db->prepare("
                    UPDATE books 
                    SET title = ?, author = ?, genre = ?, publisher = ?,
                        owner_type = ?, location = ?, owner = ?
                    WHERE id = ?
                    RETURNING *
                ");
                $stmt->execute([
                    $input['title'],
                    $input['author'],
                    $input['genre'],
                    $input['publisher'],
                    $input['ownerType'],
                    $input['location'],
                    $input['owner'],
                    $input['id']
                ]);
                $book = $stmt->fetch();
                echo json_encode(['success' => true, 'book' => $book]);
            }
            break;
            
        case 'delete_book':
            if ($method === 'POST') {
                $stmt = $db->prepare("DELETE FROM books WHERE id = ?");
                $stmt->execute([$input['id']]);
                echo json_encode(['success' => true]);
            }
            break;
            
        case 'rent_book':
            if ($method === 'POST') {
                $db->beginTransaction();
                
                // 書籍をレンタル中に
                $stmt = $db->prepare("UPDATE books SET status = 'rented' WHERE id = ?");
                $stmt->execute([$input['bookId']]);
                
                // レンタル履歴に追加
                $stmt = $db->prepare("
                    INSERT INTO book_rentals (book_id, borrower, rental_date, expected_return_date)
                    VALUES (?, ?, CURRENT_DATE, ?)
                    RETURNING *
                ");
                $stmt->execute([
                    $input['bookId'],
                    $input['borrower'],
                    $input['returnDate'] ?? null
                ]);
                
                $db->commit();
                echo json_encode(['success' => true]);
            }
            break;
            
        case 'return_book':
            if ($method === 'POST') {
                $db->beginTransaction();
                
                // 書籍を利用可能に
                $stmt = $db->prepare("UPDATE books SET status = 'available' WHERE id = ?");
                $stmt->execute([$input['bookId']]);
                
                // 最新のレンタル履歴を更新
                $stmt = $db->prepare("
                    UPDATE book_rentals 
                    SET return_date = CURRENT_DATE 
                    WHERE book_id = ? AND return_date IS NULL
                ");
                $stmt->execute([$input['bookId']]);
                
                $db->commit();
                echo json_encode(['success' => true]);
            }
            break;
            
        case 'add_review':
            if ($method === 'POST') {
                $stmt = $db->prepare("
                    INSERT INTO book_reviews (book_id, reviewer_name, rating, comment, review_date)
                    VALUES (?, ?, ?, ?, CURRENT_DATE)
                    RETURNING *
                ");
                $stmt->execute([
                    $input['bookId'],
                    $input['name'],
                    $input['rating'],
                    $input['comment']
                ]);
                $review = $stmt->fetch();
                echo json_encode(['success' => true, 'review' => $review]);
            }
            break;
            
        // ===== 傘関連 =====
        case 'get_umbrellas':
            if ($method === 'GET') {
                $stmt = $db->query("
                    SELECT u.*,
                           COALESCE(json_agg(DISTINCT jsonb_build_object(
                               'id', ur.id,
                               'borrower', ur.borrower,
                               'date', ur.rental_date,
                               'returnDate', ur.expected_return_date
                           )) FILTER (WHERE ur.id IS NOT NULL AND ur.return_date IS NULL), '[]') as rentals
                    FROM umbrellas u
                    LEFT JOIN umbrella_rentals ur ON u.id = ur.umbrella_id
                    GROUP BY u.id
                    ORDER BY u.id DESC
                ");
                $umbrellas = $stmt->fetchAll();
                
                foreach ($umbrellas as &$umbrella) {
                    $umbrella['rentals'] = json_decode($umbrella['rentals'], true);
                }
                
                echo json_encode(['success' => true, 'umbrellas' => $umbrellas]);
            }
            break;
            
        case 'register_umbrella':
            if ($method === 'POST') {
                $stmt = $db->prepare("
                    INSERT INTO umbrellas (name, color, size, note, status)
                    VALUES (?, ?, ?, ?, 'available')
                    RETURNING *
                ");
                $stmt->execute([
                    $input['name'],
                    $input['color'],
                    $input['size'],
                    $input['note'] ?? ''
                ]);
                $umbrella = $stmt->fetch();
                echo json_encode(['success' => true, 'umbrella' => $umbrella]);
            }
            break;
            
        case 'rent_umbrella':
            if ($method === 'POST') {
                $db->beginTransaction();
                
                $stmt = $db->prepare("UPDATE umbrellas SET status = 'rented' WHERE id = ?");
                $stmt->execute([$input['umbrellaId']]);
                
                $stmt = $db->prepare("
                    INSERT INTO umbrella_rentals (umbrella_id, borrower, rental_date, expected_return_date)
                    VALUES (?, ?, CURRENT_DATE, ?)
                    RETURNING *
                ");
                $stmt->execute([
                    $input['umbrellaId'],
                    $input['borrower'],
                    $input['returnDate'] ?? null
                ]);
                
                $db->commit();
                echo json_encode(['success' => true]);
            }
            break;
            
        case 'return_umbrella':
            if ($method === 'POST') {
                $db->beginTransaction();
                
                $stmt = $db->prepare("UPDATE umbrellas SET status = 'available' WHERE id = ?");
                $stmt->execute([$input['umbrellaId']]);
                
                $stmt = $db->prepare("
                    UPDATE umbrella_rentals 
                    SET return_date = CURRENT_DATE 
                    WHERE umbrella_id = ? AND return_date IS NULL
                ");
                $stmt->execute([$input['umbrellaId']]);
                
                $db->commit();
                echo json_encode(['success' => true]);
            }
            break;
            
        case 'test_db':
            // データベース接続テスト
            $stmt = $db->query("SELECT COUNT(*) as count FROM books");
            $result = $stmt->fetch();
            echo json_encode([
                'success' => true,
                'message' => 'Database connection OK',
                'book_count' => $result['count']
            ]);
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action', 'requested' => $request]);
    }
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['error' => $e->getMessage()]);
}
?>
