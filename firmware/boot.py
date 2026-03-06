# firmware/boot.py
import network
import time

def start_ap():
    ap = network.WLAN(network.AP_IF)
    ap.active(True)
    ap.config(essid='GetraenkespenderAP', password='12345678', authmode=network.AUTH_WPA_WPA2_PSK)
    timeout = 10
    while not ap.active() and timeout > 0:
        time.sleep(0.5)
        timeout -= 1
    if ap.active():
        print('AP started, IP:', ap.ifconfig()[0])
    else:
        print('AP failed to start')

start_ap()
