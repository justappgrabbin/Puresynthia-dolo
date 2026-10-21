@echo off
REM SynthAi Complete - Quick Start Script (Windows)
REM Launches frontend, backend API, and optional MCP server

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo 🚀 SynthAi Complete Startup (Windows)
echo =====================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 20+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo ✓ Node.js %%i

REM Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.9+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do echo ✓ Python %%i

REM Start Backend API
echo.
echo Starting Backend API...
cd /d "%~dp0backend\python"

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt >nul 2>&1

start "SynthAi API" python api.py
echo ✓ API started at http://localhost:8000

REM Wait for API
echo Waiting for API to be ready...
timeout /t 5 /nobreak

REM Start Frontend
echo.
echo Starting Frontend...
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install -q
)

start "SynthAi Frontend" cmd /k npm run dev
echo ✓ Frontend started at http://localhost:5173

REM Optional: Start MCP
echo.
set /p mcp_choice="Start MCP server for Claude integration? (y/n): "
if /i "%mcp_choice%"=="y" (
    cd /d "%~dp0mcp"
    
    if not exist "venv" (
        python -m venv venv
    )
    
    call venv\Scripts\activate.bat
    pip install -q anthropic >nul 2>&1
    
    start "SynthAi MCP" cmd /k python mcp_server.py
    echo ✓ MCP Server started
)

REM Summary
echo.
echo ================================
echo SynthAi Complete is running!
echo ================================
echo.
echo Services:
echo   Frontend:  http://localhost:5173
echo   API:       http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Next steps:
echo   1. Open http://localhost:5173 in your browser
echo   2. Enter your birth date, time, and location
echo   3. Click 'Calculate Chart' to begin
echo.
echo Close windows or press Ctrl+C to stop services
echo.

pause
