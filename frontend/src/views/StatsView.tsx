import React from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';

export default function StatsView() {
  const gridPatternStyle = {
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  };

  return (
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <section>
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Your <span className="text-[#ccff00]">Stats</span>
        </h1>

        <p className="text-sm font-medium tracking-wide text-zinc-400">
          Analyze your progress and beat your personal records. Numbers
          don't lie.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <StatCard
          title="Completed Workouts"
          value="128"
          glowColor="lime"
        />

        <StatCard
          title="Current Streak"
          value={
            <>
              4
              <span className="ml-1 text-lg text-zinc-500">weeks</span>
            </>
          }
          glowColor="blue"
        />

        <StatCard
          title="Most in a Month"
          value="18"
          glowColor="lime"
        />

        <StatCard
          title="Favorite Exercise"
          value="Deadlift"
          glowColor="rose"
        />
      </section>

      <section>
        <Card className="flex min-h-[350px] flex-col p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Training Volume (Last 6 Months)
            </h2>

            <select className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs font-bold text-zinc-400 focus:border-[#ccff00] focus:outline-none">
              <option>Total Volume</option>
              <option>Workout Count</option>
              <option>Chest Volume</option>
            </select>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-xl border-2 border-dashed border-zinc-800/50 bg-zinc-950/50">
            <div
              className="absolute inset-0"
              style={gridPatternStyle}
            />

            <div className="relative z-10 flex h-full items-center justify-center text-center">
              <p className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 backdrop-blur-md">
                Line chart coming soon
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Recent Personal Records
          </h2>

          <div className="space-y-3">
            {[
              {
                name: 'Barbell Bench Press',
                value: '100 kg x 5',
                date: '2 days ago',
              },
              {
                name: 'Barbell Squat',
                value: '140 kg x 3',
                date: '1 week ago',
              },
              {
                name: 'Conventional Deadlift',
                value: '160 kg x 1',
                date: '2 weeks ago',
              },
            ].map((pr) => (
              <div
                key={pr.name}
                className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-3 transition-colors hover:border-[#ccff00]/30"
              >
                <div>
                  <div className="text-sm font-bold text-white">
                    {pr.name}
                  </div>

                  <div className="mt-1 text-xs text-zinc-400">
                    {pr.date}
                  </div>
                </div>

                <div className="text-lg font-black text-[#ccff00]">
                  {pr.value}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Muscle Group Distribution (30 Days)
          </h2>

          <div className="space-y-4">
            {[
              { name: 'Chest', percent: 35 },
              { name: 'Back', percent: 25 },
              { name: 'Legs', percent: 20 },
              { name: 'Shoulders & Arms', percent: 20 },
            ].map((muscle) => (
              <div key={muscle.name}>
                <div className="mb-2 flex justify-between text-xs font-bold">
                  <span className="text-white">{muscle.name}</span>
                  <span className="text-[#ccff00]">
                    {muscle.percent}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-950">
                  <div
                    className="h-full rounded-full bg-[#ccff00]"
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