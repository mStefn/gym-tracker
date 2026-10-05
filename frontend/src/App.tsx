import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { InstallGuide } from './components/InstallGuide';
import styles from './App.module.css';

// Przykładowe importy widoków (stworzymy je w kolejnych krokach)
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

  // Efekt zajmujący się sprawami z Twojego starego index.html (PWA i mobile vh fix)
  useEffect(() => {
    // Mobile vh fix
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    setAppHeight();

    // Service Worker PWA Register
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.location.reload(); // Nowa wersja wymusza reload
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

  // Jeśli użytkownik nie jest zalogowany, pokaż tylko ekran logowania
  if (!token) {
    return <AuthView />;
  }

  // Renderowanie aktualnego widoku na podstawie stanu
  const renderView = () => {
    switch (currentView) {
      case 'home': return <Dashboard />;
      case 'workout': return <WorkoutView />;
      case 'stats': return <StatsView />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div id="app-container" className={styles.appContainer}>
      <main id="main-content" className={styles.mainContent}>
        
        {/* Odpowiednik Twojego #top-bar */}
        <header className={styles.topBar}>
          <div>Hello, {currentUserName}</div>
          <button onClick={logout} className={styles.btnLogout}>Logout</button>
        </header>
        
        {/* Odpowiednik Twojego #sidebar */}
        <nav className={styles.sidebar}>
          <ul className={styles.navLinks}>
            <li>
              <button 
                onClick={() => setCurrentView('home')} 
                className={`${styles.navItem} ${currentView === 'home' ? styles.active : ''}`}
              >Home</button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('workout')} 
                className={`${styles.navItem} ${currentView === 'workout' ? styles.active : ''}`}
              >Workouts</button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('stats')} 
                className={`${styles.navItem} ${currentView === 'stats' ? styles.active : ''}`}
              >Stats</button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('settings')} 
                className={`${styles.navItem} ${currentView === 'settings' ? styles.active : ''}`}
              >Settings</button>
            </li>
          </ul>
        </nav>
        
        {/* Kontener dynamiczny - zamiast ukrywać CSSem, React ładuje tylko aktywny widok */}
        <div id="exercises" className={styles.viewContainer}>
          {renderView()}
        </div>

      </main>

      {/* Instrukcja instalacji PWA pokazana warunkowo */}
      {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}
    </div>
  );
}