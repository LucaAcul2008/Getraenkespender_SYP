// src/components/LoginScreen.tsx
import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const MASTER_PASSWORD = "master-key"; // <--- Das Master-Passwort

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [masterInput, setMasterInput] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- LOGIK (Bleibt gleich wie vorher) ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUsers = JSON.parse(localStorage.getItem('app_users') || '{}');
    if (storedUsers[username] && storedUsers[username] === password) {
      onLogin(username);
    } else {
      setError('Benutzername oder Passwort falsch!');
      setTimeout(() => setError(''), 3000); // Fehler nach 3s ausblenden
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterInput !== MASTER_PASSWORD) {
      setError('Falsches Master-Passwort!');
      return;
    }
    if (username.length < 3 || password.length < 3) {
      setError('Mindestens 3 Zeichen erforderlich.');
      return;
    }
    const storedUsers = JSON.parse(localStorage.getItem('app_users') || '{}');
    storedUsers[username] = password;
    localStorage.setItem('app_users', JSON.stringify(storedUsers));

    setSuccessMsg(`User "${username}" angelegt!`);
    setTimeout(() => setSuccessMsg(''), 3000);
    setMode('login');
    setUsername(''); setPassword(''); setMasterInput(''); setError('');
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode); setError(''); setSuccessMsg('');
    setUsername(''); setPassword(''); setMasterInput('');
  };

  // --- STYLES (CSS-in-JS für dieses File) ---
  const styles = {
    container: {
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      // Ein dunkler, edler Hintergrundverlauf
      background: 'radial-gradient(circle at top right, #2a1a3a, #121212 60%)',
      padding: '20px',
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      background: 'rgba(30, 30, 30, 0.95)', // Leicht transparent
      backdropFilter: 'blur(10px)', // Milchglas-Effekt (wenn Browser unterstützt)
      borderRadius: '20px',
      padding: '40px 30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(187, 134, 252, 0.1)', // Weicher Schatten mit leichtem Lila Glow
      border: '1px solid #333',
      textAlign: 'center' as const,
    },
    titleGradient: {
      // Text-Verlauf für die Überschrift
      background: 'linear-gradient(90deg, #bb86fc, #03dac6)',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
      fontSize: '1.8rem',
      marginBottom: '10px',
      fontWeight: 'bold',
    },
    subTitle: {
      color: '#888', marginBottom: '30px', fontSize: '0.9rem', textTransform: 'uppercase' as const, letterSpacing: '1px'
    },
    inputGroup: {
      position: 'relative' as const,
      marginBottom: '20px',
      textAlign: 'left' as const,
    },
    inputIcon: {
      position: 'absolute' as const,
      left: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '1.2rem',
      color: '#666',
      zIndex: 1,
    },
    inputField: {
      width: '100%',
      padding: '15px 15px 15px 50px', // Platz links für das Icon lassen
      borderRadius: '12px',
      border: '2px solid transparent',
      background: '#2c2c2c',
      color: 'white',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.3s ease',
    },
    // Kleiner Trick um den Fokus-Rahmen zu stylen. 
    // In echtem CSS würde man .inputField:focus nutzen. Hier inline simuliert durch Border-Color Logik im JSX.
    mainButton: {
      width: '100%',
      padding: '15px',
      marginTop: '10px',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: 'white',
      cursor: 'pointer',
      // Gradient Button passend zum Modus
      background: mode === 'login' 
        ? 'linear-gradient(135deg, #646cff, #bb86fc)' 
        : 'linear-gradient(135deg, #03dac6, #00a896)',
      boxShadow: mode === 'login' 
        ? '0 4px 15px rgba(100, 108, 255, 0.4)'
        : '0 4px 15px rgba(3, 218, 198, 0.4)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    switchButton: {
      background: 'none', border: 'none', color: '#bb86fc', 
      padding: '5px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none',
      fontSize: '0.9rem', marginTop: '20px', display: 'inline-block'
    },
    alertBox: {
      padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem',
      animation: 'fadeIn 0.3s ease-in-out', // Simple Animation
    }
  };

  return (
    <div style={styles.container}>
      {/* Kleiner CSS Trick für die Animation der Alerts */}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={styles.card}>
        {/* Logo / Titel Bereich */}
        <div style={{fontSize: '3rem', marginBottom: '0px'}}>🍹</div>
        <h1 style={styles.titleGradient}>Getränke-Bot</h1>
        <p style={styles.subTitle}>
          {mode === 'login' ? 'Betreiber Zugang' : 'Neuen Betreiber anlegen'}
        </p>
        
        {/* Fehlermeldungen / Erfolgsmeldungen mit Animation */}
        {error && <div style={{...styles.alertBox, background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid #ff4444'}}>⚠️ {error}</div>}
        {successMsg && <div style={{...styles.alertBox, background: 'rgba(3, 218, 198, 0.1)', color: '#03dac6', border: '1px solid #03dac6'}}>✅ {successMsg}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          
          {/* Username Feld mit Icon */}
          <div style={styles.inputGroup}>
            <span style={styles.inputIcon}>👤</span>
            <input 
              type="text" 
              placeholder="Benutzername"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={styles.inputField}
              onFocus={(e) => e.target.style.borderColor = mode === 'login' ? '#bb86fc' : '#03dac6'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />
          </div>

          {/* Passwort Feld mit Icon */}
          <div style={styles.inputGroup}>
            <span style={styles.inputIcon}>🔒</span>
            <input 
              type="password" 
              placeholder="Passwort"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={styles.inputField}
              onFocus={(e) => e.target.style.borderColor = mode === 'login' ? '#bb86fc' : '#03dac6'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />
          </div>

          {/* Master Passwort (nur bei Register) */}
          {mode === 'register' && (
            <div style={{...styles.inputGroup, marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px'}}>
              <label style={{display:'block', marginBottom:'10px', color: '#03dac6', fontSize:'0.9rem'}}>Autorisierung benötigt:</label>
              <div style={{position: 'relative'}}>
                <span style={{...styles.inputIcon, color: '#03dac6'}}>🔑</span>
                <input 
                  type="password" 
                  value={masterInput} 
                  onChange={e => setMasterInput(e.target.value)} 
                  placeholder="Master-Key" 
                  required 
                  style={{...styles.inputField, background: '#1a3a3a'}}
                  onFocus={(e) => e.target.style.borderColor = '#03dac6'}
                />
               </div>
            </div>
          )}

          {/* Der Haupt-Button mit Hover-Effekt (simuliert durch onMouseEnter/Leave) */}
          <button 
            type="submit" 
            style={styles.mainButton}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1'; }}
          >
            {mode === 'login' ? '🚀 Einloggen' : '🛡️ User erstellen'}
          </button>
        </form>

        {/* Umschalter */}
        <div style={{marginTop: '25px', fontSize: '0.9rem', color: '#888'}}>
          {mode === 'login' ? (
            <p>Neu hier? <button onClick={() => switchMode('register')} style={styles.switchButton}>Account erstellen</button></p>
          ) : (
            <p>Zurück zum <button onClick={() => switchMode('login')} style={{...styles.switchButton, color: '#646cff'}}>Login</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;