@echo off
title TST Meet - Startup
color 0B

echo.
echo  ████████╗███████╗████████╗    ███╗   ███╗███████╗███████╗████████╗
echo  ╚══██╔══╝██╔════╝╚══██╔══╝    ████╗ ████║██╔════╝██╔════╝╚══██╔══╝
echo     ██║   ███████╗   ██║       ██╔████╔██║█████╗  █████╗     ██║
echo     ██║   ╚════██║   ██║       ██║╚██╔╝██║██╔══╝  ██╔══╝     ██║
echo     ██║   ███████║   ██║       ██║ ╚═╝ ██║███████╗███████╗   ██║
echo     ╚═╝   ╚══════╝   ╚═╝       ╚═╝     ╚═╝╚══════╝╚══════╝   ╚═╝
echo.
echo  Internal Company Meeting Platform
echo  ====================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org
    echo Minimum version required: 18.x
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER% detected

:: Check if dependencies are installed
if not exist "backend\node_modules" (
    echo.
    echo [INFO] Installing backend dependencies... (first time only)
    cd backend
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Backend dependency installation failed!
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Backend dependencies installed
)

if not exist "frontend\node_modules" (
    echo.
    echo [INFO] Installing frontend dependencies... (first time only)
    cd frontend
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Frontend dependency installation failed!
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Frontend dependencies installed
)

:: Create data directory for SQLite
if not exist "backend\data" mkdir backend\data

echo.
echo [INFO] Starting TST Meet...
echo.
echo  Backend API  → http://localhost:3001
echo  Frontend     → http://localhost:3000
echo  API Docs     → http://localhost:3001/api/docs
echo  Admin Login  → http://localhost:3000/admin/login
echo.
echo  Admin Email    : admin@tst-meet.com
echo  Admin Password : Admin@123456
echo.
echo  Press Ctrl+C in each window to stop the servers.
echo.

:: Start backend in new window
start "TST Meet - Backend" cmd /k "cd backend && npm run dev"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in new window
start "TST Meet - Frontend" cmd /k "cd frontend && npm run dev"

:: Wait a moment then open browser
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo [OK] TST Meet is starting up!
echo     The browser will open automatically.
echo.
pause
