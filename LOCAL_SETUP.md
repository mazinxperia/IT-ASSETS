# 🚀 AssetFlow - Complete Local Setup Guide

## ⚠️ IMPORTANT: Follow Steps in Exact Order

This guide will get AssetFlow running on your computer in 30 minutes.

---

## 📋 Prerequisites - What You Need

### Required Software Versions

| Software | Minimum Version | Recommended Version | Why Needed |
|----------|----------------|---------------------|------------|
| **Node.js** | 18.0.0 | 18.17.0+ | Runs the frontend (React) |
| **Python** | 3.11.0 | 3.11.5+ | Runs the backend (FastAPI) |
| **npm** | 9.0.0 | 9.8.0+ | Installs Node packages |
| **pip** | 23.0.0 | 23.2.0+ | Installs Python packages |

**Optional but Recommended:**
- **Git** 2.40.0+ (for cloning repository)
- **MongoDB Compass** (GUI for viewing database)

---

## 🖥️ Step-by-Step Installation

### Part 1: Install Node.js

#### For Windows:

1. **Download Node.js:**
   - Go to: https://nodejs.org/en/download
   - Click **"Windows Installer (.msi)"** - **64-bit**
   - Choose **"18.17.1 LTS"** or newer

2. **Run Installer:**
   - Double-click the downloaded `.msi` file
   - Click **"Next"** on welcome screen
   - Accept license agreement → **"Next"**
   - Choose installation location (default is fine) → **"Next"**
   - **CHECK**: "Automatically install necessary tools" → **"Next"**
   - Click **"Install"**
   - Wait 2-3 minutes
   - Click **"Finish"**

3. **Verify Installation:**
   ```cmd
   # Open NEW Command Prompt (important - must be new)
   # Press Windows Key, type "cmd", press Enter
   
   node --version
   # Should show: v18.17.1 (or higher)
   
   npm --version
   # Should show: 9.8.1 (or higher)
   ```

4. **If version doesn't show:**
   - Close and reopen Command Prompt
   - Restart computer if needed

#### For macOS:

**Method 1: Official Installer (Easiest)**

1. **Download:**
   - Go to: https://nodejs.org/en/download
   - Click **"macOS Installer (.pkg)"**
   - Choose **"18.17.1 LTS"**

2. **Install:**
   - Open downloaded `.pkg` file
   - Follow installation wizard
   - Enter your Mac password when prompted
   - Click **"Install"**

3. **Verify:**
   ```bash
   # Open Terminal (Cmd + Space, type "terminal")
   node --version
   npm --version
   ```

**Method 2: Using Homebrew (Recommended for Developers)**

```bash
# Install Homebrew first (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Verify
node --version
npm --version
```

#### For Linux (Ubuntu/Debian):

```bash
# Update package list
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

---

### Part 2: Install Python

#### For Windows:

1. **Download Python:**
   - Go to: https://www.python.org/downloads/
   - Click **"Download Python 3.11.x"** (big yellow button)
   - Choose the latest 3.11.x version

2. **Run Installer:**
   - Double-click downloaded `.exe` file
   - **⚠️ CRITICAL:** Check ☑ **"Add Python to PATH"** (bottom of window)
   - Click **"Install Now"**
   - Wait 2-3 minutes
   - Click **"Close"**

3. **Verify Installation:**
   ```cmd
   # Open NEW Command Prompt
   python --version
   # Should show: Python 3.11.x
   
   # OR try:
   python3 --version
   
   pip --version
   # Should show: pip 23.x.x
   ```

4. **If "python" doesn't work, try "python3":**
   - Use `python3` instead of `python` in all commands below

#### For macOS:

**Using Homebrew (Recommended):**

```bash
# Install Python 3.11
brew install python@3.11

# Verify
python3 --version
pip3 --version

# Create aliases (optional, makes life easier)
echo 'alias python=python3' >> ~/.zshrc
echo 'alias pip=pip3' >> ~/.zshrc
source ~/.zshrc
```

**Official Installer:**
1. Download from: https://www.python.org/downloads/macos/
2. Install Python 3.11.x
3. Follow installation wizard

#### For Linux (Ubuntu/Debian):

```bash
# Install Python 3.11
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Verify
python3.11 --version
pip3 --version
```

---

### Part 3: Download AssetFlow

#### Option A: Download ZIP (Easiest)

1. **Go to your GitHub repository**
2. **Click green "Code" button**
3. **Click "Download ZIP"**
4. **Save to easy location:**
   - Windows: `C:\Users\YourName\Desktop\AssetFlow`
   - macOS: `~/Desktop/AssetFlow`
5. **Extract ZIP file:**
   - Right-click → Extract All (Windows)
   - Double-click ZIP (macOS)

#### Option B: Clone with Git

```bash
# Windows (Command Prompt) or macOS/Linux (Terminal)
cd Desktop
git clone https://github.com/your-username/your-repo-name.git AssetFlow
cd AssetFlow
```

---

### Part 4: Set Up MongoDB Atlas

**⚠️ CRITICAL: Without database, nothing works!**

Follow the MongoDB Atlas setup guide in the main README.md (Part: "MongoDB Atlas Setup").

**Quick Summary:**
1. Create free account at https://mongodb.com/cloud/atlas
2. Create FREE M0 cluster (512 MB)
3. Create database user (save username & password!)
4. Whitelist IP: `0.0.0.0/0` (for testing)
5. Get connection string - looks like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/assetflow?retryWrites=true&w=majority
   ```
