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
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
            Active Workout
          </p>

          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
            {workout.name}
          </h1>

          <p className="mt-2 text-sm text-muted">
            {workout.exercises.length} exercise
            {workout.exercises.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            onClick={handleFinish}
            disabled={isLoading}
            className="flex-1 sm:w-auto"
          >
            Finish Workout
          </Button>
        </div>
      </section>

      {(error || exerciseError) && (
        <Card className="border-danger/20 bg-danger/5 p-4">
          <p className="text-sm text-danger">
            {error || exerciseError}
          </p>
        </Card>
      )}

      {workout.exercises.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">
            No exercises yet
          </h2>

          <p className="mt-2 text-sm text-muted">
            Add exercises to start your workout.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {workout.exercises.map((exercise) => (
            <WorkoutExerciseCard
              key={exercise.id}
              exercise={exercise}
            />
          ))}
        </div>
      )}

      <Button
        variant="secondary"
        onClick={() => {
          setExerciseError(null);
          setShowExerciseWizard(true);
        }}
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
  );
}