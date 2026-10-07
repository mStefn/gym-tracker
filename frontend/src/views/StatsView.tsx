import React from 'react';
import { theme } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';

export default function StatsView() {
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
            {/* Siatka tła */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1