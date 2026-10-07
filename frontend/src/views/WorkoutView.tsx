import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { WorkoutPlanEditor } from '../components/Workout/WorkoutPlanEditor';
import { useWorkoutStore } from '../store/useWorkoutStore';

export default function WorkoutView() {
  const { startWorkout } = useWorkoutStore();
  const [showPlanEditor, setShowPlanEditor] = useState(false);

  if (showPlanEditor) {
    return (
      <WorkoutPlanEditor
        onCancel={() => setShowPlanEditor(false)}
        onSaved={() => setShowPlanEditor(false)}
      />
    );
  }

  return (
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <section>
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
          Your <span className="text-accent">Workout</span>
        </h1>

        <p className="text-sm font-medium tracking-wide text-muted">
          Choose a workout plan or start with a clean slate.
        </p>
      </section>

      <section>
        <Card className="flex flex-col items-center justify-between gap-6 border-accent/20 bg-surface/40 p-6 sm:flex-row sm:p-8">
          <div className="text-center sm:text-left">
            <h2 className="mb-2 text-xl font-bold text-foreground">
              Empty Workout
            </h2>

            <p className="text-sm text-muted">
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
        <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-subtle">
          My Templates
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          <Card
            className="group flex h-full cursor-pointer flex-col p-5 transition-colors hover:border-border-light"
            onClick={() => startWorkout('Push Day')}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                  Push Day
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Chest, shoulders, triceps
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background p-2 text-muted">
                Template
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
              <p className="text-xs font-bold text-subtle">
                6 exercises
              </p>

              <span className="text-xs font-bold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Start
              </span>
            </div>
          </Card>

          <Card
            className="group flex h-full cursor-pointer flex-col p-5 transition-colors hover:border-border-light"
            onClick={() => startWorkout('Pull Day')}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                  Pull Day
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Back, biceps, rear delts
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background p-2 text-muted">
                Template
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
              <p className="text-xs font-bold text-subtle">
                5 exercises
              </p>

              <span className="text-xs font-bold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Start
              </span>
            </div>
          </Card>

          <Card
            className="group flex min-h-[160px] h-full cursor-pointer flex-col items-center justify-center border-2 border-dashed bg-transparent p-5 transition-colors hover:border-border-light hover:bg-surface/30"
            onClick={() => setShowPlanEditor(true)}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-subtle transition-all group-hover:border-accent group-hover:bg-accent group-hover:text-background">
              <span className="text-2xl">+</span>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-widest text-muted transition-colors group-hover:text-foreground">
              New Template
            </h3>
          </Card>
        </div>
      </section>
    </div>
  );
}