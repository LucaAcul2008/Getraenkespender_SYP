// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<'ready' | 'busy' | 'error'>('ready');

  // --- 1. Status überwachen ---
  useEffect(() => {
    checkStatus();
    // Alle 5 Sekunden prüfen, ob der ESP32 noch lebt oder beschäftigt ist
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = () => {
    api.getStatus().then(res => {
      if (res.status === 'ready') setStatus('ready');
      else setStatus('busy');
    }).catch(() => {
      setStatus('error');
    });
  };

  // --- 2. Manuelle Steuerung (Gedrückt halten) ---
  const startPump = (pump: 'A' | 'B') => {
    console.log(`Starte Pumpe ${pump} manuell`);
    // Wir senden den Befehl sofort, ohne auf Antwort zu warten (Latenz minimieren)
    api.triggerAction(`start_pump_${pump}`);
  };

  const stopPump = (pump: 'A' | 'B') => {
    console.log(`Stoppe Pumpe ${pump} manuell`);
    api.triggerAction(`stop_pump_${pump}`);
  };

  // --- 3. Power-Spülen (Automatisches Programm) ---
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
      // Wir senden 'flush_all' an den ESP32 (dort musst du run_pump_cycle(15, 15) ausführen)
      await api.triggerAction('flush_all');
      alert("Spülvorgang gestartet! Dauert ca. 15 Sekunden.");
    } catch (e) {
      alert("Fehler beim Senden des Befehls.");
      setStatus('ready');
    }
  };

  return (
    <div className="card" style={{textAlign: 'center'}}>
      <h2>System Status</h2>
      
      {/* Großer Status-Kreis */}
      <div style={{
        width: '120px', 
        height: '120px', 
        borderRadius: '50%', 
        // Farben basierend auf Status (Grün, Orange, Rot)
        background: status === 'ready' ? '#03dac6' : (status === 'busy' ? '#ff9800' : '#cf6679'),
        margin: '20px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 25px rgba(0,0,0,0.4)',
        fontSize: '3rem',
        color: '#121212',
        transition: 'background 0.3s ease'
      }}>
        {status === 'ready' && '✓'}
        {status === 'busy' && '⚙️'}
        {status === 'error' && '!'}
      </div>

      <p style={{color: '#aaaaaa', marginBottom: '30px', fontWeight: 'bold'}}>
        {status === 'ready' && "BEREIT ZUR AUSGABE"}
        {status === 'busy' && "SYSTEM ARBEITET..."}
        {status === 'error' && "VERBINDUNGSFEHLER"}
      </p>

      {/* Bereich: Manuelle Wartung */}
      <div style={{borderTop: '1px solid #333', paddingTop: '20px', marginTop: '20px'}}>
        <h3 style={{marginBottom: '10px'}}>🔧 Manuell / Ansaugen</h3>
        <p style={{fontSize: '0.8rem', color: '#888', marginBottom: '15px'}}>
          Button gedrückt halten zum Pumpen
        </p>
        
        <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
          {/* Pumpe A Button */}
          <button 
            style={{flex: 1, backgroundColor: '#333', border: '1px solid #555'}}
            onMouseDown={() => startPump('A')}
            onMouseUp={() => stopPump('A')}
            onMouseLeave={() => stopPump('A')} // Falls Maus abrutscht
            onTouchStart={() => startPump('A')} // Wichtig für Handy
            onTouchEnd={() => stopPump('A')}    // Wichtig für Handy
          >
            Pumpe A
          </button>
          
          {/* Pumpe B Button */}
          <button 
            style={{flex: 1, backgroundColor: '#333', border: '1px solid #555'}}
            onMouseDown={() => startPump('B')}
            onMouseUp={() => stopPump('B')}
            onMouseLeave={() => stopPump('B')}
            onTouchStart={() => startPump('B')}
            onTouchEnd={() => stopPump('B')}
          >
            Pumpe B
          </button>
        </div>
      </div>

      {/* Bereich: Automatische Reinigung */}
      <div style={{marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #333'}}>
        <h3 style={{marginBottom: '10px'}}>🚰 Reinigung</h3>
        <button 
          onClick={handlePowerFlush}
          disabled={status !== 'ready'}
          style={{
            width: '100%', 
            backgroundColor: status === 'ready' ? '#cf6679' : '#555', // Rot wenn bereit
            padding: '15px',
            fontSize: '1.1rem',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {status === 'busy' ? 'Bitte warten...' : '⚡ Power-Spülen (15s)'}
        </button>
      </div>

    </div>
  );
};

export default Dashboard;