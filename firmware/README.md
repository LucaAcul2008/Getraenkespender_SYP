# Firmware — MicroPython ESP32

## Flash Instructions

1. Install MicroPython on your ESP32 (v1.21+ recommended)
2. Install `mpremote` or use Thonny IDE
3. Upload all files:

```bash
mpremote cp boot.py :boot.py
mpremote cp main.py :main.py
mpremote cp config.json :config.json
```

4. Build the frontend:
```bash
cd frontend/getraenkespender
npm install
npm run build
```
This produces `frontend/getraenkespender/www/`.

5. Upload the built frontend:
```bash
mpremote mkdir :www
mpremote cp -r frontend/getraenkespender/www/ :www/
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
- **SSID:** `GetraenkespenderAP`
- **Password:** `12345678`
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
