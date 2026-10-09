import { Card } from '../ui/Card';
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
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
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