import { useState } from 'react';

import { useWorkoutStore } from '../store/useWorkoutStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import WorkoutExerciseCard from '../components/Workout/WorkoutExerciseCard';
import AddExerciseForm from '../components/Workout/AddExerciseForm';

export default function ActiveWorkoutView() {
  const {
    workout,
    isLoading,
    error,
    finishWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [showAddExercise, setShowAddExercise] = useState(false);

  if (!workout) {
    return null;
  }

  const handleFinish = async () => {
    if (
      !window.confirm(
        'Finish this workout? Saved sets will remain in your history.'
      )
    ) {
      return;
    }

    await finishWorkout();
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        'Cancel this workout? The active session will be discarded.'
      )
    ) {
      return;
    }

    await cancelWorkout();
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

      {error && (
        <Card className="border-danger/20 bg-danger/5 p-4">
          <p className="text-sm text-danger">{error}</p>
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

      {showAddExercise ? (
        <AddExerciseForm
          onClose={() => setShowAddExercise(false)}
        />
      ) : (
        <Button
          variant="secondary"
          onClick={() => setShowAddExercise(true)}
          className="mx-auto w-full sm:w-auto"
        >
          + Add Exercise
        </Button>
      )}
    </div>
  );
}