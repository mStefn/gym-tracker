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
    return (
      <AuthView 
        onLoginSuccess={(newToken, user) => {
          // Bezpośrednia aktualizacja store'a po pomyślnym logowaniu
          useAuthStore.setState({ 
            token: newToken, 
            currentUserName: user.name 
          });
        }} 
      />
    );
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

  // Zmienne pomocnicze dla klas Tailwinda
  const navItemBase = "flex-1 md:flex-none py-3 px-2 md:px-4 rounded-xl text-sm font-semibold transition-colors duration-200 text-center md:text-left cursor-pointer";
  const navItemActive = "bg-blue-600 text-white shadow-md"; 
  const navItemInactive = "text-slate-400 hover:text-white hover:bg-slate-800/50";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-500/30">
      
      {/* 📱 TOP BAR (Tylko na telefonie) */}
      <header className="bg-slate-900/90 p-4 flex justify-between items-center md:hidden shadow-md z-10 border-b border-slate-800 backdrop-blur-md">
        <div className="font-bold text-lg text-white">Witaj, {currentUserName}</div>
        <button 
          onClick={logout} 
          className="px-4 py-2 bg-slate-800/80 hover:bg-rose-600 rounded-lg text-sm font-semibold transition-colors text-white"
        >
          Wyloguj
        </button>
      </header>

      {/* 💻 SIDEBAR (Tylko na tabletach/PC - md:flex) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 z-10">
        <div className="flex items-center