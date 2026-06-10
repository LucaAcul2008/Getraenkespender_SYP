import os, re, sys
sys.stdout.reconfigure(encoding="utf-8")

WWW = os.path.join("dist", "www")
html_path = os.path.join(WWW, "index.html")

if not os.path.exists(html_path):
    print("ERROR: dist/www/index.html not found. Run 'npm run build' first.")
    sys.exit(1)

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Remove vite favicon (not uploaded to ESP32)
html = re.sub(r'<link[^>]*vite\.svg[^>]*>\s*', '', html)
# Remove modulepreload hints (not needed for classic serving)
html = re.sub(r'<link[^>]*modulepreload[^>]*>\s*', '', html)
# Downgrade module scripts to classic scripts, keep defer so DOM is ready first
html = re.sub(r'<script\s+type="module"\s+crossorigin\s+', '<script defer ', html)
# Remove leftover crossorigin attributes
html = re.sub(r'\s+crossorigin(?:="[^"]*")?', '', html)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)
print("HTML: index.html gepatcht")

files = [(fname, os.path.getsize(os.path.join(WWW, fname))) for fname in os.listdir(WWW)]
for fname, size in files:
    print("  -> /www/" + fname + "  (" + str(size // 1024) + " KB)")

bat_lines = [
    "@echo off",
    "chcp 65001 > nul",
    "echo Starte Upload auf ESP32...",
    "mpremote fs mkdir www 2>nul || echo www existiert bereits",
]
for fname, _ in files:
    bat_lines.append("echo Upload: " + fname)
    bat_lines.append("mpremote cp dist/www/" + fname + " :/www/" + fname)
bat_lines += [
    "echo Upload main.py",
    "mpremote cp ..\\..\\firmware\\main.py :main.py",
    "echo Fertig! ESP32 wird neu gestartet...",
    "mpremote reset",
]

with open("upload.bat", "w", encoding="utf-8") as f:
    f.write("\n".join(bat_lines) + "\n")
print("upload.bat geschrieben")

sh_lines = [
    "#!/bin/sh",
    "echo 'Starte Upload auf ESP32...'",
    "mpremote fs mkdir www 2>/dev/null || true",
]
for fname, _ in files:
    sh_lines.append("echo 'Upload: " + fname + "'")
    sh_lines.append("mpremote cp dist/www/" + fname + " :/www/" + fname)
sh_lines += [
    "echo 'Upload main.py'",
    "mpremote cp ../../firmware/main.py :main.py",
    "echo 'Fertig! ESP32 wird neu gestartet...'",
    "mpremote reset",
]

with open("upload.sh", "w", encoding="utf-8") as f:
    f.write("\n".join(sh_lines) + "\n")
print("upload.sh geschrieben")
print("\nJetzt ausfuehren: upload.bat  (oder upload.sh auf Linux/Mac)")
