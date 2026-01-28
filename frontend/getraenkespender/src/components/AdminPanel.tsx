import React, { useState } from 'react';

const AdminPanel: React.FC = () => {
  // Zustand für Login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Zustand für die Einstellungen
  const [winChance, setWinChance] = useState(10); // Standard: 10%
  const [coinValue, setCoinValue] = useState(1);  // Wie viele Credits pro Münze

  const handleLogin = () => {
    // Simuliertes Passwort (für die Schule reicht das)
    if (passwordInput === 'Acul123') {
      setIsAuthenticated(true);
    } else {
      alert('Falsches Passwort!');
    }
  };

  const handleSave = () => {
    console.log(`Speichere Settings: Chance=${winChance}%, Credits=${coinValue}`);
    alert('Einstellungen gespeichert!');
  };

  // --- Ansicht: Wenn NICHT eingeloggt ---
  if (!isAuthenticated) {
    return (
      <div className="card" style={{textAlign: 'center'}}>
        <h2>🔒 Geschützter Bereich</h2>
        <p>Bitte Passwort eingeben:</p>
        <input 
          type="password" 
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Passwort"
        />
        <br />
        <button onClick={handleLogin} style={{marginTop: '10px'}}>Login</button>
      </div>
    );
  }

  // --- Ansicht: Wenn EINGELOGGT ---
  return (
    <div className="card" style={{border: '1px solid #646cff'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>🎰 Slot Machine Config</h2>
        <button onClick={() => setIsAuthenticated(false)} style={{fontSize: '0.8rem', padding: '5px 10px'}}>Logout</button>
      </div>

      <div style={{background: '#222', padding: '15px', borderRadius: '8px', marginBottom: '15px'}}>
        <label style={{display: 'block', marginBottom: '10px'}}>
          <strong>Gewinnchance ({winChance}%)</strong>
          <input 
            type="range" 
            min="0" max="100" 
            value={winChance} 
            onChange={(e) => setWinChance(parseInt(e.target.value))}
            style={{width: '100%'}} 
          />
        </label>
        
        <label>
          <strong>Credits pro Münze:</strong><br/>
          <input 
            type="number" 
            value={coinValue} 
            onChange={(e) => setCoinValue(parseInt(e.target.value))}
          />
        </label>
      </div>

      <button onClick={handleSave} style={{width: '100%', background: '#ff4444'}}>
        Einstellungen an ESP32 senden
      </button>
    </div>
  );
};

export default AdminPanel;