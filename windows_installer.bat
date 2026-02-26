@echo off
setlocal enabledelayedexpansion
title AssetFlow Installer
color 0F
mode con: cols=60 lines=40

:: ===== LOCATE PROJECT ROOT (works from any drive, any folder) =====
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "LOG_FILE=%PROJECT_ROOT%\install.log"

echo. > "%LOG_FILE%"

cls
echo.
echo  ==========================================
echo         AssetFlow  ^|  Windows Installer
echo  ==========================================
echo.
echo  This will set up AssetFlow on your machine.
echo  Sit back and follow the prompts.
echo.
echo  ==========================================
echo.
timeout /t 2 /nobreak >nul


:: ===== VERIFY PROJECT STRUCTURE =====
if not exist "%BACKEND_DIR%" (
    echo  [ERROR] Could not find the backend folder.
    echo.
    echo  Make sure windows_installer.bat is inside
    echo  the AssetFlow project root folder.
    echo.
    pause
    exit /b 1
)
if not exist "%FRONTEND_DIR%" (
    echo  [ERROR] Could not find the frontend folder.
    echo.
    echo  Make sure windows_installer.bat is inside
    echo  the AssetFlow project root folder.
    echo.
    pause
    exit /b 1
)


:: =============================================
cls
echo.
echo  ==========================================
echo   Step 1 of 6  ^|  Checking Python
echo  ==========================================
echo.

set "PYTHON_OK=0"

python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=2" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
    echo  Python !PY_VER! is already installed.
    set "PYTHON_OK=1"
)

if "!PYTHON_OK!"=="0" (
    echo  Python not found. Installing Python 3.11...
    echo  (This may take a few minutes)
    echo.

    winget --version >nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo  [ERROR] Cannot auto-install Python.
        echo.
        echo  Please install Python 3.11 manually:
        echo  https://www.python.org/downloads/
        echo.
        echo  IMPORTANT: Check "Add Python to PATH"
        echo  during installation, then re-run this.
        pause
        exit /b 1
    )

    winget install --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements >> "%LOG_FILE%" 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo  [ERROR] Python installation failed.
        echo  Please install manually from python.org
        pause
        exit /b 1
    )

    :: Refresh PATH from registry
    call :refresh_path

    python --version >nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo  [ERROR] Python installed but PATH not updated.
        echo  Please restart your PC and re-run installer.
        pause
        exit /b 1
    )

    for /f "tokens=2" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
    echo  Python !PY_VER! installed successfully.
)

echo.
echo  Checking version...
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
for /f "tokens=1,2 delims=." %%a in ("!PY_VER!") do (
    set "PY_MAJOR=%%a"
    set "PY_MINOR=%%b"
)
if !PY_MAJOR! EQU 3 if !PY_MINOR! LSS 11 (
    echo  Warning: Python !PY_VER! detected.
    echo  Version 3.11+ is recommended.
    echo  Continuing anyway...
)

echo.
echo  Python is ready.
echo [LOG] Python %PY_VER% >> "%LOG_FILE%"
timeout /t 1 /nobreak >nul


:: =============================================
cls
echo.
echo  ==========================================
echo   Step 2 of 6  ^|  Checking Node.js
echo  ==========================================
echo.

set "NODE_OK=0"

node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f %%v in ('node --version 2^>^&1') do set "NODE_VER=%%v"
    echo  Node.js !NODE_VER! is already installed.
    set "NODE_OK=1"
)

