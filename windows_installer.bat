@echo off
title AssetFlow Windows Installer

echo =====================================
echo        AssetFlow Installer
echo =====================================
echo.

:: Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Python not found. Install Python 3.11 and add it to PATH.
    pause
    exit /b
)

:: Check Node
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js not found. Install Node.js and add it to PATH.
    pause
    exit /b
)

echo.
echo Setting up backend...
cd backend

python -m venv venv
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt

:askmongo
echo.
set /p MONGODB_URI=Enter MongoDB URI: 
IF "%MONGODB_URI%"=="" (
    echo MongoDB URI cannot be empty.
    goto askmongo
)

echo MONGODB_URI=%MONGODB_URI% > .env

cd ..

echo.
echo Setting up frontend...
cd frontend
npm install
cd ..

echo.
echo Creating start.bat...

(
echo @echo off
echo title AssetFlow
echo cd backend
echo call venv\Scripts\activate
echo start cmd /k uvicorn server:app --host 0.0.0.0 --port 8001
echo cd ..
echo cd frontend
echo start cmd /k npm start
) > start.bat

echo.
echo Installation complete.
echo Launching application...
call start.bat

pause
