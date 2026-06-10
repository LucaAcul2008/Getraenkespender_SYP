# firmware/main.py
import ujson
import uos
import machine
import time
import socket
import _thread

# --- Pin Setup ---
PUMP_A_PIN = machine.Pin(32, machine.Pin.OUT)
PUMP_B_PIN = machine.Pin(33, machine.Pin.OUT)
BTN_1_PIN  = machine.Pin(25, machine.Pin.IN, machine.Pin.PULL_UP)
BTN_2_PIN  = machine.Pin(26, machine.Pin.IN, machine.Pin.PULL_UP)
BTN_3_PIN  = machine.Pin(27, machine.Pin.IN, machine.Pin.PULL_UP)
LED_1_PIN  = machine.Pin(13, machine.Pin.OUT)
LED_2_PIN  = machine.Pin(16, machine.Pin.OUT)
LED_3_PIN  = machine.Pin(17, machine.Pin.OUT)

PUMP_A_PIN.value(0)
PUMP_B_PIN.value(0)
LED_1_PIN.value(0)
LED_2_PIN.value(0)
LED_3_PIN.value(0)

CONFIG_FILE = 'config.json'
is_busy      = False
emergency_stop = False
CONFIG_RELOAD_INTERVAL = 200

LEDS = [LED_1_PIN, LED_2_PIN, LED_3_PIN]

# --- Config Helpers ---
def load_config():
    try:
        with open(CONFIG_FILE, 'r') as f:
            return ujson.load(f)
    except:
        return {
            "recipes": [
                {"id": 1, "name": "Rezept 1", "pumpA": 5.0, "pumpB": 2.0},
                {"id": 2, "name": "Rezept 2", "pumpA": 3.0, "pumpB": 3.0},
                {"id": 3, "name": "Wasser",   "pumpA": 0.0, "pumpB": 5.0}
            ],
            "slotMachineChance": 10,
            "calibrationFactor": 5.0,
            "bottleA_ml": 1500,
            "bottleB_ml": 1500,
            "remainingA_ml": 1500,
            "remainingB_ml": 1500
        }

def save_config(cfg):
    with open(CONFIG_FILE, 'w') as f:
        ujson.dump(cfg, f)

def deduct_volume(pump_a_sec, pump_b_sec):
    cfg = load_config()
    cal = cfg.get('calibrationFactor', 5.0)
    ml_per_sec = 100.0 / cal if cal > 0 else 0
    cfg['remainingA_ml'] = max(0, cfg.get('remainingA_ml', 0) - pump_a_sec * ml_per_sec)
    cfg['remainingB_ml'] = max(0, cfg.get('remainingB_ml', 0) - pump_b_sec * ml_per_sec)
    save_config(cfg)
    return cfg['remainingA_ml'], cfg['remainingB_ml']

def is_bottle_empty(pump_a_sec, pump_b_sec):
    cfg = load_config()
    cal = cfg.get('calibrationFactor', 5.0)
    ml_per_sec = 100.0 / cal if cal > 0 else 0
    needed_a = pump_a_sec * ml_per_sec
    needed_b = pump_b_sec * ml_per_sec
    rem_a = cfg.get('remainingA_ml', 0)
    rem_b = cfg.get('remainingB_ml', 0)
    
    if pump_a_sec > 0 and rem_a < needed_a: return True, 'A'
    if pump_b_sec > 0 and rem_b < needed_b: return True, 'B'
    return False, None

# --- LED Helpers ---
def set_leds(a, b, c):
    LED_1_PIN.value(a)
    LED_2_PIN.value(b)
    LED_3_PIN.value(c)

def all_leds_off():
    set_leds(0, 0, 0)

def blink_all_leds_async(stop_flag):
    while not stop_flag[0]:
        set_leds(1, 1, 1)
        time.sleep(0.4)
        all_leds_off()
        time.sleep(0.4)
    all_leds_off()