6. **SAVE THIS STRING - you'll need it in 2 minutes!**

---

### Part 5: Configure Backend

1. **Open Terminal/Command Prompt in Backend Folder:**

   **Windows:**
   ```cmd
   cd C:\Users\YourName\Desktop\AssetFlow\backend
   ```

   **macOS/Linux:**
   ```bash
   cd ~/Desktop/AssetFlow/backend
   ```

2. **Create Environment File:**

   **Windows:**
   ```cmd
   copy .env.example .env
   notepad .env
   ```

   **macOS:**
   ```bash
   cp .env.example .env
   nano .env
   ```

   **Linux:**
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **Edit .env File:**

   Replace the content with:

   ```env
   # MongoDB Connection (REPLACE WITH YOUR ATLAS CONNECTION STRING!)
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/assetflow?retryWrites=true&w=majority

   # Database Name
   DB_NAME=assetflow

   # JWT Secret (Generate random string or use this)
   JWT_SECRET=AssetFlow2024SecureRandomKey!@#$%^&*()

   # CORS Origins (Frontend URL)
   CORS_ORIGINS=http://localhost:3000

   # Upload Directory
   UPLOAD_DIR=./uploads
   ```

   **⚠️ IMPORTANT:**
   - Replace the ENTIRE `MONGODB_URI` line with YOUR connection string from MongoDB Atlas
   - Make sure there are no spaces around the `=` sign
   - Remove `<password>` and put actual password

4. **Save and Close:**
   - **Notepad:** File → Save, then close
   - **nano:** Ctrl+O (save), Enter, Ctrl+X (exit)

5. **Create Virtual Environment:**

   **Windows:**
   ```cmd
   python -m venv venv
   ```

   **macOS/Linux:**
   ```bash
   python3 -m venv venv
   ```

   **What this does:** Creates isolated Python environment (prevents conflicts)
   **Takes:** 30-60 seconds
   **Creates:** `venv` folder

6. **Activate Virtual Environment:**

   **Windows (Command Prompt):**
   ```cmd
   venv\Scripts\activate
   ```

   **Windows (PowerShell):**
   ```powershell
   venv\Scripts\Activate.ps1
   ```

   **If PowerShell gives error:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   venv\Scripts\Activate.ps1
   ```

   **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

   **Success Check:** You should see `(venv)` at start of command line:
   ```
   (venv) C:\Users\John\Desktop\AssetFlow\backend>
   ```

7. **Install Python Dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

   **OR if "pip" doesn't work:**
   ```bash
   pip3 install -r requirements.txt
   ```

   **What happens:**
   - Downloads and installs ~20 packages
   - Takes 2-5 minutes
   - Shows progress for each package

   **Expected output:**
   ```
   Collecting fastapi==0.110.1
   Downloading fastapi-0.110.1...
   Installing collected packages: typing_extensions, annotated-types...
   Successfully installed fastapi-0.110.1 uvicorn-0.25.0 ...
   ```

8. **Verify Installation:**
   ```bash
   python -c "import fastapi; print('✓ Backend dependencies installed!')"
   ```

   Should show: `✓ Backend dependencies installed!`

---

### Part 6: Configure Frontend

1. **Open NEW Terminal/Command Prompt (keep backend one open!):**

   **Windows:** Press Windows Key, type "cmd", press Enter
   **macOS:** Cmd+Space, type "terminal", press Enter

2. **Navigate to Frontend Folder:**

   **Windows:**
   ```cmd
   cd C:\Users\YourName\Desktop\AssetFlow\frontend
   ```

   **macOS/Linux:**
   ```bash
   cd ~/Desktop/AssetFlow/frontend
   ```

3. **Create Environment File:**

   **Windows:**
   ```cmd
   copy .env.example .env
   notepad .env
   ```

   **macOS/Linux:**
   ```bash
   cp .env.example .env
   nano .env
   ```

4. **Edit .env File:**

   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

   **Keep this EXACTLY as shown above for local development!**

5. **Save and Close**

6. **Install Node Dependencies:**

   ```bash
   npm install
   ```

   **OR using Yarn (if you have it):**
   ```bash
   yarn install
   ```

   **What happens:**
   - Downloads ~1,000 packages
   - Takes 3-10 minutes (depending on internet speed)
   - Creates `node_modules` folder (very large - normal!)

   **Expected output:**
   ```
   npm WARN deprecated ...
   added 1452 packages in 4m
   ```

   **Warnings are NORMAL - you can ignore them**

7. **Verify Installation:**
   ```bash
   npm list react
   ```

   Should show React version without errors

---

### Part 7: Start the Application

#### Terminal 1: Start Backend

1. **Make sure you're in backend folder with venv active:**
   ```
   (venv) .../AssetFlow/backend>
   ```

2. **If venv not active, activate it:**
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. **Start Backend Server:**
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8001
   ```

   **What each part means:**
   - `uvicorn` = Web server
   - `server:app` = Run "app" from "server.py"
   - `--reload` = Auto-restart on code changes
   - `--host 0.0.0.0` = Accept connections from any computer
   - `--port 8001` = Run on port 8001

