// src/components/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Recipe } from '../types';

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<'ready' | 'busy' | 'error'>('ready');
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const checkStatus = useCallback(() => {
    api.getStatus().then(res => {
      setStatus(res.status === 'ready' ? 'ready' : 'busy');
    }).catch(() => {
      setStatus('error');
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

  const handleTriggerRecipe = async (recipeId: number) => {
    if (status !== 'ready') return;
    setStatus('busy');
    try {
      await api.triggerRecipe(recipeId);
      // Poll until ready again
      const poll = setInterval(() => {
        api.getStatus().then(res => {
          if (res.status === 'ready') {
            setStatus('ready');
            clearInterval(poll);
          }
        }).catch(() => {
          setStatus('error');
          clearInterval(poll);
        });
      }, 1000);
    } catch (error) {
      alert('Fehler: ' + String(error));
      setStatus('ready');
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
    setStatus('busy');
    try {
      await api.triggerAction('flush_all');
      alert("Spülvorgang gestartet! Dauert ca. 30 Sekunden.");
    } catch {
      alert("Fehler beim Senden des Befehls.");
      setStatus('ready');
    }
  };

  const statusColor = status === 'ready' ? '#03dac6' : status === 'busy' ? '#ff9800' : '#cf6679';
  const statusText = status === 'ready' ? 'BEREIT ZUR AUSGABE' : status === 'busy' ? 'SYSTEM ARBEITET...' : 'VERBINDUNGSFEHLER';
  const statusIcon = status === 'ready' ? '✓' : status === 'busy' ? '⚙️' : '!';

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h2>System Status</h2>

      {/* Status Circle */}
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        background: statusColor,
        margin: '20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 25px ${statusColor}66`,
        fontSize: '3rem', color: '#121212', transition: 'background 0.3s ease',
      }}>
        {statusIcon}
      </div>
      <p style={{ color: '#aaaaaa', marginBottom: '30px', fontWeight: 'bold' }}>{statusText}</p>

      {/* Recipe Buttons */}
      <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
        <h3 style={{ marginBottom: '15px' }}>🍹 Getränk auswählen</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {recipes.length === 0
            ? [1, 2, 3].map(id => (
                <button key={id}
                  onClick={() => { void handleTriggerRecipe(id); }}
                  disabled={status !== 'ready'}
                  style={{
                    flex: 1, minWidth: '80px',
                    padding: '18px 10px',
                    background: status === 'ready' ? 'linear-gradient(135deg, #646cff, #bb86fc)' : '#333',
                    color: 'white', fontWeight: 'bold', fontSize: '1rem',
                    border: 'none', borderRadius: '12px',
                    boxShadow: status === 'ready' ? '0 4px 15px rgba(100,108,255,0.4)' : 'none',
                    cursor: status === 'ready' ? 'pointer' : 'not-allowed',
                  }}>
                  Taste {id}
                </button>
              ))
            : recipes.map(recipe => (
                <button key={recipe.id}
                  onClick={() => { void handleTriggerRecipe(recipe.id); }}
                  disabled={status !== 'ready'}
                  style={{
                    flex: 1, minWidth: '80px',
                    padding: '18px 10px',
                    background: status === 'ready' ? 'linear-gradient(135deg, #646cff, #bb86fc)' : '#333',
                    color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
                    border: 'none', borderRadius: '12px',
                    boxShadow: status === 'ready' ? '0 4px 15px rgba(100,108,255,0.4)' : 'none',
                    cursor: status === 'ready' ? 'pointer' : 'not-allowed',
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