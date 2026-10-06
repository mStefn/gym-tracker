import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function Dashboard() {
  const { currentUserName } = useAuthStore();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 relative z-10">
      
      {/* Nagłówek powitalny */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2">
          Gotowy na <span className="text-lime-400">wycisk</span>?
        </h1>
        <p className="text-zinc-400 text-sm font-medium tracking-wide">
          Witaj z powrotem, {currentUserName}. Oto Twoje dzisiejsze podsumowanie.
        </p>
      </section>

      {/* Główne karty ze statystykami */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-lime-400/10 blur-[20px] rounded-full group-hover:bg-lime-400/20 transition-all" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Treningi w tym msc</span>
          <span className="text-3xl sm:text-4xl font-black text-white">12</span>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-[20px] rounded-full group-hover:bg-blue-500/20 transition-all" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Całkowity Tonaż</span>
          <span className="text-3xl sm:text-4xl font-black text-white">42<span className="text-lg text-zinc-500">t</span></span>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 blur-[20px] rounded-full group-hover:bg-rose-500/20 transition-all" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Ulubiona partia</span>
          <span className="text-2xl sm:text-3xl font-black text-white truncate">Klatka P.</span>
        </div>

        <div className="bg-lime-400 border border-lime-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-center items-center cursor-pointer hover:bg-lime-300 transition-colors shadow-[0_0_20px_rgba(204,255,0,0.15)]">
          <span className="text-3xl mb-1">⚡</span>
          <span className="text-xs font-black text-black uppercase tracking-widest">Rozpocznij Trening</span>
        </div>

      </section>

      {/* Ostatni trening i wykres */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Kolumna lewa: Ostatnia aktywność */}
        <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-3xl p-5 sm:p-6 shadow-xl">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">Ostatni trening</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div>
                <div className="text-white font-bold text-sm">Push Day (Klatka, Barki, Triceps)</div>
                <div className="text-zinc-500 text-xs mt-1">2 dni temu • 1h 15m</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-lime-400 border border-zinc-800">
                PR
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div>
                <div className="text-white font-bold text-sm">Leg Day (Siła)</div>
                <div className="text-zinc-500 text-xs mt-1">5 dni temu • 1h 30m</div>
              </div>
            </div>

            <button className="w-full py-3 mt-2 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider hover:text-white hover:border-zinc-600 transition-colors">
              Zobacz całą historię
            </button>
          </div>
        </div>

        {/* Kolumna Prawa: Miejsce na wykres */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col min-h-[300px]">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">Objętość w czasie</h2>
          
          <div className="flex-1 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center bg-zinc-900/20 relative overflow-hidden">
            {/* Ozdobna siatka w tle (mockup wykresu) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest z-10 bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-800">
              Wkrótce: Wykres Recharts
            </p>
          </div>
        </div>

      </section>

    </div>
  );
}