# --- Pump Control ---
def emergency_stop_all():
    global is_busy, emergency_stop
    PUMP_A_PIN.value(0)
    PUMP_B_PIN.value(0)
    emergency_stop = True
    is_busy = False
    for _ in range(5):
        set_leds(1, 1, 1)
        time.sleep(0.1)
        all_leds_off()
        time.sleep(0.1)

def run_recipe(pump_a_sec, pump_b_sec, active_btn_led=None):
    global is_busy, emergency_stop
    if is_busy: return
    
    empty, _ = is_bottle_empty(pump_a_sec, pump_b_sec)
    if empty:
        stop_flag = [False]
        _thread.start_new_thread(blink_all_leds_async, (stop_flag,))
        time.sleep(5)
        stop_flag[0] = True
        return

    is_busy = True
    emergency_stop = False
    led_stop = [False]

    if active_btn_led is not None:
        def blink_active():
            while not led_stop[0]:
                active_btn_led.value(1)
                time.sleep(0.3)
                active_btn_led.value(0)
                time.sleep(0.3)
            active_btn_led.value(0)
        _thread.start_new_thread(blink_active, ())

    try:
        start = time.ticks_ms()
        if pump_a_sec > 0: PUMP_A_PIN.value(1)
        if pump_b_sec > 0: PUMP_B_PIN.value(1)

        a_done = pump_a_sec <= 0
        b_done = pump_b_sec <= 0

        while not (a_done and b_done):
            if emergency_stop: break
            elapsed = time.ticks_diff(time.ticks_ms(), start) / 1000.0
            if not a_done and elapsed >= pump_a_sec:
                PUMP_A_PIN.value(0)
                a_done = True
            if not b_done and elapsed >= pump_b_sec:
                PUMP_B_PIN.value(0)
                b_done = True
            time.sleep(0.05)

        led_stop[0] = True
        if not emergency_stop:
            deduct_volume(pump_a_sec, pump_b_sec)
            if active_btn_led is not None:
                active_btn_led.value(1)
                time.sleep(0.5)
                active_btn_led.value(0)
    finally:
        PUMP_A_PIN.value(0)
        PUMP_B_PIN.value(0)
        led_stop[0] = True
        is_busy = False

def run_recipe_async(pump_a_sec, pump_b_sec, active_btn_led=None):
    _thread.start_new_thread(run_recipe, (pump_a_sec, pump_b_sec, active_btn_led))

def run_flush():
    global is_busy, emergency_stop
    if is_busy: return
    is_busy = True
    emergency_stop = False
    try:
        start = time.ticks_ms()
        PUMP_A_PIN.value(1)
        PUMP_B_PIN.value(1)
        while time.ticks_diff(time.ticks_ms(), start) < 15000:
            if emergency_stop: break
            set_leds(1, 1, 1)
            time.sleep(0.3)
            all_leds_off()
            time.sleep(0.3)
    finally:
        PUMP_A_PIN.value(0)
        PUMP_B_PIN.value(0)
        all_leds_off()
        is_busy = False

# --- HTTP Server & Routing ---
CORS_HEADERS = 'Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n'

def send_json(conn, data, status=200):
    body = ujson.dumps(data)
    conn.send('HTTP/1.1 {} OK\r\nContent-Type: application/json\r\n{}\r\nContent-Length: {}\r\n\r\n{}'.format(
        status, CORS_HEADERS, len(body), body).encode())

def send_options(conn):
    conn.send('HTTP/1.1 204 No Content\r\n{}\r\n'.format(CORS_HEADERS).encode())

def read_body(request_text):
    try:
        parts = request_text.split('\r\n\r\n', 1)
        if len(parts) > 1: return parts[1].strip()
    except: pass
    return ''

