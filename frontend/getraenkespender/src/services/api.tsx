import { type GlobalConfig } from '../types';

// Vite erkennt automatisch, ob wir entwickeln (npm run dev) oder live sind
const IS_DEV = import.meta.env.DEV;

// Simulierter Speicher für den Laptop-Modus
let mockConfig: GlobalConfig = {
  recipes: [
    { id: 1, name: 'Mische 1 (Sim)', pumpA: 5, pumpB: 2 },
    { id: 2, name: 'Mische 2 (Sim)', pumpA: 3, pumpB: 3 },
    { id: 3, name: 'Wasser (Sim)', pumpA: 0, pumpB: 5 },
  ],
  slotMachineChance: 10
};

// --- Die echten Funktionen ---

export const api = {
  // 1. Status abrufen (Ist der ESP bereit?)
  getStatus: async (): Promise<{ status: string }> => {
    if (IS_DEV) {
      console.log("[DEV] Mock-Status abgerufen");
      return new Promise(resolve => setTimeout(() => resolve({ status: 'ready' }), 500));
    }
    // Echter Request an ESP32
    const response = await fetch('/api/status');
    return response.json();
  },

  // 2. Config laden
  getConfig: async (): Promise<GlobalConfig> => {
    if (IS_DEV) {
      console.log("[DEV] Mock-Config geladen");
      return new Promise(resolve => setTimeout(() => resolve(mockConfig), 500));
    }
    const response = await fetch('/api/config');
    return response.json();
  },

  // 3. Config speichern
  saveConfig: async (config: GlobalConfig): Promise<void> => {
    if (IS_DEV) {
      console.log("[DEV] Speichere Config:", config);
      mockConfig = config; // Update Mock
      return new Promise(resolve => setTimeout(resolve, 800));
    }
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },

  // 4. Aktionen auslösen (z.B. Reinigen oder manuell Pumpen)
 triggerAction: async (action: string): Promise<void> => {
    if (IS_DEV) {
      console.log(`[DEV Mock] Führe Aktion aus: ${action}`);
      // Keine Verzögerung bei manuellem Start/Stop, soll ja sofort reagieren
      return Promise.resolve();
    }
    
    // Echter Request an ESP32
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: action })
    });
  }
};