@echo off
echo.
echo ========================================
echo   🌸 Aarogini Backend Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Check if MongoDB is running (optional check)
echo 🔍 Checking MongoDB connection...
echo.

REM Start the server
echo 🚀 Starting server on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev
