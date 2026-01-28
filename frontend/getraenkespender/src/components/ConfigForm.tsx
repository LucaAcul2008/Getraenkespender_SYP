import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Recipe, GlobalConfig } from '../types';

const ConfigForm: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  // Startwert 5.0 Sekunden für 100ml (wird später überschrieben)
  const [calibration, setCalibration] = useState<number>(5.0); 
  const [loading, setLoading] = useState(true);

  // --- State für den "Smart Mixer" Rechner ---
  const [totalMl, setTotalMl] = useState(250); // Standard Glasgröße
  const [ratioA, setRatioA] = useState(50);    // 50% Mische
  
  // Berechnete Werte für die Vorschau
  const calcSecA = ((totalMl * (ratioA / 100)) / 100) * calibration;
  const calcSecB = ((totalMl * ((100 - ratioA) / 100)) / 100) * calibration;

  // Daten laden
  useEffect(() => {
    api.getConfig().then((data) => {
      setRecipes(data.recipes);
      // Falls in deiner Config noch kein Wert ist, nehmen wir 5
      setCalibration(data.calibrationFactor || 5.0);
      setLoading(false);
    });
  }, []);

  const handleChange = (id: number, field: keyof Recipe, value: string | number) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Funktion: Übernimmt die berechneten Werte in ein Rezept
  const applyCalculatorToRecipe = (recipeId: number) => {
    setRecipes(prev => prev.map(r => 
      r.id === recipeId 
      ? { ...r, pumpA: parseFloat(calcSecA.toFixed(1)), pumpB: parseFloat(calcSecB.toFixed(1)) } 
      : r
    ));
    alert(`Werte in Taste ${recipeId} übernommen!`);
  };

  const handleSave = async () => {
    setLoading(true);
    const currentConfig = await api.getConfig();
    const newConfig: GlobalConfig = { 
      ...currentConfig, 
      recipes: recipes,
      calibrationFactor: calibration // Auch den Kalibrierwert speichern
    };
    await api.saveConfig(newConfig);
    setLoading(false);
    alert("Alles gespeichert!");
  };

  if (loading) return <div className="card">Lade Daten...</div>;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
      
      {/* 1. KALIBRIERUNG */}
      <div className="card" style={{borderLeft: '4px solid #03dac6'}}>
        <h3>📏 Kalibrierung</h3>
        <p style={{fontSize: '0.9rem', color: '#aaa'}}>
          Miss nach: Wie viele Sekunden braucht die Pumpe für 100ml?
        </p>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <input 
            type="number" 
            step="0.1"
            value={calibration}
            onChange={(e) => setCalibration(parseFloat(e.target.value))}
            style={{width: '80px'}}
          />
          <span>Sekunden = 100ml</span>
        </div>
      </div>

      {/* 2. SMART MIXER (Rechner) */}
      <div className="card" style={{background: '#2a2a35', border: '1px solid #646cff'}}>
        <h3>🧪 Smart Mixer</h3>
        
        {/* Schieberegler für Menge */}
        <label>Gesamtmenge: <strong>{totalMl} ml</strong></label>
        <input 
          type="range" min="50" max="1000" step="10"
          value={totalMl} 
          onChange={(e) => setTotalMl(parseInt(e.target.value))}
          style={{width: '100%', marginBottom: '20px'}}
        />

        {/* Schieberegler für Verhältnis */}
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <span style={{color: '#ff4444'}}>Pumpe A ({ratioA}%)</span>
          <span style={{color: '#448aff'}}>Pumpe B ({100 - ratioA}%)</span>
        </div>
        <input 
          type="range" min="0" max="100" 
          value={ratioA} 
          onChange={(e) => setRatioA(parseInt(e.target.value))}
          style={{width: '100%', accentColor: '#ff4444'}}
        />

        {/* Ergebnis Vorschau */}
        <div style={{
          display: 'flex', gap: '10px', marginTop: '15px', 
          background: '#1a1a1a', padding: '10px', borderRadius: '8px'
        }}>
          <div style={{flex: 1, textAlign: 'center'}}>
            <div style={{fontSize: '0.8rem', color: '#aaa'}}>Ergibt Zeit A</div>
            <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{calcSecA.toFixed(1)}s</div>
          </div>
          <div style={{flex: 1, textAlign: 'center'}}>
            <div style={{fontSize: '0.8rem', color: '#aaa'}}>Ergibt Zeit B</div>
            <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{calcSecB.toFixed(1)}s</div>
          </div>
        </div>
        
        <p style={{fontSize: '0.8rem', textAlign: 'center', margin: '10px 0'}}>
          Werte unten in ein Rezept übernehmen:
        </p>
        <div style={{display: 'flex', gap: '5px', justifyContent: 'center'}}>
          <button onClick={() => applyCalculatorToRecipe(1)} style={{fontSize: '0.8rem'}}>Taste 1</button>
          <button onClick={() => applyCalculatorToRecipe(2)} style={{fontSize: '0.8rem'}}>Taste 2</button>
          <button onClick={() => applyCalculatorToRecipe(3)} style={{fontSize: '0.8rem'}}>Taste 3</button>
        </div>
      </div>

      {/* 3. REZEPTE LISTE */}
      <div className="card">
        <h2>💾 Gespeicherte Rezepte</h2>
        {recipes.map((recipe) => (
          <div key={recipe.id} style={{marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #444'}}>
            <h4 style={{margin: '0 0 10px 0'}}>Taste {recipe.id}</h4>
            <input 
              type="text" 
              value={recipe.name} 
              onChange={(e) => handleChange(recipe.id, 'name', e.target.value)}
              placeholder="Name (z.B. Cola-Korn)"
            />
            <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
              <div style={{flex: 1}}>
                <label style={{fontSize: '0.8rem'}}>Pumpe A (sek)</label>
                <input 
                  type="number" step="0.1"
                  value={recipe.pumpA} 
                  onChange={(e) => handleChange(recipe.id, 'pumpA', parseFloat(e.target.value))}
                />
              </div>
              <div style={{flex: 1}}>
                <label style={{fontSize: '0.8rem'}}>Pumpe B (sek)</label>
                <input 
                  type="number" step="0.1"
                  value={recipe.pumpB} 
                  onChange={(e) => handleChange(recipe.id, 'pumpB', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        ))}
        
        <button onClick={handleSave} style={{width: '100%', background: '#646cff', marginTop: '10px'}}>
          ALLES SPEICHERN
        </button>
      </div>
    </div>
  );
};

export default ConfigForm;