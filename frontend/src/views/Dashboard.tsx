import { useEffect, useState } from 'react';

import { useAuthStore } from '../store/useAuthStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { authFetch, API_URL } from '../api/client';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';

interface RecentWorkout {
  id: number;
  name: string;
  completedAt: string;
  durationMinutes: number;
  exerciseCount: number;
}

interface WeeklyVolume {
  week: string;
  total: number;
}

interface DashboardData {
  workoutsThisMonth: number;
  totalVolume: number;
  favoriteMuscle: string;
  recentWorkouts: RecentWorkout[];
  volume: WeeklyVolume[];
}

interface DashboardProps {
  onViewHistory?: () => void;
}

function formatRelativeDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const daysAgo = Math.floor(
    (today.getTime() - date.getTime()) / 86_400_000
  );

  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatVolumeInTons(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(value / 1000);
}

function formatWeek(week: string): string {
  const weekNumber = week.split('-')[1];
  return weekNumber ? `W${Number(weekNumber)}` : week;
}

export default function Dashboard({ onViewHistory }: DashboardProps) {
  const { currentUserName } = useAuthStore();
  const {
    startWorkout,
    isStarting,
    error: workoutError,
  } = useWorkoutStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authFetch(`${API_URL}/dashboard`);

        if (!response.ok) {
          throw new Error(`Dashboard request failed: ${response.status}`);
        }

        const result = (await response.json()) as DashboardData;

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        console.error('Dashboard loading error:', err);

        if (!cancelled) {
          setError('Could not load your dashboard.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const handleStartWorkout = async () => {
    await startWorkout({
      name: 'Empty Workout',
    });
  };

  const weeklyVolume = data?.volume ?? [];
  const maxVolume = Math.max(
    1,
    ...weeklyVolume.map((point) => point.total)
  );

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

      {isLoading && (
        <Card className="p-5">
          <p className="text-sm text-muted">
            Loading your dashboard...
          </p>
        </Card>
      )}

      {error && (
        <Card className="border-danger/20 bg-danger/5 p-5">
          <p className="text-sm text-danger">{error}</p>

          <Button
            variant="secondary"
            onClick={() => setRetryKey((current) => current + 1)}
            className="mt-4 w-auto px-4"
          >
            Try Again
          </Button>
        </Card>
      )}

      {data && !error && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            <StatCard
              title="Workouts This Month"
              value={data.workoutsThisMonth}
              glowColor="lime"
            />

            <StatCard
              title="Total Volume"
              value={
                <>
                  {formatVolumeInTons(data.totalVolume)}
                  <span className="ml-1 text-lg text-subtle">t</span>
                </>
              }
              glowColor="blue"
            />

            <StatCard
              title="Top Muscle (30 Days)"
              value={data.favoriteMuscle || '—'}
              glowColor="rose"
            />

            <Button
              className="h-full flex-col justify-center py-6"
              onClick={handleStartWorkout}
              disabled={isStarting}
            >
              <span className="text-xs font-black uppercase tracking-widest">
                {isStarting ? 'Starting...' : 'Start Workout'}
              </span>
            </Button>
          </section>

          {workoutError && (
            <Card className="border-danger/20 bg-danger/5 p-4">
              <p className="text-sm text-danger">{workoutError}</p>
            </Card>
          )}

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="p-5 sm:p-6">
              <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-subtle">
                Recent Workouts
              </h2>

              {data.recentWorkouts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">
                  No completed workouts yet. Finish your first session to see it here.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.recentWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="border-b border-border/60 pb-3 last:border-0"
                    >
                      <div className="text-sm font-bold text-foreground">
                        {workout.name}
                      </div>

                      <div className="mt-1 text-xs text-muted">
                        {formatRelativeDate(workout.completedAt)}
                        {' · '}
                        {workout.durationMinutes > 0
                          ? `${workout.durationMinutes} min`
                          : 'Under 1 min'}
                      </div>

                      <div className="mt-1 text-xs text-subtle">
                        {workout.exerciseCount}{' '}
                        {workout.exerciseCount === 1
                          ? 'exercise'
                          : 'exercises'}
                      </div>
                    </div>
                  ))}

                  {onViewHistory && (
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={onViewHistory}
                    >
                      View Stats
                    </Button>
                  )}
                </div>
              )}
            </Card>

            <Card className="flex min-h-[300px] flex-col p-5 sm:p-6 lg:col-span-2">
              <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-subtle">
                Weekly Training Volume
              </h2>

              {weeklyVolume.length === 0 ||
              weeklyVolume.every((point) => point.total <= 0) ? (
                <div className="relative flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/50 p-8 text-center">
                  <p className="text-sm text-muted">
                    No training volume recorded yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col">
                  <p className="mb-4 text-xs text-muted">
                    Weight × reps per week, in kilograms.
                  </p>

                  <div className="flex h-52 items-end gap-3 border-b border-border pb-2">
                    {weeklyVolume.map((point) => {
                      const barHeight = (point.total / maxVolume) * 100;

                      return (
                        <div
                          key={point.week}
                          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                          title={`${formatWeek(point.week)}: ${formatNumber(point.total)} kg`}
                        >
                          <span className="text-[10px] font-bold text-muted">
                            {formatNumber(point.total)}
                          </span>

                          <div className="flex h-full w-full items-end overflow-hidden rounded-t-md bg-background">
                            <div
                              className="w-full rounded-t-md bg-accent transition-[height]"
                              style={{
                                height: `${barHeight}%`,
                                minHeight: point.total > 0 ? '4px' : '0',
                              }}
                            />
                          </div>

                          <span className="whitespace-nowrap text-[10px] text-subtle">
                            {formatWeek(point.week)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}