#!/bin/bash

# ===== SAFE ROOT DETECTION (Finder + Terminal Safe) =====
SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

LOG_FILE="$PROJECT_ROOT/assetflow_install.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "===== AssetFlow Smart Installer ====="

BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    echo "Backend or Frontend folder missing."
    echo "Make sure install.command is inside project root."
    exit 1
fi

# ===== HOMEBREW CHECK =====
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# ===== PYTHON 3.11 DETECTION =====
PYTHON_BIN=""

if command -v python3.11 &> /dev/null; then
    PYTHON_BIN=$(command -v python3.11)
elif [ -f "/opt/homebrew/opt/python@3.11/bin/python3.11" ]; then
    PYTHON_BIN="/opt/homebrew/opt/python@3.11/bin/python3.11"
elif [ -f "/usr/local/opt/python@3.11/bin/python3.11" ]; then
    PYTHON_BIN="/usr/local/opt/python@3.11/bin/python3.11"
else
    echo "Installing Python 3.11..."
    brew install python@3.11
    if [ -f "/opt/homebrew/opt/python@3.11/bin/python3.11" ]; then
        PYTHON_BIN="/opt/homebrew/opt/python@3.11/bin/python3.11"
    else
        PYTHON_BIN="/usr/local/opt/python@3.11/bin/python3.11"
    fi
fi

if [ ! -f "$PYTHON_BIN" ]; then
    echo "Python 3.11 not found. Exiting."
    exit 1
fi

echo "Using Python:"
$PYTHON_BIN --version

# ===== NODE CHECK =====
if ! command -v node &> /dev/null; then
    echo "Installing Node..."
    brew install node
fi

echo "Node version:"
node -v
npm -v

# ===== BACKEND SETUP =====
echo "Setting up backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    $PYTHON_BIN -m venv venv
fi

source venv/bin/activate

if ! python -c "import fastapi" &>/dev/null; then
    pip install -r requirements.txt --upgrade-strategy only-if-needed
else
    echo "Backend dependencies already installed."
fi

# ===== MONGODB INPUT LOOP =====
echo ""
echo "Enter MongoDB URI:"
echo "Example:"
echo "mongodb+srv://username:password@cluster.mongodb.net/assetflow?retryWrites=true&w=majority"
echo ""

while true; do
    read -p "MONGODB_URI: " USER_MONGO_URI

    if [[ ! "$USER_MONGO_URI" =~ ^mongodb\+srv:// ]]; then
        echo "Invalid format."
        continue
    fi

    export MONGO_TEST_URI="$USER_MONGO_URI"

    python - <<EOF
import os
from pymongo import MongoClient
try:
    client = MongoClient(os.environ["MONGO_TEST_URI"], serverSelectionTimeoutMS=5000)
    client.server_info()
except Exception:
    exit(1)
EOF

    if [ $? -eq 0 ]; then
        echo "MongoDB connection successful."
        break
    else
        echo "Connection failed. Try again."
    fi
done

cat > .env <<EOL
MONGODB_URI=$USER_MONGO_URI
DB_NAME=assetflow
JWT_SECRET=$(openssl rand -hex 16)
CORS_ORIGINS=http://localhost:3000
UPLOAD_DIR=./uploads
EOL

mkdir -p uploads

# ===== FRONTEND SETUP =====
echo "Setting up frontend..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Frontend dependencies already installed."
fi

cat > .env <<EOL
REACT_APP_BACKEND_URL=http://localhost:8001
EOL

cd "$PROJECT_ROOT"

# ===== CREATE START SCRIPT =====
echo "Creating start.command..."

cat > start.command <<'STARTSCRIPT'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "Starting AssetFlow..."

cd "$BACKEND_DIR" || exit 1
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 &

sleep 3

cd "$FRONTEND_DIR" || exit 1
npm start
STARTSCRIPT

chmod +x start.command

echo "Installation complete."
echo "Launching application..."

"$PROJECT_ROOT/start.command"