4. **What You Should See:**
   ```
   INFO:     Will watch for changes in these directories: ['/path/to/backend']
   INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
   INFO:     Started reloader process
   INFO:     Started server process
   INFO:     Waiting for application startup.
   ✓ Connected to MongoDB: assetflow
   Database initialized
   INFO:     Application startup complete.
   ```

   **✅ Key thing to see:** `✓ Connected to MongoDB: assetflow`

   **❌ If you see error:** Check your MONGODB_URI in .env

5. **Test Backend:**
   - Open browser
   - Go to: http://localhost:8001/docs
   - You should see **Swagger API Documentation**
   - ✅ Backend is running!

6. **Keep this terminal open!**

#### Terminal 2: Start Frontend

1. **In your second terminal, navigate to frontend:**
   ```bash
   cd ~/Desktop/AssetFlow/frontend  # macOS/Linux
   cd C:\Users\YourName\Desktop\AssetFlow\frontend  # Windows
   ```

2. **Start Frontend Server:**
   ```bash
   npm start
   ```

   **OR with Yarn:**
   ```bash
   yarn start
   ```

3. **What Happens:**
   - Compiles React application
   - Takes 30-90 seconds first time
   - Opens browser automatically!

4. **What You Should See:**
   ```
   Compiled successfully!

   You can now view frontend in the browser.

     Local:            http://localhost:3000
     On Your Network:  http://192.168.x.x:3000

   Note that the development build is not optimized.
   To create a production build, use npm run build.

   webpack compiled successfully
   ```

5. **Browser Opens:**
   - Automatic redirect to http://localhost:3000
   - You see **AssetFlow Login Page**! 🎉

---

### Part 8: First Login

1. **You should see beautiful login page**

2. **Enter Default Credentials:**
   ```
   Email: admin@local.internal
   Password: Admin123!
   ```

   **⚠️ Note:**
   - Capital "A" in Admin
   - Exclamation mark at the end!
   - Copy-paste to avoid typos

3. **Click "Sign In"**

4. **Success! You're in the Dashboard! 🎊**
   - You'll see 0 assets, 0 employees (brand new system)
   - Navigation menu on left
   - Your name top-right

5. **FIRST THING: Change Password**
   - Click your name (top-right)
   - Click "Change Password"
   - Set new secure password

---

## 🎯 Quick Verification Checklist

After completing setup, verify everything works:

### Backend Checks:
- [ ] Terminal shows "Connected to MongoDB"
- [ ] Terminal shows "Application startup complete"
- [ ] No red error messages
- [ ] http://localhost:8001/docs shows Swagger UI

### Frontend Checks:
- [ ] Terminal shows "Compiled successfully"
- [ ] Browser opens automatically
- [ ] Login page displays correctly
- [ ] Can login with default credentials
- [ ] Dashboard loads with 0/0/0 metrics

### Database Checks:
- [ ] MongoDB Atlas shows "Connected" in cluster
- [ ] Can see "assetflow" database in Compass (if installed)

---

## 🐛 Common Issues & Solutions

### Issue 1: "python: command not found"

**Solution:**
```bash
# Try python3 instead
python3 --version
python3 -m venv venv

# Or create alias (macOS/Linux)
alias python=python3
```

### Issue 2: "Port 8001 already in use"

**Solution:**

**Find what's using the port:**

**Windows:**
```cmd
netstat -ano | findstr :8001
taskkill /PID <number> /F
```

**macOS/Linux:**
```bash
lsof -i :8001
kill -9 <PID>
```

**OR use different port:**
```bash
uvicorn server:app --reload --port 8002
# Then update frontend .env to: REACT_APP_BACKEND_URL=http://localhost:8002
```

