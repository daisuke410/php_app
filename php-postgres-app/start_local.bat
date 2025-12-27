@echo off
REM ローカルWindows環境用の起動スクリプト

echo Setting environment variables...
set DB_HOST=localhost
set DB_PORT=5434
set DB_NAME=appdb
set DB_USER=appuser
set DB_PASSWORD=password

echo Starting PHP server on http://0.0.0.0:8080
echo Access from iPhone: http://[YOUR_PC_IP]:8080
php -S 0.0.0.0:8080 -t src

pause
