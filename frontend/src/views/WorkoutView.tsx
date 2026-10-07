import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useWorkoutStore } from '../store/useWorkoutStore';

export default function WorkoutView() {
  const { startWorkout } = useWorkoutStore();

  return (
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <section>
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Your <span className="text-[#ccff00]">Workout</span>
        </h1>

        <p className="text-sm font-medium tracking-wide text-zinc-400">
          Choose a workout plan or start with a clean slate.
        </p>
      </section>

      <section>
        <Card className="flex flex-col items-center justify-between gap-6 border-[#ccff00]/20 bg-zinc-900/40 p-6 sm:flex-row sm:p-8">
          <div className="text-center sm:text-left">
            <h2 className="mb-2 text-xl font-bold text-white">
              Empty Workout
            </h2>

            <p className="text-sm text-zinc-400">
              Start from scratch and add exercises as you go. Perfect for a
              spontaneous session.
            </p>
          </div>

          <Button
            className="w-full px-8 py-4 text-sm sm:w-auto"
            onClick={() => startWorkout('Empty Workout')}
          >
            START WORKOUT
          </Button>
        </Card>
      </section>

      <section>
        <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-zinc-500">
          My Templates
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          <Card
            className="group flex h-full cursor-pointer flex-col p-5 transition-colors hover:border-zinc-700"
            onClick={() => startWorkout('Push Day')}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white transition-colors group-hover:text-[#ccff00]">
                  Push Day
                </h3>

                <p className="mt-1 text-xs text-zinc-400">
                  Chest, shoulders, triceps
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-400">
                Template
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-zinc-800/60 pt-4">
              <p className="text-xs font-bold text-zinc-500">
                6 exercises
              </p>

              <span className="text-xs font-bold text-[#ccff00] opacity-0 transition-opacity group-hover:opacity-100">
                Start
              </span>
            </div>
          </Card>

          <Card
            className="group flex h-full cursor-pointer flex-col p-5 transition-colors hover:border-zinc-700"
            onClick={() => startWorkout('Pull Day')}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white transition-colors group-hover:text-[#ccff00]">
                  Pull Day
                </h3>

                <p className="mt-1 text-xs text-zinc-400">
                  Back, biceps, rear delts
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-400">
                Template
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-zinc-800/60 pt-4">
              <p className="text-xs font-bold text-zinc-500">
                5 exercises
              </p>

              <span className="text-xs font-bold text-[#ccff00] opacity-0 transition-opacity group-hover:opacity-100">
                Start
              </span>
            </div>
          </Card>

          <Card className="group flex min-h-[160px] h-full cursor-pointer flex-col items-center justify-center border-2 border-dashed bg-transparent p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900/30">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-500 transition-all group-hover:border-[#ccff00] group-hover:bg-[#ccff00] group-hover:text-zinc-950">
              <span className="text-2xl">+</span>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 transition-colors group-hover:text-white">
              New Template
            </h3>
          </Card>
        </div>
      </section>
    </div>
  );
}