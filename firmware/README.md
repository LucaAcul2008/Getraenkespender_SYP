# Firmware — MicroPython ESP32

## Flash Instructions

### Prerequisites

| Tool | How to install |
|---|---|
| MicroPython on ESP32 | [https://micropython.org/download/ESP32_GENERIC/](https://micropython.org/download/ESP32_GENERIC/) (v1.21+ recommended) |
| Node.js + npm | [https://nodejs.org](https://nodejs.org) |
| mpremote | `pip install mpremote` |

### Quick start — automated script (recommended)

Connect the ESP32 via USB, then run from the **repository root**:

```bash
chmod +x flash.sh
./flash.sh
```

This single command will:
1. Build the React frontend (`npm install` + `npm run build`)
2. Upload `boot.py`, `main.py`, `config.json` to the ESP32
3. Create the `/www` directory on the ESP32 and upload the built frontend
4. Restart the ESP32

After flashing, connect to the WiFi hotspot and open the app (see [WiFi](#wifi) below).

### Manual steps (alternative)

1. Build the frontend:
```bash
cd frontend/getraenkespender
npm install
npm run build
```
This produces `frontend/getraenkespender/www/`.

2. Upload firmware files (from the repository root):
```bash
mpremote cp firmware/boot.py   :boot.py
mpremote cp firmware/main.py   :main.py
mpremote cp firmware/config.json :config.json
```

3. Upload the built frontend:
```bash
mpremote mkdir :www
# Upload all files from the www/ build output
find frontend/getraenkespender/www -type f | while read f; do
    remote=":www${f#frontend/getraenkespender/www}"
    mpremote cp "$f" "$remote"
done
```

4. Restart the ESP32:
```bash
mpremote reset
```

## GPIO Pin Assignment

| Function | GPIO |
|---|---|
| Pump A | 16 |
| Pump B | 17 |
| Button 1 (Recipe 1) | 4 |
| Button 2 (Recipe 2) | 5 |
| Button 3 (Recipe 3) | 6 |

## WiFi

- **Mode:** Access Point
- **SSID:** `GetraenkeBot_3000`
- **Password:** `party1234`
- **ESP32 IP:** `192.168.4.1`
- **App URL:** `http://192.168.4.1`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/status | Returns `{"status": "ready"}` or `{"status": "busy"}` |
| GET | /api/config | Returns full config JSON |
| POST | /api/config | Save new config JSON |
| POST | /api/action | Trigger an action (see below) |

### Actions (`POST /api/action` with `{"command": "..."}`)

| Command | Effect |
|---|---|
| `start_pump_A` | Pump A ON (manual) |
| `stop_pump_A` | Pump A OFF |
| `start_pump_B` | Pump B ON (manual) |
| `stop_pump_B` | Pump B OFF |
| `flush_all` | Both pumps 15s each |
| `recipe_1` | Run Recipe 1 |
| `recipe_2` | Run Recipe 2 |
| `recipe_3` | Run Recipe 3 |
