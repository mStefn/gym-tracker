import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { InstallGuide } from './components/InstallGuide';

// Importy widoków 
import Dashboard from './views/Dashboard';
import WorkoutView from './views/WorkoutView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import AuthView from './views/AuthView';

type View = 'home' | 'workout' | 'stats' | 'settings';

export default function App() {
  const { token, currentUserName, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<View>('home');
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // PWA & Mobile vh fix
  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    setAppHeight();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      });
    }

    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  // Ochrona tras - niezalogowany widzi tylko AuthView
  if (!token) {
    return <AuthView />;
  }

  // Routing widoków
  const renderView = () => {
    switch (currentView) {
      case 'home': return <Dashboard />;
      case 'workout': return <WorkoutView />;
      case 'stats': return <StatsView />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  // Zmienne pomocnicze dla klas Tailwinda (żeby nie pisać tego 4 razy)
  const navItemBase = "flex-1 md:flex-none py-3 px-2 md:px-4 rounded-xl text-sm font-semibold transition-colors duration-200 text-center md:text-left";
  const navItemActive = "bg-gym-primary text-white shadow-md";
  const navItemInactive = "text-gray-400 hover:text-white hover:bg-white/5";

  return (
    <div className="min-h-screen bg-gym-dark text-white flex flex-col md:flex-row font-sans selection:bg-gym-primary">
      
      {/* 📱 TOP BAR (Tylko na telefonie) */}
      <header className="bg-gym-card p-4 flex justify-between items-center md:hidden shadow-md z-10 border-b border-white/5">
        <div className="font-bold text-lg">Witaj, {currentUserName}</div>
        <button 
          onClick={logout} 
          className="px-4 py-2 bg-white/5 hover:bg-gym-danger rounded-lg text-sm font-semibold transition-colors"
        >
          Wyloguj
        </button>
      </header>

      {/* 💻 SIDEBAR (Tylko na tabletach/PC - md:flex) */}
      <aside className="hidden md:flex flex-col w-64 bg-gym-card border-r border-white/5 p-4 z-10">
        <div className="font-black text-2xl mb-8 px-2 tracking-tight text-gym-primary">Gym Tracker</div>
        <div className="mb-8 px-2 text-gray-400">Zalogowany jako <br/><span className="text-white font-bold">{currentUserName}</span></div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button onClick={() => setCurrentView('home')} className={`${navItemBase} ${currentView === 'home' ? navItemActive : navItemInactive}`}>Pulpit</button>
          <button onClick={() => setCurrentView('workout')} className={`${navItemBase} ${currentView === 'workout' ? navItemActive : navItemInactive}`}>Treningi</button>
          <button onClick={() => setCurrentView('stats')} className={`${navItemBase} ${currentView === 'stats' ? navItemActive : navItemInactive}`}>Statystyki</button>
          <button onClick={() => setCurrentView('settings')} className={`${navItemBase} ${currentView === 'settings' ? navItemActive : navItemInactive}`}>Ustawienia</button>
        </nav>

        <button onClick={logout} className="mt-auto px-4 py-3 bg-white/5 hover:bg-gym-danger hover:text-white rounded-xl text-sm font-semibold transition-colors text-left">
          Wyloguj się
        </button>
      </aside>
      
      {/* 🏋️ GŁÓWNA ZAWARTOŚĆ (Widoki) */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4 w-full max-w-7xl mx-auto">
        {renderView()}
      </main>

      {/* 📱 BOTTOM NAVIGATION (Tylko na telefonie) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-gym-card border-t border-white/5 p-2 flex gap-1 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        <button onClick={() => setCurrentView('home')} className={`${navItemBase} ${currentView === 'home' ? navItemActive : navItemInactive}`}>Pulpit</button>
        <button onClick={() => setCurrentView('workout')} className={`${navItemBase} ${currentView === 'workout' ? navItemActive : navItemInactive}`}>Treningi</button>
        <button onClick={() => setCurrentView('stats')} className={`${navItemBase} ${currentView === 'stats' ? navItemActive : navItemInactive}`}>Statystyki</button>
        <button onClick={() => setCurrentView('settings')} className={`${navItemBase} ${currentView === 'settings' ? navItemActive : navItemInactive}`}>Ustaw. </button>
      </nav>

      {/* Instrukcja instalacji PWA pokazana warunkowo */}
      {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}
    </div>
  );
}