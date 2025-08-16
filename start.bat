@echo off
echo Starting Data Modeling Tool...
echo.

echo Starting backend server...
start /D server cmd /k "npm start"

echo Waiting 3 seconds for server to start...
timeout /t 3 /nobreak >nul

echo Starting frontend...
start /D client cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
pause
