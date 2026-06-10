@echo off
chcp 65001 > nul
echo Starte Upload auf ESP32...
mpremote fs mkdir www 2>nul || echo www existiert bereits
echo Upload: app.css
mpremote cp dist/www/app.css :/www/app.css
echo Upload: app.js
mpremote cp dist/www/app.js :/www/app.js
echo Upload: index.html
mpremote cp dist/www/index.html :/www/index.html
echo Upload main.py
mpremote cp ..\..\firmware\main.py :main.py
echo Fertig! ESP32 wird neu gestartet...
mpremote reset
