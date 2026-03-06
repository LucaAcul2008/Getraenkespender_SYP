#!/bin/bash
# flash.sh — Builds the frontend and uploads all firmware files to the ESP32.
#
# Prerequisites:
#   - Node.js + npm installed  (https://nodejs.org)
#   - mpremote installed       (pip install mpremote)
#   - ESP32 connected via USB
#
# Usage:
#   chmod +x flash.sh
#   ./flash.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend/getraenkespender"
FIRMWARE_DIR="$SCRIPT_DIR/firmware"
WWW_DIR="$FRONTEND_DIR/www"

echo "==================================================="
echo "  Getraenkespender — Flash Script"
echo "==================================================="

# --- 1. Build the frontend ---
echo ""
echo "[1/4] Building React frontend..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build
echo "      ✅ Frontend built → $WWW_DIR"

# --- 2. Upload firmware files ---
echo ""
echo "[2/4] Uploading firmware to ESP32..."
cd "$SCRIPT_DIR"
mpremote cp "$FIRMWARE_DIR/boot.py"   :boot.py
mpremote cp "$FIRMWARE_DIR/main.py"   :main.py
mpremote cp "$FIRMWARE_DIR/config.json" :config.json
echo "      ✅ boot.py, main.py, config.json uploaded"

# --- 3. Create /www directory on ESP32 ---
echo ""
echo "[3/4] Creating /www directory on ESP32..."
mpremote mkdir :www 2>/dev/null || true

# Upload every file inside the www/ build output, preserving sub-directories.
find "$WWW_DIR" -type d | while read -r dir; do
    remote_dir=":www${dir#$WWW_DIR}"
    if [ "$remote_dir" != ":www" ]; then
        mpremote mkdir "$remote_dir" 2>/dev/null || true
    fi
done

find "$WWW_DIR" -type f | while read -r file; do
    remote_path=":www${file#$WWW_DIR}"
    mpremote cp "$file" "$remote_path"
done
echo "      ✅ Frontend files uploaded to /www"

# --- 4. Restart the ESP32 ---
echo ""
echo "[4/4] Restarting ESP32..."
mpremote reset
echo "      ✅ ESP32 restarted"

echo ""
echo "==================================================="
echo "  ✅ Done! Connect to WiFi:"
echo "     SSID    : GetraenkeBot_3000"
echo "     Password: party1234"
echo "     Open    : http://192.168.4.1"
echo "==================================================="