### Issue 3: "Port 3000 already in use"

**Solution:**
```bash
# Kill process or use different port
PORT=3001 npm start
```

### Issue 4: "ModuleNotFoundError: No module named 'fastapi'"

**Solution:**
```bash
# Make sure virtual environment is active
# You should see (venv) in terminal

# If not active:
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Then reinstall:
pip install -r requirements.txt
```

### Issue 5: "Cannot find module 'react'"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json  # macOS/Linux
# OR
rmdir /s node_modules  # Windows

npm install
```

### Issue 6: "Database connection error"

**Solutions:**

1. **Check MONGODB_URI in backend/.env**
   - Open .env file
   - Verify connection string is correct
   - No `<password>` - replace with actual password
   - No spaces around `=`

2. **Test connection directly:**
   ```bash
   # If you have mongosh installed
   mongosh "your-connection-string"
   ```

3. **Common mistakes:**
   - Wrong password in connection string
   - IP not whitelisted (add 0.0.0.0/0 in Atlas)
   - Cluster not active (check Atlas dashboard)
   - No internet connection

### Issue 7: "Network Error" when trying to login

**Solution:**

1. **Check backend is running**
   - Terminal 1 should show "Application startup complete"
   - Visit http://localhost:8001/docs

2. **Check CORS settings**
   - backend/.env should have: `CORS_ORIGINS=http://localhost:3000`

3. **Check frontend .env**
   - Should have: `REACT_APP_BACKEND_URL=http://localhost:8001`

4. **Restart both servers**

### Issue 8: npm/yarn is slow or hanging

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try with verbose output
npm install --verbose

# Or switch to yarn
npm install -g yarn
yarn install
```

### Issue 9: Permission denied (macOS/Linux)

**Solution:**
```bash
# Don't use sudo! Instead fix permissions:
sudo chown -R $USER ~/Desktop/AssetFlow

# For npm global packages:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

---

## 🔄 Stopping the Application

**To stop servers:**
1. Go to each terminal
2. Press **Ctrl+C**
3. Wait for graceful shutdown

**To stop completely:**
```bash
# Backend terminal:
Ctrl+C
deactivate  # exits virtual environment

# Frontend terminal:
Ctrl+C
```

---

## 🚀 Starting Application Again (Next Time)

**Quick Start (after initial setup):**

**Terminal 1 - Backend:**
```bash
cd ~/Desktop/AssetFlow/backend
source venv/bin/activate  # macOS/Linux
# OR venv\Scripts\activate  # Windows
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd ~/Desktop/AssetFlow/frontend
npm start
```

**That's it! Much faster second time!**

---

## 📊 System Requirements Summary

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 4 GB | 8 GB |
| **Storage** | 2 GB free | 5 GB free |
| **Internet** | Required | Broadband |
| **OS** | Windows 10, macOS 10.15, Ubuntu 20.04 | Latest versions |

---

## 🎓 Understanding the Stack

**What runs where:**

```
┌─────────────────────────────────────────┐
│  Browser (http://localhost:3000)        │
│  Frontend - React Application           │
│  What you see and click                 │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
┌──────────────▼──────────────────────────┐
│  Backend (http://localhost:8001)        │
│  FastAPI - Python Server                │
│  Business logic, API endpoints          │
└──────────────┬──────────────────────────┘
               │ MongoDB Queries
┌──────────────▼──────────────────────────┐
│  MongoDB Atlas (Cloud)                   │
│  Database - Stores all data             │
│  Assets, Employees, Transfers, Settings │
└─────────────────────────────────────────┘
```

---

## ✅ Success!

If you made it here, you now have:
- ✅ AssetFlow running locally
- ✅ Backend on http://localhost:8001
- ✅ Frontend on http://localhost:3000
- ✅ Connected to MongoDB Atlas
- ✅ Can login and use all features

**Next Steps:**
1. Change default password
2. Configure SMTP (Settings → Integration → SMTP)
3. Add your first employee
4. Add your first asset
5. Start managing your IT assets!

---

## 📞 Getting Help

**If you get stuck:**

1. **Check Logs:**
   - Backend: Look at Terminal 1 output
   - Frontend: Browser console (F12 → Console)

2. **Common Commands:**
   ```bash
   # Check versions
   node --version
   python --version
   pip --version

   # Test imports
   python -c "import fastapi; print('OK')"

   # Check ports
   lsof -i :8001  # macOS/Linux
   netstat -ano | findstr :8001  # Windows
   ```

3. **Database Testing:**
   ```bash
   # Test MongoDB connection
   mongosh "your-connection-string"
   ```

4. **Review README.md** for detailed feature configuration

---

**Built with ❤️ using React, FastAPI, and MongoDB**
