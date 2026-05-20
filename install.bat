@echo off
title TST Meet - Install Dependencies
color 0A

echo.
echo  TST Meet - Dependency Installer
echo  =================================
echo.

node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org (v18+)
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version

echo.
echo [INFO] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% neq 0 ( echo [ERROR] Backend install failed! & pause & exit /b 1 )
cd ..
echo [OK] Backend ready.

echo.
echo [INFO] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 ( echo [ERROR] Frontend install failed! & pause & exit /b 1 )
cd ..
echo [OK] Frontend ready.

if not exist "backend\data" mkdir backend\data
echo [OK] Database folder created.

echo.
echo  ==========================================
echo  [SUCCESS] All dependencies installed!
echo  Run start.bat to launch TST Meet.
echo  ==========================================
echo.
pause
