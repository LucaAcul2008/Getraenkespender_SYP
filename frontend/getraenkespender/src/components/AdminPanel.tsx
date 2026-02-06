import React, { useState } from 'react';

const GAMBLING_PASSWORD = "777"; // <--- Das Extra-Passwort für Glücksspiel

const AdminPanel: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  
  // Settings State
  const [winChance, setWinChance] = useState(10);
  const [coinValue, setCoinValue] = useState(1);

  const checkGamblingPass = () => {
    if (password === GAMBLING_PASSWORD) {
      setIsAuth(true);
    } else {
      alert("Falsches Gambling-Passwort!");
      setPassword('');
    }
  };

  // --- ZUSTAND 1: GESPERRT ---
  if (!isAuth) {
    return (
      <div className="card" style={{border: '1px solid #ff4444', textAlign: 'center'}}>
        <h2 style={{color: '#ff4444'}}>🎰 Gambling Bereich</h2>
        <p>Dieser Bereich ist extra geschützt.</p>
        
        <div style={{margin: '20px 0'}}>
          <input 
            type="password" 
            placeholder="Gambling-Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{textAlign: 'center', width: '80%'}}
          />
        </div>
        
        <button onClick={checkGamblingPass} style={{background: '#ff4444', width: '100%'}}>
          Entsperren
        </button>
      </div>
    );
  }

  // --- ZUSTAND 2: ENTSPERRT (Config) ---
  return (
    <div className="card" style={{border: '1px solid #03dac6'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>🎰 Slot Config</h2>
        <button onClick={() => setIsAuth(false)} style={{fontSize: '0.8rem', padding: '5px 10px', background: '#333'}}>Sperren 🔒</button>
      </div>

      <div style={{background: '#222', padding: '15px', borderRadius: '8px', marginBottom: '15px'}}>
        <label style={{display: 'block', marginBottom: '10px'}}>
          <strong>Gewinnchance ({winChance}%)</strong>
          <input type="range" min="0" max="100" value={winChance} onChange={(e) => setWinChance(parseInt(e.target.value))} style={{width: '100%'}} />
        </label>
        
        <label>
          <strong>Credits pro Münze:</strong><br/>
          <input type="number" value={coinValue} onChange={(e) => setCoinValue(parseInt(e.target.value))} />
        </label>
      </div>

      <button onClick={() => alert("Gespeichert an ESP32")} style={{width: '100%', background: '#03dac6', color: '#000'}}>
        Einstellungen Speichern
      </button>
    </div>
  );
};

export default AdminPanel;