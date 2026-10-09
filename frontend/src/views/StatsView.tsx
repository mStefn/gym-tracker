import { useEffect, useState } from 'react';

import { authFetch, API_URL } from '../api/client';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';

import TrainingTrendChart, {
  type ChartMetric,
  type MonthlyTrendPoint,
} from '../components/Stats/TrainingTrendChart';

interface StatsSummary {
  completedWorkouts: number;
  currentStreakWeeks: number;
  mostWorkoutsInMonth: number;
  favoriteExercise: string;
}

interface PersonalRecord {
  name: string;
  weight: number;
  reps: number;
  date: string;
}

interface MuscleDistribution {
  category: string;
  count: number;
  percent: number;
}

interface AdvancedStats {
  summary: StatsSummary;
  monthlyTrend: MonthlyTrendPoint[];
  personalRecords: PersonalRecord[];
  distribution: MuscleDistribution[];
}

function formatWeight(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRelativeDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
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

export default function StatsView() {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [metric, setMetric] = useState<ChartMetric>('totalVolume');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authFetch(
          `${API_URL}/stats/advanced`
        );

        if (!response.ok) {
          throw new Error('Failed to load statistics.');
        }

        const data = (await response.json()) as AdvancedStats;

        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        console.error('Stats loading error:', err);

        if (!cancelled) {
          setError('Could not load your statistics.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  return (
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <section>
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
          Your <span className="text-accent">Stats</span>
        </h1>

        <p className="text-sm font-medium tracking-wide text-muted">
          Analyze your progress and beat your personal records. Numbers don't lie.
        </p>
      </section>

      {isLoading && (
        <Card className="p-6">
          <p className="text-sm text-muted">
            Loading your statistics...
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

      {!isLoading && !error && stats && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            <StatCard
              title="Completed Workouts"
              value={stats.summary.completedWorkouts}
              glowColor="lime"
            />

            <StatCard
              title="Current Streak"
              value={
                <>
                  {stats.summary.currentStreakWeeks}
                  <span className="ml-1 text-lg text-subtle">
                    weeks
                  </span>
                </>
              }
              glowColor="blue"
            />

            <StatCard
              title="Most in a Month"
              value={stats.summary.mostWorkoutsInMonth}
              glowColor="lime"
            />

            <StatCard
              title="Favorite Exercise"
              value={stats.summary.favoriteExercise || '—'}
              glowColor="rose"
            />
          </section>

          <section>
            <TrainingTrendChart
              data={stats.monthlyTrend}
              metric={metric}
              onMetricChange={setMetric}
            />
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-subtle">
                Recent Personal Records
              </h2>

              {stats.personalRecords.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">
                  No personal records yet. Log weighted sets to see your best performances here.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.personalRecords.map((record) => (
                    <div
                      key={`${record.name}-${record.date}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-3 transition-colors hover:border-accent/30"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground">
                          {record.name}
                        </div>

                        <div className="mt-1 text-xs text-muted">
                          {formatRelativeDate(record.date)}
                        </div>
                      </div>

                      <div className="shrink-0 text-right text-lg font-black text-accent">
                        {formatWeight(record.weight)} kg × {record.reps}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-subtle">
                Muscle Group Distribution (30 Days)
              </h2>

              {stats.distribution.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">
                  No training sets logged in the last 30 days.
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.distribution.map((muscle) => (
                    <div key={muscle.category}>
                      <div className="mb-2 flex justify-between gap-3 text-xs font-bold">
                        <span className="text-foreground">
                          {muscle.category}
                        </span>

                        <span className="text-accent">
                          {muscle.percent}%
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-accent transition-[width]"
                          style={{
                            width: `${Math.min(100, muscle.percent)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}