def serve_file(conn, path):
    try:
        size = uos.stat(path)[6]
        ext = path.split('.')[-1]
        mime = {'html': 'text/html', 'js': 'application/javascript', 'css': 'text/css',
                'json': 'application/json', 'svg': 'image/svg+xml', 'ico': 'image/x-icon'}.get(ext, 'application/octet-stream')
        conn.send('HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\n\r\n'.format(mime, size).encode())
        with open(path, 'rb') as f:
            while True:
                chunk = f.read(1024)
                if not chunk:
                    break
                conn.send(chunk)
    except OSError:
        conn.send(b'HTTP/1.1 404 Not Found\r\n\r\n404 Not Found')

def handle_request(conn):
    global is_busy, emergency_stop
    try:
        request = conn.recv(8192).decode('utf-8', 'ignore')
        lines = request.split('\r\n')
        if not lines or len(lines[0]) < 3: return
        
        method, path_full, *_ = lines[0].split(' ') + ['', '']
        path = path_full.split('?')[0]

        if method == 'OPTIONS':
            send_options(conn)
            return

        if path == '/api/status':
            cfg = load_config()
            send_json(conn, {
                'status': 'busy' if is_busy else 'ready',
                'remainingA_ml': cfg.get('remainingA_ml', 0),
                'remainingB_ml': cfg.get('remainingB_ml', 0),
                'bottleA_ml': cfg.get('bottleA_ml', 1500),
                'bottleB_ml': cfg.get('bottleB_ml', 1500)
            })

        elif path == '/api/config':
            if method == 'GET':
                send_json(conn, load_config())
            elif method == 'POST':
                body = read_body(request)
                try:
                    new_cfg = ujson.loads(body)
                    save_config(new_cfg)
                    send_json(conn, {'ok': True})
                except Exception as e:
                    send_json(conn, {'error': str(e)}, 400)

        elif path == '/api/refill':
            if method == 'POST':
                body = read_body(request)
                try:
                    data = ujson.loads(body)
                    cfg = load_config()
                    pump = data.get('pump', 'both')
                    if pump in ('A', 'both'): cfg['remainingA_ml'] = cfg.get('bottleA_ml', 1500)
                    if pump in ('B', 'both'): cfg['remainingB_ml'] = cfg.get('bottleB_ml', 1500)
                    save_config(cfg)
                    send_json(conn, {'ok': True, 'remainingA_ml': cfg['remainingA_ml'], 'remainingB_ml': cfg['remainingB_ml']})
                except Exception as e:
                    send_json(conn, {'error': str(e)}, 400)

        elif path == '/api/action':
            if method == 'POST':
                body = read_body(request)
                try:
                    data = ujson.loads(body)
                    cmd = data.get('command', '')
                except: cmd = ''

                if cmd == 'emergency_stop':
                    emergency_stop_all()
                    send_json(conn, {'ok': True})
                elif cmd == 'start_pump_A':
                    PUMP_A_PIN.value(1)
                    send_json(conn, {'ok': True})
                elif cmd == 'stop_pump_A':
                    PUMP_A_PIN.value(0)
                    send_json(conn, {'ok': True})
                elif cmd == 'start_pump_B':
                    PUMP_B_PIN.value(1)
                    send_json(conn, {'ok': True})
                elif cmd == 'stop_pump_B':
                    PUMP_B_PIN.value(0)
                    send_json(conn, {'ok': True})
                elif cmd == 'flush_all':
                    if not is_busy:
                        _thread.start_new_thread(run_flush, ())
                        send_json(conn, {'ok': True})
                    else:
                        send_json(conn, {'error': 'busy'}, 409)
                elif cmd.startswith('recipe_'):
                    try:
                        recipe_id = int(cmd.split('_')[1])
                        cfg = load_config()
                        recipe = next((r for r in cfg['recipes'] if r['id'] == recipe_id), None)
                        led = LEDS[recipe_id - 1] if 1 <= recipe_id <= 3 else None
                        if recipe and not is_busy:
                            run_recipe_async(recipe['pumpA'], recipe['pumpB'], led)
                            send_json(conn, {'ok': True})
                        elif is_busy:
                            send_json(conn, {'error': 'busy'}, 409)
                        else:
                            send_json(conn, {'error': 'recipe not found'}, 404)
                    except Exception as e:
                        send_json(conn, {'error': str(e)}, 400)
                else:
                    send_json(conn, {'error': 'unknown command'}, 400)

        elif path == '/' or path == '/index.html':
            serve_file(conn, '/www/index.html')
        else:
            serve_file(conn, '/www' + path)

    except Exception as e:
        print('Request error:', e)
    finally:
        conn.close()

