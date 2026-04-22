import network
import time

# --- KONFIGURATION DEINES BOT-WLANS ---
AP_SSID = "GetraenkeBot_3000"  # So heißt das WLAN, das du am Handy siehst
AP_PASS = "party1234"          # Das Passwort (MUSS mindestens 8 Zeichen lang sein!)

def create_hotspot():
    print("Starte Getränke-Bot Hotspot...")
    # Access Point Interface (AP) aktivieren
    ap = network.WLAN(network.AP_IF)
    # Zuerst aktivieren, dann konfigurieren (wichtig bei manchen ESP32 Versionen)
    ap.active(True)
    ap.config(essid=AP_SSID, password=AP_PASS)
    # Kurz warten, bis das Netzwerk steht
    time.sleep(1)
    print("\n✅ Eigener Hotspot ist ONLINE!")
    print(f"📡 Finde dieses WLAN am Handy/Laptop: {AP_SSID}")
    print(f"🔑 Das Passwort ist: {AP_PASS}")
    # Die IP-Adresse auslesen (ist beim ESP32 als Hotspot fast immer 192.168.4.1)
    ip_adresse = ap.ifconfig()[0]
    print(f"🌐 Die IP-Adresse des Bots ist: {ip_adresse}")

# Starten
create_hotspot()

