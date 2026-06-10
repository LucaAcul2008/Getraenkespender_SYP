// src/services/api.tsx
import type { GlobalConfig, SystemStatus } from '../types';

const IS_DEV = import.meta.env.DEV;

// Simulierter Speicher für den Laptop-Modus
let mockConfig: GlobalConfig = {
  recipes: [
    { id: 1, name: 'Rezept 1 (Sim)', pumpA: 5, pumpB: 2 },
    { id: 2, name: 'Rezept 2 (Sim)', pumpA: 3, pumpB: 3 },
    { id: 3, name: 'Wasser (Sim)',   pumpA: 0, pumpB: 5 },
  ],
  slotMachineChance: 10,
  calibrationFactor: 5.0,
  bottleA_ml: 1500,
  bottleB_ml: 1500,
  remainingA_ml: 1500,
  remainingB_ml: 1500
};

export const api = {
  getStatus: async (): Promise<SystemStatus> => {
    if (IS_DEV) {
      return new Promise(resolve => setTimeout(() => resolve({ 
        status: 'ready', 
        remainingA_ml: mockConfig.remainingA_ml || 1500, 
        remainingB_ml: mockConfig.remainingB_ml || 1500, 
        bottleA_ml: mockConfig.bottleA_ml || 1500, 
        bottleB_ml: mockConfig.bottleB_ml || 1500 
      }), 300));
    }
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error('Status fetch failed');
    return response.json() as Promise<SystemStatus>;
  },

  getConfig: async (): Promise<GlobalConfig> => {
    if (IS_DEV) {
      return new Promise(resolve => setTimeout(() => resolve({ ...mockConfig, recipes: [...mockConfig.recipes] }), 300));
    }
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Config fetch failed');
    return response.json() as Promise<GlobalConfig>;
  },

  saveConfig: async (config: GlobalConfig): Promise<void> => {
    if (IS_DEV) {
      mockConfig = config;
      return new Promise(resolve => setTimeout(resolve, 500));
    }
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Save config failed');
  },

  triggerAction: async (action: string): Promise<void> => {
    if (IS_DEV) {
      console.log(`[DEV Mock] Action: ${action}`);
      return Promise.resolve();
    }
    const response = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: action }),
    });
    if (!response.ok) throw new Error(`Action ${action} failed`);
  },

  triggerRecipe: async (recipeId: number): Promise<void> => {
    return api.triggerAction(`recipe_${recipeId}`);
  },

  refillBottles: async (pump: 'A' | 'B' | 'both' = 'both'): Promise<void> => {
    if (IS_DEV) {
      console.log(`[DEV Mock] Refill: ${pump}`);
      if (pump === 'A' || pump === 'both') mockConfig.remainingA_ml = mockConfig.bottleA_ml;
      if (pump === 'B' || pump === 'both') mockConfig.remainingB_ml = mockConfig.bottleB_ml;
      return Promise.resolve();
    }
    const response = await fetch('/api/refill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pump }),
    });
    if (!response.ok) throw new Error(`Refill failed`);
  }
};