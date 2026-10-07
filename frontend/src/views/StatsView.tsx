import React from 'react';
import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';

export default function StatsView() {
  // Bezpieczniejsze rozwiązanie dla długich gradientów (unikamy błędu kompilatora)
  const gridPatternStyle = {
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 relative z-10">
      
      {/* Nagłówek */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2">
          Twoje <span className={theme.text.accent}>Statystyki</span>
        </h1>
        <p className={`${theme.text.secondary} text-sm font-medium tracking-wide`}>
          Analizuj swój progres i bij własne rekordy. Liczby nie kłamią.
        </p>
      </section>

      {/* Główne metryki */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard title="Ukończone Treningi" value="128" glowColor="lime" />
        <StatCard title="Obecny Streak" value={<>4<span className="text-lg text-zinc-500 ml-1">tyg</span></>} glowColor="blue" />
        <StatCard title="Najwięcej w msc" value="18" glowColor="lime" />
        <StatCard title="Ulubione ćwiczenie" value="Martwy" glowColor="rose" />
      </section>

      {/* Wykres główny */}
      <section>
        <Card className="p-5 sm:p-6 flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Objętość Treningowa (Ostatnie 6 miesięcy)
            </h2>
            <select className="bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-400 p-2 rounded-lg focus:outline-none focus:border-[#ccff00] cursor-pointer">
              <option>Całkowita objętość</option>
              <option>Ilość treningów</option>
              <option>Tonaż Klatki Piersiowej</option>
            </select>
          </div>
          
          <div className="flex-1 border-2 border-dashed border-zinc-800/50 rounded-xl flex items-center justify-center bg-zinc-950/50 relative overflow-hidden">
            {/* Siatka tła - teraz bezpiecznie wstrzyknięta */}
            <div className="absolute inset-0" style={gridPatternStyle} />
            <div className="z-10 text-center">
              <span className="text-4xl block mb-2">📊</span>
              <p className={`${theme.text.secondary} text-xs font-bold uppercase tracking-widest bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800`}>
                Miejsce na wykres liniowy
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Najnowsze PRy i Aktywność partii */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Kolumna lewa: Personal Records */}
        <Card className="p-5 sm:p-6">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">
            Ostatnie Rekordy (PR)
          </h2>
          <div className="space-y-3">
            {[
              { name: 'Wyciskanie na ławce poziomej', value: '100 kg x 5', date: '2 dni temu' },
              { name: 'Przysiad ze sztangą', value: '140 kg x 3', date: 'Tydzień temu' },
              { name: 'Martwy ciąg klasyczny', value: '160 kg x 1', date: '2 tygodnie temu' }
            ].map((pr, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/60 hover:border-[#ccff00]/30 transition-colors">
                <div>
                  <div className="text-white font-bold text-sm">{pr.name}</div>
                  <div className={`${theme.text.secondary} text-xs mt-1`}>{pr.date}</div>
                </div>
                <div className={`text-lg font-black ${theme.text.accent}`}>
                  {pr.value}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Kolumna prawa: Częstotliwość partii */}
        <Card className="p-5 sm:p-6">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">
            Rozkład partii mięśniowych (30 dni)
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Klatka piersiowa', percent: 35 },
              { name: 'Plecy', percent: 25 },
              { name: 'Nogi', percent: 20 },
              { name: 'Barki & Ramiona', percent: 20 }
            ].map((muscle, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-white">{muscle.name}</span>
                  <span className={theme.text.accent}>{muscle.percent}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#ccff00] rounded-full" 
                    style={{ width: `${muscle.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </section>

    </div>
  );
}