def start_server():
    addr = socket.getaddrinfo('0.0.0.0', 80)[0][-1]
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(addr)
    s.listen(5)
    print('HTTP server running on port 80')
    while True:
        try:
            conn, addr = s.accept()
            handle_request(conn)
        except Exception as e:
            print('Server error:', e)

# --- Physical Button Polling ---
def poll_buttons():
    global is_busy, emergency_stop
    last_states   = [1, 1, 1]
    press_times   = [0, 0, 0]  
    btn1_tap_times = []        
    buttons = [BTN_1_PIN, BTN_2_PIN, BTN_3_PIN]
    leds    = [LED_1_PIN, LED_2_PIN, LED_3_PIN]
    cfg = load_config()
    cfg_reload_counter = 0

    while True:
        cfg_reload_counter += 1
        if cfg_reload_counter > CONFIG_RELOAD_INTERVAL:
            cfg = load_config()
            cfg_reload_counter = 0

        now = time.ticks_ms()
        states = [btn.value() for btn in buttons]

        # 3 Knöpfe gleichzeitig (Spülung - 5 Sek)
        if states[0] == 0 and states[1] == 0 and states[2] == 0:
            if press_times[2] == 0: press_times[2] = now
            elif time.ticks_diff(now, press_times[2]) >= 5000:
                print('Spuelung!')
                if not is_busy: _thread.start_new_thread(run_flush, ())
                press_times[2] = 0
                time.sleep(1) # Entprellen nach Aktion
        # 2 Knöpfe gleichzeitig (Not-Aus - 2 Sek)
        elif (states[0] == 0 and states[1] == 0) or (states[1] == 0 and states[2] == 0) or (states[0] == 0 and states[2] == 0):
            press_times[2] = 0 # Reset 3-Knopf counter
            if press_times[0] == 0: press_times[0] = now
            elif time.ticks_diff(now, press_times[0]) >= 2000:
                print('NOT-AUS!')
                emergency_stop_all()
                press_times[0] = 0
                time.sleep(1)
        else:
            press_times[0] = 0
            press_times[2] = 0

            # Einzelne Knöpfe prüfen
            for i, _ in enumerate(buttons):
                state = states[i]
                if state == 0 and last_states[i] == 1: 
                    print('Button {} pressed'.format(i + 1))

                    if i == 0:
                        btn1_tap_times.append(now)
                        btn1_tap_times = [t for t in btn1_tap_times if time.ticks_diff(now, t) < 2000]
                        if len(btn1_tap_times) >= 3:
                            print('Refill bestätigt!')
                            cfg['remainingA_ml'] = cfg.get('bottleA_ml', 1500)
                            cfg['remainingB_ml'] = cfg.get('bottleB_ml', 1500)
                            save_config(cfg)
                            btn1_tap_times = []
                            set_leds(1, 1, 1)
                            time.sleep(0.5)
                            all_leds_off()

                    # Nur Starten, wenn wirklich NUR DIESER EINE Knopf gedrückt ist
                    if not is_busy and states[(i+1) % 3] == 1 and states[(i+2) % 3] == 1:
                        recipe = next((r for r in cfg['recipes'] if r['id'] == i + 1), None)
                        if recipe:
                            run_recipe_async(recipe['pumpA'], recipe['pumpB'], leds[i])

                last_states[i] = state

        time.sleep(0.05)

_thread.start_new_thread(start_server, ())
poll_buttons()