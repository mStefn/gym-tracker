import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { InstallGuide } from './components/InstallGuide';
import { Button } from './components/ui/Button';

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
      document.documentElement.style.setProperty(
        '--app-height',
        `${window.innerHeight}px`
      );
    };

    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    setAppHeight();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          newWorker?.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
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
            currentUserName: user.name,
          });
        }}
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Dashboard />;
      case 'workout':
        return <WorkoutView />;
      case 'stats':
        return <StatsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  const navItemBase =
    'flex-1 md:flex-none py-3.5 px-2 md:px-5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 text-center md:text-left cursor-pointer';

  const navItemActive =
    'bg-[#ccff00] text-zinc-950 shadow-[0_0_15px_rgba(204,255,0,0.4)]';

  const navItemInactive =
    'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900';

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans selection:bg-[#ccff00] selection:text-black md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/80 p-4 shadow-md backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <img
            src="/img/icon-512.png"
            alt="Gym Tracker Logo"
            className="h-8 w-8 rounded-lg"
          />

          <div className="text-sm font-black uppercase italic tracking-tight">
            Hi, <span className="text-[#ccff00]">{currentUserName}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
        >
          Sign Out
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="z-10 hidden w-72 flex-col border-r border-zinc-900 bg-zinc-950 p-5 shadow-2xl md:flex">
        <div className="mb-8 flex items-center gap-3 px-2 text-2xl font-black uppercase italic tracking-tight text-white">
          <img
            src="/img/icon-512.png"
            alt="Gym Tracker Logo"
            className="h-10 w-10 rounded-xl"
          />

          <span>
            Gym <span className="text-[#ccff00]">Tracker</span>
          </span>
        </div>

        <div className="mb-10 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 px-3 py-4">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Logged in as
          </div>

          <div className="text-lg font-black tracking-wide text-white">
            {currentUserName}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className={`${navItemBase} ${
              currentView === 'home'
                ? navItemActive
                : navItemInactive
            }`}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('workout')}
            className={`${navItemBase} ${
              currentView === 'workout'
                ? navItemActive
                : navItemInactive
            }`}
          >
            Workouts
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('stats')}
            className={`${navItemBase} ${
              currentView === 'stats'
                ? navItemActive
                : navItemInactive
            }`}
          >
            Stats
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('settings')}
            className={`${navItemBase} ${
              currentView === 'settings'
                ? navItemActive
                : navItemInactive
            }`}
          >
            Settings
          </button>
        </nav>

        <Button variant="danger" onClick={logout} className="mt-auto">
          Sign Out
        </Button>
      </aside>

      {/* Main content */}
      <main className="relative mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-4 pb-28 md:p-8 md:pb-8">
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[#ccff00]/5 blur-[120px]" />

        {renderView()}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 z-20 flex w-full gap-2 border-t border-zinc-900 bg-zinc-950/95 p-3 pb-safe backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setCurrentView('home')}
          className={`${navItemBase} ${
            currentView === 'home'
              ? navItemActive
              : navItemInactive
          }`}
        >
          Home
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('workout')}
          className={`${navItemBase} ${
            currentView === 'workout'
              ? navItemActive
              : navItemInactive
          }`}
        >
          Workout
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('stats')}
          className={`${navItemBase} ${
            currentView === 'stats'
              ? navItemActive
              : navItemInactive
          }`}
        >
          Stats
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('settings')}
          className={`${navItemBase} ${
            currentView === 'settings'
              ? navItemActive
              : navItemInactive
          }`}
        >
          Menu
        </button>
      </nav>

      {showInstallGuide && (
        <InstallGuide onClose={() => setShowInstallGuide(false)} />
      )}
    </div>
  );
}