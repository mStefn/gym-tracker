import { useEffect, useState } from 'react';

import { useAuthStore } from './store/useAuthStore';
import { useWorkoutStore } from './store/useWorkoutStore';

import { InstallGuide } from './components/InstallGuide';
import { Button } from './components/ui/Button';

import Dashboard from './views/Dashboard';
import PlansView from './views/PlansView';
import ActiveWorkoutView from './views/ActiveWorkoutView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import AuthView from './views/AuthView';

type View = 'home' | 'workout' | 'stats' | 'settings';

const navItems: { view: View; label: string }[] = [
  { view: 'home', label: 'Dashboard' },
  { view: 'workout', label: 'Workouts' },
  { view: 'stats', label: 'Stats' },
  { view: 'settings', label: 'Settings' },
];

export default function App() {
  const { token, currentUserName, logout } = useAuthStore();

  const {
    workout,
    isRestoring,
    restoreActiveWorkout,
  } = useWorkoutStore();

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

  useEffect(() => {
    if (!token) {
      return;
    }

    restoreActiveWorkout();
  }, [token, restoreActiveWorkout]);

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
        return <PlansView />;

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
    'bg-accent text-background shadow-glow-strong';

  const navItemInactive =
    'text-subtle hover:text-foreground hover:bg-surface';

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans selection:bg-accent selection:text-background md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 p-4 shadow-md backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <img
            src="/img/icon-512.png"
            alt="Gym Tracker Logo"
            className="h-8 w-8 rounded-lg"
          />

          <div className="text-sm font-black uppercase italic tracking-tight">
            Hi, <span className="text-accent">{currentUserName}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted transition-colors hover:border-danger/50 hover:text-danger"
        >
          Sign Out
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="z-10 hidden w-72 flex-col border-r border-border bg-background p-5 shadow-2xl md:flex">
        <div className="mb-8 flex items-center gap-3 px-2 text-2xl font-black uppercase italic tracking-tight text-foreground">
          <img
            src="/img/icon-512.png"
            alt="Gym Tracker Logo"
            className="h-10 w-10 rounded-xl"
          />

          <span>
            Gym <span className="text-accent">Tracker</span>
          </span>
        </div>

        <div className="mb-10 rounded-2xl border border-border/50 bg-surface/50 px-3 py-4">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-subtle">
            Logged in as
          </div>

          <div className="text-lg font-black tracking-wide text-foreground">
            {currentUserName}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2.5">
          {navItems.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => setCurrentView(item.view)}
              className={`${navItemBase} ${
                currentView === item.view
                  ? navItemActive
                  : navItemInactive
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <Button
          variant="danger"
          onClick={logout}
          className="mt-auto"
        >
          Sign Out
        </Button>
      </aside>

      {/* Main content */}
      <main className="relative mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-4 pb-28 md:p-8 md:pb-8">
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[120px]" />

        {isRestoring ? (
          <div className="relative z-10 flex min-h-[60vh] items-center justify-center">
            <p className="text-sm font-bold uppercase tracking-widest text-muted">
              Loading workout...
            </p>
          </div>
        ) : workout?.status === 'active' ? (
          <div className="relative z-10">
            <ActiveWorkoutView />
          </div>
        ) : (
          <div className="relative z-10">
            {renderView()}
          </div>
        )}
      </main>

      {/* Mobile bottom navigation */}
      {workout?.status !== 'active' && (
        <nav className="fixed bottom-0 left-0 z-20 flex w-full gap-2 border-t border-border bg-background/95 p-3 pb-safe backdrop-blur-xl md:hidden">
          {navItems.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => setCurrentView(item.view)}
              className={`${navItemBase} ${
                currentView === item.view
                  ? navItemActive
                  : navItemInactive
              }`}
            >
              {item.view === 'home'
                ? 'Home'
                : item.view === 'workout'
                  ? 'Workout'
                  : item.view === 'stats'
                    ? 'Stats'
                    : 'Menu'}
            </button>
          ))}
        </nav>
      )}

      {showInstallGuide && (
        <InstallGuide onClose={() => setShowInstallGuide(false)} />
      )}
    </div>
  );
}