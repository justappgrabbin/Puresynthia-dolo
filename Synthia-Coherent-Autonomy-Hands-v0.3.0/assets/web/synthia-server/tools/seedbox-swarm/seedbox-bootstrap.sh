#!/data/data/com.termux/files/usr/bin/bash
# ═══════════════════════════════════════════════════════════════
#  SYNTHIA SEED BOX — ONE-COMMAND BOOTSTRAP
#  "Drop it. Press go. It finishes."
# ═══════════════════════════════════════════════════════════════
#  Run this in Termux:
#    curl -sL <url> | bash
#  Or save and run:
#    bash seedbox-bootstrap.sh
# ═══════════════════════════════════════════════════════════════

set -e

SEEDBOX_DIR="$HOME/synthia-seedbox"
mkdir -p "$SEEDBOX_DIR"

echo ""
echo "  🌱 SYNTHIA SEED BOX SWARM"
echo "  Drop files. Press go. It finishes."
echo ""

# ─── Step 1: Ensure Python ───
echo "[1/4] Ensuring Python..."
if ! command -v python3 &> /dev/null; then
    pkg install -y python 2>/dev/null || apt install -y python3
fi
python3 --version

# ─── Step 2: Download Swarm Coordinator ───
echo ""
echo "[2/4] Downloading Swarm Coordinator..."
COORDINATOR_URL="https://raw.githubusercontent.com/synthia-os/seedbox/main/swarm-coordinator.py"
COORDINATOR_LOCAL="$SEEDBOX_DIR/swarm-coordinator.py"

# Try to download, fallback to local if available
if curl -sL "$COORDINATOR_URL" -o "$COORDINATOR_LOCAL" 2>/dev/null; then
    echo "  ✓ Downloaded from remote"
elif wget -q "$COORDINATOR_URL" -O "$COORDINATOR_LOCAL" 2>/dev/null; then
    echo "  ✓ Downloaded from remote"
else
    echo "  ⚠ Remote download failed. Looking for local copy..."
    # Check if coordinator exists in current directory
    if [ -f "swarm-coordinator.py" ]; then
        cp "swarm-coordinator.py" "$COORDINATOR_LOCAL"
        echo "  ✓ Using local copy"
    else
        echo "  ✗ No coordinator found!"
        echo ""
        echo "  Please download swarm-coordinator.py to this directory"
        echo "  and run this script again."
        exit 1
    fi
fi

# ─── Step 3: Create Drop Directory ───
echo ""
echo "[3/4] Setting up drop box..."
mkdir -p "$SEEDBOX_DIR/drop"
echo "  📁 Drop your Synthia files here:"
echo "     $SEEDBOX_DIR/drop/"
echo ""

# ─── Step 4: Run the Swarm ───
echo "[4/4] Launching Swarm Coordinator..."
echo ""
python3 "$COORDINATOR_LOCAL"
