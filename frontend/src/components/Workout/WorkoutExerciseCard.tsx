import { useState } from 'react';

import { Card } from '../ui/Card';
import WorkoutSetRow from './WorkoutSetRow';

interface Props {
  exercise: {
    id: number;
    exercise_name: string;
    category: string;
    target_sets: number;
    position: number;
    sets: {
      set_number: number;
      reps: number;
      weight: number;
      is_failure: boolean;
      completed_at: string | null;
      previous: {
        reps: number | null;
        weight: number | null;
        is_failure: boolean;
      };
      target: {
        reps: number | null;
        weight: number | null;
      };
      next_target: {
        reps: number | null;
        weight: number | null;
      } | null;
    }[];
  };
  exerciseNumber: number;
  totalExercises: number;
}

export default function WorkoutExerciseCard({
  exercise,
  exerciseNumber,
  totalExercises,
}: Props) {
  const firstUnfinishedSet =
    exercise.sets.find((set) => !set.completed_at) ??
    exercise.sets[0];

  const [selectedSetNumber, setSelectedSetNumber] = useState(
    firstUnfinishedSet?.set_number ?? 1
  );

  const selectedSet =
    exercise.sets.find(
      (set) => set.set_number === selectedSetNumber
    ) ?? exercise.sets[0];

  const completedSets = exercise.sets.filter(
    (set) => Boolean(set.completed_at)
  ).length;

  const formatNumber = (value: number) =>
    String(value).padStart(2, '0');

  return (
    <Card className="overflow-hidden">
      {/* Exercise header */}
      <div className="flex items-start gap-4 border-b border-border p-5 sm:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-black text-background shadow-glow">
          {formatNumber(exerciseNumber)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">
            Exercise {formatNumber(exerciseNumber)} of{' '}
            {formatNumber(totalExercises)}
          </p>

          <h2 className="mt-1 text-xl font-black text-foreground sm:text-2xl">
            {exercise.exercise_name}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              {exercise.category}
            </span>

            <span className="text-xs text-muted">
              {completedSets}/{exercise.sets.length} sets saved
            </span>
          </div>
        </div>
      </div>

      {/* Set selector */}
      <div className="border-b border-border p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-subtle">
            Select Set
          </h3>

          <span className="text-xs font-bold text-muted">
            {exercise.target_sets} target sets
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {exercise.sets.map((set) => {
            const isSelected =
              set.set_number === selectedSet?.set_number;

            const isSaved = Boolean(set.completed_at);

            const buttonStyle = isSelected
              ? 'border-accent bg-accent text-background shadow-glow'
              : isSaved
                ? 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10'
                : 'border-border bg-background text-muted hover:border-border-light hover:text-foreground';

            return (
              <button
                key={`${exercise.id}-${set.set_number}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedSetNumber(set.set_number)}
                className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${buttonStyle}`}
              >
                <span className="text-sm font-black">
                  Set {set.set_number}
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                  {isSaved ? 'Saved' : isSelected ? 'Selected' : 'Pending'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected set details */}
      {selectedSet ? (
        <WorkoutSetRow
          key={`${exercise.id}-${selectedSet.set_number}`}
          sessionExerciseId={exercise.id}
          set={selectedSet}
        />
      ) : (
        <div className="p-5">
          <p className="text-sm text-muted">
            No sets configured for this exercise.
          </p>
        </div>
      )}
    </Card>
  );
}