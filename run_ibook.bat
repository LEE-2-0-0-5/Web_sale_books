@echo off
chcp 65001 > nul
echo Đang khởi động dự án IBook...

:: Chạy Backend
echo Đang khởi động Backend (Node.js)...
start "IBook Backend" cmd /k "cd ibook-backend && node server.js"

:: Chạy Frontend USER (Port 5173)
echo Đang khởi động Frontend User (Port 5173)...
start "IBook User (5173)" cmd /k "cd ibook-app && npm run dev -- --port 5173"

:: Chạy Frontend ADMIN (Port 2004)
echo Đang khởi động Frontend Admin (Port 2004)...
start "IBook Admin (2004)" cmd /k "cd ibook-app && npm run dev -- --port 2004"

echo Đã gửi lệnh khởi động! 
echo - Backend: Cổng 3001
echo - User: http://localhost:5173
echo - Admin: http://localhost:2004
timeout /t 5
