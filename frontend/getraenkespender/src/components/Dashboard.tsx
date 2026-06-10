// src/components/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Recipe, SystemStatus } from '../types';

const Dashboard: React.FC = () => {
  const [statusData, setStatusData] = useState<SystemStatus>({
    status: 'ready', remainingA_ml: 1500, remainingB_ml: 1500, bottleA_ml: 1500, bottleB_ml: 1500
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const checkStatus = useCallback(() => {
    api.getStatus().then(res => setStatusData(res)).catch(() => {
      setStatusData(prev => ({...prev, status: 'error'}));
    });
  }, []);

  const loadRecipes = useCallback(() => {
    api.getConfig().then(cfg => setRecipes(cfg.recipes)).catch(console.error);
  }, []);

  useEffect(() => {
    checkStatus();
    loadRecipes();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus, loadRecipes]);

  const startPump = (pump: 'A' | 'B') => {
    void api.triggerAction(`start_pump_${pump}`);
  };

  const stopPump = (pump: 'A' | 'B') => {
    void api.triggerAction(`stop_pump_${pump}`);
  };

  const handleRefill = async (pump: 'A' | 'B' | 'both') => {
    if (confirm("Flasche als voll markieren?")) {
      await api.refillBottles(pump);
      checkStatus();
    }
  };

  const handleTriggerRecipe = async (recipeId: number) => {
    if (statusData.status !== 'ready') return;
    setStatusData(prev => ({...prev, status: 'busy'}));
    try {
      await api.triggerRecipe(recipeId);
      const poll = setInterval(() => {
        api.getStatus().then(res => {
          if (res.status === 'ready') {
            setStatusData(res);
            clearInterval(poll);
          }
        }).catch(() => {
          setStatusData(prev => ({...prev, status: 'error'}));
          clearInterval(poll);
        });
      }, 1000);
    } catch (error) {
      alert('Fehler: ' + String(error));
      checkStatus();
    }
  };

  const handlePowerFlush = async () => {
    const confirmed = confirm(
      "⚠️ ACHTUNG: Reinigungs-Modus\n\n" +
      "1. Sind große Gefäße unter BEIDEN Auslässen?\n" +
      "2. Ist genug Wasser/Reiniger angeschlossen?\n\n" +
      "Starten?"
    );
    if (!confirmed) return;
    setStatusData(prev => ({...prev, status: 'busy'}));
    try {
      await api.triggerAction('flush_all');
      alert("Spülvorgang gestartet! Dauert ca. 15 Sekunden.");
    } catch {
      alert("Fehler beim Senden des Befehls.");
      checkStatus();
    }
  };

  const status = statusData.status;
  const percentA = (statusData.remainingA_ml / statusData.bottleA_ml) * 100;
  const percentB = (statusData.remainingB_ml / statusData.bottleB_ml) * 100;
  const isEmpty = percentA <= 0 || percentB <= 0;

  const statusColor = status === 'ready' && !isEmpty ? '#03dac6' : status === 'busy' ? '#ff9800' : '#cf6679';
  const statusText = isEmpty ? 'FLASCHE LEER!' : status === 'ready' ? 'BEREIT ZUR AUSGABE' : status === 'busy' ? 'SYSTEM ARBEITET...' : 'VERBINDUNGSFEHLER';
  const statusIcon = status === 'ready' && !isEmpty ? '✓' : status === 'busy' ? '⚙️' : '!';

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h2>System Status</h2>

      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        background: statusColor,
        margin: '20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 25px ${statusColor}66`,
        fontSize: '3rem', color: '#121212', transition: 'background 0.3s ease',
      }}>
        {statusIcon}
      </div>
      <p style={{ color: statusColor, marginBottom: '20px', fontWeight: 'bold' }}>{statusText}</p>

      {/* Füllstandsanzeige */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, background: '#222', padding: '15px', borderRadius: '12px', border: percentA <= 0 ? '1px solid #ff4444' : '1px solid transparent' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ff4444' }}>🔴 Pumpe A</h4>
          <div style={{ background: '#111', height: '15px', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(0, percentA)}%`, background: '#ff4444', height: '100%', transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>{Math.round(statusData.remainingA_ml)} ml / {statusData.bottleA_ml} ml</p>
          <button onClick={() => handleRefill('A')} style={{ fontSize: '0.7rem', padding: '5px 10px', marginTop: '5px', background: '#333' }}>🔄 Voll</button>
        </div>

        <div style={{ flex: 1, background: '#222', padding: '15px', borderRadius: '12px', border: percentB <= 0 ? '1px solid #ff4444' : '1px solid transparent' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#448aff' }}>🔵 Pumpe B</h4>
          <div style={{ background: '#111', height: '15px', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(0, percentB)}%`, background: '#448aff', height: '100%', transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>{Math.round(statusData.remainingB_ml)} ml / {statusData.bottleB_ml} ml</p>
          <button onClick={() => handleRefill('B')} style={{ fontSize: '0.7rem', padding: '5px 10px', marginTop: '5px', background: '#333' }}>🔄 Voll</button>
        </div>
      </div>

      {/* Recipe Buttons */}
      <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
        <h3 style={{ marginBottom: '15px' }}>🍹 Getränk auswählen</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {recipes.length === 0
            ? [1, 2, 3].map(id => (
                <button key={id}
                  onClick={() => { void handleTriggerRecipe(id); }}
                  disabled={status !== 'ready' || isEmpty}
                  style={{
                    flex: 1, minWidth: '80px',
                    padding: '18px 10px',
                    background: status === 'ready' && !isEmpty ? 'linear-gradient(135deg, #646cff, #bb86fc)' : '#333',
                    color: 'white', fontWeight: 'bold', fontSize: '1rem',
                    border: 'none', borderRadius: '12px',
                    boxShadow: status === 'ready' && !isEmpty ? '0 4px 15px rgba(100,108,255,0.4)' : 'none',
                    cursor: status === 'ready' && !isEmpty ? 'pointer' : 'not-allowed',
                  }}>
                  Taste {id}
                </button>
              ))
            : recipes.map(recipe => (
                <button key={recipe.id}
                  onClick={() => { void handleTriggerRecipe(recipe.id); }}
                  disabled={status !== 'ready' || isEmpty}
                  style={{
                    flex: 1, minWidth: '80px',
                    padding: '18px 10px',
                    background: status === 'ready' && !isEmpty ? 'linear-gradient(135deg, #646cff, #bb86fc)' : '#333',
                    color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
                    border: 'none', borderRadius: '12px',
                    boxShadow: status === 'ready' && !isEmpty ? '0 4px 15px rgba(100,108,255,0.4)' : 'none',
                    cursor: status === 'ready' && !isEmpty ? 'pointer' : 'not-allowed',
                  }}>
                  <div style={{ fontSize: '0.7rem', color: '#ccc', marginBottom: '4px' }}>TASTE {recipe.id}</div>
                  {recipe.name}
                </button>
              ))
          }
        </div>
      </div>

      {/* Manual pump control */}
      <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '25px' }}>
        <h3 style={{ marginBottom: '10px' }}>🔧 Manuell / Ansaugen</h3>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>
          Button gedrückt halten zum Pumpen
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            style={{ flex: 1, backgroundColor: '#333', border: '1px solid #555', padding: '15px' }}
            onMouseDown={() => startPump('A')} onMouseUp={() => stopPump('A')} onMouseLeave={() => stopPump('A')}
            onTouchStart={() => startPump('A')} onTouchEnd={() => stopPump('A')}
          >
            🔴 Pumpe A
          </button>
          <button
            style={{ flex: 1, backgroundColor: '#333', border: '1px solid #555', padding: '15px' }}
            onMouseDown={() => startPump('B')} onMouseUp={() => stopPump('B')} onMouseLeave={() => stopPump('B')}
            onTouchStart={() => startPump('B')} onTouchEnd={() => stopPump('B')}
          >
            🔵 Pumpe B
          </button>
        </div>
      </div>

      {/* Power flush */}
      <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #333' }}>
        <h3 style={{ marginBottom: '10px' }}>🚰 Reinigung</h3>
        <button
          onClick={() => { void handlePowerFlush(); }}
          disabled={status !== 'ready'}
          style={{
            width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', color: 'white',
            backgroundColor: status === 'ready' ? '#cf6679' : '#555',
          }}
        >
          {status === 'busy' ? 'Bitte warten...' : '⚡ Power-Spülen (15s je Pumpe)'}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;