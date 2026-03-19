# firmware/main.py
import ujson
import uos
import machine
import time
import network
import socket
import _thread

# --- Pin Setup ---
PUMP_A_PIN = machine.Pin(16, machine.Pin.OUT)
PUMP_B_PIN = machine.Pin(17, machine.Pin.OUT)
BTN_1_PIN = machine.Pin(13, machine.Pin.IN, machine.Pin.PULL_UP)
BTN_2_PIN = machine.Pin(14, machine.Pin.IN, machine.Pin.PULL_UP)
BTN_3_PIN = machine.Pin(15, machine.Pin.IN, machine.Pin.PULL_UP)

PUMP_A_PIN.value(0)
PUMP_B_PIN.value(0)

CONFIG_FILE = 'config.json'
is_busy = False
CONFIG_RELOAD_INTERVAL = 200  # Reload config every ~10 seconds (200 * 50ms)

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
            "calibrationFactor": 5.0
        }

def save_config(cfg):
    with open(CONFIG_FILE, 'w') as f:
        ujson.dump(cfg, f)

# --- Pump Control ---
def run_recipe(pump_a_sec, pump_b_sec):
    global is_busy
    if is_busy:
        return
    is_busy = True
    try:
        if pump_a_sec > 0:
            PUMP_A_PIN.value(1)
            time.sleep(pump_a_sec)
            PUMP_A_PIN.value(0)
        if pump_b_sec > 0:
            PUMP_B_PIN.value(1)
            time.sleep(pump_b_sec)
            PUMP_B_PIN.value(0)
    finally:
        PUMP_A_PIN.value(0)
        PUMP_B_PIN.value(0)
        is_busy = False

def run_recipe_async(pump_a_sec, pump_b_sec):
    _thread.start_new_thread(run_recipe, (pump_a_sec, pump_b_sec))

# --- HTTP Helpers ---
CORS_HEADERS = 'Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n'

def send_json(conn, data, status=200):
    body = ujson.dumps(data)
    conn.send('HTTP/1.1 {} OK\r\nContent-Type: application/json\r\n{}\r\nContent-Length: {}\r\n\r\n{}'.format(
        status, CORS_HEADERS, len(body), body))

def send_options(conn):
    conn.send('HTTP/1.1 204 No Content\r\n{}\r\n'.format(CORS_HEADERS))

def read_body(request_text):
    try:
        parts = request_text.split('\r\n\r\n', 1)
        if len(parts) > 1:
            return parts[1].strip()
    except:
        pass
    return ''

def serve_file(conn, path):
    try:
        with open(path, 'rb') as f:
            content = f.read()
        ext = path.split('.')[-1]
        mime = {'html': 'text/html', 'js': 'application/javascript', 'css': 'text/css',
                'json': 'application/json', 'svg': 'image/svg+xml', 'ico': 'image/x-icon'}.get(ext, 'application/octet-stream')
        conn.send('HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\n\r\n'.format(mime, len(content)).encode())
        conn.send(content)
    except:
        conn.send(b'HTTP/1.1 404 Not Found\r\n\r\n404 Not Found')

# --- HTTP Server ---
def handle_request(conn):
    global is_busy
    try:
        request = conn.recv(8192).decode('utf-8', 'ignore')
        lines = request.split('\r\n')
        if not lines:
            return
        method, path_full, *_ = lines[0].split(' ') + ['', '']
        path = path_full.split('?')[0]

        if method == 'OPTIONS':
            send_options(conn)
            return

        # --- API Routes ---
        if path == '/api/status':
            send_json(conn, {'status': 'busy' if is_busy else 'ready'})

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

        elif path == '/api/action':
            if method == 'POST':
                body = read_body(request)
                try:
                    data = ujson.loads(body)
                    cmd = data.get('command', '')
                except:
                    cmd = ''

                if cmd == 'start_pump_A':
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
                        run_recipe_async(15.0, 15.0)
                        send_json(conn, {'ok': True})
                    else:
                        send_json(conn, {'error': 'busy'}, 409)
                elif cmd.startswith('recipe_'):
                    try:
                        recipe_id = int(cmd.split('_')[1])
                        cfg = load_config()
                        recipe = next((r for r in cfg['recipes'] if r['id'] == recipe_id), None)
                        if recipe and not is_busy:
                            run_recipe_async(recipe['pumpA'], recipe['pumpB'])
                            send_json(conn, {'ok': True})
                        elif is_busy:
                            send_json(conn, {'error': 'busy'}, 409)
                        else:
                            send_json(conn, {'error': 'recipe not found'}, 404)
                    except Exception as e:
                        send_json(conn, {'error': str(e)}, 400)
                else:
                    send_json(conn, {'error': 'unknown command'}, 400)

        # --- Static File Serving ---
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

# --- Physical Button Polling (runs on main thread) ---
def poll_buttons():
    last_states = [1, 1, 1]
    buttons = [BTN_1_PIN, BTN_2_PIN, BTN_3_PIN]
    cfg = load_config()
    cfg_reload_counter = 0
    while True:
        cfg_reload_counter += 1
        if cfg_reload_counter > CONFIG_RELOAD_INTERVAL:
            cfg = load_config()
            cfg_reload_counter = 0
        for i, btn in enumerate(buttons):
            state = btn.value()
            if state == 0 and last_states[i] == 1:  # Falling edge (pressed)
                print('Button {} pressed'.format(i + 1))
                if not is_busy:
                    recipe = next((r for r in cfg['recipes'] if r['id'] == i + 1), None)
                    if recipe:
                        run_recipe_async(recipe['pumpA'], recipe['pumpB'])
            last_states[i] = state
        time.sleep(0.05)  # 50ms debounce

# Start HTTP server in background thread
_thread.start_new_thread(start_server, ())

# Poll buttons on main thread
poll_buttons()
