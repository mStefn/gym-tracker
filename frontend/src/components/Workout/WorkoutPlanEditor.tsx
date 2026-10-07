import { useEffect, useState } from 'react';
import { authFetch, API_URL } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ExerciseWizard } from './ExerciseWizard';

interface WorkoutPlanEditorProps {
  planId?: number | null;
  initialName?: string;
  onCancel: () => void;
  onSaved: () => void;
}

interface PlanExercise {
  id: number;
  name: string;
  category: string;
  sets: number;
}

export function WorkoutPlanEditor({
  planId = null,
  initialName = '',
  onCancel,
  onSaved,
}: WorkoutPlanEditorProps) {
  const [planName, setPlanName] = useState(initialName);
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [showExerciseWizard, setShowExerciseWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(planId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return;
    }

    const loadPlanExercises = async () => {
      try {
        const response = await authFetch(
          `${API_URL}/plan-exercises/${planId}`
        );

        if (!response.ok) {
          throw new Error('Failed to load workout plan.');
        }

        const data = await response.json();

        setExercises(
          data.map((exercise: {
            exercise_id: number;
            exercise_name: string;
            category: string;
            target_sets: number;
          }) => ({
            id: exercise.exercise_id,
            name: exercise.exercise_name,
            category: exercise.category,
            sets: exercise.target_sets,
          }))
        );
      } catch (err) {
        console.error('Plan loading error:', err);
        setError('Could not load workout plan.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlanExercises();
  }, [planId]);

  const handleExerciseComplete = (exercise: PlanExercise) => {
    const alreadyExists = exercises.some(
      (item) => item.name === exercise.name
    );

    if (alreadyExists) {
      setError(
        'This exercise variation is already included in the plan.'
      );
      setShowExerciseWizard(false);
      return;
    }

    setExercises((current) => [
      ...current,
      {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: 3,
      },
    ]);

    setError(null);
    setShowExerciseWizard(false);
  };

  const updateSets = (index: number, value: string) => {
    const sets = Number.parseInt(value, 10);

    setExercises((current) =>
      current.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? {
              ...exercise,
              sets: Math.min(
                15,
                Math.max(1, Number.isNaN(sets) ? 3 : sets)
              ),
            }
          : exercise
      )
    );
  };

  const removeExercise = (index: number) => {
    setExercises((current) =>
      current.filter((_, exerciseIndex) => exerciseIndex !== index)
    );
  };

  const savePlan = async () => {
    if (!planName.trim()) {
      setError('Please enter a name for your workout plan.');
      return;
    }

    if (exercises.length === 0) {
      setError('Add at least one exercise to save the plan.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let finalPlanId = planId;

      if (!planId) {
        const response = await authFetch(`${API_URL}/plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: planName.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create workout plan.');
        }

        const data = await response.json();
        finalPlanId = data.id;
      } else {
        const response = await authFetch(`${API_URL}/plan/${planId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: planName.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update workout plan.');
        }
      }

      const syncResponse = await authFetch(
        `${API_URL}/plan-exercises/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: finalPlanId,
            exercises: exercises.map((exercise) => ({
              name: exercise.name,
              category: exercise.category,
              sets: exercise.sets,
            })),
          }),
        }
      );

      if (!syncResponse.ok) {
        throw new Error('Failed to synchronize workout exercises.');
      }

      onSaved();
    } catch (err) {
      console.error('Plan save error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save workout plan.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative z-10">
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-medium text-muted">
            Loading workout plan...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <section className="flex items-center justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
            {planId ? 'Edit' : 'Create'}{' '}
            <span className="text-accent">Workout Plan</span>
          </h1>

          <p className="text-sm font-medium tracking-wide text-muted">
            Build your workout by adding exercises and setting target sets.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={onCancel}
          className="shrink-0"
        >
          Cancel
        </Button>
      </section>

      <Card className="p-5 sm:p-6">
        <div className="space-y-6">
          <Input
            id="workout-plan-name"
            label="Plan Name"
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
            placeholder="e.g. Push Day"
          />

          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-subtle">
              Exercises
            </h2>

            {exercises.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border bg-background/30 p-6 text-center">
                <p className="text-sm text-muted">
                  No exercises added yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div
                    key={`${exercise.id}-${exercise.name}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/50 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-foreground">
                        {exercise.name}
                      </div>

                      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-subtle">
                        {exercise.category}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div>
                        <label
                          htmlFor={`sets-${index}`}
                          className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-subtle"
                        >
                          Sets
                        </label>

                        <input
                          id={`sets-${index}`}
                          type="number"
                          min="1"
                          max="15"
                          value={exercise.sets}
                          onChange={(event) =>
                            updateSets(index, event.target.value)
                          }
                          className="w-16 rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm font-bold text-foreground focus:border-accent focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="mt-5 text-xl text-subtle transition-colors hover:text-danger"
                        aria-label={`Remove ${exercise.name}`}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="secondary"
              onClick={() => setShowExerciseWizard(true)}
              className="mt-4"
            >
              + Add Exercise
            </Button>
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="border-t border-border pt-5">
            <Button onClick={savePlan} disabled={isSaving}>
              {isSaving
                ? 'Saving Workout Plan...'
                : planId
                  ? 'Update Workout Plan'
                  : 'Save Workout Plan'}
            </Button>
          </div>
        </div>
      </Card>

      {showExerciseWizard && (
        <ExerciseWizard
          onClose={() => setShowExerciseWizard(false)}
          onComplete={handleExerciseComplete}
        />
      )}
    </div>
  );
}