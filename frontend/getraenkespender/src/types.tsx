// src/types.tsx

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
  bottleA_ml: number;
  bottleB_ml: number;
  remainingA_ml?: number;
  remainingB_ml?: number;
}

export interface SystemStatus {
  status: string;
  remainingA_ml: number;
  remainingB_ml: number;
  bottleA_ml: number;
  bottleB_ml: number;
}