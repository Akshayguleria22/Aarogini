@echo off
echo Starting Aarogini Services...
echo.

echo Starting Node.js Backend on port 5000...
start "Node.js Backend" cmd /k "cd backend && node index.js"

timeout /t 3 /nobreak > nul

echo.
echo ============================================
echo Backend service started!
echo ============================================
echo Node.js Backend:   http://localhost:5000
echo React Frontend:    http://localhost:5173
echo ============================================
echo.
echo To start frontend, run: cd frontend && npm run dev
echo.
echo Press any key to stop all services...
pause > nul

taskkill /FI "WINDOWTITLE eq Node.js Backend*" /F
