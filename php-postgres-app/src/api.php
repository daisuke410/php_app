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
                               'date', r.review_date,
                               'created_at', r.created_at
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
                        publish_date = ?, owner_type = ?, location = ?, owner = ?,
                        image_url = ?, description = ?
                    WHERE id = ?
                    RETURNING *
                ");
                $stmt->execute([
                    $input['title'],
                    $input['author'],
                    $input['genre'],
                    $input['publisher'],
                    $input['date'] ?? null,
                    $input['ownerType'],
                    $input['location'],
                    $input['owner'],
                    $input['imageUrl'] ?? '',
                    $input['description'] ?? '',
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
                               'returnDate', ur.expected_return_date,
                               'actualReturnDate', ur.return_date,
                               'reportNote', ur.report_note
                           )) FILTER (WHERE ur.id IS NOT NULL AND ur.return_date IS NULL), '[]') as rentals,
                           COALESCE(json_agg(DISTINCT jsonb_build_object(
                               'id', ur_history.id,
                               'borrower', ur_history.borrower,
                               'rentalDate', ur_history.rental_date,
                               'returnDate', ur_history.return_date,
                               'expectedReturnDate', ur_history.expected_return_date,
                               'reportNote', ur_history.report_note
                           )) FILTER (WHERE ur_history.id IS NOT NULL), '[]') as history
                    FROM umbrellas u
                    LEFT JOIN umbrella_rentals ur ON u.id = ur.umbrella_id AND ur.return_date IS NULL
                    LEFT JOIN umbrella_rentals ur_history ON u.id = ur_history.umbrella_id
                    GROUP BY u.id
                    ORDER BY u.id DESC
                ");
                $umbrellas = $stmt->fetchAll();
                
                foreach ($umbrellas as &$umbrella) {
                    $umbrella['rentals'] = json_decode($umbrella['rentals'], true);
                    $umbrella['history'] = json_decode($umbrella['history'], true);
                    $umbrella['umbrellaType'] = $umbrella['umbrella_type'] ?? '長傘';
                    $umbrella['condition'] = $umbrella['condition'] ?? '正常';
                }
                
                echo json_encode(['success' => true, 'umbrellas' => $umbrellas]);
            }
            break;
            
        case 'register_umbrella':
            if ($method === 'POST') {
                $stmt = $db->prepare("
                    INSERT INTO umbrellas (name, color, size, umbrella_type, condition, note, description, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
                    RETURNING *
                ");
                $stmt->execute([
                    $input['name'],
                    $input['color'],
                    $input['size'],
                    $input['umbrellaType'] ?? '長傘',
                    $input['condition'] ?? '正常',
                    $input['note'] ?? '',
                    $input['description'] ?? ''
                ]);
                $umbrella = $stmt->fetch();
                echo json_encode(['success' => true, 'umbrella' => $umbrella]);
            }
            break;
            
        case 'update_umbrella':
            if ($method === 'POST') {
                $stmt = $db->prepare("
                    UPDATE umbrellas 
                    SET name = ?, color = ?, size = ?, umbrella_type = ?, 
                        condition = ?, note = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    RETURNING *
                ");
                $stmt->execute([
                    $input['name'],
                    $input['color'],
                    $input['size'],
                    $input['umbrellaType'] ?? '長傘',
                    $input['condition'] ?? '正常',
                    $input['note'] ?? '',
                    $input['description'] ?? '',
                    $input['id']
                ]);
                $umbrella = $stmt->fetch();
                echo json_encode(['success' => true, 'umbrella' => $umbrella]);
            }
            break;
            
        case 'delete_umbrella':
            if ($method === 'POST') {
                $stmt = $db->prepare("DELETE FROM umbrellas WHERE id = ?");
                $stmt->execute([$input['id']]);
                echo json_encode(['success' => true]);
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
                    SET return_date = CURRENT_DATE, report_note = ?
                    WHERE umbrella_id = ? AND return_date IS NULL
                ");
                $stmt->execute([
                    $input['reportNote'] ?? null,
                    $input['umbrellaId']
                ]);
                
                $db->commit();
                echo json_encode(['success' => true]);
            }
            break;
            
        case 'get_umbrella_stats':
            if ($method === 'GET') {
                // 統計情報を取得
                $total = $db->query("SELECT COUNT(*) as count FROM umbrellas")->fetch()['count'];
                $available = $db->query("SELECT COUNT(*) as count FROM umbrellas WHERE status = 'available'")->fetch()['count'];
                $rented = $db->query("SELECT COUNT(*) as count FROM umbrellas WHERE status = 'rented'")->fetch()['count'];
                
                // 月ごとの貸出数
                $monthlyRentals = $db->query("
                    SELECT TO_CHAR(rental_date, 'YYYY-MM') as month, COUNT(*) as count
                    FROM umbrella_rentals
                    WHERE rental_date >= CURRENT_DATE - INTERVAL '6 months'
                    GROUP BY month
                    ORDER BY month DESC
                ")->fetchAll();
                
                // よく借りられる傘
                $popularUmbrellas = $db->query("
                    SELECT u.id, u.name, COUNT(ur.id) as rental_count
                    FROM umbrellas u
                    LEFT JOIN umbrella_rentals ur ON u.id = ur.umbrella_id
                    GROUP BY u.id, u.name
                    ORDER BY rental_count DESC
                    LIMIT 5
                ")->fetchAll();
                
                // 返却遅延中の傘
                $overdueRentals = $db->query("
                    SELECT u.*, ur.borrower, ur.rental_date, ur.expected_return_date
                    FROM umbrellas u
                    JOIN umbrella_rentals ur ON u.id = ur.umbrella_id
                    WHERE ur.return_date IS NULL 
                    AND ur.expected_return_date < CURRENT_DATE
                ")->fetchAll();
                
                echo json_encode([
                    'success' => true,
                    'stats' => [
                        'total' => $total,
                        'available' => $available,
                        'rented' => $rented,
                        'monthlyRentals' => $monthlyRentals,
                        'popularUmbrellas' => $popularUmbrellas,
                        'overdueRentals' => $overdueRentals
                    ]
                ]);
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
