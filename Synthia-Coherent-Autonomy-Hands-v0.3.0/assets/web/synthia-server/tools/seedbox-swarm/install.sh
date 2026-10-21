#!/data/data/com.termux/files/usr/bin/bash
# Synthia Seed Box — Quick Installer
# Run: bash install.sh

echo "🌱 Synthia Seed Box Installer"
echo ""

SEEDBOX_DIR="$HOME/synthia-seedbox"
mkdir -p "$SEEDBOX_DIR"

# Copy files
cp seedbox.sh "$SEEDBOX_DIR/"
cp swarm-coordinator.py "$SEEDBOX_DIR/"
cp README.md "$SEEDBOX_DIR/"

# Create drop directory
mkdir -p "$SEEDBOX_DIR/drop"

# Create rebuild shortcut
cat > "$SEEDBOX_DIR/rebuild.sh" << 'EOF'
#!/bin/bash
python3 "$HOME/synthia-seedbox/swarm-coordinator.py"
EOF
chmod +x "$SEEDBOX_DIR/rebuild.sh"

# Create quick command
cat > "$HOME/.shortcuts/synthia-rebuild" << 'EOF'
#!/bin/bash
termux-toast "Rebuilding Synthia..."
python3 "$HOME/synthia-seedbox/swarm-coordinator.py"
EOF
chmod +x "$HOME/.shortcuts/synthia-rebuild" 2>/dev/null || true

echo "✅ Installed to: $SEEDBOX_DIR"
echo ""
echo "Next steps:"
echo "  1. Drop your Synthia files in: $SEEDBOX_DIR/drop/"
echo "  2. Run: bash $SEEDBOX_DIR/seedbox.sh"
echo "  3. Get your APK"
echo ""
echo "Quick rebuild anytime:"
echo "  bash $SEEDBOX_DIR/rebuild.sh"
