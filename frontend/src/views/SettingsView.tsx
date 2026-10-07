import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function SettingsView() {
  const { currentUserName, logout } = useAuthStore();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 relative z-10">
      
      {/* Nagłówek */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2">
          Twoje <span className={theme.text.accent}>Ustawienia</span>
        </h1>
        <p className={`${theme.text.secondary} text-sm font-medium tracking-wide`}>
          Dostosuj profil, preferencje aplikacji i zarządzaj kontem.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Kolumna lewa - Profil i Konto */}
        <div className="space-y-5 sm:space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5 border-b border-zinc-800/60 pb-3">
              Profil Użytkownika
            </h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl font-black ${theme.text.accent}`}>
                {currentUserName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-xl font-bold text-white">{currentUserName}</div>
                <div className={`${theme.text.secondary} text-xs mt-1`}>Konto aktywne</div>
              </div>
            </div>

            <form className="space-y-4">
              <div className={theme.input.wrapper}>
                <label className={theme.input.label}>Nazwa wyświetlana</label>
                <input type="text" className={theme.input.field} defaultValue={currentUserName || ''} />
              </div>
              <div className={theme.input.wrapper}>
                <label className={theme.input.label}>Nowy PIN (Opcjonalnie)</label>
                <input type="password" className={theme.input.field} placeholder="••••" />
              </div>
              <Button type="button" className="mt-2">Zapisz zmiany</Button>
            </form>
          </Card>
        </div>

        {/* Kolumna prawa - Preferencje i Danger Zone */}
        <div className="space-y-5 sm:space-y-6">
          
          <Card className="p-5 sm:p-6">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5 border-b border-zinc-800/60 pb-3">
              Preferencje Aplikacji
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Motyw aplikacji</div>
                  <div className={`${theme.text.secondary} text-xs mt-1`}>Wymuszony tryb mroczny 🦇</div>
                </div>
                {/* Atrapa switcha (włączony) */}
                <div className="w-12 h-6 bg-[#ccff00] rounded-full relative cursor-not-allowed opacity-80">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-zinc-950 rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Jednostki wagi</div>
                  <div className={`${theme.text.secondary} text-xs mt-1`}>Kilogramy (kg)</div>
                </div>
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                  <button className="px-3 py-1 bg-[#ccff00] text-zinc-950 text-xs font-bold rounded-md">KG</button>
                  <button className="px-3 py-1 text-zinc-500 text-xs font-bold rounded-md hover:text-white">LBS</button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6 border-red-500/20 bg-red-500/5">
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-5 border-b border-red-500/20 pb-3">
              Strefa niebezpieczna
            </h2>
            
            <div className="space-y-3">
              <p className={`${theme.text.secondary} text-sm mb-4`}>
                Wylogowanie usunie token sesji. Usunięcie konta jest nieodwracalne i skasuje wszystkie Twoje treningi.
              </p>
              
              <Button variant="secondary" onClick={logout}>
                Wyloguj się
              </Button>
              
              <Button variant="danger">
                Usuń konto i dane
              </Button>
            </div>
          </Card>

        </div>
      </div>

    </div>
  );
}