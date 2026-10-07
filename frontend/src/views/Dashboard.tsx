import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';

export default function Dashboard() {
  const { currentUserName } = useAuthStore();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 relative z-10">
      
      {/* Nagłówek powitalny */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2">
          Gotowy na <span className={theme.text.accent}>wycisk</span>?
        </h1>
        <p className={`${theme.text.secondary} text-sm font-medium tracking-wide`}>
          Witaj z powrotem, {currentUserName}. Oto Twoje dzisiejsze podsumowanie.
        </p>
      </section>

      {/* Główne karty ze statystykami */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard title="Treningi w tym msc" value="12" glowColor="lime" />
        
        <StatCard 
          title="Całkowity Tonaż" 
          value={<>42<span className="text-lg text-zinc-500 ml-1">t</span></>} 
          glowColor="blue" 
        />
        
        <StatCard title="Ulubiona partia" value="Klatka P." glowColor="rose" />

        <Button className="h-full flex flex-col justify-center items-center py-6">
          <span className="text-3xl mb-1">⚡</span>
          <span className="text-xs font-black uppercase tracking-widest">Rozpocznij Trening</span>
        </Button>
      </section>

      {/* Ostatni trening i wykres */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Kolumna lewa: Ostatnia aktywność */}
        <Card className="lg:col-span-1 p-5 sm:p-6">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">Ostatni trening</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
              <div>
                <div className="text-white font-bold text-sm">Push Day (Klatka, Barki, Triceps)</div>
                <div className={`${theme.text.secondary} text-xs mt-1`}>2 dni temu • 1h 15m</div>
              </div>
              <div className={`w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-bold border border-zinc-800 ${theme.text.accent}`}>
                PR
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
              <div>
                <div className="text-white font-bold text-sm">Leg Day (Siła)</div>
                <div className={`${theme.text.secondary} text-xs mt-1`}>5 dni temu • 1h 30m</div>
              </div>
            </div>

            <Button variant="secondary" className="mt-4">
              Zobacz całą historię
            </Button>
          </div>
        </Card>

        {/* Kolumna Prawa: Miejsce na wykres */}
        <Card className="lg:col-span-2 p-5 sm:p-6 flex flex-col min-h-[300px]">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">Objętość w czasie</h2>
          
          <div className="flex-1 border-2 border-dashed border-zinc-800/50 rounded-xl flex items-center justify-center bg-zinc-950/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <p className={`${theme.text.secondary} text-xs font-bold uppercase tracking-widest z-10 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800`}>
              Wkrótce: Wykres Recharts
            </p>
          </div>
        </Card>

      </section>

    </div>
  );
}