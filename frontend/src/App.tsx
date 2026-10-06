import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { InstallGuide } from './components/InstallGuide';

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

  if (!token) {
    return (
      <AuthView 
        onLoginSuccess={(newToken, user) => {
          useAuthStore.setState({ 
            token: newToken, 
            currentUserName: user.name 
          });
        }} 
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'home': return <Dashboard />;
      case 'workout': return <WorkoutView />;
      case 'stats': return <StatsView />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  // Zaktualizowane klasy bazujące na Cyber Lime i głębokiej czerni
  const navItemBase = "flex-1 md:flex-none py-3.5 px-2 md:px-5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 text-center md:text-left cursor-pointer";
  const navItemActive = "bg-lime-400 text-black shadow-[0_0_15px_rgba(204,255,0,0.15)]"; 
  const navItemInactive = "text-zinc-500 hover:text-white hover:bg-zinc-900";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans selection:bg-lime-400 selection:text-black">
      
      {/* 📱 TOP BAR (Tylko na telefonie) */}
      <header className="bg-zinc-950/80 p-4 flex justify-between items-center md:hidden shadow-md z-10 border-b border-zinc-900 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-2">
          <img src="/img/icon-512.png" alt="Logo" className="w-8 h-8 rounded-lg" />
          <div className="font-black text-sm uppercase italic tracking-tight">
            Hi, <span className="text-lime-400">{currentUserName}</span>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 hover:text-rose-400 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors text-zinc-400"
        >
          Wyloguj
        </button>
      </header>

      {/* 💻 SIDEBAR (Tylko na tabletach/PC) */}
      <aside className="hidden md:flex flex-col w-72 bg-zinc-950 border-r border-zinc-900 p-5 z-10 shadow-2xl">
        <div className="flex items-center gap-3 font-black text-2xl mb-8 px-2 tracking-tight text-white uppercase italic">
          <img src="/img/icon-512.png" alt="Logo" className="w-10 h-10 rounded-xl" />
          <span>Gym <span className="text-lime-400">Tracker</span></span>
        </div>
        
        <div className="mb-10 px-3 py-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Zalogowano jako</div>
          <div className="text-white font-black text-lg tracking-wide">{currentUserName}</div>
        </div>
        
        <nav className="flex flex-col gap-2.5 flex-1">
          <button onClick={() => setCurrentView('home')} className={`${navItemBase} ${currentView === 'home' ? navItemActive : navItemInactive}`}>Pulpit</button>
          <button onClick={() => setCurrentView('workout')} className={`${navItemBase} ${currentView === 'workout' ? navItemActive : navItemInactive}`}>Treningi</button>
          <button onClick={() => setCurrentView('stats')} className={`${navItemBase} ${currentView === 'stats' ? navItemActive : navItemInactive}`}>Statystyki</button>
          <button onClick={() => setCurrentView('settings')} className={`${navItemBase} ${currentView === 'settings' ? navItemActive : navItemInactive}`}>Ustawienia</button>
        </nav>

        <button 
          onClick={logout} 
          className="mt-auto px-5 py-4 bg-zinc-900 hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-left text-zinc-400 hover:text-rose-400"
        >
          Wyloguj się
        </button>
      </aside>
      
      {/* 🏋️ GŁÓWNA ZAWARTOŚĆ (Widoki) */}
      <main className="flex-1 overflow-y-auto p-4 pb-28 md:pb-8 md:p-8 w-full max-w-7xl mx-auto relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-lime-500/5 rounded-full blur-[120px] pointer-events-none" />
        {renderView()}
      </main>

      {/* 📱 BOTTOM NAVIGATION (Tylko na telefonie) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-950/95 border-t border-zinc-900 p-3 pb-safe flex gap-2 z-20 backdrop-blur-xl">
        <button onClick={() => setCurrentView('home')} className={`${navItemBase} ${currentView === 'home' ? navItemActive : navItemInactive}`}>Pulpit</button>
        <button onClick={() => setCurrentView('workout')} className={`${navItemBase} ${currentView === 'workout' ? navItemActive : navItemInactive}`}>Trening</button>
        <button onClick={() => setCurrentView('stats')} className={`${navItemBase} ${currentView === 'stats' ? navItemActive : navItemInactive}`}>Staty</button>
        <button onClick={() => setCurrentView('settings')} className={`${navItemBase} ${currentView === 'settings' ? navItemActive : navItemInactive}`}>Menu</button>
      </nav>

      {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}
    </div>
  );
}