if "!NODE_OK!"=="0" (
    echo  Node.js not found. Installing Node.js LTS...
    echo  (This may take a few minutes)
    echo.

    winget --version >nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo  [ERROR] Cannot auto-install Node.js.
        echo.
        echo  Please install Node.js manually:
        echo  https://nodejs.org/
        echo  Then re-run this installer.
        pause
        exit /b 1
    )

    winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements >> "%LOG_FILE%" 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo  [ERROR] Node.js installation failed.
        echo  Please install manually from nodejs.org
        pause
        exit /b 1
    )

    call :refresh_path

    node --version >nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo  [ERROR] Node.js installed but PATH not updated.
        echo  Please restart your PC and re-run installer.
        pause
        exit /b 1
    )

    for /f %%v in ('node --version 2^>^&1') do set "NODE_VER=%%v"
    echo  Node.js !NODE_VER! installed successfully.
)

echo.
echo  Node.js is ready.
echo [LOG] Node.js %NODE_VER% >> "%LOG_FILE%"
timeout /t 1 /nobreak >nul


:: =============================================
cls
echo.
echo  ==========================================
echo   Step 3 of 6  ^|  Setting Up Backend
echo  ==========================================
echo.

cd /d "%BACKEND_DIR%"

echo  Creating Python virtual environment...
if not exist "venv" (
    python -m venv venv >> "%LOG_FILE%" 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo  [ERROR] Failed to create virtual environment.
        echo  Check the install.log file for details.
        pause
        exit /b 1
    )
    echo  Virtual environment created.
) else (
    echo  Virtual environment already exists. Skipping.
)

echo.
echo  Activating virtual environment...
call venv\Scripts\activate.bat
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Could not activate virtual environment.
    pause
    exit /b 1
)
echo  Virtual environment active.

echo.
python -c "import fastapi" >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo  Backend packages already installed. Skipping.
) else (
    echo  Installing backend packages...
    echo  (This may take 2-3 minutes)
    echo.
    python -m pip install --upgrade pip --quiet >> "%LOG_FILE%" 2>&1
    python -m pip install -r requirements.txt >> "%LOG_FILE%" 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo  [ERROR] Package installation failed.
        echo  Check install.log for details.
        pause
        exit /b 1
    )
    echo  Backend packages installed.
)

echo.
echo  Backend is ready.
echo [LOG] Backend setup done >> "%LOG_FILE%"
timeout /t 1 /nobreak >nul


:: =============================================
cls
echo.
echo  ==========================================
echo   Step 4 of 6  ^|  Database Setup
echo  ==========================================
echo.
echo  You need a MongoDB Atlas connection string.
echo.
echo  How to get it:
echo  1. Go to mongodb.com/cloud/atlas
echo  2. Open your cluster
echo  3. Click Connect - Drivers
echo  4. Copy the connection string
echo  5. Replace ^<password^> with your password
echo.
echo  It looks like this:
echo  mongodb+srv://user:pass@cluster.net/assetflow
echo.
echo  ==========================================
echo.

:askmongo
set "MONGODB_URI="
set /p "  Enter URI: MONGODB_URI="

echo.

if "!MONGODB_URI!"=="" (
    echo  URI cannot be empty. Please try again.
    echo.
    goto askmongo
)

echo !MONGODB_URI! | findstr /i "mongodb" >nul
if !ERRORLEVEL! NEQ 0 (
    echo  Invalid format. Must contain mongodb://
    echo  Please try again.
    echo.
    goto askmongo
)

echo  Testing connection to MongoDB...
echo  (This takes up to 10 seconds)
echo.

python -c "
import sys
from pymongo import MongoClient
try:
    client = MongoClient(sys.argv[1], serverSelectionTimeoutMS=10000)
    client.server_info()
    print('OK')
except Exception as e:
    print('FAIL')
    sys.exit(1)
" "!MONGODB_URI!" 2>>"%LOG_FILE%" | findstr "OK" >nul

if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Could not connect to MongoDB.
    echo.
    echo  Common causes:
    echo  - Wrong password in connection string
    echo  - Your IP is not whitelisted in Atlas
    echo    (Add 0.0.0.0/0 in Atlas Network Access)
    echo  - Cluster is paused
    echo.
    set /p "  Try again? (y/n): " RETRY=
    if /i "!RETRY!"=="y" (
        echo.
        goto askmongo
    )
    echo  Exiting installer.
    pause
    exit /b 1
)

