import React from 'react';

export type TabOption = 'home' | 'config' | 'admin';

interface NavigationProps {
  activeTab: TabOption;
  setActiveTab: (tab: TabOption) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="main-nav">
      {/* Home Button */}
      <button 
        className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} 
        onClick={() => setActiveTab('home')}
      >
        <span className="nav-icon">🏠</span>
        <span>Dashboard</span>
      </button>

      {/* Rezepte Button */}
      <button 
        className={`nav-btn ${activeTab === 'config' ? 'active' : ''}`} 
        onClick={() => setActiveTab('config')}
      >
        <span className="nav-icon">⚙️</span>
        <span>Rezepte</span>
      </button>

      {/* Admin Button */}
      <button 
        className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`} 
        onClick={() => setActiveTab('admin')}
      >
        <span className="nav-icon">🎰</span>
        <span>Admin</span>
      </button>
    </nav>
  );
};

export default Navigation;