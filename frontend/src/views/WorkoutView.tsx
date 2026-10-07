import { useEffect, useState } from 'react';
import { authFetch, API_URL } from '../api/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { WorkoutPlanEditor } from '../components/Workout/WorkoutPlanEditor';
import { useWorkoutStore } from '../store/useWorkoutStore';

interface WorkoutPlan {
  id: number;
  name: string;
}

export default function WorkoutView() {
  const { startWorkout } = useWorkoutStore();

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlanEditor, setShowPlanEditor] = useState(false);

  const loadPlans = async () => {
    try {
      setError(null);

      const response = await authFetch(`${API_URL}/plans`);

      if (!response.ok) {
        throw new Error('Failed to load workout plans.');
      }

      const data = await response.json();
      setPlans(data);
    } catch (err) {
      console.error('Plans loading error:', err);
      setError('Could not load workout plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handlePlanSaved = async () => {
    setShowPlanEditor(false);
    setIsLoading(true);
    await loadPlans();
  };

  if (showPlanEditor) {
    return (
      <WorkoutPlanEditor
        onCancel={() => setShowPlanEditor(false)}
        onSaved={handlePlanSaved}
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
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-subtle">
            My Templates
          </h2>

          <Button
            variant="secondary"
            onClick={() => setShowPlanEditor(true)}
            className="w-auto px-4 py-2 text-xs"
          >
            + New Template
          </Button>
        </div>

        {isLoading && (
          <Card className="p-6">
            <p className="text-sm text-muted">
              Loading workout plans...
            </p>
          </Card>
        )}

        {!isLoading && error && (
          <Card className="border-danger/20 bg-danger/5 p-6">
            <p className="text-sm text-danger">{error}</p>

            <Button
              variant="secondary"
              onClick={loadPlans}
              className="mt-4 w-auto px-4"
            >
              Try Again
            </Button>
          </Card>
        )}

        {!isLoading && !error && plans.length === 0 && (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-bold text-foreground">
              No workout plans yet
            </h3>

            <p className="mt-2 text-sm text-muted">
              Create your first workout template to get started.
            </p>

            <Button
              onClick={() => setShowPlanEditor(true)}
              className="mx-auto mt-5 w-auto px-6"
            >
              Create First Template
            </Button>
          </Card>
        )}

        {!isLoading && !error && plans.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="group flex h-full flex-col p-5 transition-colors hover:border-border-light"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                      {plan.name}
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      Workout template
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-2 text-xs font-bold text-subtle">
                    PLAN
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="text-xs font-bold text-subtle">
                    Workout Plan
                  </span>

                  <button
                    type="button"
                    onClick={() => startWorkout(plan.name)}
                    className="text-xs font-bold text-accent transition-colors hover:text-accent-hover"
                  >
                    Start
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}