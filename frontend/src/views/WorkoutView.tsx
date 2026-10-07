import React from 'react';
import { theme } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function WorkoutView() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 relative z-10">
      
      {/* Nagłówek */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2">
          Twój <span className={theme.text.accent}>Trening</span>
        </h1>
        <p className={`${theme.text.secondary} text-sm font-medium tracking-wide`}>
          Wybierz gotowy plan lub rozpocznij z czystą kartą.
        </p>
      </section>

      {/* Szybki start */}
      <section>
        <Card className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-[#ccff00]/20 bg-zinc-900/40">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-white mb-2">Pusty trening</h2>
            <p className={`${theme.text.secondary} text-sm`}>
              Zacznij od zera i dodawaj ćwiczenia na bieżąco. Idealne na spontaniczną sesję.
            </p>
          </div>
          <Button className="w-full sm:w-auto px-8 py-4">
            <span className="text-xl">⚡</span> Rozpocznij
          </Button>
        </Card>
      </section>

      {/* Szablony Treningowe */}
      <section>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">
          Moje Szablony
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          
          {/* Szablon 1 */}
          <Card className="p-5 flex flex-col h-full hover:border-zinc-700 transition-colors group cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#ccff00] transition-colors">
                  Push Day
                </h3>
                <p className={`${theme.text.secondary} text-xs mt-1`}>Klatka, barki, triceps</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-zinc-400">
                📋
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-zinc-800/60 flex justify-between items-center">
              <p className="text-xs font-bold text-zinc-500">6 ćwiczeń</p>
              <span className="text-xs font-bold text-[#ccff00] opacity-0 group-hover:opacity-100 transition-opacity">
                Start →
              </span>
            </div>
          </Card>

          {/* Szablon 2 */}
          <Card className="p-5 flex flex-col h-full hover:border-zinc-700 transition-colors group cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#ccff00] transition-colors">
                  Pull Day
                </h3>
                <p className={`${theme.text.secondary} text-xs mt-1`}>Plecy, biceps, tył barku</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-zinc-400">
                📋
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-zinc-800/60 flex justify-between items-center">
              <p className="text-xs font-bold text-zinc-500">5 ćwiczeń</p>
              <span className="text-xs font-bold text-[#ccff00] opacity-0 group-hover:opacity-100 transition-opacity">
                Start →
              </span>
            </div>
          </Card>

          {/* Dodaj nowy szablon */}
          <Card className="p-5 flex flex-col h-full hover:border-zinc-700 transition-colors group cursor-pointer border-dashed border-2 bg-transparent justify-center items-center hover:bg-zinc-900/30 min-h-[160px]">
            <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 group-hover:text-zinc-950 group-hover:bg-[#ccff00] group-hover:border-[#ccff00] transition-all">
              <span className="text-2xl pb-1">+</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">
              Nowy Plan
            </h3>
          </Card>

        </div>
      </section>

    </div>
  );
}