echo  Connected to MongoDB successfully!
echo.

:: Generate JWT secret
for /f %%i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set "JWT_SECRET=%%i"

echo  Creating backend configuration file...
(
echo MONGODB_URI=!MONGODB_URI!
echo DB_NAME=assetflow
echo JWT_SECRET=!JWT_SECRET!
echo CORS_ORIGINS=http://localhost:3000
) > .env

echo  Configuration file created.
echo [LOG] .env created >> "%LOG_FILE%"
timeout /t 1 /nobreak >nul


:: =============================================
cls
echo.
echo  ==========================================
echo   Step 5 of 6  ^|  Setting Up Frontend
echo  ==========================================
echo.

cd /d "%FRONTEND_DIR%"

echo  Creating frontend configuration file...
(
echo REACT_APP_BACKEND_URL=http://localhost:8001
) > .env
echo  Frontend configuration created.
echo.

if exist "node_modules" (
    echo  Frontend packages already installed. Skipping.
) else (
    echo  Installing frontend packages...
    echo  (This may take 3-5 minutes)
    echo.
    npm install >> "%LOG_FILE%" 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo  [ERROR] npm install failed.
        echo  Check install.log for details.
        pause
        exit /b 1
    )
    echo  Frontend packages installed.
)

echo.
echo  Frontend is ready.
echo [LOG] Frontend setup done >> "%LOG_FILE%"
timeout /t 1 /nobreak >nul


:: =============================================
cls
echo.
echo  ==========================================
echo   Step 6 of 6  ^|  Creating Launcher
echo  ==========================================
echo.

cd /d "%PROJECT_ROOT%"

echo  Creating start.bat...

(
echo @echo off
echo title AssetFlow
echo color 0F
echo cls
echo echo.
echo echo  ==========================================
echo echo          AssetFlow  ^|  Launcher
echo echo  ==========================================
echo echo.
echo echo  Starting backend server...
echo cd /d "%%~dp0backend"
echo call venv\Scripts\activate.bat
echo start cmd /k "title AssetFlow Backend ^& uvicorn server:app --host 0.0.0.0 --port 8001"
echo echo  Backend starting on http://localhost:8001
echo echo.
echo echo  Waiting for backend to load...
echo timeout /t 4 /nobreak ^>nul
echo echo  Starting frontend...
echo cd /d "%%~dp0frontend"
echo start cmd /k "title AssetFlow Frontend ^& npm start"
echo echo  Frontend starting on http://localhost:3000
echo echo.
echo echo  ==========================================
echo echo   Both servers are now launching.
echo echo   Browser will open automatically.
echo echo.
echo echo   Login credentials:
echo echo   Email:    admin@local.internal
echo echo   Password: Admin123!
echo echo  ==========================================
echo echo.
echo pause
) > start.bat

echo  start.bat created.
echo.
echo [LOG] start.bat created >> "%LOG_FILE%"


:: =============================================
cls
echo.
echo  ==========================================
echo.
echo   Installation Complete!
echo.
echo  ==========================================
echo.
echo   To start AssetFlow anytime:
echo   Double-click  start.bat
echo.
echo   Default login:
echo   Email:    admin@local.internal
echo   Password: Admin123!
echo.
echo   Backend  - http://localhost:8001
echo   Frontend - http://localhost:3000
echo.
echo  ==========================================
echo.
echo [LOG] Installation complete >> "%LOG_FILE%"

set /p "  Launch AssetFlow now? (y/n): " LAUNCH=
if /i "!LAUNCH!"=="y" (
    call start.bat
)

pause
exit /b 0


:: =============================================
:refresh_path
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "SYS_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "USR_PATH=%%b"
set "PATH=!SYS_PATH!;!USR_PATH!"
exit /b 0
