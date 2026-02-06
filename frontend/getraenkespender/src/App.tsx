import { useState, useEffect } from 'react';
import Navigation, { type TabOption } from './components/Navigation';
import ConfigForm from './components/ConfigForm';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabOption>('home');

  // Prüfen ob Session noch aktiv ist (optional, hier einfachheitshalber beim Reload logout)
  // Wenn du willst, dass man eingeloggt bleibt, nutze localStorage hier.

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('home');
  };

  // --- WENN NICHT EINGELOGGT -> LOGIN SCREEN ---
  if (!currentUser) {
    return <LoginScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  // --- WENN EINGELOGGT -> APP ---
  return (
    <div className="app-container">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="content">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px', marginBottom: '10px'}}>
          <div style={{fontSize: '0.8rem', color: '#888'}}>
            Betreiber: <strong style={{color: '#fff'}}>{currentUser}</strong>
          </div>
          
          <button 
            onClick={handleLogout} 
            style={{background: 'transparent', border: '1px solid #444', fontSize: '0.8rem', padding: '5px 10px'}}
          >
            Logout 🚪
          </button>
        </div>
        
        {activeTab === 'home' && <Dashboard />}
        {activeTab === 'config' && <ConfigForm />}
        {activeTab === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}

export default App;