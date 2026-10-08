import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import WorkoutSetRow from './WorkoutSetRow';

interface Props {
  exercise: {
    id: number;
    exercise_name: string;
    category: string;
    target_sets: number;
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
}

export default function WorkoutExerciseCard({ exercise }: Props) {
  const { removeExercise, isLoading } = useWorkoutStore();

  const handleRemove = async () => {
    if (
      !window.confirm(
        `Remove "${exercise.exercise_name}" from this workout?`
      )
    ) {
      return;
    }

    await removeExercise(exercise.id);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">
            {exercise.category}
          </p>

          <h2 className="mt-1 text-xl font-black text-foreground">
            {exercise.exercise_name}
          </h2>

          <p className="mt-1 text-xs text-muted">
            {exercise.target_sets} target sets
          </p>
        </div>

        <Button
          variant="danger"
          onClick={handleRemove}
          disabled={isLoading}
          className="w-auto px-3 py-2 text-xs"
        >
          Remove
        </Button>
      </div>

      <div className="divide-y divide-border">
        {exercise.sets.map((set) => (
          <WorkoutSetRow
            key={`${exercise.id}-${set.set_number}`}
            sessionExerciseId={exercise.id}
            set={set}
          />
        ))}
      </div>
    </Card>
  );
}