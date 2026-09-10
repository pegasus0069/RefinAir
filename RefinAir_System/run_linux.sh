#!/usr/bin/env bash
# ==============================================================================
# RefinAir: Atmospheric & Indoor Environmental Intelligence System
# Zero-Configuration Standalone Launcher for Linux
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================================================"
echo "RefinAir: Atmospheric & Indoor Environmental Intelligence System"
echo "Independent University, Bangladesh (IUB) Research Platform"
echo "Starting on Linux..."
echo "======================================================================"

# If Wine is installed and user wants to run the Windows binary directly
if [ "$1" == "--wine" ] && command -v wine &> /dev/null; then
    echo "Launching via Wine compatibility layer..."
    exec wine "$SCRIPT_DIR/RefinAir.exe"
fi

# Detect Python 3 on Linux (standard on all major Linux distributions)
PYTHON_CMD=""
for cmd in python3 python; do
    if command -v "$cmd" &> /dev/null; then
        PY_VER=$("$cmd" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)
        MAJOR=$(echo "$PY_VER" | cut -d. -f1)
        MINOR=$(echo "$PY_VER" | cut -d. -f2)
        if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 8 ]; then
            PYTHON_CMD="$cmd"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "ERROR: Python 3.8+ was not found on this Linux machine."
    echo "Please ensure Python 3 is installed: sudo apt update && sudo apt install -y python3 python3-venv"
    exit 1
fi

VENV_DIR="$SCRIPT_DIR/.venv_linux"

# Automatically create isolated local virtual environment on first launch
if [ ! -d "$VENV_DIR" ]; then
    echo "First-time launch on this Linux PC: preparing isolated runtime..."
    "$PYTHON_CMD" -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install --upgrade pip --quiet
    echo "Configuring application dependencies..."
    "$VENV_DIR/bin/pip" install -r "$SCRIPT_DIR/requirements.txt" --quiet
    echo "Setup completed successfully."
fi

# Launch the server
echo "Starting RefinAir Server..."
echo "Open in your browser at: http://127.0.0.1:5000"
echo "To stop the server, press Ctrl+C."
echo "======================================================================"

exec "$VENV_DIR/bin/python" "$SCRIPT_DIR/app.py"
