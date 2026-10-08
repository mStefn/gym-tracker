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

export default function PlansView() {
  const { startWorkout, isLoading: isWorkoutLoading } = useWorkoutStore();

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [startingWorkoutId, setStartingWorkoutId] = useState<number | 'empty' | null>(null);

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

  const openCreateEditor = () => {
    setEditingPlan(null);
    setShowPlanEditor(true);
  };

  const openEditEditor = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setShowPlanEditor(true);
  };

  const closeEditor = () => {
    setShowPlanEditor(false);
    setEditingPlan(null);
  };

  const handlePlanSaved = async () => {
    closeEditor();
    setIsLoading(true);
    await loadPlans();
  };

  const handleDeletePlan = async (plan: WorkoutPlan) => {
    const confirmed = window.confirm(
      `Delete "${plan.name}"? This will also remove all exercises from this template.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingPlanId(plan.id);
    setError(null);

    try {
      const response = await authFetch(
        `${API_URL}/plan/${plan.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete workout plan.');
      }

      setPlans((current) =>
        current.filter((item) => item.id !== plan.id)
      );
    } catch (err) {
      console.error('Plan deletion error:', err);
      setError('Could not delete workout plan.');
    } finally {
      setDeletingPlanId(null);
    }
  };

  const handleStartEmptyWorkout = async () => {
    setStartingWorkoutId('empty');
    setError(null);

    try {
      await startWorkout({
        name: 'Empty Workout',
      });
    } catch (err) {
      console.error('Empty workout start error:', err);
      setError('Could not start workout.');
    } finally {
      setStartingWorkoutId(null);
    }
  };

  const handleStartPlanWorkout = async (plan: WorkoutPlan) => {
    setStartingWorkoutId(plan.id);
    setError(null);

    try {
      await startWorkout({
        planId: plan.id,
        name: plan.name,
      });
    } catch (err) {
      console.error('Workout start error:', err);
      setError('Could not start workout.');
    } finally {
      setStartingWorkoutId(null);
    }
  };

  if (showPlanEditor) {
    return (
      <WorkoutPlanEditor
        planId={editingPlan?.id}
        initialName={editingPlan?.name || ''}
        onCancel={closeEditor}
        onSaved={handlePlanSaved}
      />
    );
  }

  const isStartingWorkout =
    startingWorkoutId !== null || isWorkoutLoading;

  return (
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <section>
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
          Your <span className="text-accent">Workouts</span>
        </h1>

        <p className="text-sm font-medium tracking-wide text-muted">
          Choose a workout plan or start with a clean slate.
        </p>
      </section>

      {error && (
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
            onClick={handleStartEmptyWorkout}
            disabled={isStartingWorkout}
          >
            {startingWorkoutId === 'empty'
              ? 'STARTING...'
              : 'START WORKOUT'}
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
            onClick={openCreateEditor}
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

        {!isLoading && !error && plans.length === 0 && (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-bold text-foreground">
              No workout plans yet
            </h3>

            <p className="mt-2 text-sm text-muted">
              Create your first workout template to get started.
            </p>

            <Button
              onClick={openCreateEditor}
              className="mx-auto mt-5 w-auto px-6"
            >
              Create First Template
            </Button>
          </Card>
        )}

        {!isLoading && plans.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isStartingThisPlan = startingWorkoutId === plan.id;
              const isDeletingThisPlan = deletingPlanId === plan.id;

              return (
                <Card
                  key={plan.id}
                  className="group flex h-full flex-col p-5 transition-colors hover:border-border-light"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                      {plan.name}
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      Workout template
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => openEditEditor(plan)}
                        disabled={isStartingWorkout || isDeletingThisPlan}
                        className="w-auto px-3 py-2 text-xs"
                      >
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => handleDeletePlan(plan)}
                        disabled={isStartingWorkout || isDeletingThisPlan}
                        className="w-auto px-3 py-2 text-xs"
                      >
                        {isDeletingThisPlan ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => handleStartPlanWorkout(plan)}
                      disabled={isStartingWorkout || isDeletingThisPlan}
                      className="w-auto px-3 py-2 text-xs text-accent hover:text-accent-hover"
                    >
                      {isStartingThisPlan ? 'Starting...' : 'Start'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}