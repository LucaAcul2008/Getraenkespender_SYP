// src/components/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const GAMBLING_PASSWORD = "777";

const AdminPanel: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [winChance, setWinChance] = useState(10);
  const [coinValue, setCoinValue] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isAuth) {
      api.getConfig().then(cfg => {
        setWinChance(cfg.slotMachineChance ?? 10);
      }).catch(console.error);
    }
  }, [isAuth]);

  const checkGamblingPass = () => {
    if (password === GAMBLING_PASSWORD) {
      setIsAuth(true);
    } else {
      alert("Falsches Gambling-Passwort!");
      setPassword('');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const cfg = await api.getConfig();
      cfg.slotMachineChance = winChance;
      await api.saveConfig(cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert("Fehler beim Speichern: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="card" style={{ border: '1px solid #ff4444', textAlign: 'center' }}>
        <h2 style={{ color: '#ff4444' }}>🎰 Gambling Bereich</h2>
        <p>Dieser Bereich ist extra geschützt.</p>
        <div style={{ margin: '20px 0' }}>
          <input
            type="password"
            placeholder="Gambling-Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkGamblingPass()}
            style={{ textAlign: 'center', width: '80%' }}
          />
        </div>
        <button onClick={checkGamblingPass} style={{ background: '#ff4444', width: '100%' }}>
          Entsperren
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ border: '1px solid #03dac6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🎰 Slot Config</h2>
        <button onClick={() => setIsAuth(false)} style={{ fontSize: '0.8rem', padding: '5px 10px', background: '#333' }}>
          Sperren 🔒
        </button>
      </div>

      <div style={{ background: '#222', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          <strong>Gewinnchance ({winChance}%)</strong>
          <input
            type="range"
            min="0"
            max="100"
            value={winChance}
            onChange={(e) => setWinChance(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          <strong>Credits pro Münze:</strong>
          <br />
          <input
            type="number"
            value={coinValue}
            onChange={(e) => setCoinValue(parseInt(e.target.value))}
            style={{ marginTop: '8px' }}
          />
        </label>
      </div>

      {saved && (
        <div style={{ background: 'rgba(3,218,198,0.1)', color: '#03dac6', border: '1px solid #03dac6', borderRadius: '8px', padding: '10px', marginBottom: '10px', textAlign: 'center' }}>
          ✅ Gespeichert!
        </div>
      )}

      <button
        onClick={() => { void handleSave(); }}
        disabled={loading}
        style={{ width: '100%', background: loading ? '#555' : '#03dac6', color: '#000', padding: '12px', fontWeight: 'bold' }}
      >
        {loading ? 'Speichert...' : '💾 Einstellungen Speichern'}
      </button>
    </div>
  );
};

export default AdminPanel;