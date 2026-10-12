import { useState } from 'react';

import { useWorkoutStore } from '../store/useWorkoutStore';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ExerciseWizard } from '../components/Workout/ExerciseWizard';
import WorkoutExerciseCard from '../components/Workout/WorkoutExerciseCard';

interface SelectedExercise {
  id: number;
  name: string;
  category: string;
}

export default function ActiveWorkoutView() {
  const {
    workout,
    isLoading,
    error,
    addExercise,
    finishWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [showExerciseWizard, setShowExerciseWizard] = useState(false);
  const [exerciseError, setExerciseError] = useState<string | null>(null);

  if (!workout) {
    return null;
  }

  const isFreeWorkout = workout.plan_id == null;

  const orderedExercises = [...workout.exercises].sort(
    (a, b) => a.position - b.position || a.id - b.id
  );

  const handleFinish = async () => {
    const confirmed = window.confirm(
      'Finish this workout? Saved sets will remain in your history.'
    );

    if (!confirmed) {
      return;
    }

    await finishWorkout();
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      'Cancel this workout? The active session will be discarded.'
    );

    if (!confirmed) {
      return;
    }

    await cancelWorkout();
  };

  const handleExerciseComplete = async (
    exercise: SelectedExercise
  ) => {
    setExerciseError(null);

    const success = await addExercise({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      targetSets: 3,
    });

    if (!success) {
      setExerciseError('Could not add exercise to workout.');
      return;
    }

    setShowExerciseWizard(false);
  };

  return (
    <div className="space-y-6 pb-4 sm:space-y-8">
      {/* Workout header */}
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
            Active Workout
          </p>

          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
            {workout.name}
          </h1>

          <p className="mt-2 text-sm text-muted">
            {orderedExercises.length} exercise
            {orderedExercises.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel Workout
          </Button>
        </div>
      </section>

      {/* Errors */}
      {(error || exerciseError) && (
        <Card className="border-danger/20 bg-danger/5 p-4">
          <p className="text-sm text-danger">
            {error || exerciseError}
          </p>
        </Card>
      )}

      {/* Exercises */}
      {orderedExercises.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">
            No exercises yet
          </h2>

          <p className="mt-2 text-sm text-muted">
            Add exercises to start your workout.
          </p>
        </Card>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {orderedExercises.map((exercise, index) => (
            <WorkoutExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseNumber={index + 1}
              totalExercises={orderedExercises.length}
            />
          ))}
        </div>
      )}

      {/* Add Exercise: Empty Workout only */}
      {isFreeWorkout && (
        <div className="space-y-4">
          <Button
            variant="secondary"
            onClick={() => {
              setExerciseError(null);
              setShowExerciseWizard(true);
            }}
            disabled={isLoading}
            className="mx-auto w-full sm:w-auto"
          >
            + Add Exercise
          </Button>

          {showExerciseWizard && (
            <ExerciseWizard
              onClose={() => setShowExerciseWizard(false)}
              onComplete={handleExerciseComplete}
            />
          )}
        </div>
      )}

      {/* Finish Workout: bottom of the session */}
      <section className="border-t border-border pt-6 sm:pt-8">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                Ready to finish?
              </h2>

              <p className="mt-2 text-sm text-muted">
                Your saved sets will remain in your workout history.
              </p>
            </div>

            <Button
              onClick={handleFinish}
              disabled={isLoading}
              className="w-full sm:w-56"
            >
              {isLoading ? 'Finishing...' : 'Finish Workout'}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}