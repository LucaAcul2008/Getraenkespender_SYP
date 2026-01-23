# Getraenkespender_SYP
Automatisierter IoT-Getränkemischer auf Basis eines ESP32 (MicroPython) mit modernem React-Frontend zur Konfiguration. Steuert 6-12V-Membranpumpen für präzise Mischverhältnisse.


# 🍹 Smart Drink Mixer (ESP32 + React)

Ein vollautomatischer Getränkemischer, der zwei Flüssigkeiten über Membranpumpen in einem definierten Verhältnis mischt. Das System wird über physische Taster bedient und über ein responsives Web-Interface konfiguriert.

Dieses Projekt entstand als Projektarbeit in SYP.

## 🚀 Funktionen
* **Duale Pumpensteuerung:** Unabhängige Ansteuerung von zwei 6-12V-Membranpumpen (Selbstansaugend).
* **Web-Konfiguration:** Modernes React-Frontend (Single Page Application) zum Erstellen und Speichern von Getränke-Rezepten.
* **Hardware-Bedienung:** 3 physische Taster zum direkten Auslösen der gespeicherten Mischprofile.
* **Persistenz:** Speicherung der Konfigurationen im Flash-Speicher des ESP32 (JSON).
* **Custom Gehäuse:** Hybrid-Gehäuse aus 3D-Druck-Komponenten und Holz.

## 🛠 Technologie-Stack

### Hardware
* **Controller:** ESP32 (WLAN integriert)
* **Aktorik:** 2x 6-12V DC Membranpumpen 
* **Treiber:** MOSFET Schaltung (Logic Level) zur Ansteuerung der 6-12V Pumpen über 3.3V GPIOs
* **Stromversorgung:** 12V Netzteil + Step-Down Converter (für ESP32)

### Software
* **Firmware (Backend):** MicroPython
    * REST-API für die Kommunikation mit dem Frontend
    * Dateisystem-Management für Config-Dateien
* **Frontend (UI):** React.js
    * Responsive Design (Mobile First)
    * Kommunikation via `fetch` API

## 📂 Projektstruktur
```text
/firmware      -> MicroPython Code für den ESP32 (main.py, boot.py)
/frontend      -> Quellcode der React Web-App
/3d-models     -> STL-Dateien für Halterungen und Gehäuse
/docs          -> Schaltpläne und Dokumentation
