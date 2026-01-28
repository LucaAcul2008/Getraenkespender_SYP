import { useState } from 'react';
import Navigation, { type TabOption } from './components/Navigation';
import ConfigForm from './components/ConfigForm';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabOption>('home');

  return (
    <div className="app-container">
      {/* 1. Die Navigation (landet im Grid-Bereich "nav") */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Der Inhalt (landet im Grid-Bereich "content") */}
      <main className="content">
        <h1>🍹 Getränke-Bot 3000</h1>
        
        {activeTab === 'home' && <Dashboard />}
        {activeTab === 'config' && <ConfigForm />}
        {activeTab === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}

export default App;