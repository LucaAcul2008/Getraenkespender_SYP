// src/types.ts

export interface Recipe {
  id: number;           // 1, 2 oder 3
  name: string;         // z.B. "Mische 1"
  pumpA: number;        // Laufzeit in Sekunden
  pumpB: number;        // Laufzeit in Sekunden
}

export interface GlobalConfig {
  recipes: Recipe[];
  slotMachineChance: number; // 0-100
  calibrationFactor: number;
}