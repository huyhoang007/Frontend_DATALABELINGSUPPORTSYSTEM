@echo off
TITLE Frontend Data Labeling Support System
echo ============================================
echo Starting Frontend Server...
echo ============================================

cd /d "C:\Users\hai yen\Downloads\Front-end\Front-end"

if not exist "node_modules" (
    echo [INFO] node_modules not found. Running npm install...
    call npm install
    echo.
)

call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend failed to start.
    pause
) else (
    pause
)
