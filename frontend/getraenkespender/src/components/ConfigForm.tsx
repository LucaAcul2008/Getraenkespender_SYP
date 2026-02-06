// src/components/ConfigForm.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Recipe, GlobalConfig } from '../types';

const ConfigForm: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [calibration, setCalibration] = useState<number>(5.0);
  const [loading, setLoading] = useState(true);

  // Smart Mixer State
  const [totalMl, setTotalMl] = useState(250);
  const [ratioA, setRatioA] = useState(30); // Start bei 30%

  // Berechnete Werte für Smart Mixer
  const calcSecA = ((totalMl * (ratioA / 100)) / 100) * calibration;
  const calcSecB = ((totalMl * ((100 - ratioA) / 100)) / 100) * calibration;

  useEffect(() => {
    api.getConfig().then((data) => {
      setRecipes(data.recipes);
      setCalibration(data.calibrationFactor || 5.0);
      setLoading(false);
    });
  }, []);

  const handleChange = (id: number, field: keyof Recipe, value: string | number) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const applyCalculatorToRecipe = (recipeId: number) => {
    setRecipes(prev => prev.map(r => 
      r.id === recipeId 
      ? { ...r, pumpA: parseFloat(calcSecA.toFixed(1)), pumpB: parseFloat(calcSecB.toFixed(1)) } 
      : r
    ));
  };

  const handleSave = async () => {
    setLoading(true);
    const currentConfig = await api.getConfig();
    const newConfig: GlobalConfig = { 
      ...currentConfig, 
      recipes: recipes,
      calibrationFactor: calibration
    };
    await api.saveConfig(newConfig);
    setLoading(false);
    alert("✅ Erfolgreich gespeichert!");
  };

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Lade Daten...</div>;

  // --- STYLES ---
  const styles = {
    header: {
      background: 'linear-gradient(90deg, #ff4444, #448aff)',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
      marginBottom: '20px',
      textAlign: 'center' as const
    },
    calculatorCard: {
      background: '#252525',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '30px',
      border: '1px solid #333',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Automatisch nebeneinander auf Desktop
      gap: '20px',
      marginBottom: '20px'
    },
    recipeCard: {
      background: '#1e1e1e',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #333',
      position: 'relative' as const,
      transition: 'transform 0.2s',
    },
    input: {
      background: '#2c2c2c', border: '1px solid #444', color: 'white', 
      padding: '10px', borderRadius: '8px', width: '100%', fontSize: '0.9rem'
    },
    labelSmall: {
      fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block'
    },
    visualBarContainer: {
      height: '12px', width: '100%', background: '#333', borderRadius: '6px', 
      overflow: 'hidden', display: 'flex', marginTop: '15px', marginBottom: '15px'
    },
    pumpAColor: '#ff4444', // Rot
    pumpBColor: '#448aff', // Blau
  };

  return (
    <div>
      <h2 style={styles.header}>⚙️ Mixer Konfiguration</h2>

      {/* --- 1. SMART MIXER (Rechner) --- */}
      <div style={styles.calculatorCard}>
        <h3 style={{marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '10px'}}>🧪 Smart Mixer</h3>
        
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#aaa'}}>
          <span>Gesamtmenge: <strong>{totalMl} ml</strong></span>
          <span>Verhältnis: <strong>{ratioA}% / {100 - ratioA}%</strong></span>
        </div>

        {/* Slider für Menge */}
        <input 
          type="range" min="50" max="500" step="10"
          value={totalMl} onChange={(e) => setTotalMl(parseInt(e.target.value))}
          style={{width: '100%', marginBottom: '20px', accentColor: '#03dac6'}}
        />

        {/* Visueller Slider für Verhältnis (Rot zu Blau) */}
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span style={{color: styles.pumpAColor, fontWeight: 'bold'}}>A</span>
          <input 
            type="range" min="0" max="100" 
            value={ratioA} onChange={(e) => setRatioA(parseInt(e.target.value))}
            style={{
              width: '100%', 
              background: `linear-gradient(to right, ${styles.pumpAColor} ${ratioA}%, ${styles.pumpBColor} ${ratioA}%)`,
              appearance: 'none', height: '8px', borderRadius: '4px', outline: 'none'
            }}
          />
          <span style={{color: styles.pumpBColor, fontWeight: 'bold'}}>B</span>
        </div>

        {/* Vorschau Box */}
        <div style={{
          display: 'flex', marginTop: '20px', background: '#111', borderRadius: '8px', padding: '10px'
        }}>
          <div style={{flex: 1, textAlign: 'center', borderRight: '1px solid #333'}}>
            <div style={{color: styles.pumpAColor, fontSize: '0.8rem'}}>Pumpe A</div>
            <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{calcSecA.toFixed(1)}s</div>
          </div>
          <div style={{flex: 1, textAlign: 'center'}}>
            <div style={{color: styles.pumpBColor, fontSize: '0.8rem'}}>Pumpe B</div>
            <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{calcSecB.toFixed(1)}s</div>
          </div>
        </div>

        <div style={{marginTop: '15px', textAlign: 'center'}}>
          <p style={{fontSize: '0.8rem', color: '#666', marginBottom: '5px'}}>Übernehmen in:</p>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
            {[1, 2, 3].map(id => (
              <button 
                key={id}
                onClick={() => applyCalculatorToRecipe(id)}
                style={{
                  background: '#333', border: '1px solid #555', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem'
                }}
              >
                Taste {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- 2. REZEPTE GRID (Das neue Design) --- */}
      <h3 style={{marginBottom: '15px'}}>💾 Gespeicherte Rezepte</h3>
      
      <div style={styles.gridContainer}>
        {recipes.map((recipe) => {
          // Berechne Prozent für den visuellen Balken
          const totalSec = (recipe.pumpA || 0) + (recipe.pumpB || 0);
          const percentA = totalSec > 0 ? ((recipe.pumpA / totalSec) * 100) : 50;
          const percentB = totalSec > 0 ? ((recipe.pumpB / totalSec) * 100) : 50;

          return (
            <div key={recipe.id} style={styles.recipeCard}>
              {/* Titel Zeile */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <span style={{
                  background: '#333', color: '#aaa', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold'
                }}>
                  TASTE {recipe.id}
                </span>
              </div>

              {/* Name Input */}
              <div style={{marginBottom: '15px'}}>
                <label style={styles.labelSmall}>Name des Getränks</label>
                <input 
                  type="text" 
                  value={recipe.name} 
                  onChange={(e) => handleChange(recipe.id, 'name', e.target.value)}
                  style={{...styles.input, fontWeight: 'bold', fontSize: '1.1rem'}}
                  placeholder="z.B. Cola-Korn"
                />
              </div>

              {/* Visueller Mix-Balken */}
              <div style={styles.visualBarContainer}>
                <div style={{width: `${percentA}%`, background: styles.pumpAColor}}></div>
                <div style={{width: `${percentB}%`, background: styles.pumpBColor}}></div>
              </div>

              {/* Pumpen Inputs nebeneinander */}
              <div style={{display: 'flex', gap: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={{...styles.labelSmall, color: styles.pumpAColor}}>🔴 Pumpe A (sek)</label>
                  <input 
                    type="number" step="0.1"
                    value={recipe.pumpA} 
                    onChange={(e) => handleChange(recipe.id, 'pumpA', parseFloat(e.target.value))}
                    style={{...styles.input, borderLeft: `3px solid ${styles.pumpAColor}`}}
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={{...styles.labelSmall, color: styles.pumpBColor}}>🔵 Pumpe B (sek)</label>
                  <input 
                    type="number" step="0.1"
                    value={recipe.pumpB} 
                    onChange={(e) => handleChange(recipe.id, 'pumpB', parseFloat(e.target.value))}
                    style={{...styles.input, borderLeft: `3px solid ${styles.pumpBColor}`}}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- 3. FOOTER (Kalibrierung & Save) --- */}
      <div style={{background: '#252525', padding: '20px', borderRadius: '16px', borderTop: '4px solid #03dac6'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <div>
            <h4 style={{margin: 0}}>📏 Kalibrierung</h4>
            <span style={{fontSize: '0.8rem', color: '#888'}}>Sekunden für 100ml</span>
          </div>
          <input 
            type="number" step="0.1"
            value={calibration}
            onChange={(e) => setCalibration(parseFloat(e.target.value))}
            style={{width: '80px', padding: '10px', borderRadius: '8px', background: '#333', border: '1px solid #555', color: 'white', textAlign: 'center'}}
          />
        </div>

        <button 
          onClick={handleSave} 
          style={{
            width: '100%', 
            padding: '15px', 
            background: 'linear-gradient(135deg, #646cff, #bb86fc)', 
            border: 'none', borderRadius: '12px', 
            color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(100, 108, 255, 0.4)'
          }}
        >
          💾 Alles Speichern
        </button>
      </div>
    </div>
  );
};

export default ConfigForm;