@echo off
REM ローカルWindows環境用のデータベース初期化スクリプト

echo Setting environment variables...
set DB_HOST=localhost
set DB_PORT=5434
set DB_NAME=appdb
set DB_USER=appuser
set DB_PASSWORD=password

echo Initializing database...
php src\init_db.php

echo Running migrations...
php src\run_migration.php

echo Done!
pause
