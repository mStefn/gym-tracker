import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';

export default function Dashboard() {
  const { currentUserName } = useAuthStore();

  return (
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <section>
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
          Ready to <span className="text-accent">train</span>?
        </h1>

        <p className="text-sm font-medium tracking-wide text-muted">
          Welcome back, {currentUserName}. Here is your daily summary.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <StatCard
          title="Workouts This Month"
          value="12"
          glowColor="lime"
        />

        <StatCard
          title="Total Volume"
          value={
            <>
              42
              <span className="ml-1 text-lg text-subtle">t</span>
            </>
          }
          glowColor="blue"
        />

        <StatCard
          title="Favorite Muscle"
          value="Chest"
          glowColor="rose"
        />

        <Button className="h-full flex-col justify-center py-6">
          <span className="text-xs font-black uppercase tracking-widest">
            Start Workout
          </span>
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-subtle">
            Recent Workout
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <div className="text-sm font-bold text-foreground">
                  Push Day (Chest, Shoulders, Triceps)
                </div>

                <div className="mt-1 text-xs text-muted">
                  2 days ago • 1h 15m
                </div>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-accent">
                PR
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <div className="text-sm font-bold text-foreground">
                  Leg Day (Strength)
                </div>

                <div className="mt-1 text-xs text-muted">
                  5 days ago • 1h 30m
                </div>
              </div>
            </div>

            <Button variant="secondary" className="mt-4">
              View Full History
            </Button>
          </div>
        </Card>

        <Card className="flex min-h-[300px] flex-col p-5 sm:p-6 lg:col-span-2">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-subtle">
            Volume Over Time
          </h2>

          <div className="relative flex-1 overflow-hidden rounded-xl border-2 border-dashed border-border/50 bg-background/50">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

            <div className="relative z-10 flex h-full items-center justify-center">
              <p className="rounded-lg border border-border bg-surface/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted backdrop-blur-md">
                Coming soon: Recharts
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}